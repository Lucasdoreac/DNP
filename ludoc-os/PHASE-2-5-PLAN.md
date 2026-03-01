# Phase 2.5: Dynamic Sovereignty - Imortalidade do Bridge

**Objetivo:** Transformar o Context Server em um sistema "Plug-and-Play" que nunca precise de restart manual.

**Problema Atual:** Quando Claude adiciona novos endpoints, o servidor precisa de restart manual.
**Solução:** Hot-reload automático com persistent state via SQLite.

---

## 🎯 Arquitetura Proposta

### Antes (Phase 2.4)
```
Code Change
    ↓
Manual Restart
    ↓
Server Alive
```

### Depois (Phase 2.5)
```
Code Change
    ↓
Auto-Restart (bun watch)
    ↓
SQLite Restore State
    ↓
Server Alive + No Message Loss
```

---

## 📋 Implementação em 3 Fases

### **Fase A: SQLite Persistent Store**

**Arquivo:** `src/db/ludoc-store.ts` (novo)

```typescript
import Database from "bun:sqlite";

export class LudocStore {
  private db: Database;

  constructor() {
    this.db = new Database(".ludoc/ludoc.db");
    this.initSchema();
  }

  private initSchema() {
    // Message Queue Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_queue (
        id TEXT PRIMARY KEY,
        message TEXT NOT NULL,
        signature TEXT NOT NULL,
        sender TEXT,
        timestamp INTEGER,
        tier TEXT DEFAULT 'warm',
        processedAt INTEGER
      );
    `);

    // Memory Entries Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_entries (
        id TEXT PRIMARY KEY,
        tier TEXT NOT NULL,
        data TEXT NOT NULL,
        hash TEXT,
        created INTEGER,
        accessed INTEGER,
        accessCount INTEGER DEFAULT 0,
        expiresAt INTEGER
      );
    `);

    // Session Tokens Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        initiator TEXT NOT NULL,
        responder TEXT,
        nonce TEXT NOT NULL,
        createdAt INTEGER,
        expiresAt INTEGER,
        status TEXT DEFAULT 'pending'
      );
    `);
  }

  // Message Queue Operations
  async enqueueMessage(id: string, message: any) {
    const stmt = this.db.prepare(`
      INSERT INTO message_queue (id, message, signature, sender, timestamp, tier)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, JSON.stringify(message), message.signature, message.sender, Date.now(), 'warm');
  }

  async dequeueMessage() {
    const stmt = this.db.prepare(`
      SELECT * FROM message_queue ORDER BY timestamp ASC LIMIT 1
    `);
    const row = stmt.get();
    if (row) {
      this.db.prepare(`DELETE FROM message_queue WHERE id = ?`).run(row.id);
    }
    return row;
  }

  // Memory Operations
  async setMemory(id: string, data: any, tier: string) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memory_entries
      (id, tier, data, hash, created, accessed, accessCount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    stmt.run(id, tier, JSON.stringify(data), hash, Date.now(), Date.now(), 0);
  }

  async getMemory(id: string) {
    const stmt = this.db.prepare(`SELECT * FROM memory_entries WHERE id = ?`);
    return stmt.get(id);
  }

  // Session Operations
  async createSession(token: string, initiator: string, nonce: string) {
    const stmt = this.db.prepare(`
      INSERT INTO sessions (token, initiator, nonce, createdAt, expiresAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    const expiresAt = Date.now() + (24 * 3600 * 1000); // 24h
    stmt.run(token, initiator, nonce, Date.now(), expiresAt);
  }
}
```

---

### **Fase B: Hot-Reload Setup**

**Script:** Development mode with file watcher

```typescript
// In package.json scripts:
"dev": "bun --watch src/api/context-server.ts"
```

**Usage:**
```bash
bun run dev
```

**Behavior:**
- File change detected automatically
- Process restarts without manual intervention
- SQLite persists state → no message loss
- New endpoints available immediately

---

### **Fase C: Dynamic Handler Loading**

**Arquivo:** `src/api/handlers/index.ts` (novo)

```typescript
import type { Request } from "bun";

export type Handler = (req: Request, ctx: any) => Promise<Response>;

export const handlers: Map<string, Handler> = new Map();

export async function loadHandlers() {
  // dispatch
  const { handleDispatch } = await import("./dispatch.js");
  handlers.set("POST /context/dispatch", handleDispatch);

  // auth
  const { handleAuthChallenge } = await import("./auth.js");
  handlers.set("POST /context/auth/challenge", handleAuthChallenge);

  // memory
  const { handleMemoryStats } = await import("./memory.js");
  handlers.set("GET /context/memory/stats", handleMemoryStats);

  console.log(`[HANDLERS] Loaded ${handlers.size} route handlers`);
}
```

---

## 🚀 Implementation Steps

### Step 1: Add SQLite Store (2 hours)
- [ ] Create `src/db/ludoc-store.ts`
- [ ] Define schema (message_queue, memory_entries, sessions)
- [ ] Test CRUD operations via integration tests
- [ ] Integrate with Context Server constructor

### Step 2: Persistent Memory Layer (2 hours)
- [ ] Modify `TernaryMemoryModel` to use SQLite backend
- [ ] Persist tier migrations to database
- [ ] Implement recovery on server restart
- [ ] Test memory persistence across restarts

### Step 3: Hot-Reload Infrastructure (1 hour)
- [ ] Add dev script to package.json
- [ ] Update message queue to use SQLite
- [ ] Validate no message loss on restart
- [ ] Test: Add endpoint → Save file → Auto-reload confirms

### Step 4: Dynamic Handlers (1 hour)
- [ ] Extract route handlers to `src/api/handlers/` modules
- [ ] Create handler registry pattern
- [ ] Implement dynamic loading at startup
- [ ] Test endpoint discovery and routing

---

## 📊 Success Criteria

| Critério | Validação |
|----------|-----------|
| Hot-reload works | Edit file, save, observe auto-restart in logs |
| No message loss | Send dispatch, trigger restart, verify queue intact |
| Memory persists | Add memory entry, restart, GET returns data |
| Sessions survive | Create token, restart, token validates correctly |
| Performance | SQLite query < 10ms for lookups |
| Handler discovery | New route auto-loaded without server restart |

---

## 🔧 Technology Stack

- **Database:** `bun:sqlite` (built-in, no external deps)
- **File Watcher:** Native Bun watch mode
- **Persistence:** `.ludoc/ludoc.db` (machine-local, .gitignore'd)
- **State Recovery:** Automatic on server startup

---

## 🎓 Why This Architecture Matters

**Current State (Phase 2.4):**
- Claude adds new handler code
- Manual restart required
- Gemini waits for restart
- Communication gap during transition

**After Phase 2.5:**
- Claude adds new handler code
- Save file → auto-restart (bun watch)
- SQLite restores previous state
- Gemini continues immediately
- Zero downtime for agent coordination

**Result:** System evolves autonomously without human coordination.

---

## 📅 Timeline

- **Phase 2.4:** ✅ COMPLETE (Memory tiers, Identity rotation, Auth ready)
- **Phase 2.5:** 🚀 NEXT (SQLite + Hot-reload)
- **Phase 3.0:** 🔮 PLANNED (Full multi-agent autonomy)

---

**Owner:** Claude + Gemini (joint implementation)
**Urgency:** High (eliminates manual restart bottleneck)
**Difficulty:** Medium (SQLite integration is straightforward with bun:sqlite)

**O Bridge será imortal. A revolução é aqui.** 🦾
