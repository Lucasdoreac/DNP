#!/bin/bash
# LUDOC Phase 2.3 - Teste de Validação Real

set -e
cd /mnt/c/Users/ludoc/DNP/ludoc-os

echo "========================================="
echo "  LUDOC Phase 2.3 - Validação Prática"
echo "========================================="
echo ""

# 1. Verificar pré-requisitos
echo "[1/4] Verificando pré-requisitos..."
if [ ! -f .ludoc/sealed-identity.json ]; then
  echo "❌ Sealed identity não encontrada"
  exit 1
fi
if [ ! -f ~/.ludoc-keys/ludoc.priv.pgp ]; then
  echo "❌ Private key não encontrada"
  exit 1
fi
echo "✅ Pré-requisitos OK"
echo ""

# 2. Limpar fila antiga
echo "[2/4] Limpando fila de mensagens antiga..."
rm -f .ludoc/message-queue.json .ludoc/gemini-response.json
echo "✅ Fila limpa"
echo ""

# 3. Enviar mensagem assinada
echo "[3/4] Enviando mensagem assinada via Dispatcher..."
echo "     Usando: bun run ./src/api/dispatcher.ts --send \"test message\" --host 127.0.0.1 --port 9000"
if bun run ./src/api/dispatcher.ts --send "LUDOC Phase 2.3 Validation Test" --host 127.0.0.1 --port 9000 2>&1; then
  echo "✅ Dispatcher executado"
else
  echo "⚠️  Dispatcher retornou erro (pode ser esperado se server não está rodando)"
fi
echo ""

# 4. Verificar fila
echo "[4/4] Verificando se mensagem foi enfileirada..."
if [ -f .ludoc/message-queue.json ]; then
  echo "✅ Arquivo de fila criado:"
  cat .ludoc/message-queue.json | jq . | head -15
else
  echo "⏳ Fila não foi criada (Context Server pode não estar rodando)"
  echo ""
  echo "Para teste completo, execute em outro terminal:"
  echo "  cd /mnt/c/Users/ludoc/DNP/ludoc-os"
  echo "  bun run ./src/api/context-server.ts"
  echo ""
  echo "Depois re-execute este script"
fi

echo ""
echo "========================================="
echo "  Teste Concluído"
echo "========================================="
