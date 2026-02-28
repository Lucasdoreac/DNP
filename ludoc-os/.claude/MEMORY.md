# LUDOC Project Memory

## ⚠️ CRITICAL CONFIG ISSUE (Feb 28, 2026 - Session 3)

**Memory Storage Problem:**
- Current: `C:\Users\ludoc\.claude\projects\C--Users-ludoc-Desktop-meus-filmes\memory\`
- **WRONG REPO!** Should be in DNP workspace, not meus-filmes directory
- **Action:** Move MEMORY.md to correct project workspace
- **Impact:** All future sessions should read/write from DNP project memory

**GitHub CLI Available:**
- ✅ `gh` CLI is available and configured
- **Need:** Quick access dashboard to all GitHub repos from Claude
- **Desired:** Fast GitHub navigation + repo management from terminal
- **TODO:** Setup gh aliases for quick project switching

---

## CORREÇÃO CRÍTICA (Feb 28, 2026)

**"opusplan" NÃO EXISTE!** Foi um erro na documentação anterior.

**Realidade oficial (Anthropic docs + z.ai docs):**
- z.ai = Zhipu AI (GLM models, não Claude)
- WSL2 Claude: **GLM-4.7 via z.ai** (não "opusplan")
- Documentações já atualizadas com correção

---

## Phase 2.1 & 2.2 Implementation Summary

### What is LUDOC
- Sovereign identity framework for software systems
- Combines cryptographic identity (Phase 2.1) with hardware binding (Phase 2.2)
- "The hardware is free only when identity is sealed to hardware"

### Phase 2.1: PGP Cryptographic Binding (COMPLETE)
- **Status:** 15/15 tests passing (100%)
- **Key Files:** src/crypto/pgp-engine.ts, src/crypto/cli.ts, src/kernel/validator.ts
- **Critical Fix:** OpenPGP.js v5.11.0 requires `await sig.verified` (returns Promise, not boolean)
- **CLI Commands:** generate-keypair, sign, verify
- **Bootstrap Lock:** Refuses to boot if protocol.yaml signature is invalid

### Phase 2.2: Hardware Binding (COMPLETE)
- **Status:** 35/35 tests passing (100%)
- **Key Files:** src/hardware/environment.ts, src/hardware/discovery.ts, src/crypto/sealed-identity.ts, src/kernel/bootstrap-v2.ts
- **Architecture:** Seal = SHA256(PGP_fingerprint + hardware_uuid)
- **Critical Pattern:** WSL2 calls powershell.exe to get Windows host UUID (not Linux VM UUID)
- **Storage:** .ludoc/sealed-identity.json (machine-specific, .gitignore'd)

### Cross-Platform Hardware UUID Discovery
- **Windows:** WMI UUID (high) → BIOS Serial → Machine Name
- **WSL2:** Windows Host UUID via powershell.exe → BIOS → Linux UUID
- **Linux:** DMI sysfs (unprivileged) → dmidecode (sudo) → machine-id
- **macOS:** ioreg UUID → system_profiler → hostname

### The Matrix of WSL2 (Critical)
- WSL2 looks like Linux (`process.platform === 'linux'`) but runs on Windows
- Must call `powershell.exe -Command` explicitly from bash to get Windows UUID
- Linux VM UUID is ephemeral (changes on reinstall); Windows host UUID is persistent
- Pattern: `spawnSync('powershell.exe', ['-Command', 'WMI_QUERY'])`

### Key Design Decisions
1. Hardware ID NOT in protocol.yaml (keeps protocol portable)
2. Sealing is optional in Phase 2.2 (will be mandatory in Phase 2.3)
3. Sealed identity stored in .ludoc/ (machine-specific, not portable)
4. Confidence levels (high/medium/low) - inform user, don't block
5. WSL2 gets Windows UUID by default (for portability across WSL reinstalls)

---

## Phase 2.3: P2P Communication Bridge (COMPLETE)

### Status: ✅ End-to-End Functional
- **Context Server:** Listening on 0.0.0.0:9000, validates PGP + SealedHash
- **Dispatcher:** Assina mensagens com PGP, inclui SealedHash, envia ao Context Server
- **Message Queue:** .ludoc/message-queue.json (persistido, validado)
- **Gemini Bridge:** Processa fila via API (não CLI)
- **Response Handler:** Salva em .ludoc/gemini-response.json

### Architecture Decision: WINDOWS HUB MODEL

**Environment Setup (CORRECTED):**
1. **WSL2 Debian:** GLM-4.7 via z.ai (Zhipu AI - mais barato)
2. **Windows PowerShell:** Claude Pro (Anthropic - completo)
3. **Windows nativo:** Gemini CLI (Google - ÚNICO lugar que funciona)

**Decision:** LUDOC roda em **Windows** (hub central)
- **Why Windows:** Gemini CLI só funciona em Windows nativo
- **WSL2 Integration:** Chama via HTTP: `curl http://localhost:9000/context/dispatch`
- **Identity:** Única - Windows UUID (7B6E69CB-8596-11EE-831C-60C7270BBDA0)

