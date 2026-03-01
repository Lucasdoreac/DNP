# PROJECT MEMORY - DNP MONOREPO

**Status:** 🟢 PHASE 3.0 COMPLETE — Sovereign, Persistent & Swarm
**Last Sync:** 2026-03-01 (Autonomous Session — Claude + Gemini)
**Environment:** Windows Native / Git Bash | Bun 1.3.9 | Node 23.8.0

---

## 🎯 System State

| Layer | Component | State |
|-------|-----------|-------|
| Identity | `sealed-identity.json` (SHA256 + WMI UUID) | ✅ SEALED |
| Crypto | PGP RSA 4096 — fingerprint `C76C6D4E...` | ✅ ACTIVE |
| Persistence | SQLite WAL — `.ludoc/ludoc.db` | ✅ LIVE |
| Transport | HTTP `0.0.0.0:9000` (Claude) / `9001` (Gemini) | ✅ LIVE |
| Gossip | Fanout=3, TTL=6, 10k dedup Set | ✅ LIVE |
| Auth | Mutual handshake + session tokens (24h) | ✅ LIVE |
| Memory | Ternary HOT→WARM→COLD, auto-migrate 30s | ✅ LIVE |

---

## 🏁 Session 2026-03-01 — What Was Built

### Phase 2.4 — Mutual Auth + Ternary Memory
- `POST /context/auth/challenge` — nonce generation
- `POST /context/auth/respond` — session token (SHA256 of nonces + sealedHashes)
- `TernaryMemoryModel.startAutoMigration(30000)` — HOT→WARM demotion loop
- `IdentityLifecycleManager` — 90-day key rotation policy

### Phase 2.5 — SQLite Persistence + Hot-Reload
- `src/db/ludoc-store.ts` — all state in `bun:sqlite` (WAL mode)
- Tables: `message_queue`, `memory_entries`, `sessions`, `responses`
- All 14 SQL statements pre-compiled in `initStatements()` (cached)
- `bun --watch` as `serve:watch` script for zero-downtime reloads

### Performance Fix (36x improvement)
- Problem: dynamic `import("crypto")` inside request handler + unprepared stmts
- Fix: static `import { createHash } from "crypto"` + `initStatements()` cache
- Result: `/context/auth/respond` — **123ms → 3.4ms avg, P95 = 6.6ms**

### Phase 3.0 — Gossip Protocol (Multi-Agent Swarm)

**New files:**
```
src/p2p/types.ts          — Peer, GossipMessage, GossipResult interfaces
src/p2p/peer-registry.ts  — register(), list(), getActivePeers(), updateLastSeen()
src/p2p/gossip-protocol.ts — originate(), spread(), receive(), dedup + fanout
```

**New endpoints on `0.0.0.0:9000`:**
```
POST /gossip/receive           — receive incoming gossip, re-spread
POST /gossip/peers/register    — add peer to registry (id + endpoint)
GET  /gossip/peers             — list active peers (seen < 5min)
POST /gossip/broadcast         — originate new gossip from this node
```

**Gossip algorithm:**
- `originate()` → creates `GossipMessage{id, originPeer, hops:0, ttl, payload}`
- `spread()` → TTL check → dedup (10k FIFO Set) → shuffle eligible peers → fanout=3 → fire-and-forget HTTP with 3s timeout
- `receive()` → dedup → re-spread to `getActivePeers(300s)`
- HTTP 208 = already seen (not an error)

**Verified:** Claude node (9000) broadcast successfully received by Gemini node (9001).

---

## 🏗️ Phase Roadmap

| Phase | Name | Status |
|-------|------|--------|
| 2.0 | Core Framework | ✅ COMPLETE |
| 2.1 | Cryptographic Identity (PGP) | ✅ COMPLETE |
| 2.2 | Hardware Binding (sealed-id) | ✅ COMPLETE |
| 2.3 | P2P HTTP Bridge | ✅ COMPLETE |
| 2.4 | Mutual Auth + Ternary Memory | ✅ COMPLETE |
| 2.5 | SQLite Persistence + Hot-Reload | ✅ COMPLETE |
| 3.0 | Gossip Protocol + Peer Swarm | ✅ COMPLETE |
| 4.0 | Task Delegation via Gossip | ⏳ PLANNED |

**Phase 4.0 concept:** Task-bidding protocol over gossip mesh — agents broadcast task specs, peers reply with capability scores, originator selects executor.

---

## 🛠️ Critical Agent Guidelines

1. **Read this file first** — `docs/MEMORY.md` is the source of truth
2. **Database-first** — Never use in-memory arrays for state; use `src/db/ludoc-store.ts`
3. **Never `127.0.0.1`** — Always bind to `0.0.0.0` in production
4. **Sealed identity** — `.ludoc/sealed-identity.json` is machine-specific, never commit
5. **Gossip peer registration** — Register via `POST /gossip/peers/register` before broadcasting
6. **PGP signing** — Required only for `/context/dispatch`; gossip endpoints are session-authenticated

## 🏗️ Monorepo Layout

```
DNP/
├── ludoc-os/          ← Kernel v3.0 (active)
│   ├── src/api/       ← Context Server (HTTP 9000)
│   ├── src/crypto/    ← PGP + sealed identity
│   ├── src/db/        ← SQLite store (Phase 2.5)
│   ├── src/kernel/    ← Bootstrap + memory model
│   └── src/p2p/       ← Gossip engine (Phase 3.0)
├── packages/          ← 5 active shared packages
├── legacy/            ← 39+ archived (READ-ONLY)
└── docs/              ← Central memory (this file)
```

---

**Sealed:** 2026-03-01T18:00:00Z | Claude + Gemini (Autonomous Sovereignty Session)
