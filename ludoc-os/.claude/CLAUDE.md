# CLAUDE.md - Workspace DNP/LUDOC OS

**Project:** DNP Monorepo + LUDOC OS Subproject
**Primary Workspace:** `C:\Users\ludoc\ludoc-workspace\`
**GitHub:** https://github.com/Lucasdoreac/DNP

---

## 📋 Estrutura do Projeto

```
DNP/                                 ← Monorepo (constitution)
├── .dnp.config.yml                  ← Dimensões de análise (político, linguístico, cultural, técnico)
├── .ludoc.config.yml                ← Guardrails LUDOC (rede, memória, auth)
├── bootstrap.md                      ← Filosofia + decisões arquiteturais
├── SYNC-PROTOCOL.md                 ← Protocolo Claude ↔ Copilot
├── COPILOT-PROMPT.md                ← Instruções para GitHub Copilot
├── ludoc-os/                         ← Subprojeto soberania
│   ├── src/
│   │   ├── api/                      ← P2P Communication (0.0.0.0 binding)
│   │   ├── agent/                    ← Agent wrapper para integração
│   │   ├── crypto/                   ← PGP + Hardware sealing (Phase 2.1-2.2)
│   │   ├── hardware/                 ← UUID discovery multi-plataforma
│   │   └── kernel/                   ← Bootstrap & orchestration
│   ├── tests/                        ← Vitest (50/50 tests passing)
│   ├── scripts/                      ← bash scripts (E2E, validation)
│   ├── systemd/                      ← Daemon services (4GB memory limit)
│   ├── docs/                         ← Documentação (25+ arquivos)
│   ├── protocol.yaml                 ← Manifest do sistema
│   └── package.json                  ← Dependencies (bun, vitest)
└── docs/
    └── LUDOC-AUDIT-REPORT.md         ← 95% DNP compliance validated
```

---

## 🎯 Fases Implementadas

| Fase | Nome | Status | Tests | Descrição |
|------|------|--------|-------|-----------|
| **2.0** | Core Framework | ✅ COMPLETE | Bootstrap | Orchestration engine |
| **2.1** | Cryptographic Identity | ✅ COMPLETE | 15/15 | PGP via OpenPGP.js |
| **2.2** | Hardware Binding | ✅ COMPLETE | 35/35 | Sealed ID (SHA256) |
| **2.3** | P2P Communication | ✅ COMPLETE | E2E | Dispatcher → Server → Bridge |
| **2.3.1** | DNP Compliance | ✅ COMPLETE | 5/5 | Memory limits, warnings, docs, sources |
| **2.4** | Mutual Auth (Future) | ⏳ PLANNED | — | Ternary memory model |

---

## 🔑 Padrões de Projeto

### Network Guardrails (Rule of Gold)
- ✅ **ALLOWED:** `0.0.0.0` binding (any interface)
- ❌ **FORBIDDEN:** `127.0.0.1` / `localhost` (except debug with warning)
- ✅ **WSL2:** Auto-discovery via `/etc/resolv.conf` + Windows UUID

### Cryptographic Identity
- **Type:** PGP (OpenPGP.js v5.11.0)
- **Key:** RSA 4096-bit
- **Fingerprint:** `3F2D99ABEE94540A39D0BB5D257C433B4BB9A37D`
- **Critical:** `sig.verified` returns Promise (must await)

### Hardware Binding (Sealed Identity)
- **Formula:** `SHA256(PGP_fingerprint + hardware_uuid)`
- **Storage:** `.ludoc/sealed-identity.json` (machine-specific, .gitignore'd)
- **Platforms:** Windows/WSL2/Linux/macOS
- **Key Pattern:** WSL2 must call `powershell.exe` to get Windows UUID

### Message Flow (P2P Bridge)
```
Dispatcher (CLI)
  ├─ Sign with PGP key
  ├─ Add SealedHash (origin proof)
  └─ POST http://0.0.0.0:9000/context/dispatch

Context Server (HTTP)
  ├─ Validate PGP signature
  ├─ Validate SealedHash
  └─ Enqueue to .ludoc/message-queue.json

Gemini Bridge (API)
  ├─ Poll message queue
  ├─ Call Gemini API (not CLI)
  └─ Save response to .ludoc/gemini-response.json
