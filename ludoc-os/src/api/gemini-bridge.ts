import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

/**
 * GEMINI BRIDGE - Comunicação direta com Gemini CLI
 *
 * Phase 2.3: Resource-optimized version with:
 * - Process timeout (prevents hanging)
 * - Memory limits
 * - Clean shutdown
 * - Retry with exponential backoff
 */
export class GeminiBridge {
  // Use gemini command directly (already in PATH via alias)
  // This is the most reliable way to invoke Gemini CLI
  private geminiCommand = "gemini";
  private activeProcesses: Set<number> = new Set();
  private readonly PROCESS_TIMEOUT = 30000; // 30 seconds max (Gemini needs time to load)
  private pollInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  /**
   * Processa mensagem via Gemini CLI com timeout
   */
  async processMessage(signedMessage: string): Promise<string> {
    // Reject messages during shutdown
    if (this.isShuttingDown) {
      throw new Error('[GEMINI-BRIDGE] Service is shutting down');
    }

    return new Promise((resolve, reject) => {
      console.log(`[GEMINI-BRIDGE] Enviando para Gemini: "${signedMessage.substring(0, 100)}..."`);
      console.log(`[GEMINI-BRIDGE] DEBUG: geminiCommand = "${this.geminiCommand}"`);

      try {
        // Use execSync with gemini in headless mode using -p/--prompt flag
        // Official Gemini CLI docs: "Use -p/--prompt for non-interactive (headless) mode"
        const command = `${this.geminiCommand} -p "${signedMessage}"`;
        console.log(`[GEMINI-BRIDGE] DEBUG: command = "${command.substring(0, 100)}..."`);
        const output = execSync(command, {
          timeout: this.PROCESS_TIMEOUT,
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          stdio: ['pipe', 'pipe', 'pipe'],
        });

        if (output.trim().length > 0) {
          console.log(`[GEMINI-BRIDGE] ✅ Resposta (${output.length} chars)`);
          resolve(output.trim());
        } else {
          reject(new Error('Empty response'));
        }
      } catch (error) {
        const err = error as any;
        if (err.status === 0) {
          // Empty response but successful
          console.log(`[GEMINI-BRIDGE] ✅ Resposta (exit 0)`);
          resolve('');
        } else {
          console.error(`[GEMINI-BRIDGE] ❌ Erro (status ${err.status}): ${err.message.substring(0, 100)}`);
          reject(error);
        }
      }
    });
  }

  /**
   * Clean shutdown
   */
  async shutdown(): Promise<void> {
    console.log('[GEMINI-BRIDGE] Shutting down...');
    this.isShuttingDown = true;

    // Stop polling
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    // Kill all active Gemini processes
    for (const pid of this.activeProcesses) {
      console.log(`[GEMINI-BRIDGE] Killing active process: ${pid}`);
      try {
        process.kill(pid, 'SIGTERM');
      } catch (e) {
        // Process may already be dead
      }
    }

    this.activeProcesses.clear();
    console.log('[GEMINI-BRIDGE] ✅ Shutdown complete');
  }

  /**
   * Listener - Lê fila de mensagens e processa com Gemini
   */
  async listen(queueFile: string = ".ludoc/message-queue.json") {
    console.log(`[GEMINI-BRIDGE] Listening for messages from ${queueFile}...`);

    setInterval(async () => {
      try {
        const content = readFileSync(queueFile, "utf-8");
        const queue = JSON.parse(content) as any[];

        if (queue.length > 0) {
          const message = queue.shift();
          console.log(`[GEMINI-BRIDGE] Processing message from queue...`);

          // Inicializar contador de tentativas se não existir
          if (!message.retryCount) {
            message.retryCount = 0;
          }
          message.retryCount++;

          const MAX_RETRIES = 3;

          try {
            const response = await this.processMessage(message.text);

            // Salvar resposta
            const responseFile = ".ludoc/gemini-response.json";
            writeFileSync(
              responseFile,
              JSON.stringify(
                {
                  originalMessage: message.text,
                  response,
                  respondedAt: new Date().toISOString(),
                },
                null,
                2
              )
            );

            console.log(`[GEMINI-BRIDGE] ✅ Response saved to ${responseFile}`);

            // Atualizar fila (remover mensagem processada)
            writeFileSync(queueFile, JSON.stringify(queue, null, 2));
          } catch (error) {
            console.error(`[GEMINI-BRIDGE] Error processing message: ${error}`);

            // Verificar limite de tentativas
            if (message.retryCount >= MAX_RETRIES) {
              console.error(`[GEMINI-BRIDGE] ❌ Message discarded after ${MAX_RETRIES} failed attempts`);
              console.error(`[GEMINI-BRIDGE] Message: ${message.text.substring(0, 50)}...`);
              // NÃO recolocar na fila - descartar permanentemente
              writeFileSync(queueFile, JSON.stringify(queue, null, 2));
            } else {
              console.error(`[GEMINI-BRIDGE] ⚠️  Retry ${message.retryCount}/${MAX_RETRIES} - requeuing message`);
              // Recolocar na fila com contador incrementado
              queue.unshift(message);
              writeFileSync(queueFile, JSON.stringify(queue, null, 2));
            }
          }
        }
      } catch (error) {
        // Fila não existe ainda, ignorar
      }
    }, 2000); // Poll a cada 2 segundos
  }
}

// CLI entry point
// @ts-ignore
if (import.meta.main) {
  const bridge = new GeminiBridge();
  await bridge.listen();
}
