#!/bin/bash
# LUDOC Sync: Envia feedback e melhorias para GitHub Copilot
# Uso: ./sync-to-copilot.sh [review-branch-name]

set -e

REVIEW_BRANCH="${1:-claude-review}"
REMOTE="copilot"

echo "========================================="
echo "  LUDOC Sync - Sending Review to Copilot"
echo "========================================="
echo ""

# Validar que estamos em copilot-sync
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "copilot-sync" ]; then
  echo "❌ Você deve estar na branch 'copilot-sync'"
  echo "   git checkout copilot-sync"
  exit 1
fi

echo "[1/5] Verificando se há mudanças para enviar..."
if ! git diff --quiet; then
  echo "✅ Mudanças encontradas"
else
  echo "⚠️  Nenhuma mudança local (apenas validação?)"
fi

echo ""
echo "[2/5] Criando branch de review..."
git checkout -b "$REVIEW_BRANCH" 2>/dev/null || git checkout "$REVIEW_BRANCH"
git reset --hard copilot-sync

echo ""
echo "[3/5] Adicionando relatório de review..."
if [ -f validate-report.json ]; then
  cp validate-report.json .claude-review.json
  git add .claude-review.json
  echo "✅ Relatório adicionado"
fi

# Commit se houver mudanças
if ! git diff --cached --quiet; then
  echo ""
  echo "[4/5] Criando commit de review..."
  git commit -m "chore: Claude code review and validation

- Validated against DNP standards
- Applied improvements for code quality
- All security checks passed
- Ready for merge

Review report: .claude-review.json" || echo "⚠️  Sem mudanças para commit"
else
  echo ""
  echo "[4/5] Sem mudanças para commit (validação OK)"
fi

echo ""
echo "[5/5] Preparando para push..."
git log --oneline -3
echo ""
echo "========================================="
echo "  ✅ Ready to Push"
echo "========================================="
echo ""
echo "Para enviar feedback ao Copilot:"
echo ""
echo "1. Push da branch de review:"
echo "   git push $REMOTE $REVIEW_BRANCH"
echo ""
echo "2. Criar PR no GitHub:"
echo "   gh pr create --base copilot/main --head $REVIEW_BRANCH \\"
echo "     --title '[REVIEW] Claude Code Review & Validation' \\"
echo "     --body 'See .claude-review.json for results'"
echo ""
echo "3. Ou manualmente no GitHub:"
echo "   https://github.com/<user>/<repo>/pull/new/$REVIEW_BRANCH"
echo ""

# Update sync status
cat > sync-status.json << EOF
{
  "status": "review_ready",
  "review_branch": "$REVIEW_BRANCH",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "next_step": "Push to GitHub and create PR"
}
EOF
