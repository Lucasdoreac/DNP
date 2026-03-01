/// <reference types="bun" />

import { readFileSync } from "fs";
import { createHash } from "crypto";
import { PGPEngine } from "../crypto/pgp-engine.js";
import { SealedIdentityManager } from "../crypto/sealed-identity.js";
import { TernaryMemoryModel, MemoryTier } from "../kernel/memory-model.js";
import { LudocStore } from "../db/ludoc-store.js";
import { PeerRegistry } from "../p2p/peer-registry.js";
import { GossipEngine } from "../p2p/gossip-protocol.js";

/**
 * CONTEXT SERVER - O Portal P2P Real
 *
 * Escuta em 0.0.0.0:9000
 * Recebe dispatches assinados de Claude
 * Valida PGP + SealedHash
 * Envia para Gemini instantaneamente
 */
export class ContextServer {
  private sealed: any;
  private publicKey: string = "";
  private server: any;
  private memory: TernaryMemoryModel;
  private store: LudocStore;
  private peerRegistry: PeerRegistry;
  private gossip: GossipEngine;

  async init(port: number = 9000) {
    // Carregar identidade selada
    this.sealed = await SealedIdentityManager.load();
    if (!this.sealed) {
      throw new Error("[CONTEXT] Sealed identity not found. Run bootstrap-v2.ts --seal first");
    }

    // Inicializar SQLite store (Phase 2.5) — persiste entre restarts
    this.store = new LudocStore();

    // Inicializar P2P Gossip (Phase 3.0)
    this.peerRegistry = new PeerRegistry(this.store);
    this.gossip = new GossipEngine(this.peerRegistry, this.sealed.sealedHash, 3);
    console.log(`[CONTEXT SERVER] 🕸️  Gossip Engine initialized (fanout=3)`);

    // Inicializar memória ternária
    this.memory = new TernaryMemoryModel();
    console.log(`[CONTEXT SERVER] 🧠 Ternary Memory initialized (HOT: 500MB, WARM: 2GB, COLD: 4GB)`);

    // Iniciar auto-migration (Phase 2.4)
    await this.memory.startAutoMigration(30000); // 30s interval

    // Extrair chave pública do protocolo
    const protocolContent = readFileSync("./protocol.yaml", "utf-8");
    const yaml = await import("yaml");
    const protocol = yaml.parse(protocolContent);
    let publicKey = protocol.identity?.primaryKey?.public_key || "";

    if (!publicKey) {
      throw new Error("[CONTEXT] No public key in protocol.yaml");
    }

    // YAML multiline strings preserve indentation; OpenPGP.js requires clean formatting
    this.publicKey = publicKey.split('\n').map((line: string) => line.trim()).join('\n');

    // Criar servidor HTTP
    this.server = Bun.serve({
      hostname: "0.0.0.0",
      port,
      fetch: (req: Request) => this.handleRequest(req),
    });

    console.log(`[CONTEXT SERVER] 🚀 Started on 0.0.0.0:${port}`);
    console.log(`[CONTEXT SERVER] PeerID: ${this.sealed.sealedHash.substring(0, 16)}`);
    console.log(`[CONTEXT SERVER] Awaiting signed dispatches...`);
  }

