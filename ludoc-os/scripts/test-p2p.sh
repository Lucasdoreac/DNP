#!/bin/bash
# LUDOC OS P2P - Test script

echo "=== LUDOC OS P2P Test ==="
echo ""

# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

cd /mnt/c/Users/ludoc/DNP/ludoc-os

# Limpar arquivos antigos
echo "1. Limpando arquivos antigos..."
rm -f ~/.ludoc/message-queue.json ~/.ludoc/gemini-response.json
echo "✅ Limpo"

# Enviar mensagem
echo ""
echo "2. Enviando mensagem assinada..."
bun run ./src/api/dispatcher.ts --send "O que é soberania digital para um desenvolvedor?"

# Aguardar processamento
echo ""
echo "3. Aguardando processamento (15s)..."
sleep 15

# Verificar resposta
echo ""
echo "4. Verificando resposta..."
if [ -f ~/.ludoc/gemini-response.json ]; then
  echo "✅ Resposta recebida!"
  echo ""
  cat ~/.ludoc/gemini-response.json | head -20
else
  echo "⏳ Resposta não pronta ainda"
  echo "Verifique:"
  echo "  - ~/.ludoc/message-queue.json (deve estar vazio)"
  echo "  - Logs do gemini-bridge em outro terminal"
fi