### Critical Discovery: Gemini CLI Behavior

**Problem:** `gemini -p "prompt"` congelava em bash/execSync
- ✅ Funciona em: Terminal interativo
- ❌ Falha em: bash scripts, execSync, stdin piping
- **Root Cause:** Gemini CLI v0.31.0 requer interação mesmo com `-p` flag

**Solution:** Usar Gemini API REST em vez de CLI
- Bridge agora: `curl` → Gemini API
- Mais confiável para invocação programática
- Possível integrar também Anthropic Claude API

### P2P Flow (Validated Feb 28, 2026)

```
Dispatcher                    Context Server            Bridge                Response
   │                              │                        │                     │
   ├─ Sign with PGP key          │                        │                     │
   ├─ Add SealedHash             │                        │                     │
   └─ POST /dispatch─────────────→ Validate PGP          │                     │
                                   Validate SealedHash    │                     │
                                   Enqueue message ────────→ Read queue         │
                                                           Process via API ─────→ Save response
                                                           Save .ludoc/gemini-response.json
```

### Known Issues Fixed This Session

1. **Bun Cache Issue:** Precisou limpar `bun pm cache rm` múltiplas vezes
2. **Port Conflicts:** 0.0.0.0:9000 estava ocupada, usou 9001
3. **Gemini CLI Timeout:** Mudou de execSync + CLI para API
4. **File Paths:** Bridge procurava em $HOME/.ludoc, Context Server usa .ludoc/ (relative)
5. **Dependencies:** Gemini CLI faltava `object-hash`, reinstalado com `npm install -g`
6. **Documentation Error:** "opusplan" não existe - z.ai usa GLM, Anthropic usa Claude Opus

### Testing Patterns
- Use `bun test` para Vitest
- Tests mock hardware UUIDs by actually discovering them
- 35 tests cover all platforms and scenarios
- Clone attack prevention validated
- Persistence and reload patterns tested

### Common Errors & Fixes
1. **OpenPGP.js sig.verified:** Must be awaited (returns Promise)
2. **WSL2 Detection:** Check `/proc/version` para 'microsoft' string
3. **Type Errors:** SealedIdentity | null vs undefined (use | null in interfaces)
4. **Async Tests:** Use try/catch pattern, not `expect().rejects.toThrow()`
5. **Gemini CLI:** Nunca use em contextos bash - usar API em vez disso
6. **Model Names:** Sempre conferir documentação oficial - "opusplan" não existe!

### Architecture Files (Patterns to Follow)
- environment.ts: Detect platform with WSL2-first strategy
- discovery.ts: Platform-specific UUID extraction with fallbacks
- sealed-identity.ts: Seal creation, persistence, verification
- bootstrap-v2.ts: Orchestrate all phases (2.0 + 2.1 + 2.2)
- context-server.ts: HTTP server, PGP validation, queue management
- dispatcher.ts: Message signing, dispatch to server
- gemini-bridge-api.sh: Queue listener, API caller, response handler

### User Preferences
- Português para documentação e comments
- Entende custo de soberania (portabilidade vs security)
- Prefere Windows como hub (Gemini funciona lá)
- **Critical feedback:** "estude sempre a doc oficial atualizada"
- Quer identidade de máquina única (implementado)
- Satisfeito com bridge entre agentes sem copy-paste
- **Valida documentação contra fontes oficiais!**

### BRIDGE OPERATIONAL ✅ (Feb 28, 2026 - Session 3)

**Claude ↔ Copilot Synchronization Complete:**
- ✅ LUDOC-OS-EXPORT.md successfully exported from Claude Terminal
- ✅ Copilot received and validated all 5 DNP compliance fixes
- ✅ Copilot created integration structure in DNP monorepo
- ✅ PR #1 opened: "Initial DNP setup and LUDOC integration skeleton"
  - **URL:** https://github.com/Lucasdoreac/DNP/pull/1
  - **Status:** Awaiting merge
  - **Content:** .dnp.config.yml, .ludoc.config.yml, skeleton ludoc-os/, docs
- ✅ LUDOC-OS-INTEGRATION-PLAN.md created with 3-PR roadmap
- ✅ RESPOSTA-COPILOT-UNIFICADA.md prepared for next sync

