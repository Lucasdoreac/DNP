#!/bin/bash

# COMANDO PARA SINCRONIZAR ESTRUTURA NO REPOSITÓRIO DNP
# Execute isto no diretório raiz do repositório DNP clonado

# Pré-requisito: Clone do DNP repo
# $ git clone https://github.com/Lucasdoreac/DNP.git
# $ cd DNP/ludoc-os

echo "=== Sincronizando estrutura de projeto ==="
echo ""

# 1. Copiar MEMORY.md
echo "[1] Copiando MEMORY.md..."
mkdir -p .claude
if [ -f "/c/Users/ludoc/ludoc-workspace/.claude/MEMORY.md" ]; then
  cp /c/Users/ludoc/ludoc-workspace/.claude/MEMORY.md .claude/MEMORY.md
  echo "✅ MEMORY.md copiado"
else
  echo "⚠️  arquivo de memória não encontrado; pulando"
fi

# 2. Copiar CLAUDE.md
echo "[2] Copiando CLAUDE.md..."
if [ -f "/c/Users/ludoc/ludoc-workspace/.claude/CLAUDE.md" ]; then
  cp /c/Users/ludoc/ludoc-workspace/.claude/CLAUDE.md .claude/CLAUDE.md
  echo "✅ CLAUDE.md copiado"
else
  echo "⚠️  CLAUDE.md não existe; gerencie manualmente"
fi

# 3. Atualizar .gitignore
echo "[3] Atualizando .gitignore..."
cat >> .gitignore << 'EOF'

# LUDOC OS runtime state (machine-specific)
.ludoc/sealed-identity.json
.ludoc/message-queue.json
.ludoc/gemini-response.json
.ludoc/*.log

# Claude Code local settings (auth tokens, personal config)
.claude/settings.local.json

# IDE & temp
.claude/plugins/
.claude/.cache/
EOF
echo "✅ .gitignore atualizado"

# 4. Criar/selecionar branch
echo "[4] Criando/checando branch..."
BRANCH="configure-project-structure"
if git rev-parse --verify "$BRANCH" >/dev/null 2>&1; then
  git checkout "$BRANCH"
  echo "✅ Branch '$BRANCH' existente, fazendo checkout"
else
  git checkout -b "$BRANCH"
  echo "✅ Branch '$BRANCH' criado"
fi

# 5. Fazer commit
echo "[5] Fazendo commit..."
git add .claude/ .gitignore
git commit -m "chore: configure project memory and settings structure

- Move MEMORY.md from legacy location to .claude/
- Create project-specific CLAUDE.md with DNP/LUDOC OS guidelines
- Update .gitignore to exclude machine-specific runtime state
- Implement Option C: Separate Claude config from LUDOC runtime
- .claude/ contains: MEMORY.md, CLAUDE.md, settings.local.json (shared knowledge)
- .ludoc/ contains: sealed-identity, message-queue, logs (machine-specific, gitignored)

This structure allows:
✅ Persistent project memory across sessions
✅ Clear separation between config and runtime
✅ Machine-specific state properly excluded from VCS
✅ Synchronized knowledge base for Claude ↔ Copilot bridge"

echo "✅ Commit criado"

# 6. Abrir PR
echo "[6] Abrindo PR..."

# push branch and create pr if it doesn't exist yet
BRANCH="configure-project-structure"
git push --set-upstream origin "$BRANCH" || true

# if a PR already exists this will open another; rely on gh CLI fill
if ! gh pr view --json number --jq '.number' --head "$BRANCH" >/dev/null 2>&1; then
  gh pr create --fill --head "$BRANCH" --base main \
    --title "chore: configure project memory and settings structure" \
    --body "Configure project memory and settings with Option C structure:\n\n## Changes\n- ✅ Move MEMORY.md to .claude/ (persistent across sessions)\n- ✅ Create CLAUDE.md with project guidelines\n- ✅ Update .gitignore for machine-specific runtime\n\n## Structure (Option C)\n\`\`\`\n.claude/              ← Claude Code config\n├── MEMORY.md        ← Shared project knowledge\n├── CLAUDE.md        ← Project guidelines\n└── settings.local.json (gitignored)\n\n.ludoc/              ← LUDOC OS runtime (gitignored)\n├── sealed-identity.json\n├── message-queue.json\n└── *.log\n\`\`\`\n\n## Benefits\n- Clear separation of concerns\n- Persistent memory for sessions\n- Machine-specific state excluded\n- Ready for Claude ↔ Copilot synchronization\n\n**Depends on:** PR #1 (awaiting merge)\n**Next:** PR #2 will integrate actual code\n"
else
  echo "ℹ️  Pull request for $BRANCH já existe, não será recriado"
fi

echo ""
echo "=========================================="
echo "✅ Sincronização completa!"
echo "=========================================="
echo ""
echo "PR foi aberto. Aguardando review..."
echo ""
echo "Próximos passos:"
echo "1. Review PR no GitHub"
echo "2. Merge quando ready"
echo "3. Retornar para Claude Terminal"
echo ""
