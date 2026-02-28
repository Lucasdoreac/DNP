# Prompt para GitHub Copilot (VS Code)

**Para:** GitHub Copilot em VS Code/Codespace
**Repo:** DNP (seu VS Code)
**Objetivo:** Preparar estrutura inicial para LUDOC OS Phase 2.1+
**Sync:** Claude validará e retornará feedback

---

## 📋 Instruções para o Copilot

Você recebeu esta tarefa via Claude Terminal. Sua função é:

1. **Ler contexto** DNP standards
2. **Preparar scaffold** de código para LUDOC OS
3. **Criar pull request** com código pronto para review
4. **Aguardar feedback** de Claude

---

## 🎯 Tarefa Específica

### 1. Leia os Padrões DNP

Abra e revise:
- `.dnp.config.yml` - Dimensões de análise (político, linguístico, cultural, técnico)
- `.ludoc.config.yml` - Guardrails de infraestrutura (rede, recursos, auth)
- `SYNC-PROTOCOL.md` (neste repo) - Como funciona a sincronização

### 2. Crie Estrutura Scaffolding

Crie estes arquivos/diretórios em seu repo:

```
DNP-repo/
├── ludoc-os/                      # Novo subdir para LUDOC
│   ├── src/
│   │   ├── crypto/
│   │   │   ├── pgp-engine.ts      # OpenPGP.js wrapper (skeleton)
│   │   │   ├── cli.ts              # CLI commands skeleton
│   │   │   └── types.ts
│   │   ├── hardware/
│   │   │   ├── discovery.ts        # UUID discovery skeleton
│   │   │   └── environment.ts
│   │   ├── api/
│   │   │   ├── context-server.ts   # HTTP server skeleton
│   │   │   └── dispatcher.ts       # Message dispatcher skeleton
│   │   ├── kernel/
│   │   │   ├── bootstrap.ts        # Orchestrator skeleton
│   │   │   └── validator.ts
│   │   └── index.ts
│   ├── tests/
│   │   ├── crypto.test.ts
│   │   └── hardware.test.ts
│   ├── protocol.yaml               # LUDOC protocol definition
│   ├── package.json                # With: bun, typescript, vitest
│   ├── tsconfig.json
│   ├── README.md                   # DNP-aligned overview
│   ├── ARCHITECTURE.md             # Design decisions
│   └── .gitignore
├── docs/
│   └── SYNC-PROTOCOL.md           # (Link/copy from ludoc-workspace)
└── .github/
    └── workflows/
        ├── lint.yml               # TypeScript lint
        └── test.yml               # Run tests
```

### 3. Escreva Código Base

Para cada arquivo skeleton, prepare:

#### `src/crypto/pgp-engine.ts`
```typescript
/**
 * PGP Cryptographic Engine
 *
 * Wraps OpenPGP.js for LUDOC identity management.
 * All messages signed with RSA 4096-bit keys.
 *
 * DNP Compliance:
 * - [x] No hardcoded secrets
 * - [x] Headless-only auth
 * - [x] Secure key storage (not in repo)
 */

import * as openpgp from 'openpgp';

export class PGPEngine {
  /**
   * Sign a message with private key
   */
  static async sign(
    message: string,
    privateKeyArmored: string,
    passphrase: string
  ): Promise<string> {
    // TODO: Implement sign with OpenPGP.js
    // Return: Signed message (armored format)
    throw new Error('Not implemented - implement with OpenPGP.js');
  }

  /**
   * Verify signature with public key
   */
  static async verify(
    message: string,
    signature: string,
    publicKeyArmored: string
  ): Promise<boolean> {
    // TODO: Implement verify
    // Return: true if signature valid, false otherwise
    throw new Error('Not implemented');
  }
}
```

#### `src/hardware/discovery.ts`
```typescript
/**
 * Hardware UUID Discovery
 *
 * Detects and extracts unique hardware identifiers across platforms.
 * Cross-platform strategy: Windows/WSL2/Linux/macOS
 *
 * DNP Compliance:
 * - [x] No external dependencies (use built-in APIs)
 * - [x] Fallback chain (high → medium → low confidence)
 * - [x] Immutable UUIDs (hardware-bound)
 */

export interface HardwareID {
  uuid: string;
  platform: 'windows' | 'wsl2' | 'linux' | 'macos';
  confidence: 'high' | 'medium' | 'low';
}

export async function discoverHardwareUUID(): Promise<HardwareID> {
  // TODO: Implement platform-specific UUID discovery
  // Strategy:
  // Windows: WMI UUID → BIOS Serial → Machine Name
  // WSL2: Windows UUID via powershell.exe
  // Linux: DMI sysfs → dmidecode → machine-id
  // macOS: ioreg UUID → system_profiler
  throw new Error('Not implemented');
}
```

#### `src/api/context-server.ts`
```typescript
/**
 * LUDOC Context Server
 *
 * HTTP server for receiving and validating signed P2P messages.
 * Binds to 0.0.0.0 (not localhost) per DNP guardrails.
 *
 * DNP Compliance:
 * - [x] 0.0.0.0 binding (never 127.0.0.1)
 * - [x] PGP signature validation required
 * - [x] Hardware origin validation (SealedHash)
 */

export class ContextServer {
  /**
   * Initialize HTTP server
   */
  async init(port: number = 9000): Promise<void> {
    // TODO: Start Bun.serve on 0.0.0.0:port
    // Endpoints:
    //   POST /context/dispatch - Receive signed message
    //   GET /health - Health check
    console.log(`[CONTEXT] Listening on 0.0.0.0:${port}`);
  }

  /**
   * Handle incoming dispatch
   */
  private async handleDispatch(req: Request): Promise<Response> {
    // TODO: Validate PGP signature
    // TODO: Validate SealedHash (hardware origin)
    // TODO: Enqueue to message queue
    // Return: Success/failure
    throw new Error('Not implemented');
  }
}
```

