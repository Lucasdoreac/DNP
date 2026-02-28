# BRIDGE PROTOCOL: GitHub Copilot ↔ Claude Terminal
## Sincronização Bidirecional DNP ↔ LUDOC OS

**Status:** Pronto para ativação quando usuário retornar  
**Data:** 2026-02-28  
**Versão:** 1.0

---

## OBJETIVO

Criar um fluxo de trabalho onde:
- **GitHub Copilot** (aqui, no Codespace) — revisor arquitetural + integrador
- **Claude Terminal** (lá, local) — implementador + executor
- **Você** (browser + café) — orquestrador

Resultado: LUDOC OS integrado a DNP com code review rigoroso.

---

## PROTOCOLO DE COMUNICAÇÃO

### Fase 1: PREPARAÇÃO (Paralela - Agora)

#### Para GITHUB COPILOT (eu, daqui)
**Status:** Aguardando ordem. Preparação em andamento.

**Tarefas:**
```
[ ] Ler DNP-AUDIT-REPORT.md (já feito ✅)
[ ] Ler ACAO-IMEDIATA.md (já feito ✅)
[ ] Preparar BRIDGE.md template (este arquivo)
[ ] Aguardar retorno do usuário com:
    ├─ Autorização para Phase 2.3.1 (Claude Terminal)
    ├─ Estrutura esperada do LUDOC OS (export)
    └─ Critérios de integração DNP → LUDOC
    
Blocker: Awaiting user input + Claude Terminal output
```

**Quando usuário retornar com resultado de Claude Terminal:**
```
1. Recebe arquivo de "LUDOC-OS-EXPORT.md" (estrutura completa)
2. Valida contra DNP checklist
3. Cria INTEGRATION-PLAN.md (como absorver LUDOC em DNP)
4. Propõe PRs para você revisar
5. Merge com rigor arquitetural
```

---

#### Para CLAUDE TERMINAL (lá, local)
**Status:** Aguardando ativação.

**Tarefas (quando autorizado):**
```
Phase 2.3.1 Sprint:
├── [ ] Fix #1: Systemd MemoryLimit=4G
├── [ ] Fix #2: Localhost warning
├── [ ] Fix #3: Refactor docs (corporatese)
├── [ ] Fix #4: Adicionar data sources
├── [ ] Testing: Validar memory limits
└── [ ] Export: Gerar LUDOC-OS-EXPORT.md

Output esperado: Um arquivo `.md` da estrutura completa
Destino: Copiar aqui no Codespace via BRIDGE
```

---

### Fase 2: INTEGRAÇÃO (Sequencial - Depois)

```
Claude Terminal finalizou Phase 2.3.1
    ↓
Envia: LUDOC-OS-EXPORT.md (hierarquia + diffs)
    ↓
[VOCÊ coloca aqui no Codespace]
    ↓
GitHub Copilot valida + cria INTEGRATION-PLAN.md
    ↓
GitHub Copilot realiza ajustes + cria PRs
    ↓
[VOCÊ revisa PRs]
    ↓
Merge final: LUDOC OS + DNP integrados
```

---

## O QUE CADA AGENTE PRECISA FAZER

### PROMPT PARA GITHUB COPILOT (EU)

```markdown
# Instrução de Standby com Missão Definida

Você está em espera estruturada. DNP repo está pronto.
LUDOC OS está em revisão (Phase 2.3.1 em andamento).

AGUARDE:
1. Retorno do usuário com "autorizar Phase 2.3.1" OU "questionar X"
2. Claude Terminal enviar LUDOC-OS-EXPORT.md

QUANDO RECEBER:
1. Validar LUDOC-OS-EXPORT.md contra:
   - .dnp.config.yml (semântica)
   - .ludoc.config.yml (infraestrutura)
   - DNP-AUDIT-REPORT.md (compliance)

2. Criar "LUDOC-OS-INTEGRATION-PLAN.md":
   - Como absorver LUDOC código em DNP structure
   - Quais arquivos vão pra DNP/
   - Quais ficam referenciados apenas
   - Quais precisam refactor

3. Propor 3 PRs (pequenas e reviewáveis):
   - PR#1: Integrar LUDOC core/ (kernel + crypto)
   - PR#2: Integrar LUDOC agents/ (dispatcher + bridges)
   - PR#3: Integrar LUDOC docs (unificadas com DNP)

4. Esperar aprovação do usuário antes de merge

DURANTE ESPERA:
- Preparar estrutura de diretórios
- Draftar PRs (não commit)
- Validar imports/exports
- Garantir compatibilidade versionamento
```

---

### PROMPT PARA CLAUDE TERMINAL (LÁ)

