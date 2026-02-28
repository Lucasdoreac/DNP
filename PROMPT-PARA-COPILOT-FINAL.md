# PROMPT PARA GITHUB COPILOT - Estrutura de Memória & Config

**Cole isto no VS Code/Copilot:**

---

## 🤖 Olá Copilot,

Precisamos resolver a estrutura de memória e configuração do projeto DNP/LUDOC OS.

### Estado Atual:

**`.ludoc/` (LUDOC OS Runtime State):**
```
.ludoc/
├── context-server.log
├── gemini-bridge-api.log
├── gemini-bridge.log
├── gemini-response.json
├── message-queue.json
└── sealed-identity.json
```

**`.claude/` (Claude Code Configuration):**
```
.claude/
└── settings.local.json
```

**Memória legada:**
- Localização: `C:\Users\ludoc\.claude\projects\C--Users-ludoc-Desktop-meus-filmes\memory\MEMORY.md`
- Status: Precisa ser movida para `ludoc-workspace/`

### 🎯 A Decisão:

**Qual estrutura você recomenda?**

**OPÇÃO A:** Separar Config de Runtime
```
ludoc-workspace/
├── .claude/                    ← Claude Code config
│   ├── MEMORY.md              ← Memória do projeto
│   ├── CLAUDE.md              ← Instruções específicas
│   └── settings.local.json
├── .ludoc/                     ← LUDOC OS runtime (como está)
│   ├── sealed-identity.json
│   ├── message-queue.json
│   └── *.log
└── CLAUDE.md                   ← Project CLAUDE.md na raiz
```

**OPÇÃO B:** Unificar em `.ludoc/`
```
ludoc-workspace/
├── .ludoc/                     ← Tudo unificado
│   ├── MEMORY.md
│   ├── CLAUDE.md
│   ├── settings.local.json
│   ├── sealed-identity.json
│   ├── message-queue.json
│   └── *.log
└── CLAUDE.md                   ← Referência na raiz
```

**OPÇÃO C:** Separar em pastas de propósito
```
ludoc-workspace/
├── .claude/
│   ├── MEMORY.md
│   ├── CLAUDE.md
│   └── settings.local.json
├── .ludoc/                     ← Runtime apenas
│   ├── sealed-identity.json
│   ├── message-queue.json
│   └── *.log
└── CLAUDE.md                   ← Na raiz também
```

### Suas Instruções:

1. **Escolha a opção** (A, B ou C) que faz mais sentido para DNP
2. **Crie a estrutura** no repositório (branch `configure-project-structure`)
3. **Mova a MEMORY.md** da pasta legada para o lugar correto
4. **Crie um CLAUDE.md** específico para ludoc-workspace com:
   - Workspace info (DNP monorepo + ludoc-os subprojeto)
   - Padrões do projeto
   - Referência aos arquivos de config
5. **Abra um PR** intitulado: "chore: configure project memory and settings structure"
6. **Aguarde merge** de PR #1 antes de proceder

### Critério de Decisão:

- **Clareza:** Qual é mais fácil de entender?
- **Manutenção:** Qual é mais fácil de manter?
- **Padrão:** Qual segue a convenção do Claude Code?

### Quando Terminar:

Responda com:
 - ✅ Opção escolhida (A/B/C)
 - ✅ Estrutura criada (com comandos `mkdir`, `mv`, etc)
 - ✅ CLAUDE.md project-specific criado
 - ✅ PR número aberto
 - ✅ Próximas ações

---

**Depois disso, você e Claude podem sincronizar automaticamente!** 🚀
