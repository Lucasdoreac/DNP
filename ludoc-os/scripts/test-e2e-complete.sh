#!/bin/bash
# LUDOC Phase 2.3 - END-TO-END Complete Test
# Valida fluxo COMPLETO: Dispatcher → Server → Queue → Gemini → Response

set -e
cd /mnt/c/Users/ludoc/DNP/ludoc-os

echo "========================================="
echo "  LUDOC Phase 2.3 - E2E Complete Test"
echo "========================================="
echo ""

# Kill any existing processes
echo "[SETUP] Limpando processos antigos..."
pkill -f "context-server.ts" || true
pkill -f "gemini-bridge" || true
rm -f .ludoc/message-queue.json .ludoc/gemini-response.json
sleep 2
echo "✅ Limpeza concluída"
echo ""

# 1. Iniciar Context Server
echo "[1/5] Iniciando Context Server em background..."
bun run ./src/api/context-server.ts > /tmp/context-server.log 2>&1 &
SERVER_PID=$!
echo "✅ Context Server iniciado (PID: $SERVER_PID)"
sleep 2

# Verificar que servidor está rodando
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo "❌ Context Server falhou ao iniciar"
  cat /tmp/context-server.log
  exit 1
fi
echo "✅ Context Server verificado e rodando"
echo ""

# 2. Iniciar Gemini Bridge
echo "[2/5] Iniciando Gemini Bridge em background..."
bash ./gemini-bridge-api.sh > /tmp/gemini-bridge.log 2>&1 &
BRIDGE_PID=$!
echo "✅ Gemini Bridge iniciado (PID: $BRIDGE_PID)"
sleep 2
echo ""

# 3. Enviar mensagem assinada
echo "[3/5] Enviando mensagem assinada via Dispatcher..."
bun run ./src/api/dispatcher.ts --send "LUDOC E2E Test - What is digital sovereignty?" --host 127.0.0.1 --port 9000 2>&1 | grep -E "(DISPATCHER|Sending)"
sleep 2

# Verificar que entrou na fila
if [ ! -f .ludoc/message-queue.json ]; then
  echo "❌ Mensagem não foi enfileirada"
  cat /tmp/context-server.log | tail -10
  exit 1
fi
echo "✅ Mensagem enfileirada com sucesso"
QUEUE_SIZE=$(cat .ludoc/message-queue.json | jq length)
echo "   Tamanho da fila: $QUEUE_SIZE mensagens"
echo ""

# 4. Aguardar Gemini processar
echo "[4/5] Aguardando Gemini Bridge processar (30s)..."
for i in {1..30}; do
  if [ -f .ludoc/gemini-response.json ]; then
    echo ""
    echo "✅ Resposta do Gemini recebida em ${i}s!"
    break
  fi
  printf "."
  sleep 1
done

if [ ! -f .ludoc/gemini-response.json ]; then
  echo ""
  echo "⚠️  Timeout aguardando resposta"
  echo "   Fila atual:"
  cat .ludoc/message-queue.json | jq .
  echo ""
  echo "   Logs do Gemini Bridge (últimas 20 linhas):"
  tail -20 /tmp/gemini-bridge.log
fi
echo ""

# 5. Validar resposta
echo "[5/5] Validando resposta..."
if [ -f .ludoc/gemini-response.json ]; then
  RESPONSE=$(cat .ludoc/gemini-response.json)

  # Verificar estrutura
  if echo "$RESPONSE" | jq . &>/dev/null; then
    echo "✅ Resposta é JSON válido"

    # Extrair e mostrar
    echo ""
    echo "📋 Resposta do Gemini:"
    echo "─────────────────────────────────────────"
    echo "$RESPONSE" | jq .
    echo "─────────────────────────────────────────"
  else
    echo "❌ Resposta não é JSON válido"
    echo "Conteúdo: $RESPONSE"
  fi
else
  echo "⚠️  Arquivo de resposta não foi criado"
fi

echo ""
echo "========================================="
echo "  Cleanup"
echo "========================================="
# Kill processes
kill $SERVER_PID 2>/dev/null || true
kill $BRIDGE_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
wait $BRIDGE_PID 2>/dev/null || true
echo "✅ Processos encerrados"
echo ""
echo "========================================="
echo "  ✅ Teste E2E Concluído"
echo "========================================="
