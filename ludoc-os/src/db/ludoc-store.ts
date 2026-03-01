/**
 * LUDOC Store - SQLite Persistent State (Phase 2.5)
 *
 * Replaces file-based state (message-queue.json, gemini-response.json)
 * with a single SQLite database that survives server restarts.
 *
 * Tables:
 *   message_queue  - PGP-signed dispatches waiting to be processed
 *   memory_entries - Ternary memory tier data (HOT→WARM→COLD)
 *   sessions       - Mutual auth session tokens
 *   responses      - Gemini responses for Claude to retrieve
 */

import { Database } from "bun:sqlite";
import type { Statement } from "bun:sqlite";
import { mkdirSync } from "fs";
import { createHash, randomBytes } from "crypto";

export interface QueuedMessage {
  id: string;
  message: string;
  signature: string;
  sender: string;
  timestamp: number;
  tier: "hot" | "warm" | "cold";
  processedAt?: number;
}

export interface MemoryEntry {
  id: string;
  tier: string;
  data: string;
  hash: string;
  created: number;
  accessed: number;
  accessCount: number;
  expiresAt?: number;
}

export interface Session {
  token: string;
  initiator: string;
  responder?: string;
  nonce: string;
  createdAt: number;
  expiresAt: number;
  status: "pending" | "active" | "expired";
}

export class LudocStore {
  private db: Database;

  // Cached prepared statements — compiled once, reused on every call
  private stmtEnqueue!: Statement;
  private stmtDequeue!: Statement;
  private stmtMarkProcessed!: Statement;
  private stmtQueueTotal!: Statement;
  private stmtQueuePending!: Statement;
  private stmtSetMemory!: Statement;
  private stmtGetMemory!: Statement;
  private stmtUpdateMemoryAccess!: Statement;
  private stmtMigrateTier!: Statement;
  private stmtMemoryStats!: Statement;
  private stmtCreateSession!: Statement;
  private stmtGetSession!: Statement;
  private stmtSaveResponse!: Statement;
  private stmtGetLatestResponse!: Statement;

