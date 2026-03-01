#!/bin/bash
# WSL2 Claude → LUDOC P2P Hub Bridge
# Permite que Claude em WSL2 (barato) acesse o P2P hub em Windows

set -e

# Descobrir IP do Windows host (WSL2 → Windows)
# WSL2 vê Windows através de /etc/resolv.conf ou pode usar IP dinâmico
WINDOWS_HOST="${LUDOC_WINDOWS_HOST:-}"
if [ -z "$WINDOWS_HOST" ]; then
    # Tentar descobrir automaticamente
    if [ -f /etc/resolv.conf ]; then
        WINDOWS_HOST=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -1)
    fi
    # Fallback: tentar host.docker.internal (WSL2 recente)
    if [ -z "$WINDOWS_HOST" ]; then
        WINDOWS_HOST="host.docker.internal"
    fi
fi

CONTEXT_SERVER="http://${WINDOWS_HOST}:9001"
SEALED_IDENTITY_PATH="/mnt/mnt/c/Users/ludoc/DNP/ludoc-os/.ludoc/sealed-identity.json"
PRIVATE_KEY_PATH="/mnt/c/Users/ludoc/.ludoc-keys/ludoc.priv.pgp"

echo "[WSL2-CLAUDE-BRIDGE] 🌉 Acessando LUDOC P2P Hub"
echo "[WSL2-CLAUDE-BRIDGE] Contexto: Claude WSL2 (barato) → Windows Hub (Gemini)"
echo "[WSL2-CLAUDE-BRIDGE] Windows Host: ${WINDOWS_HOST}"
echo ""

# Função: Enviar pergunta para o hub
query_ludoc() {
    local question="$1"

    echo "[WSL2-CLAUDE-BRIDGE] 📨 Enviando: $question"

    # Usar dispatch do ludoc-workspace para assinar
    cd /mnt/mnt/c/Users/ludoc/DNP/ludoc-os

    # Dispatcher assina + envia para Windows host
    # --host é necessário em WSL2 para alcançar Windows (não pode ser localhost ou 0.0.0.0)
    bun run ./src/api/dispatcher.ts --send "$question" --host "${WINDOWS_HOST}" --port 9001 2>/dev/null

    # Aguardar processamento
    echo "[WSL2-CLAUDE-BRIDGE] ⏳ Aguardando resposta..."
    sleep 20

    # Buscar resposta
    if [ -f .ludoc/gemini-response.json ]; then
        echo "[WSL2-CLAUDE-BRIDGE] ✅ Resposta recebida:"
        echo ""
        jq -r '.response' .ludoc/gemini-response.json
        echo ""
    else
        echo "[WSL2-CLAUDE-BRIDGE] ❌ Sem resposta ainda"
    fi
}

# Exemplos de uso
case "${1:-help}" in
    ask)
        query_ludoc "${2:-Qual é sua opinião sobre soberania digital?}"
        ;;
    status)
        echo "[WSL2-CLAUDE-BRIDGE] Verificando hub..."
        curl -s "$CONTEXT_SERVER/context/response" | jq . | head -10
        ;;
    help|*)
        echo "Uso: $0 <comando> [argumento]"
        echo ""
        echo "Comandos:"
        echo "  ask <pergunta>  - Fazer pergunta ao hub (processa via Gemini)"
        echo "  status          - Verificar status do hub"
        echo "  help            - Este help"
        echo ""
        echo "Exemplo:"
        echo "  $0 ask \"Como Claude e Gemini podem colaborar?\""
        ;;
esac
