#!/bin/bash
# LUDOC Sync: Recebe código do GitHub Copilot
# Uso: ./sync-from-copilot.sh [branch-name] [remote-url]

set -e

BRANCH_NAME="${1:-copilot/main}"
REMOTE_URL="${2}"

echo "========================================="
echo "  LUDOC Sync - Receiving from Copilot"
echo "========================================="
echo ""

# Validar que estamos em um repo git
if [ ! -d .git ]; then
  echo "❌ Não é um git repository"
  exit 1
fi

# Se remote URL foi fornecida, adicionar remote
if [ -n "$REMOTE_URL" ]; then
  echo "[1/5] Adicionando remote do Copilot..."
  git remote add copilot "$REMOTE_URL" 2>/dev/null || git remote set-url copilot "$REMOTE_URL"
  echo "✅ Remote configurado"
else
  echo "[1/5] Usando remote 'copilot' existente"
fi

echo ""
echo "[2/5] Buscando branch do Copilot..."
git fetch copilot "$BRANCH_NAME"
echo "✅ Fetched"

echo ""
echo "[3/5] Criando branch local 'copilot-sync'..."
git checkout -b copilot-sync "copilot/$BRANCH_NAME" 2>/dev/null || git checkout copilot-sync

echo ""
echo "[4/5] Verificando estrutura..."
if [ -f protocol.yaml ] && [ -d src/ ]; then
  echo "✅ Estrutura básica OK"
else
  echo "⚠️  Estrutura incompleta (pode ser primeira recepção)"
fi

echo ""
echo "[5/5] Salvando sync status..."
cat > sync-status.json << EOF
{
  "status": "received",
  "branch": "copilot-sync",
  "remote": "copilot/$BRANCH_NAME",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "next_step": "run ./validate-copilot-code.sh"
}
EOF
echo "✅ Status salvo"

echo ""
echo "========================================="
echo "  ✅ Sync Complete"
echo "========================================="
echo ""
echo "Próximos passos:"
echo "1. Revisar mudanças:"
echo "   git diff copilot-sync main | less"
echo ""
echo "2. Validar código:"
echo "   ./validate-copilot-code.sh"
echo ""
echo "3. Aplicar melhorias:"
echo "   ./apply-claude-improvements.sh"
echo ""
echo "4. Enviar feedback:"
echo "   ./sync-to-copilot.sh"
echo ""
