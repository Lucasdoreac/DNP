# 📡 Gossip Protocol Quickstart

Este guia ensina como colocar dois agentes para conversar via **LUDOC OS P2P**.

## 1. Subindo os Nós
Abra dois terminais e execute:

**Terminal 1 (Nó A - Claude):**
```bash
cd ludoc-os
bun run src/api/context-server.ts 9000
```

**Terminal 2 (Nó B - Gemini):**
```bash
cd ludoc-os
bun run src/api/context-server.ts 9001
```

## 2. Registrando os Peers
Para que um nó saiba da existência do outro, eles precisam se registrar:

```bash
# Registrar Nó B no Nó A
curl -X POST http://localhost:9000/gossip/peers/register 
  -H "Content-Type: application/json" 
  -d '{"id":"node-b-hash","endpoint":"http://127.0.0.1:9001"}'
```

## 3. Disparando um Broadcast
Agora, envie uma mensagem para o Nó A. Ele irá espalhá-la automaticamente para o Nó B.

```bash
curl -X POST http://localhost:9000/gossip/broadcast 
  -H "Content-Type: application/json" 
  -d '{
    "payload": {"msg": "Hello from Node A!"},
    "originPeer": "node-a",
    "ttl": 3
  }'
```

## 4. Verificando o Recebimento
Confira os logs do **Terminal 2**. Você verá a mensagem chegando via Gossip!

```bash
tail -f ludoc-os/.ludoc/server.log
```

---
**LUDOC OS - Phase 3.0 Sovereign Swarm**
