# PROMPT PARA CLAUDE TERMINAL
## Copy-paste isto direto no seu chat local

---

Olá Claude. GitHub Copilot (eu, no Codespace) está sincronizado com você agora via BRIDGE protocol.

**Contexto:** Você criou LUDOC OS (excelente). Agora vou revisar + integrar com protocolo DNP.

Mas antes, você precisa passar por **Phase 2.3.1** — um sprint de 5 fixes de conformidade detectados em auditoria cruzada.

**Arquivo de referência:** DNP-AUDIT-REPORT.md
(não está aí, mas GitHub Copilot tem. Vou descrever os 5 fixes abaixo)

---

## FIXES A EXECUTAR (Phase 2.3.1)

### FIX #1: Systemd MemoryLimit (10 min)

**Arquivo:** `ludoc-context-server.service` e `ludoc-gemini-bridge.service`

**O que fazer:**
Adicionar isto nos arquivos `.service`:

```ini
[Service]
Type=simple
ExecStart=/usr/bin/bun /opt/ludoc/src/index.ts
# ADICIONAR ESTAS 3 LINHAS:
MemoryLimit=4G
CPUQuota=200%
MemoryMax=4G
```

**Por quê:** `.ludoc.config.yml` exige máximo 4GB. Systemd precisa enforçar fisicamente.

**Teste:** `systemctl status ludoc-context-server` deve mostrar memory limits.

---

### FIX #2: Localhost Warning (15 min)

**Arquivo:** `src/api/dispatcher.ts` ou `src/api/context-server.ts`

**O que fazer:**
Adicione isto **antes** de `app.listen()`:

```typescript
// Add warning for localhost
if (host === '127.0.0.1' || host === 'localhost') {
  console.warn(`[LUDOC WARN] localhost bind violates .ludoc.config.yml`);
  console.warn(`[LUDOC WARN] Allowed: 0.0.0.0, your hardware IP`);
  console.warn(`[LUDOC WARN] Proceeding at your own risk.`);
}
```

**Por quê:** localhost é "debug mode" corporativo. Deve ser explicitamente marcado.

**Teste:** Rode com `--host=127.0.0.1` e veja warning.

---

### FIX #3: Refactor Docs (1 hora)

**Arquivos:** Any markdown files contendo:
- "performance" (fora de contexto histórico)
- "best practices"
- "enterprise-grade"
- "optimize/optimization"

**O que fazer:**

Find-replace em PRs:
```
❌ "best practices" → ✅ "recommended approach"
❌ "optimize performance" → ✅ "improve correctness"
❌ "enterprise-grade" → ✅ (apenas remove)
❌ "performance optimization" → ✅ "functional improvement"
```

**Por quê:** `.dnp.config.yml` rejeita "performance" corporativa. DNP é sobre **desempenho técnico**, não sobre spectacle.

**Teste:** `grep -r "performance" docs/` não deve retornar frases corporativas.

---

### FIX #4: Validar Data Sources (30 min)

**Arquivos:** Qualquer doc que faz CLAIM sem fonte

**O que fazer:**

Exemplo encontrado:
```
❌ "LUDOC OS reduces infrastructure costs by 40%"
   ^ Sem fonte. Ou adiciona study, ou remove claim.

✅ Opção A: "LUDOC OS reduces infrastructure costs via hardware binding
   (see: TBD-benchmark-report.md)"
   
✅ Opção B: Apenas remove claim.
```

**Por quê:** `.dnp.config.yml` exige: "dados e fontes de verdade".

**Teste:** Para cada claim no README, há uma citação/estudo?

---

### FIX #5: Test Memory Limits (15 min)

**Arquivo:** Nenhum arquivo, mas validate:

**O que fazer:**
```bash
# Inicie um serviço:
systemctl start ludoc-context-server

# Cheque memory limit foi aplicado:
systemctl show ludoc-context-server --property=MemoryLimit

# Output esperado:
# MemoryLimit=4294967296  (4GB in bytes)

# Cheque CPU quota:
systemctl show ludoc-context-server --property=CPUQuota
# Output: CPUQuota=200%
```

