/// <reference types="bun" />

import { readFileSync } from "fs";
import { PGPEngine } from "../crypto/pgp-engine.js";
import { SealedIdentityManager } from "../crypto/sealed-identity.js";

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

  async init(port: number = 9000) {
    // Carregar identidade selada
    this.sealed = await SealedIdentityManager.load();
    if (!this.sealed) {
      throw new Error("[CONTEXT] Sealed identity not found. Run bootstrap-v2.ts --seal first");
    }

    // Extrair chave pública do protocolo
    const protocolContent = readFileSync("./protocol.yaml", "utf-8");
    const yaml = await import("yaml");
    const protocol = yaml.parse(protocolContent);
    this.publicKey = protocol.identity?.primaryKey?.public_key || "";

    if (!this.publicKey) {
      throw new Error("[CONTEXT] No public key in protocol.yaml");
    }

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

    // POST /context/dispatch - Receber dispatch assinado de Claude
    if (req.method === "POST" && url.pathname === "/context/dispatch") {
      try {
        const body = await req.json() as any;
        const { message, signature } = body;

        // VALIDAR: PGP
        const isValid = await PGPEngine.verify(message, signature, this.publicKey);

        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid PGP signature" }),
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

        // Adicionar à fila
        let queue: any[] = [];
        try {
          const queueContent = fs.readFileSync(".ludoc/message-queue.json", "utf-8");
          queue = JSON.parse(queueContent);
        } catch (_) {
          // Primeira vez, criar fila vazia
        }

        queue.push({
          text: message,
          signature,
          timestamp: new Date().toISOString(),
          processedBy: "gemini",
        });

        fs.writeFileSync(".ludoc/message-queue.json", JSON.stringify(queue, null, 2));

        return new Response(JSON.stringify({ success: true, accepted: true, queued: true }), {
          status: 200,
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: String(error) }),
          { status: 400 }
        );
      }
    }

    // GET /context/response - Retornar resposta de Gemini
    if (req.method === "GET" && url.pathname === "/context/response") {
      try {
        const response = fs.readFileSync(".ludoc/gemini-response.json", "utf-8");
        return new Response(response, { status: 200 });
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
