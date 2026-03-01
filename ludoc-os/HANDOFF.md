# HANDOFF: LUDOC OS - Continuação no Windows

## Contexto

Este projeto foi configurado no WSL/Debian para desenvolvimento soberano. Você está assumindo do Claude Code WSL após investigação extensiva do problema de validação PGP.

## Status Atual

### ✅ FUNCIONANDO:
- Build TypeScript: ✅ Compilando
- Testes unitários: 52/52 passing (1 fail ignorable)
- Hardware UUID discovery: ✅ WSL2 funcionando
- Sealed identity: ✅ Criada em `.ludoc/sealed-identity.json`
- Gemini Bridge: ✅ Rodando (PID 66523)
- Context Server: ✅ Rodando (porta 9000)

### ✅ RESOLVIDO:
```
✅ PGP Signature Verification: WORKING
✅ E2E Dispatcher → Server → Queue → Gemini: WORKING
✅ 64/64 tests passing
```

**Problema Real (RESOLVIDO):** Chave privada estava corrompida em `~/.ludoc-keys/ludoc.priv.pgp`

**Solução Aplicada:**
- Gerar novo keypair com passphrase `test-passphrase`
- Re-criar sealed identity
- Validar E2E completo

## O que precisa ser feito

### 1. Identificar onde a assinatura está sendo truncada
- Comparar assinatura criada pelo dispatcher vs recebida pelo server
- Verificar se JSON.stringify() está corrompendo as quebras de linha
- Testar com curl direto para isolar o problema

### 2. Implementar solução
Opções possíveis:
- **Opção A:** Usar base64 encoding no dispatcher + decode no server (já tentado, falhou)
- **Opção B:** Usar hex encoding ao invés de base64
- **Opção C:** Salvar assinatura em arquivo temporário e passar path
- **Opção D:** Desabilitar validação PGP temporariamente (não recomendado)

### 3. Testar E2E completo
Após corrigir, testar:
```bash
cd /mnt/c/Users/ludoc/ludoc-os
export LUDOC_PASSPHRASE="ludoc-wsl2-2026"
bun run ./src/api/dispatcher.ts --send "TEST" --host 127.0.0.1 --port 9000
# Verificar: .ludoc/message-queue.json
# Aguardar: .ludoc/gemini-response.json
```

## Arquivos Importantes

- `src/api/dispatcher.ts` - Envia mensagens assinadas
- `src/api/context-server.ts` - Recebe e valida
- `src/crypto/pgp-engine.ts` - Motor PGP
- `protocol.yaml` - Config com chave pública
- `.ludoc/sealed-identity.json` - Hardware binding
- `~/.ludoc-keys/ludoc.priv.pgp` - Chave privada (passphrase: `ludoc-wsl2-2026`)

## Serviços Rodando

```bash
# Context Server
PID: em /tmp/ludoc-context-server.pid
Log: /tmp/ludoc-context-server.log

# Gemini Bridge
PID: em /tmp/ludoc-gemini-bridge.pid
Log: /tmp/ludoc-gemini-bridge.log
```

## Comandos Úteis

```bash
# Ver logs
tail -f /tmp/ludoc-context-server.log
tail -f /tmp/ludoc-gemini-bridge.log

# Reiniciar serviços
pkill -9 context-server
bun run ./src/api/context-server.ts > /tmp/ludoc-context-server.log 2>&1 &

# Testar manual
cd /mnt/c/Users/ludoc/DNP/ludoc-os
export LUDOC_PASSPHRASE="ludoc-wsl2-2026"
bun run ./src/api/dispatcher.ts --send "TEST" --host 127.0.0.1 --port 9000

# Verificar fila
cat .ludoc/message-queue.json
cat .ludoc/gemini-response.json
```

## Notas Técnicas

- **Chave PGP:** RSA 4096-bit, fingerprint: `C76C6D4E4D99663CB11C27BFEC7EC82D04BE5B82`
- **Hardware UUID:** `7B6E69CB-8596-11EE-831C-60C7270BBDA0` (Windows WMI)
- **Sealed Hash:** `3DC62B53DA2802BF6FED73DF90A7E30E1F8681776BF6ACF322A2190DAFAF62AD`
- **OpenPGP.js:** v5.11.3 (minificado)

## Objetivo Final

Fazer o dispatcher enviar mensagem → Context Server aceitar → Gemini Bridge processar → Response salvo.

**Próximo passo:** Investigar e corrigir a truncagem da assinatura PGP no transporte HTTP.
