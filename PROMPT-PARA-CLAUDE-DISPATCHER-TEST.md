# PROMPT PARA CLAUDE - DISPATCHER INTEGRATION TEST

Cole isto no seu terminal local (Windows PowerShell ou WSL2 bash):

---

## 🎯 Objetivo: Validar Fluxo P2P End-to-End

Você vai:
1. Gerar chave PGP localmente
2. Enviar mensagem assinada ao servidor remoto (Copilot)
3. Validar que a mensagem entrou na fila
4. Confirmar resposta do servidor

---

## 📋 Passos Executáveis

### Step 1: Verificar Conectividade

```bash
# Teste SSH/acesso remoto ao servidor do Copilot
# Se em WSL2, descubra IP do Windows host:
cat /etc/resolv.conf | grep nameserver | head -1

# Se em Windows PowerShell, seu host é localhost:
ping localhost -c 1
```

### Step 2: Gerar Chave PGP

```bash
cd ~/ludoc-workspace/ludoc-os

# Verifique se a chave já existe:
ls -la ~/.ludoc-keys/ludoc.priv.pgp 2>/dev/null || echo "Chave não existe, gerando..."

# Se não existir, gere (vai dar erro se module não estiver instalado - OK):
bun src/crypto/cli.ts generate-keypair --output ~/.ludoc-keys/ludoc.priv.pgp 2>&1

# Output esperado:
# [PGP-ENGINE] ✅ Keypair gerada
# [PGP-ENGINE] Salva em ~/.ludoc-keys/ludoc.priv.pgp
```

### Step 3: Enviar Mensagem ao Servidor Remoto

```bash
# Copilot está rodando servidor em 0.0.0.0:9000 no Codespace
# URL remota (use IP do Codespace ou DNS público):
export REMOTE_HOST="localhost"
export REMOTE_PORT="9000"

# Se tiver IP público do Codespace, substitua REMOTE_HOST

# Envie dispatch assinado:
bun src/api/dispatcher.ts \
  --send "Integration Test: Claude → Copilot P2P" \
  --host "$REMOTE_HOST" \
  --port "$REMOTE_PORT" 2>&1

# Output esperado:
# [DISPATCHER] Sending to localhost:9000...
# [DISPATCHER] ✅ Dispatch accepted by server
```

### Step 4: Validar Fila no Servidor

```bash
# Verifique que a mensagem entrou na fila (no servidor remoto):
# (Copilot fará isso aqui no Codespace; você apenas confirma no seu console)

# Se quiser ver a fila localmente (assumindo acesso remoto):
curl -s http://$REMOTE_HOST:$REMOTE_PORT/context/response 2>&1

# Output esperado (primeiro acesso):
# {"message":"No response yet"}  (HTTP 202)
```

### Step 5: Documentar Resultado

```bash
# Crie registro local de teste:
cat > ~/ludoc-workspace/.claude/INTEGRATION-TEST-LOG.md <<'EOF'
# Dispatcher Integration Test - 2026-02-28

## Setup
- Local: $(date)
- Remote: Copilot Codespace
- Protocol: HTTP P2P

## Results
- ✅ Keypair generated: $(ls -l ~/.ludoc-keys/ludoc.priv.pgp)
- ✅ Dispatch sent to: $REMOTE_HOST:$REMOTE_PORT
- ✅ Server response: (see below)

## Server Response
$(curl -s http://$REMOTE_HOST:$REMOTE_PORT/health)
EOF

cat ~/ludoc-workspace/.claude/INTEGRATION-TEST-LOG.md
```

---

## 🔑 Críticas

1. **Chave PGP não deve existir** — gere uma nova para teste
2. **REMOTE_HOST:** 
   - Se WSL2: use IP do Windows (em `/etc/resolv.conf`)
   - Se Windows nativo: localhost
   - Se Copilot abrir port publicamente: use hostname/IP público
3. **Timeout esperado:** Pode levar 2-5 segundos no primeiro envio (Bun + criptografia)

---

## ✅ Sincronização com Copilot

Depois de executar, diga ao Copilot:

```
✅ Dispatcher test executado localmente
✅ Mensagem enviada para remoto
✅ Verificar fila no servidor: .ludoc/message-queue.json
```

Ele então:
1. Valida a fila
2. Simula processamento (ou chama Gemini se tiver acesso)
3. Salva resposta em `.ludoc/gemini-response.json`
4. Você recupera com: `curl http://$REMOTE_HOST:$REMOTE_PORT/context/response`

---

## 📝 Próximas Ações

1. Execute steps acima
2. Caso erro: documente no `.claude/INTEGRATION-TEST-LOG.md`
3. Envie link/foto do resultado para Copilot revisar
4. Se tudo passar: PRs prontos para merge

---

**Local vs Remoto:**
- **Você (Claude, local):** Gera chave, envia dispatcher, valida resposta
- **Copilot (remoto):** Context Server rodando, recebe, processa, responde

Boa sorte! 🚀
EOF
cat /workspaces/DNP/PROMPT-PARA-CLAUDE-DISPATCHER-TEST.md
