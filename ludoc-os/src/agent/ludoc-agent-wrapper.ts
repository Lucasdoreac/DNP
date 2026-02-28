/**
 * LUDOC Agent Wrapper
 *
 * Interface para agentes (Claude WSL2, Claude Windows, etc)
 * acessarem o LUDOC P2P hub sem conhecer detalhes de implementação.
 *
 * Uso:
 *   const result = await dispatchQuery("sua pergunta aqui");
 *   console.log(result.response);
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { ContextDispatcher } from "../api/dispatcher.js";

interface DispatchResult {
  success: boolean;
  response?: string;
  error?: string;
  metadata?: {
    processingTime: number;
    processedBy: string;
    timestamp: string;
  };
}

/**
 * LUDOC Agent Query Interface
 *
 * Envia pergunta assinada para o hub P2P e aguarda resposta.
 * Usa identidade hardware-bound do sistema.
 *
 * @param question Pergunta/prompt para enviar
 * @param timeout Timeout em ms (padrão: 60000)
 * @param serverHost Host do Context Server (descoberto automaticamente)
 * @param serverPort Porta do Context Server (padrão: 9000)
 *
 * @returns DispatchResult com resposta ou erro
 */
export async function dispatchQuery(
  question: string,
  timeout: number = 60000,
  serverHost?: string,
  serverPort: number = 9000
): Promise<DispatchResult> {
  try {
    // 1. Descobrir host do servidor se não fornecido
    const host = serverHost || discoverServerHost();

    console.log(`[LUDOC-AGENT] 📨 Enviando pergunta para ${host}:${serverPort}...`);

    // 2. Enviar via dispatcher
    const privateKeyPath = join(homedir(), ".ludoc-keys", "ludoc.priv.pgp");
    const passphrase = process.env.LUDOC_PASSPHRASE || "test-passphrase";

    const dispatcher = new ContextDispatcher(privateKeyPath, passphrase);
    await dispatcher.sendToServer(question, host, serverPort);

    console.log("[LUDOC-AGENT] ✅ Pergunta enviada, aguardando resposta...");

    // 3. Aguardar resposta no arquivo
    const response = await waitForResponse(timeout);

    return {
      success: true,
      response: response.content,
      metadata: response.metadata,
    };
  } catch (error) {
    console.error(`[LUDOC-AGENT] ❌ Erro: ${String(error)}`);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * Descobrir host do Context Server
 *
 * Estratégia:
 * 1. Variável de ambiente LUDOC_SERVER_HOST
 * 2. Em WSL2: IP do Windows via /etc/resolv.conf
 * 3. Fallback: localhost (127.0.0.1)
 */
function discoverServerHost(): string {
  // 1. Env var explícita
  if (process.env.LUDOC_SERVER_HOST) {
    console.log(`[LUDOC-AGENT] 🔍 Server host (env): ${process.env.LUDOC_SERVER_HOST}`);
    return process.env.LUDOC_SERVER_HOST;
  }

  // 2. WSL2: Tentar ler /etc/resolv.conf
  try {
    const resolvConf = readFileSync("/etc/resolv.conf", "utf-8");
    const match = resolvConf.match(/nameserver\s+([0-9.]+)/);
    if (match && match[1]) {
      console.log(`[LUDOC-AGENT] 🔍 Server host (WSL2 discovery): ${match[1]}`);
      return match[1];
    }
  } catch (e) {
    // Não é WSL2 ou Linux
  }

  // 3. Fallback: localhost (Windows nativo)
  console.log(`[LUDOC-AGENT] 🔍 Server host (fallback): 127.0.0.1`);
  return "127.0.0.1";
}

/**
 * Aguardar resposta do Gemini Bridge
 *
 * Polling em .ludoc/gemini-response.json com retry automático
 */
async function waitForResponse(
  timeout: number
): Promise<{ content: string; metadata: any }> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 segundos

  while (Date.now() - startTime < timeout) {
    try {
      const responseFile = ".ludoc/gemini-response.json";
      const content = readFileSync(responseFile, "utf-8");
      const data = JSON.parse(content);

      // Validar estrutura
      if (data.response || data.content) {
        console.log("[LUDOC-AGENT] 📦 Resposta recebida!");
        return {
          content: data.response || data.content,
          metadata: {
            processingTime: Date.now() - startTime,
            processedBy: data.processedBy || "unknown",
            timestamp: data.timestamp || new Date().toISOString(),
          },
        };
      }
    } catch (e) {
      // Arquivo não existe ou não é JSON válido ainda
    }

    // Aguardar antes de próximo poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error(`Timeout aguardando resposta (${timeout}ms)`);
}

/**
 * Health Check do LUDOC Hub
 *
 * Verifica se Context Server está respondendo
 */
export async function healthCheck(
  serverHost?: string,
  serverPort: number = 9000
): Promise<boolean> {
  try {
    const host = serverHost || discoverServerHost();
    const response = await fetch(`http://${host}:${serverPort}/health`, {
      method: "GET",
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.error(`[LUDOC-AGENT] Health check failed: ${String(error)}`);
    return false;
  }
}

/**
 * CLI Entry Point para testes
 */
// @ts-ignore
if (import.meta.main) {
  const question = process.argv[2] || "What is LUDOC?";

  dispatchQuery(question)
    .then((result) => {
      if (result.success) {
        console.log("\n✅ Success!");
        console.log("Response:", result.response);
        console.log("Metadata:", result.metadata);
      } else {
        console.log("\n❌ Failed!");
        console.log("Error:", result.error);
      }
    })
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}