```

---

## 📁 Estrutura de Configuração

```
ludoc-workspace/
├── .claude/                          ← Claude Code configuration
│   ├── MEMORY.md                     ← Project memory (persistent)
│   ├── CLAUDE.md                     ← This file (project instructions)
│   ├── settings.local.json           ← Local settings (.gitignore'd)
│   └── plugins/                      ← Custom plugins (if needed)
│
├── .ludoc/                           ← LUDOC OS runtime state
│   ├── sealed-identity.json          ← Hardware binding (machine-specific)
│   ├── message-queue.json            ← P2P message queue
│   ├── gemini-response.json          ← Processing output
│   └── *.log                         ← Service logs
│
├── .gitignore                        ← Git ignore rules
├── package.json
├── tsconfig.json
├── protocol.yaml
├── README.md
└── src/, tests/, scripts/, docs/    ← Project code
```

**Important:**
- ✅ `.gitignore`: Exclude `.ludoc/` (machine-specific runtime)
- ✅ `.gitignore`: Exclude `.claude/settings.local.json` (local auth)
- ✅ Commit: `.claude/MEMORY.md` and `.claude/CLAUDE.md` (shared knowledge)

---

## 🚀 Desenvolvimento

### Setup
```bash
cd /c/Users/ludoc/ludoc-workspace
bun install
```

### Run Tests
```bash
bun test                             # Vitest (50/50 tests)
bash test-memory-limits.sh           # DNP compliance
bash test-e2e-complete.sh            # E2E P2P flow
```

### Run Services
```bash
# Manual (development)
bash gemini-bridge-api.sh &
bun src/api/context-server.ts

# Production (systemd)
bash setup-ludoc-services.sh
systemctl start ludoc-context-server
```

### Agent Integration
```typescript
import { dispatchQuery, healthCheck } from './src/agent/ludoc-agent-wrapper.js';

// Send query and await response
const response = await dispatchQuery('Your question here');
console.log(response.answer);

// Verify hub is ready
const status = await healthCheck();
console.log(status.ready);  // true/false
```

---

## 🔄 Synchronization Protocol

**Claude (Terminal) ↔ GitHub Copilot (VS Code)**

1. **Export:** Claude exports code/docs via `LUDOC-OS-EXPORT.md`
2. **Validate:** Copilot validates against DNP standards
3. **Integrate:** Copilot creates PR to merge into DNP monorepo
4. **Sync:** Both agents use shared MEMORY.md for context

**Current Status:**
- ✅ PR #1 (initial setup) - awaiting merge
- ⏳ PR #2 (agents + API + scripts) - in progress
- ⏳ PR #3 (documentation) - in progress

---

## 📚 Key References

### Configuration Files
- `.dnp.config.yml` - DNP framework dimensions
- `.ludoc.config.yml` - LUDOC OS guardrails
- `bootstrap.md` - Philosophy + design decisions
- `protocol.yaml` - System manifest

### Documentation
- `SYNC-PROTOCOL.md` - Claude ↔ Copilot sync rules
- `COPILOT-PROMPT.md` - GitHub Copilot setup
- `LUDOC-AUDIT-REPORT.md` - DNP compliance (95%)
- `FINAL-VALIDATION-REPORT.md` - Test evidence

### Memory
- `.claude/MEMORY.md` - Persistent project knowledge
- Updated after each session with lessons learned

---

## ✅ User Preferences & Critical Feedback

### Communication
- **Language:** Português para docs/comments, English para código
- **Style:** Factual, technical, dense (sem corporate language)
- **Validation:** Always check official docs (não web search)
- **Trade-offs:** Always explicit quando existem

### Critical Guardrails
- ✅ Memory limits enforced (4GB max via systemd)
- ✅ Network binding: 0.0.0.0 only (never localhost prod)
- ✅ Hardware identity: Unique per machine, immutable
- ✅ Cryptographic signing: Mandatory (PGP)
- ✅ No secrets in repo: .gitignore enforced

### Autonomy Expectations
- Claude does: Architecture decisions, code review, debugging
- Copilot does: Scaffold generation, documentation, integration
- Both: Validate against official sources, no assumptions

---

## 🎯 Next Steps (Phase 2.4)

After PR #2 + PR #3 are merged:

1. Implement ternary memory model (hot/warm/cold)
2. Add mutual authentication layer
3. Lifecycle management for sealed identities
4. Revocation mechanism for keys
5. CI pipeline validation

---

**Last Updated:** 2026-02-28 (Session 3)
**Project Status:** ✅ PRODUCTION READY (Phase 2.3.1 complete)
**Synchronization:** ✅ Bridge operational (Claude ↔ Copilot)