  private async handleRequest(req: Request) {
    const url = new URL(req.url);
    const fs = await import("fs");

    // Logging de Auditoria
    console.log(`[${new Date().toISOString()}] ${req.method} ${url.pathname}`);

    // POST /context/dispatch - Receber dispatch assinado de Claude
    if (req.method === "POST" && url.pathname === "/context/dispatch") {
      try {
        const body = await req.json() as any;
        const { message, signature } = body;
        
        console.log(`[CONTEXT SERVER] Incoming dispatch attempt from: ${body.sender || 'unknown'}`);

        // VALIDAR: PGP
        const isValid = await PGPEngine.verify(message, signature, this.publicKey);

        if (!isValid) {
          console.warn(`[CONTEXT SERVER] âŒ Signature validation failed for message.`);
          return new Response(
            JSON.stringify({ error: "Invalid PGP signature", receipt_id: `err_${Date.now()}` }),
            { status: 401 }
          );
        }

        // Validar SealedHash no payload
        if (!message.includes(this.sealed.sealedHash)) {
          return new Response(
            JSON.stringify({ error: "SealedHash mismatch - hardware origin validation failed" }),
            { status: 401 }
          );
        }

        // ✅ VÁLIDO - Adicionar à fila para Gemini processar
        console.log(`\n[CONTEXT SERVER] ✅ Dispatch recebido:`);
        console.log(`   Message: ${message.substring(0, 100)}...`);
        console.log(`   Signed by: ${this.sealed.pgpFingerprint.substring(0, 16)}`);
        console.log(`   Hardware: ${this.sealed.hardwareUUID.substring(0, 16)}`);
        console.log(`[CONTEXT SERVER] → Adicionando à fila para Gemini processar...`);

        // 🗄️ PHASE 2.5: Persistir em SQLite (sobrevive a restarts)
        const msgId = this.store.enqueue({
          message,
          signature,
          sender: body.sender || 'unknown',
        });
        console.log(`[CONTEXT SERVER] 🗄️  → Queued in SQLite: ${msgId}`);

        // 🧠 PHASE 2.4: Também armazenar em WARM memory tier
        await this.memory.set(msgId, {
          message,
          signature,
          sender: body.sender || 'unknown',
          timestamp: new Date().toISOString(),
          sealedHash: this.sealed.sealedHash,
        }, MemoryTier.WARM);
        console.log(`[CONTEXT SERVER] 🧠 → Stored in WARM memory: ${msgId}`);

        return new Response(JSON.stringify({ success: true, accepted: true, id: msgId }), {
          status: 200,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 400 }
        );
      }
    }

    // GET /context/next - Return next command for Gemini CLI to process
    if (req.method === "GET" && url.pathname === "/context/next") {
      try {
        const next = this.store.dequeue();
        if (next) {
          return new Response(JSON.stringify({
            success: true,
            id: next.id,
            message: next.message,
            signature: next.signature,
            timestamp: next.timestamp,
          }), { status: 200 });
        }
        return new Response(JSON.stringify({ success: true, message: null }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // POST /context/response - Gemini CLI sends response back
    if (req.method === "POST" && url.pathname === "/context/response") {
      try {
        const body = await req.json() as any;
        const { message, response } = body;

        const id = this.store.saveResponse(message, response, "gemini-cli");

        console.log(`\n[CONTEXT SERVER] ✅ Response received from Gemini CLI`);
        console.log(`   ID: ${id}`);
        console.log(`   Response: ${response?.substring(0, 50)}...`);

        return new Response(JSON.stringify({ success: true, id }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 400 });
      }
    }

    // GET /context/response - Return latest Gemini response
    if (req.method === "GET" && url.pathname === "/context/response") {
      try {
        const latest = this.store.getLatestResponse();
        if (latest) {
          return new Response(JSON.stringify(latest), { status: 200 });
        }
        return new Response(JSON.stringify({ message: "No response yet" }), { status: 202 });
      } catch (_) {
        return new Response(JSON.stringify({ message: "No response yet" }), { status: 202 });
      }
    }

    // GET /health - Health check
    if (req.method === "GET" && url.pathname === "/health") {
      return new Response(JSON.stringify({
        status: "up",
        peerId: this.sealed.sealedHash.substring(0, 16)
      }), {
        status: 200,
      });
    }

    // ================================================================
    // PHASE 2.4: MUTUAL AUTHENTICATION ENDPOINTS
    // ================================================================

    // POST /context/auth/challenge - Claude pede um desafio
    if (req.method === "POST" && url.pathname === "/context/auth/challenge") {
      try {
        const body = await req.json() as any;
        const { initiatorSealedHash } = body;

        console.log(`[AUTH] Generating challenge for initiator: ${initiatorSealedHash?.substring(0, 16)}`);

        const { MutualAuthenticator } = await import("../crypto/mutual-authenticator.js");
        const challenge = await MutualAuthenticator.generateChallenge(initiatorSealedHash);

        return new Response(JSON.stringify(challenge), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // POST /context/auth/respond - Gemini responde ao challenge com nonce assinado
    if (req.method === "POST" && url.pathname === "/context/auth/respond") {
      try {
        const body = await req.json() as any;
        const { nonce, signature, responderSealedHash } = body;

        console.log(`[AUTH] Received handshake response for nonce: ${nonce?.substring(0, 16)}`);

        if (!nonce || !signature) {
          return new Response(
            JSON.stringify({ error: "Missing nonce or signature" }),
            { status: 400 }
          );
        }

        // Generate session token from nonce + sealed hashes
        const sessionData = `${nonce}:${this.sealed.sealedHash}:${responderSealedHash || "unknown"}`;
        const sessionToken = createHash("sha256").update(sessionData).digest("hex");

        // Persist session in SQLite
        this.store.createSession(sessionToken, this.sealed.sealedHash, nonce, responderSealedHash);

        console.log(`[AUTH] ✅ Session established: ${sessionToken.substring(0, 16)}`);

        return new Response(JSON.stringify({
          success: true,
          sessionToken,
          expiresAt: Date.now() + 86400000,
          message: "Handshake complete. Session active for 24h.",
        }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // GET /context/memory/stats - Monitor memory health
    if (req.method === "GET" && url.pathname === "/context/memory/stats") {
      try {
        const stats = await this.memory.getStats();
        return new Response(
          JSON.stringify({
            hot: {
              count: stats.hot.count,
              size: stats.hot.size,
              sizeGB: (stats.hot.size / (1024 * 1024 * 1024)).toFixed(2),
              pct: ((stats.hot.size / (500 * 1024 * 1024)) * 100).toFixed(2)
            },
            warm: {
              count: stats.warm.count,
              size: stats.warm.size,
              sizeGB: (stats.warm.size / (1024 * 1024 * 1024)).toFixed(2),
              pct: ((stats.warm.size / (2 * 1024 * 1024 * 1024)) * 100).toFixed(2)
            },
            cold: {
              count: stats.cold.count,
              size: stats.cold.size,
              sizeGB: (stats.cold.size / (1024 * 1024 * 1024)).toFixed(2),
              pct: ((stats.cold.size / (4 * 1024 * 1024 * 1024)) * 100).toFixed(2)
            }
          }),
          { status: 200 }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 500 }
        );
      }
    }

    // GET /context/dispatch/queue - Check memory queue status
    if (req.method === "GET" && url.pathname === "/context/dispatch/queue") {
      try {
        const stats = await this.memory.getStats();
        return new Response(
          JSON.stringify({
            queue: {
              hot: stats.hot.count,
              warm: stats.warm.count,
              cold: stats.cold.count,
              total: stats.hot.count + stats.warm.count + stats.cold.count
            },
            ready: stats.warm.count > 0 || stats.hot.count > 0
          }),
          { status: 200 }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 500 }
        );
      }
    }

    // ================================================================
    // PHASE 3.0: GOSSIP PROTOCOL ENDPOINTS
    // ================================================================

    // POST /gossip/receive - Another peer forwards a gossip message to us
    if (req.method === "POST" && url.pathname === "/gossip/receive") {
      try {
        const message = await req.json() as any;
        if (!message.id || !message.originPeer || message.hops === undefined) {
          return new Response(JSON.stringify({ error: "Invalid gossip message" }), { status: 400 });
        }
        const result = await this.gossip.receive(message);
        return new Response(JSON.stringify(result), { status: result.dropped ? 208 : 200 });
        // 208 Already Reported = dedup'd (not an error, just informational)
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // POST /gossip/peers/register - Register a known peer in the registry
    if (req.method === "POST" && url.pathname === "/gossip/peers/register") {
      try {
        const body = await req.json() as any;
        const { id, endpoint } = body;
        if (!id || !endpoint) {
          return new Response(JSON.stringify({ error: "id and endpoint required" }), { status: 400 });
        }
        this.peerRegistry.register({ id, endpoint, lastSeen: Date.now(), sessionToken: body.sessionToken });
        console.log(`[GOSSIP] Registered peer: ${id.substring(0, 16)} @ ${endpoint}`);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // GET /gossip/peers - List known active peers
    if (req.method === "GET" && url.pathname === "/gossip/peers") {
      try {
        const peers = this.peerRegistry.getActivePeers(300_000); // active last 5 min
        return new Response(JSON.stringify({
          count: peers.length,
          peers: peers.map(p => ({ id: p.id.substring(0, 16), endpoint: p.endpoint, lastSeen: p.lastSeen })),
        }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    // POST /gossip/broadcast - Originate a new gossip message from this node
    if (req.method === "POST" && url.pathname === "/gossip/broadcast") {
      try {
        const body = await req.json() as any;
        const { payload, ttl } = body;
        if (!payload) {
          return new Response(JSON.stringify({ error: "payload required" }), { status: 400 });
        }
        const message = this.gossip.originate(payload, ttl ?? 6);
        const peers = this.peerRegistry.getActivePeers(300_000);
        const result = await this.gossip.spread(message, peers);
        console.log(`[GOSSIP] Broadcast originated: ${message.id} → ${result.forwarded} peers`);
        return new Response(JSON.stringify({ message, result }), { status: 200 });
      } catch (error) {
        return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
      }
    }

    return new Response("Not found", { status: 404 });
  }

  /**
   * Get server status (for monitoring/shutdown)
   */
  getServer() {
    return this.server;
  }
}

// CLI entry point
// @ts-ignore
if (import.meta.main) {
  const server = new ContextServer();
  const port = parseInt(process.argv[process.argv.length - 1]) || 9000;
  await server.init(port);
}
