# 🚀 LUDOC P2P Integration - Distributed Execution

**Data:** 2026-02-28  
**Status:** Ready for synchronized testing  
**Architecture:** Claude (Local) ↔ Copilot (Remote)

---

## 📍 Locais de Execução

### Claude (Local - Windows/WSL2)
- **Arquivo:** `PROMPT-PARA-CLAUDE-DISPATCHER-TEST.md`
- **Responsabilidade:** 
  - Gerar chave PGP
  - Enviar mensagem assinada
  - Recuperar resposta

### Copilot (Remote - Codespace)
- **Script:** `ludoc-os/scripts/monitor-p2p-messages.sh`
- **Responsabilidade:**
  - Monitorar fila de mensagens
  - Processar mensagens recebidas
  - Salvar respostas

---

## 🔄 Fluxo Sincronizado

```
┌─────────────────────┐         ┌──────────────────────┐
│   Claude (Local)    │         │  Copilot (Remote)    │
│                     │         │                      │
│ 1. Generate PGP key │         │ 1. Start server      │
│    (dispatcher)     │         │    (context-server)  │
│                     │         │                      │
│ 2. Send signed msg  │────────→│ 2. Receive dispatch  │
│    to remote:9000   │         │    (add to queue)    │
│                     │         │                      │
│ 3. Store response   │         │ 3. Process message   │
│    (.ludoc/         │←────────│    (gemini/mock)     │
│     response.json)  │         │    (save response)   │
│                     │         │                      │
│ 4. Verify receipt   │         │ 4. Health check OK   │
│                     │         │                      │
└─────────────────────┘         └──────────────────────┘
```

---

## ⏱️ Cronograma Recomendado

### T=0s: Claude Inicia
```bash
cd ~/ludoc-workspace/ludoc-os
# Segue passos do PROMPT-PARA-CLAUDE-DISPATCHER-TEST.md
```

### T=2s: Copilot Ativa Monitor
```bash
cd /workspaces/DNP/ludoc-os
bash scripts/monitor-p2p-messages.sh
```

### T=5s: Claude Envia Mensagem
```bash
bun src/api/dispatcher.ts --send "..." --host <REMOTE_IP> --port 9000
```

### T=10s: Copilot Processa
```
[LUDOC-MONITOR] 📨 Processing message: ...
[LUDOC-MONITOR] ✅ Response saved to .ludoc/gemini-response.json
```

### T=15s: Claude Recupera Resposta
```bash
curl http://<REMOTE_IP>:9000/context/response
```

---

## 🔑 Variáveis de Ambiente

### Claude (Local)
```bash
# WSL2: descobrir IP do Windows host
REMOTE_IP=$(cat /etc/resolv.conf | grep nameserver | head -1 | awk '{print $2}')

# Windows nativo: usar localhost
REMOTE_IP=localhost

# Se Copilot abrir IP público:
REMOTE_IP=<github-codespace-fqdn>

export REMOTE_HOST=$REMOTE_IP
export REMOTE_PORT=9000
```

### Copilot (Remote)
```bash
cd /workspaces/DNP/ludoc-os
export LUDOC_QUEUE=.ludoc/message-queue.json
export LUDOC_RESPONSE=.ludoc/gemini-response.json
```

---

## ✅ Checklist de Execução

### Antes de Começar
- [ ] Claude em `~/ludoc-workspace/ludoc-os`
- [ ] Copilot em `/workspaces/DNP/ludoc-os`
- [ ] Ambos com `bun install` completo
- [ ] Cloud Shell / Codespace port 9000 aberto (se necessário)

### Claude Executa
- [ ] Verifica conectividade: `ping localhost` ou `cat /etc/resolv.conf`
- [ ] Gera chave PGP: `bun src/crypto/cli.ts generate-keypair ...`
- [ ] Envia dispatch: `bun src/api/dispatcher.ts --send "..." --host ...`
- [ ] Confirma envio: `[DISPATCHER] ✅ Dispatch accepted by server`

### Copilot Executa
- [ ] Inicia monitor: `bash scripts/monitor-p2p-messages.sh`
- [ ] Vê mensagem: `[LUDOC-MONITOR] ✅ Found 1 message(s)`
- [ ] Processa: `[LUDOC-MONITOR] ✅ Response saved`

### Claude Valida
- [ ] Recupera resposta: `curl http://$REMOTE_HOST:9000/context/response`
- [ ] Confirma status: `"status": "success"`

---

## 🐛 Troubleshooting

| Problema | Solução |
|----------|---------|
| `Connection refused` | Servidor não está rodando. Copilot: `bash scripts/monitor-p2p-messages.sh` inicia automaticamente |
| `Module not found: openpgp` | `bun install` em ambos locais é obrigatório |
| WSL2 não alcança Windows | Usar IP do host via `/etc/resolv.conf`, não localhost |
| Timeout no dispatcher | Copilot pode estar processando. Aguarde 5-10s |
| Response.json vazio | Monitor não processou ainda. Aguarde T=10s mínimo |

---

## 📊 Logs Gerados

### Claude (Local)
- `~/.ludoc-keys/ludoc.priv.pgp` — Chave privada gerada
- `~/.claude/INTEGRATION-TEST-LOG.md` — Registro de teste

### Copilot (Remote)
- `.ludoc/message-queue.json` — Fila recebida
- `.ludoc/gemini-response.json` — Resposta processada
- `.ludoc/server.log` — Server output (se iniciado pelo monitor)

---

## 🎯 Resultado Esperado

✅ **Sucesso:**
```json
{
  "response": "LUDOC Processing Complete: Integration Test: Claude → Copilot P2P",
  "processedBy": "ludoc-bridge",
  "timestamp": "2026-02-28T18:45:00Z",
  "status": "success"
}
```

---

## 📝 Próximas Ações Após Sucesso

1. **Documentar resultado** em `.claude/MEMORY.md`
2. **Criar PR #8** com integration test evidence
3. **Preparar Phase 2.5** (key rotation, revocation)

---

**Status:** 🚀 Ready for Synchronized P2P Integration Test
