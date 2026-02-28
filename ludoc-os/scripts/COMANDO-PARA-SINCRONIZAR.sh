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
cp /c/Users/ludoc/ludoc-workspace/.claude/MEMORY.md .claude/MEMORY.md
echo "✅ MEMORY.md copiado"

# 2. Copiar CLAUDE.md
echo "[2] Copiando CLAUDE.md..."
cp /c/Users/ludoc/ludoc-workspace/.claude/CLAUDE.md .claude/CLAUDE.md
echo "✅ CLAUDE.md copiado"

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

# 4. Criar branch
echo "[4] Criando branch..."
git checkout -b configure-project-structure
echo "✅ Branch criado"

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
gh pr create \
  --title "chore: configure project memory and settings structure" \
  --body "Configure project memory and settings with Option C structure:

## Changes
- ✅ Move MEMORY.md to .claude/ (persistent across sessions)
- ✅ Create CLAUDE.md with project guidelines
- ✅ Update .gitignore for machine-specific runtime

## Structure (Option C)
\`\`\`
.claude/              ← Claude Code config
├── MEMORY.md        ← Shared project knowledge
├── CLAUDE.md        ← Project guidelines
└── settings.local.json (gitignored)

.ludoc/              ← LUDOC OS runtime (gitignored)
├── sealed-identity.json
├── message-queue.json
└── *.log
\`\`\`

## Benefits
- Clear separation of concerns
- Persistent memory for sessions
- Machine-specific state excluded
- Ready for Claude ↔ Copilot synchronization

**Depends on:** PR #1 (awaiting merge)
**Next:** PR #2 will integrate actual code
"

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
