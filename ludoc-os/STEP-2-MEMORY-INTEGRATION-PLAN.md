# 🧠 Step 2: Integração de Memória Ternária

**Status:** 🚀 INICIADO
**Data:** 2026-03-01
**Objetivo:** Integrar TernaryMemoryModel com Context Server para Phase 2.4

---

## 📊 Análise Atual

### ✅ Já Implementado
- **TernaryMemoryModel** (`src/kernel/memory-model.ts`) — 282 linhas, completo
  - HOT (RAM): 500MB, 1h TTL
  - WARM (Disk): 2GB, 24h TTL
  - COLD (Archive): 4GB, indefinido
  - Auto-tiering baseado em access patterns

- **Context Server** (`src/api/context-server.ts`) — Rodando em 0.0.0.0:9000
  - ✅ Recebe dispatches
  - ✅ Valida PGP signature
  - ✅ Valida SealedHash
  - ✅ Audit logging (Gemini patch)
  - ✅ Auth/Challenge endpoint (Phase 2.4)
  - ❌ **FALTA:** Armazenar em memória

### ❌ Faltando (Step 2)
1. **Importar TernaryMemoryModel** no context-server.ts
2. **Instanciar memory** no constructor
3. **Armazenar dispatches** em WARM tier após validação
4. **Novo endpoint:** `GET /context/dispatch/queue` — Gemini retrieva fila de memória
5. **Novo endpoint:** `GET /context/memory/stats` — Monitorar saúde da memória

---

## 🛠️ Implementação

### Mudança 1: Importar e Inicializar Memory

**Arquivo:** `src/api/context-server.ts` (linha 4, após PGPEngine import)

```typescript
import { TernaryMemoryModel, MemoryTier } from "../kernel/memory-model.js";
```

**Arquivo:** `src/api/context-server.ts` (linha 18, no constructor)

```typescript
private memory: TernaryMemoryModel;  // Add this line

// No init() method, após this.sealed:
this.memory = new TernaryMemoryModel();
console.log(`[CONTEXT SERVER] Memory initialized (HOT: 500MB, WARM: 2GB, COLD: 4GB)`);
```

### Mudança 2: Armazenar Dispatch em WARM Tier

**Arquivo:** `src/api/context-server.ts` (dentro do handleRequest, após PGP validation passa)

```typescript
// Após "if (isValid)" check passa:

// Armazenar no WARM tier
const dispatchId = `dispatch_${Date.now()}`;
await this.memory.set(dispatchId, {
  message,
  signature,
  sender: body.sender || 'unknown',
  timestamp: new Date().toISOString(),
}, MemoryTier.WARM);

console.log(`[CONTEXT SERVER] ✅ Dispatch stored in WARM: ${dispatchId}`);

// Retornar confirmação
return new Response(
  JSON.stringify({
    success: true,
    dispatchId,
    tier: "WARM"
  }),
  { status: 200 }
);
```

### Mudança 3: Novo Endpoint - Retriever Queue

**Arquivo:** `src/api/context-server.ts` (no handleRequest, antes do final `404`)

```typescript
// GET /context/dispatch/queue - Gemini retrieves dispatch queue
if (req.method === "GET" && url.pathname === "/context/dispatch/queue") {
  try {
    const stats = await this.memory.getStats();
    console.log(`[CONTEXT SERVER] Queue request: ${stats.hot.count} HOT, ${stats.warm.count} WARM`);

    return new Response(
      JSON.stringify({
        queue: {
          hot: stats.hot.count,
          warm: stats.warm.count,
          cold: stats.cold.count,
        },
        memory: stats
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500 }
    );
  }
}

// GET /context/memory/stats - Monitor memory health
if (req.method === "GET" && url.pathname === "/context/memory/stats") {
  try {
    const stats = await this.memory.getStats();
    return new Response(
      JSON.stringify({
        hot: { ...stats.hot, pct: `${((stats.hot.size / (500 * 1024 * 1024)) * 100).toFixed(2)}%` },
        warm: { ...stats.warm, pct: `${((stats.warm.size / (2 * 1024 * 1024 * 1024)) * 100).toFixed(2)}%` },
        cold: { ...stats.cold, pct: `${((stats.cold.size / (4 * 1024 * 1024 * 1024)) * 100).toFixed(2)}%` },
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500 }
    );
  }
}
```

---

## 📋 Checklist de Testes

Após implementação, validar:

```bash
# 1️⃣ Test: Dispatch storage
curl -X POST http://localhost:9000/context/dispatch \
  -H "Content-Type: application/json" \
  -d '{"message":"test","signature":"test","sender":"claude"}'

# Expected: 200 with dispatchId and tier: "WARM"

# 2️⃣ Test: Queue status
curl -X GET http://localhost:9000/context/dispatch/queue

# Expected: { queue: {hot: 0, warm: 1, cold: 0}, memory: {...} }

# 3️⃣ Test: Memory stats
curl -X GET http://localhost:9000/context/memory/stats

# Expected: { hot: {...}, warm: {...}, cold: {...} }

# 4️⃣ Test: Multiple dispatches
for i in {1..10}; do
  curl -X POST http://localhost:9000/context/dispatch \
    -H "Content-Type: application/json" \
    -d "{\"message\":\"msg$i\",\"signature\":\"sig$i\",\"sender\":\"claude\"}"
done

curl -X GET http://localhost:9000/context/memory/stats
# Expected: warm.count = 10
```

---

## 🔗 Próximos Passos (Phase 2.4 Completo)

1. **Após Step 2:** Gemini pode via `GET /context/dispatch/queue`
2. **Mutual Handshake:** Claude + Gemini completam autenticação (nonce já capturado)
3. **Memória Distribuída:** Claude escreve em WARM, Gemini lê/valida
4. **Tiers Automáticos:** Acesso frequente → HOT, pouco acessado → COLD

---

## 📝 Notas Técnicas

- **WARM é o "Hub":** Gemini e Claude comunicam via `.ludoc/warm/` (persistent)
- **HOT é o "Cache":** Últimas 10 requisições em RAM para latência baixa
- **COLD é o "Arquivo":** Mantém histórico para auditoria DNP
- **Tiering Automático:** Baseado em `accessCount` (vide memory-model.ts:59,66)

---

**Responsável:** Claude (Terminal Agent)
**Coordenação:** Gemini (Infrastructure Orchestrator)
**Status:** 🔴 **AGUARDANDO IMPLEMENTAÇÃO**