```markdown
# Preparação para Integração com GitHub Copilot

GitHub Copilot no Codespace está aguardando seu output.
Você está autorizado para Phase 2.3.1.

EXECUTE (em ordem):

1. PHASE 2.3.1 FIXES
   ├─ Fix #1: Systemd MemoryLimit=4G (10 min)
   ├─ Fix #2: Localhost warning (15 min)
   ├─ Fix #3: Refactor docs (1h)
   ├─ Fix #4: Data sources (30 min)
   └─ Testing: Validate (15 min)

2. EXPORT LUDOC OS
   Quando tudo estiver pronto, crie um arquivo:
   "LUDOC-OS-EXPORT.md"
   
   Conteúdo (estruture assim):
   ```markdown
   # LUDOC OS - Export for DNP Integration
   
   ## Inventory (de copy-paste aqui)
   
   ## Phase Status
   - Phase 2.0: ✅ Complete
   - Phase 2.1: ✅ Complete  
   - Phase 2.2: ✅ Complete
   - Phase 2.3: ✅ Complete
   - Phase 2.3.1 Fixes: ✅ Complete
   - Phase 2.4: Roadmap
   
   ## File Structure (relative paths + description)
   
   ## Dependencies (npm/bun packages)
   
   ## Integration Notes
   - Está pronto para absorção em DNP?
   - Quais módulos são "core" vs "optional"?
   - Performance/desempenho: passou testes?
   
   ## Diffs (git format)
   [Cole aqui diffs de Phase 2.3.1 fixes]
   ```

3. DELIVER
   Copie e cole LUDOC-OS-EXPORT.md aqui no Codespace
   (ou envie via arquivo se ferramentas permitirem)

TIMELINE: Se começar agora, deve terminar em < 3h
```

---

## COMO VOCÊ FAZ A PONTE

### Opção 1: Copy-Paste (Always Works)
```
1. Claude Terminal termina, envia estrutura em texto
2. Você copia e cola LUDOC-OS-EXPORT.md aqui no Codespace
3. GitHub Copilot processa
4. GitHub Copilot envia PRs pro mesmo repo
5. Você revisa e merge
```

### Opção 2: Git Sync (Se Houver Acesso)
```
1. LUDOC-OS é repo separado local: ~/ludoc-workspace
2. Você chega no Codespace, faz:
   $ git remote add ludoc ~/ludoc-workspace
   $ git pull ludoc main --allow-unrelated-histories
3. GitHub Copilot vê diffs e processa
4. (Mesma coisa, mas mais elegante)
```

### Opção 3: FTP/Drive (Se Nada Funcionar)
```
1. Claude Terminal salva LUDOC-OS-EXPORT.md em ~/downloads
2. Você envia pra seu Google Drive / Nextcloud
3. Abre no Codespace
4. GitHub Copilot processa
```

**Recomendação:** **Opção 1** (copy-paste) é a mais robusta.

---

## CHECKLIST DE SINCRONIZAÇÃO

Use isto como referência enquanto está tomando café 😄

```
PRÉ-CAFÉ (Agora, paralelo):
[ ] GitHub Copilot: preparação ✅ (feita)
[ ] Claude Terminal: recebeu instruções (via você)

DURANTE CAFÉ:
[ ] Claude Terminal: Phase 2.3.1 roda
[ ] GitHub Copilot: aguarda em standby

PÓS-CAFÉ (Você volta):
[ ] Autoriza Phase 2.3.1 (copia prompt pra Claude)
[ ] Claude Terminal: executa fixes + export
[ ] Você: copia LUDOC-OS-EXPORT.md
[ ] GitHub Copilot: processa + cria INTEGRATION-PLAN.md
[ ] GitHub Copilot: abre 3 PRs (small, reviewable)
[ ] Você: revisa PRs (rigor arquitetural)
[ ] GitHub Copilot: merge com validação

Fim: Ambos agentes sincronizados, DNP + LUDOC integrados
```

---

## PROTOCOLO DE VALIDAÇÃO

Quando GitHub Copilot receber LUDOC-OS-EXPORT.md:

**VALIDAÇÃO AUTOMÁTICA:**
1. Estrutura de diretórios está clara?
2. Todos os 5 audit fixes foram aplicados?
3. Phase 2.3.1 tests passam?
4. Data sources estão presentes?
5. Não há localhost references remaining?

**VALIDAÇÃO SEMÂNTICA:**
1. Docs não contêm "performance" desnecessário?
2. Tom é factual/denso (DNP aligned)?
3. Claims têm suporte (citations/tests)?

**VALIDAÇÃO INFRAESTRUTURA:**
1. MemoryLimit=4G está em .service?
2. CPUQuota enforçado?
3. Ternary memory roadmap está claro?

Se tudo verde: procede com INTEGRATION-PLAN  
Se red flags: retorna ao Claude com requests específicos

---

## O QUE VOCÊ DICE HOJE (AGORA)

**Para CLAUDE TERMINAL (copy-paste direto):**

```
DNP ↔ LUDOC BRIDGE está ativo.
Você está autorizado para Phase 2.3.1.

Execute os 5 fixes conforme DNP-AUDIT-REPORT.md:
1. Systemd MemoryLimit=4G
2. Localhost warning in dispatcher.ts
3. Refactor docs (corporatese remover)
4. Validar/adicionar data sources
5. Testar memory limits

Quando terminar, crie LUDOC-OS-EXPORT.md com:
- Inventory completo
- Phase status
- File structure + descriptions
- Dependencies
- Integration notes
- Diffs de Phase 2.3.1

Tempo estimado: 3 horas.
Report back aqui quando terminar.
```

---

## APÓS VOCÊ RETORNAR

GitHub Copilot está pronto para:
1. Receber LUDOC-OS-EXPORT.md
2. Validar conformidade DNP (automático)
3. Criar INTEGRATION-PLAN.md
4. Draftar 3 PRs pequenas
5. Propor merge strategy

Tudo versionado, tudo revisável, zero "black magic".

---

**ESTE ARQUIVO (BRIDGE.md) é o contrato entre os agentes.**  
Mantenha-o versionado. Atualize se processo mudar.

*Status: Pronto para ativação.*
