#!/bin/bash
# LUDOC OS P2P - Gemini Bridge (via Gemini API)
# Escuta fila e processa via API em vez de CLI

QUEUE_FILE=".ludoc/message-queue.json"
RESPONSE_FILE=".ludoc/gemini-response.json"
MAX_RETRIES=3

# Usar chave da variável de ambiente ou usar valor default
GEMINI_API_KEY="${GEMINI_API_KEY:-}"

echo "[GEMINI-API-BRIDGE] 🚀 Iniciado com API"
[ -z "$GEMINI_API_KEY" ] && echo "[GEMINI-API-BRIDGE] ⚠️  GEMINI_API_KEY não definida"

while true; do
  if [ -f "$QUEUE_FILE" ]; then
    MESSAGE_COUNT=$(jq 'length' "$QUEUE_FILE" 2>/dev/null || echo "0")

    if [ "$MESSAGE_COUNT" -gt 0 ]; then
      # Extrair primeira mensagem
      MESSAGE=$(jq -r '.[0].text' "$QUEUE_FILE")
      RETRY_COUNT=$(jq -r '.[0].retryCount // 0' "$QUEUE_FILE")

      echo "[GEMINI-API-BRIDGE] 📨 Processando: ${MESSAGE:0:80}..."
      echo "[GEMINI-API-BRIDGE] Tentativa: $((RETRY_COUNT + 1))/$MAX_RETRIES"

      # Tentar processar - para agora, just echo a resposta
      # Em produção, chamaríamos a API do Gemini/Claude
      RESPONSE="Echo response: $MESSAGE"

      if [ -n "$RESPONSE" ]; then
        echo "[GEMINI-API-BRIDGE] ✅ Resposta gerada (${#RESPONSE} chars)"

        # Salvar resposta
        jq -n --arg msg "$MESSAGE" --arg resp "$RESPONSE" \
          '{originalMessage: $msg, response: $resp, respondedAt: now | todate}' \
          > "$RESPONSE_FILE"

        # Remover da fila
        jq '.[1:]' "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
        mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
      else
        echo "[GEMINI-API-BRIDGE] ❌ Erro ao gerar resposta"
        RETRY_COUNT=$((RETRY_COUNT + 1))

        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
          echo "[GEMINI-API-BRIDGE] ❌ Descartada após $MAX_RETRIES tentativas"
          jq '.[1:]' "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
          mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
        else
          echo "[GEMINI-API-BRIDGE] ⚠️  Retry $RETRY_COUNT/$MAX_RETRIES"
          jq ".[0].retryCount = $RETRY_COUNT | [.[0]] + .[1:]" "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
          mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
        fi
      fi
    fi
  fi

  sleep 2
done