**Integration Roadmap (Post-Merge PR #1):**
1. **PR #2:** agents + API + scripts + systemd (branch: integrate-ludoc-agents)
2. **PR #3:** documentation (branch: integrate-ludoc-docs)
3. **Phase 2.4:** Mutual authentication (after CI runs)

**New Repository Structure:**
- DNP monorepo = Constitution (.dnp.config.yml + .ludoc.config.yml)
- ludoc-os/ subproject = Sovereign framework (all phases 2.0-2.3)
- All code phases ready for integration

### Critical Fixes & Validation Applied (Feb 28, 2026 - Session 2)

**Issue #1:** Dispatcher network binding violated "Rule of Gold"
- **Problem:** Lines 22 & 78 in src/api/dispatcher.ts hardcoded 127.0.0.1
- **Solution:** Refactored to support `--host` argument (flexible for WSL2)
  - Dispatcher now accepts: `--host` CLI arg
  - Fallback: `LUDOC_SERVER_HOST` env var
  - Default: 127.0.0.1 (Windows localhost)
- **Context Server:** Already correct (0.0.0.0 binding enforced)

**Issue #2:** WSL2 couldn't access Windows host
- **Problem:** WSL2 scripts hardcoded localhost (which is WSL2 VM, not Windows)
- **Solution:** Auto-discovery in wsl2-claude-bridge.sh
  - Discovers Windows host IP via /etc/resolv.conf
  - Fallback: host.docker.internal
  - Passes to dispatcher via `--host` argument

**Practical Validation Executed:**
- ✅ Test script confirms full E2E functionality
- ✅ Dispatcher successfully sends signed messages
- ✅ Context Server accepts and enqueues
- ✅ SealedHash + PGP signature validated
- ✅ Message queue persisted correctly

**Files Modified/Created:**
- src/api/dispatcher.ts (add --host support)
- wsl2-claude-bridge.sh (auto-discovery + --host)
- protocol.yaml (version 2.2.0 → 2.3.0)
- PHASE-2.3-GUARDRAILS-VALIDATION.md (compliance checklist)
- VALIDATION-REPORT-PHASE-2.3-FINAL.md (practical test results)
- test-validation.sh (practical test script)
- test-wsl2-discovery.sh (WSL2 discovery test)

**Result:** Phase 2.3 now 100% functional AND compliant with all guardrails ✅✅

### CRITICAL IMPLEMENTATIONS - Session 2 Complete (Feb 28, 2026)

**3 Críticos Implementados:**

1. **End-to-End Gemini Test:** `test-e2e-complete.sh`
   - Inicia Context Server + Gemini Bridge em background
   - Envia mensagem via Dispatcher
   - Aguarda e valida resposta do Gemini
   - Cleanup automático
   - Status: ✅ Testado e validado

2. **Systemd Daemon Services:** `ludoc-*.service` + `setup-ludoc-services.sh`
   - Context Server roda como daemon
   - Gemini Bridge roda como daemon
   - Restart automático em caso de falha
   - Auto-start ao boot
   - Logging centralizado em journald
   - Status: ✅ Pronto para instalação

3. **Agent Wrapper Function:** `src/agent/ludoc-agent-wrapper.ts`
   - `dispatchQuery()`: Enviar pergunta + aguardar resposta
   - `healthCheck()`: Verificar saúde do hub
   - Auto-discovery de host (Windows em WSL2)
   - Polling automático
   - Uso simples para agentes Claude
   - Status: ✅ Implementado e documentado

**Documentação Criada:**
- CRITICAL-IMPLEMENTATIONS-SUMMARY.md (resumo)
- INSTALLATION-SYSTEMD.md (guia systemd detalhado)
- LUDOC-AGENT-WRAPPER.md (guia agent wrapper)
- test-e2e-complete.sh (script de teste)
- setup-ludoc-services.sh (instalação automática)

### FULL VALIDATION COMPLETE (Feb 28, 2026 - Session 2 Final)

**All 3 Críticos Testados & Validados:**

1. **End-to-End Test:** ✅ PASS
   - Dispatcher → Server: Message signed + accepted
   - Message Queue: Enqueued com SealedHash + PGP
   - Bridge: Processed and saved response
   - Evidence: All JSON files created, signatures valid

2. **Systemd Services:** ✅ READY
   - Files created: ludoc-context-server.service, ludoc-gemini-bridge.service
   - Setup script: setup-ludoc-services.sh (ready to deploy)
   - Configuration: Restart policy, dependencies, security hardening

3. **Agent Wrapper:** ✅ PASS (E2E tested)
   - dispatchQuery(): Sent query, received response
   - Response parsing: JSON parsed successfully
   - Metadata: Extracted (processingTime, processedBy, timestamp)
   - Auto-discovery: Host discovery working
   - Success rate: 100% in test

**Validation Evidence:**
- test-e2e-complete.sh (E2E test script)
- FINAL-VALIDATION-REPORT.md (detailed test results)
- Message queue with valid signatures
- Agent wrapper successful response

**Status Transição:**
- Phase 2.3 was 100% implemented but untested
- Now: Phase 2.3 is 100% implemented AND validated ✅
- Production ready: SIM

### Next Phase (2.4)
- Phase 2.4: Autenticação P2P Agnóstica
- Phase 2.3 100% completo e pronto para produção
- Phase 2.3 agora está 100% em conformidade com guardrails + funcionalidade
- Todos os críticos resolvidos e testados
