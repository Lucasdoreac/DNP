#!/bin/bash
# LUDOC OS P2P - Gemini Bridge (Bash version)
# Escuta fila de mensagens e processa via Gemini CLI

QUEUE_FILE=".ludoc/message-queue.json"
RESPONSE_FILE=".ludoc/gemini-response.json"
MAX_RETRIES=3

echo "[GEMINI-BRIDGE-BASH] 🚀 Iniciado - Aguardando mensagens..."

while true; do
  if [ -f "$QUEUE_FILE" ]; then
    # Verificar se há mensagens na fila
    MESSAGE_COUNT=$(jq 'length' "$QUEUE_FILE" 2>/dev/null || echo "0")

    if [ "$MESSAGE_COUNT" -gt 0 ]; then
      # Extrair primeira mensagem
      MESSAGE=$(jq -r '.[0].text' "$QUEUE_FILE")
      RETRY_COUNT=$(jq -r '.[0].retryCount // 0' "$QUEUE_FILE")

      echo "[GEMINI-BRIDGE-BASH] 📨 Processando: ${MESSAGE:0:100}..."
      echo "[GEMINI-BRIDGE-BASH] Tentativa: $((RETRY_COUNT + 1))/$MAX_RETRIES"

      # Tentar processar com Gemini
      RESPONSE=$(timeout 120 gemini -p "$MESSAGE" 2>&1 | tail -50)
      STATUS=$?

      if [ $STATUS -eq 0 ] && [ -n "$RESPONSE" ]; then
        echo "[GEMINI-BRIDGE-BASH] ✅ Resposta recebida (${#RESPONSE} chars)"

        # Salvar resposta
        jq -n --arg msg "$MESSAGE" --arg resp "$RESPONSE" \
          '{originalMessage: $msg, response: $resp, respondedAt: now | todate}' \
          > "$RESPONSE_FILE"

        # Remover da fila
        jq '.[1:]' "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
        mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
      else
        echo "[GEMINI-BRIDGE-BASH] ❌ Erro (status $STATUS): ${RESPONSE:0:50}..."
        RETRY_COUNT=$((RETRY_COUNT + 1))

        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
          echo "[GEMINI-BRIDGE-BASH] ❌ Descartada após $MAX_RETRIES tentativas"
          jq '.[1:]' "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
          mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
        else
          echo "[GEMINI-BRIDGE-BASH] ⚠️  Retry $RETRY_COUNT/$MAX_RETRIES"
          # Incrementar retry count e recolocar na fila
          jq ".[0].retryCount = $RETRY_COUNT | [.[0]] + .[1:]" "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
          mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"
        fi
      fi
    fi
  fi

  sleep 2
done