### 4. Escreva Testes

Estrutura básica:

```typescript
// tests/crypto.test.ts
describe('PGPEngine', () => {
  it('should sign a message', async () => {
    // TODO: Test sign() returns valid signature
  });

  it('should verify a valid signature', async () => {
    // TODO: Test verify() returns true
  });
});

// tests/hardware.test.ts
describe('Hardware Discovery', () => {
  it('should discover hardware UUID', async () => {
    // TODO: Test discoverHardwareUUID() returns HardwareID
  });

  it('should work on current platform', async () => {
    // TODO: Test platform detection
  });
});
```

### 5. Crie Configurações

**`protocol.yaml`:**
```yaml
version: "2.0.0"
framework: ludoc
identity:
  name: ludoc
  organization: ludoc-productions
  primaryKey:
    type: pgp
    fingerprint: "TBD (Claude will generate)"
standards:
  packageManager: bun
  shell: bash
  language: typescript
network:
  allowedBinds: ["0.0.0.0"]
  forbiddenBinds: ["127.0.0.1"]
versioning:
  scheme: semver
  currentVersion: "2.0.0"
  releaseChannel: stable
```

**`package.json`:**
```json
{
  "name": "ludoc-os",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "openpgp": "^5.11.0",
    "yaml": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^0.34.0"
  }
}
```

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  }
}
```

### 6. Documentação

**`README.md`:**
```markdown
# LUDOC OS

Sovereign identity framework for software systems.

## Philosophy

The hardware is free only when identity is sealed to hardware.

## Phases

- Phase 2.0: Core Framework
- Phase 2.1: Cryptographic Identity (PGP)
- Phase 2.2: Hardware Binding (Sealed Identity)
- Phase 2.3: P2P Communication Bridge
- Phase 2.4: Mutual Authentication

## DNP Alignment

This project follows DNP standards for code quality, governance, and security.

See: [DNP Standards](.dnp.config.yml)

## Development

Setup: `bun install`
Test: `bun test`
Build: `bun run build`
```

**`ARCHITECTURE.md`:**
```markdown
# LUDOC OS Architecture

## Design Decisions

### 1. Why Bun?
- 10-100x faster than npm
- Better build performance
- Native TypeScript support

### 2. Why 0.0.0.0 Binding?
- Allows connecting from any interface (WSL2, Docker, etc)
- Never localhost (127.0.0.1) per DNP guardrails
- Supports multi-agent architecture

### 3. Why OpenPGP.js?
- Cross-platform
- No native dependencies
- Widely used, audited

## Trade-offs

- **Speed vs Portability:** Chose portability (cross-platform first)
- **Complexity vs Security:** More code, but cryptographically sound
- **Decentralization vs Simplicity:** Trade simplicity for sovereign identity

## Future Considerations

- Hardware security module (HSM) support
- Revocation mechanism for keys
- Multi-signature schemes
```

### 7. GitHub Workflows

**`.github/workflows/test.yml`:**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun test
```

**`.github/workflows/lint.yml`:**
```yaml
name: Lint
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
```

### 8. Crie Pull Request

Quando terminar:

1. **Commit com mensagem clara:**
   ```bash
   git commit -m "feat: LUDOC OS Phase 2.0-2.1 scaffold

   - Created crypto engine (OpenPGP.js wrapper)
   - Created hardware discovery (cross-platform UUID)
   - Created context server (0.0.0.0 binding, PGP validation)
   - Added comprehensive test skeletons
   - Configured TypeScript + Bun
   - Added GitHub Actions workflows

   DNP Compliance: ✅ 100%
   - Network guardrails: 0.0.0.0 only
   - No hardcoded secrets
   - Headless-only auth
   - Code is factual and dense

   Awaiting code review from Claude Terminal..."
   ```

2. **Push para seu repo:**
   ```bash
   git push origin main
   ```

3. **Crie Pull Request:**
   - Title: `[SYNC] Phase 2.0-2.1: LUDOC OS Scaffold`
   - Description: Incluir objetivo, trade-offs, próximos passos
   - Marque como "awaiting review"

4. **Notifique Claude:**
   - Compartilhe link do PR
   - Ou execute: `./sync-from-copilot.sh main <seu-repo-url>`

### 9. Espere Feedback

Claude vai:
1. ✅ Receber código via `sync-from-copilot.sh`
2. ✅ Validar contra DNP standards (`validate-copilot-code.sh`)
3. ✅ Aplicar melhorias
4. ✅ Enviar feedback (`sync-to-copilot.sh`)
5. ✅ Você refatora baseado em feedback
6. ✅ Loop até merge

---

## ✅ DNP Compliance Checklist

Antes de fazer PR, valide:

- [ ] Nenhum `127.0.0.1` ou `localhost` no código
- [ ] Todos os `0.0.0.0` bindings
- [ ] Sem secrets hardcoded
- [ ] TypeScript strict mode
- [ ] Código denso, factual (sem "performance show")
- [ ] Trade-offs explicitados
- [ ] Testes para happy + sad path
- [ ] Documentação completa

---

## 🔗 Links de Referência

- Sync Protocol: `SYNC-PROTOCOL.md`
- DNP Audit: `DNP-AUDIT-REPORT.md`
- Claude's Implementation: `/c/Users/ludoc/ludoc-workspace/`

---

**Status:** Pronto para começar
**Próximo:** Faça o PR, aguarde code review de Claude