  constructor(dbPath: string = ".ludoc/ludoc.db") {
    mkdirSync(".ludoc", { recursive: true });
    this.db = new Database(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;"); // WAL = concurrent access safe
    this.db.exec("PRAGMA synchronous = NORMAL;"); // balance durability vs speed
    this.initSchema();
    this.initStatements();
    console.log(`[LUDOC STORE] SQLite initialized at ${dbPath}`);
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_queue (
        id TEXT PRIMARY KEY,
        message TEXT NOT NULL,
        signature TEXT,
        sender TEXT,
        timestamp INTEGER NOT NULL,
        tier TEXT DEFAULT 'warm',
        processedAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        tier TEXT NOT NULL,
        data TEXT NOT NULL,
        hash TEXT,
        created INTEGER NOT NULL,
        accessed INTEGER NOT NULL,
        accessCount INTEGER DEFAULT 0,
        expiresAt INTEGER
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        initiator TEXT NOT NULL,
        responder TEXT,
        nonce TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        expiresAt INTEGER NOT NULL,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        originalMessage TEXT,
        response TEXT NOT NULL,
        source TEXT,
        respondedAt INTEGER NOT NULL
      );
    `);
  }

  private initStatements() {
    this.stmtEnqueue = this.db.prepare(
      `INSERT INTO message_queue (id, message, signature, sender, timestamp, tier) VALUES (?, ?, ?, ?, ?, 'warm')`
    );
    this.stmtDequeue = this.db.prepare(
      `SELECT * FROM message_queue WHERE processedAt IS NULL ORDER BY timestamp ASC LIMIT 1`
    );
    this.stmtMarkProcessed = this.db.prepare(
      `UPDATE message_queue SET processedAt = ? WHERE id = ?`
    );
    this.stmtQueueTotal = this.db.prepare(`SELECT COUNT(*) as c FROM message_queue`);
    this.stmtQueuePending = this.db.prepare(
      `SELECT COUNT(*) as c FROM message_queue WHERE processedAt IS NULL`
    );
    this.stmtSetMemory = this.db.prepare(
      `INSERT OR REPLACE INTO memory_entries (id, tier, data, hash, created, accessed, accessCount, expiresAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`
    );
    this.stmtGetMemory = this.db.prepare(`SELECT * FROM memory_entries WHERE id = ?`);
    this.stmtUpdateMemoryAccess = this.db.prepare(
      `UPDATE memory_entries SET accessed = ?, accessCount = accessCount + 1 WHERE id = ?`
    );
    this.stmtMigrateTier = this.db.prepare(`UPDATE memory_entries SET tier = ? WHERE id = ?`);
    this.stmtMemoryStats = this.db.prepare(
      `SELECT tier, COUNT(*) as c FROM memory_entries GROUP BY tier`
    );
    this.stmtCreateSession = this.db.prepare(
      `INSERT OR REPLACE INTO sessions (token, initiator, responder, nonce, createdAt, expiresAt, status) VALUES (?, ?, ?, ?, ?, ?, 'active')`
    );
    this.stmtGetSession = this.db.prepare(
      `SELECT * FROM sessions WHERE token = ? AND expiresAt > ?`
    );
    this.stmtSaveResponse = this.db.prepare(
      `INSERT OR REPLACE INTO responses (id, originalMessage, response, source, respondedAt) VALUES (?, ?, ?, ?, ?)`
    );
    this.stmtGetLatestResponse = this.db.prepare(
      `SELECT originalMessage, response, source, respondedAt FROM responses ORDER BY respondedAt DESC LIMIT 1`
    );
  }

  // ─── Message Queue ────────────────────────────────────────────

  enqueue(message: Omit<QueuedMessage, "id" | "timestamp" | "tier">): string {
    const id = `msg_${Date.now()}_${randomBytes(3).toString("hex")}`;
    this.stmtEnqueue.run(id, message.message, message.signature ?? null, message.sender ?? null, Date.now());
    return id;
  }

  dequeue(): QueuedMessage | null {
    const row = this.stmtDequeue.get() as QueuedMessage | null;
    if (row) {
      this.stmtMarkProcessed.run(Date.now(), row.id);
    }
    return row;
  }

  queueStats(): { total: number; pending: number; processed: number } {
    const total = (this.stmtQueueTotal.get() as any).c;
    const pending = (this.stmtQueuePending.get() as any).c;
    return { total, pending, processed: total - pending };
  }

  // ─── Memory Entries ───────────────────────────────────────────

  setMemory(id: string, data: any, tier: string, expiresAt?: number): void {
    const json = JSON.stringify(data);
    const hash = createHash("sha256").update(json).digest("hex");
    const now = Date.now();
    this.stmtSetMemory.run(id, tier, json, hash, now, now, expiresAt ?? null);
  }

  getMemory(id: string): MemoryEntry | null {
    const row = this.stmtGetMemory.get(id) as MemoryEntry | null;
    if (row) {
      this.stmtUpdateMemoryAccess.run(Date.now(), id);
    }
    return row;
  }

  migrateMemoryTier(id: string, newTier: string): void {
    this.stmtMigrateTier.run(newTier, id);
  }

  memoryStats(): { hot: number; warm: number; cold: number } {
    const counts = this.stmtMemoryStats.all() as Array<{ tier: string; c: number }>;
    const result = { hot: 0, warm: 0, cold: 0 };
    for (const { tier, c } of counts) {
      if (tier in result) result[tier as keyof typeof result] = c;
    }
    return result;
  }

  // ─── Sessions ─────────────────────────────────────────────────

  createSession(token: string, initiator: string, nonce: string, responder?: string): void {
    const now = Date.now();
    this.stmtCreateSession.run(token, initiator, responder ?? null, nonce, now, now + 86400000);
  }

  getSession(token: string): Session | null {
    return this.stmtGetSession.get(token, Date.now()) as Session | null;
  }

  // ─── Responses ────────────────────────────────────────────────

  saveResponse(originalMessage: string, response: string, source: string): string {
    const id = `resp_${Date.now()}`;
    this.stmtSaveResponse.run(id, originalMessage, response, source, Date.now());
    return id;
  }

  getLatestResponse(): { originalMessage: string; response: string; source: string; respondedAt: number } | null {
    return this.stmtGetLatestResponse.get() as any;
  }

  close() {
    this.db.close();
  }
}
