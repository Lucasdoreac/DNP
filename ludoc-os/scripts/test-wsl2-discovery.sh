#!/bin/bash
# Teste de descoberta de Windows Host em WSL2

echo "========================================="
echo "  WSL2 → Windows Host Discovery Test"
echo "========================================="
echo ""

# Simular ambiente WSL2
if [ -f /etc/resolv.conf ]; then
    echo "[INFO] Sistema tem /etc/resolv.conf (WSL2 ou Linux)"
    WINDOWS_HOST=$(grep nameserver /etc/resolv.conf | awk '{print $2}' | head -1)
    if [ -n "$WINDOWS_HOST" ]; then
        echo "✅ Windows Host descoberto via /etc/resolv.conf: $WINDOWS_HOST"
    else
        echo "⏳ Nameserver não encontrado em /etc/resolv.conf"
    fi
else
    echo "⏳ /etc/resolv.conf não existe (não é WSL2 ou Linux)"
fi

echo ""
echo "Alternativa: host.docker.internal"
if ping -c 1 host.docker.internal &>/dev/null; then
    echo "✅ host.docker.internal está acessível"
else
    echo "⏳ host.docker.internal não respondeu"
fi

echo ""
echo "Para usar em wsl2-claude-bridge.sh:"
echo "  export LUDOC_WINDOWS_HOST=<IP_DO_WINDOWS>"
echo "  ./wsl2-claude-bridge.sh ask \"sua pergunta\""
echo ""
echo "========================================="