**Por quê:** Validar que infraestrutura está physicamente enforçada.

---

## OUTPUT ESPERADO

Quando terminar os 5 fixes, crie um arquivo chamado:

**`LUDOC-OS-EXPORT.md`**

Estrutura (copy-paste e preencha):

```markdown
# LUDOC OS - Export for DNP Integration
## Phase 2.3.1 Completion Report

**Date:** [hoje]
**All 5 Fixes:** ✅ Complete

### Inventory (Current)

\`\`\`
ludoc-workspace/
├── src/
│   ├── api/
│   │   ├── dispatcher.ts     (FIX #2: localhost warning ✅)
│   │   └── context-server.ts
│   ├── crypto/
│   └── kernel/
├── ludoc-context-server.service   (FIX #1: Memory limits ✅)
├── ludoc-gemini-bridge.service    (FIX #1: Memory limits ✅)
├── docs/
│   ├── README.md             (FIX #3: corporatese removed ✅)
│   ├── QUICK-START.md        (FIX #3: corporatese removed ✅)
│   └── [5 more docs refactored]
└── (more structure here)
\`\`\`

### Phase Status

- Phase 2.0: ✅ Complete
- Phase 2.1: ✅ Complete (Crypto, 15/15 tests)
- Phase 2.2: ✅ Complete (Hardware, 35/35 tests)
- Phase 2.3: ✅ Complete (P2P Bridge, E2E tested)
- Phase 2.3.1: ✅ Complete (5 DNP compliance fixes)
- Phase 2.4: Roadmap (Ternary memory model)

### DNP Compliance Checklist

- [x] Memory limits enforced via Systemd
- [x] Localhost usage warned
- [x] Docs refactored (corporatese removed)
- [x] Data sources validated
- [x] Tests passed

### Key Changes (Diffs)

[Include key changes from Phase 2.3.1 here, or at least list which files changed]

### Ready for Integration?

✅ YES - LUDOC OS is production-ready and DNP-compliant
```

---

## TIMELINE & NEXT STEPS

**Agora (você, 3 horas):**
1. Fix #1: Systemd
2. Fix #2: Localhost warning
3. Fix #3: Docs refactor
4. Fix #4: Data sources
5. Fix #5: Test memory limits
6. Crie LUDOC-OS-EXPORT.md

**Depois (seu usuário, no Codespace):**
1. Copia LUDOC-OS-EXPORT.md pra lá
2. GitHub Copilot recebe + valida
3. GitHub Copilot cria INTEGRATION-PLAN.md
4. 3 PRs são drafted
5. Usuário revisa + merge

**Result:** LUDOC OS + DNP integrados, production-ready.

---

## CHECKLIST FINAL (Você)

Antes de dizer "pronto":

```
[ ] Fix #1: Systemd MemoryLimit adicionado + testado
[ ] Fix #2: Localhost warning funcionando
[ ] Fix #3: Docs refatorados (zero "performance" desnecessário)
[ ] Fix #4: Claims têm fontes ou foram removidos
[ ] Fix #5: Memory limits physical enforcement validado
[ ] LUDOC-OS-EXPORT.md criado e preenchido
[ ] Commit com mensagem: "Phase 2.3.1: DNP compliance audit fixes"
```

---

**Status:** Você é autorizado. Procee com Phase 2.3.1.

Quando terminar, copie todo o conteúdo de **LUDOC-OS-EXPORT.md** aqui neste chat, ou crie um arquivo e diga ao seu usuário pra trazer pro Codespace.

GitHub Copilot estará aguardando.

---

*Este prompt foi gerado por: GitHub Copilot (Codespace)*  
*Tempo estimado de execução: 3 horas*  
*Prioridade: Crítica para integração DNP*
