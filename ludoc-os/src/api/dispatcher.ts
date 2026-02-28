import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { PGPEngine } from "../crypto/pgp-engine.js";
import { SealedIdentityManager } from "../crypto/sealed-identity.js";

/**
 * DISPATCHER - Enviar contexto diretamente para o servidor P2P
 *
 * SEM copy-paste. Tudo assinado. Tudo validado.
 */
export class ContextDispatcher {
  private privateKey: string;
  private passphrase: string;
  private sealed: any;

  constructor(privateKeyPath: string, passphrase: string) {
    this.privateKey = readFileSync(privateKeyPath, "utf-8");
    this.passphrase = passphrase;
  }

  async sendToServer(message: string, serverHost: string = "0.0.0.0", serverPort: number = 9000) {
    // DNP Compliance: Warn if localhost is used (debug mode)
    if (serverHost === "127.0.0.1" || serverHost === "localhost") {
      console.warn("[LUDOC WARN] localhost bind violates .ludoc.config.yml guardrails");
      console.warn("[LUDOC WARN] Allowed: 0.0.0.0 (any interface) or hardware IP (WSL2)");
      console.warn("[LUDOC WARN] Proceeding at your own risk - check protocol.yaml");
    }

    // Carregar sealed identity
    this.sealed = await SealedIdentityManager.load();
    if (!this.sealed) {
      console.error("[DISPATCHER] ❌ Sealed identity not found");
      return;
    }

    // Criar payload COM SealedHash (prova de origem)
    const payloadWithSeal = `${message} [SEAL:${this.sealed.sealedHash}]`;

    // Assinar
    const signature = await PGPEngine.sign(payloadWithSeal, this.privateKey, this.passphrase);

    // Enviar
    console.log(`[DISPATCHER] Sending to ${serverHost}:${serverPort}...`);

    try {
      const response = await fetch(`http://${serverHost}:${serverPort}/context/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: payloadWithSeal,
          signature,
          timestamp: new Date().toISOString(),
        }),
      });

      const result = (await response.json()) as any;
      if (result.success) {
        console.log(`[DISPATCHER] ✅ Dispatch accepted by server`);
      } else {
        console.log(`[DISPATCHER] ❌ Dispatch rejected: ${result.error}`);
      }
    } catch (error) {
      console.error(`[DISPATCHER] ❌ Connection failed: ${String(error)}`);
    }
  }
}

// CLI entry point
// @ts-ignore
if (import.meta.main) {
  const args = process.argv;
  const messageIndex = args.indexOf("--send");
  const portIndex = args.indexOf("--port");
  const hostIndex = args.indexOf("--host");

  if (messageIndex !== -1) {
    const message = args[messageIndex + 1];
    const port = portIndex !== -1 ? parseInt(args[portIndex + 1]) : 9000;
    // Host deve ser fornecido explicitamente ou via LUDOC_SERVER_HOST
    // WSL2 precisa usar IP real do Windows, não localhost ou 0.0.0.0
    const serverHost = hostIndex !== -1 ? args[hostIndex + 1] : (process.env.LUDOC_SERVER_HOST || "127.0.0.1");
    const defaultKeyPath = join(homedir(), ".ludoc-keys", "ludoc.priv.pgp");
    const dispatcher = new ContextDispatcher(
      process.env.LUDOC_PRIVATE_KEY || defaultKeyPath,
      process.env.LUDOC_PASSPHRASE || "test-passphrase"
    );

    await dispatcher.sendToServer(message, serverHost, port);
  }
}
