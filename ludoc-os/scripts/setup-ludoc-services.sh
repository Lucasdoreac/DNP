#!/bin/bash
# LUDOC Phase 2.3 - Automated Service Setup
# Instala e configura systemd services para produção

set -e

PROJECT_DIR="/mnt/c/Users/ludoc/DNP/ludoc-os"
SYSTEMD_DIR="/etc/systemd/system"
USER="ludoc"

echo "========================================="
echo "  LUDOC Phase 2.3 - Service Setup"
echo "========================================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script deve rodar com sudo:"
  echo "   sudo bash setup-ludoc-services.sh"
  exit 1
fi

# Check if in correct directory
if [ ! -f "$PROJECT_DIR/ludoc-context-server.service" ]; then
  echo "❌ Service files não encontrados em $PROJECT_DIR"
  echo "   Execute este script no diretório do projeto"
  exit 1
fi

echo "[1/5] Verificando pré-requisitos..."

# Verificar bun
if ! command -v bun &>/dev/null; then
  # Tentar caminho conhecido
  if [ ! -f "/c/Users/ludoc/.bun/bin/bun" ]; then
    echo "❌ Bun não encontrado"
    echo "   Instale com: curl -fsSL https://bun.sh/install | bash"
    exit 1
  fi
  echo "✅ Bun encontrado em /c/Users/ludoc/.bun/bin/bun"
else
  echo "✅ Bun disponível"
fi

# Verificar usuário
if ! id "$USER" &>/dev/null; then
  echo "⚠️  Usuário '$USER' não encontrado"
  echo "   Service rodará como root (não recomendado para produção)"
  USER="root"
fi
echo "✅ Service rodará como: $USER"
echo ""

echo "[2/5] Instalando service files..."

# Copiar context-server
cp "$PROJECT_DIR/ludoc-context-server.service" "$SYSTEMD_DIR/"
echo "✅ ludoc-context-server.service instalado"

# Copiar gemini-bridge
cp "$PROJECT_DIR/ludoc-gemini-bridge.service" "$SYSTEMD_DIR/"
echo "✅ ludoc-gemini-bridge.service instalado"

# Ajustar permissões
chmod 644 "$SYSTEMD_DIR/ludoc-context-server.service"
chmod 644 "$SYSTEMD_DIR/ludoc-gemini-bridge.service"
echo "✅ Permissões ajustadas"
echo ""

echo "[3/5] Recarregando systemd daemon..."
systemctl daemon-reload
echo "✅ Daemon recarregado"
echo ""

echo "[4/5] Habilitando services..."
systemctl enable ludoc-context-server.service
echo "✅ ludoc-context-server habilitado"

systemctl enable ludoc-gemini-bridge.service
echo "✅ ludoc-gemini-bridge habilitado"
echo ""

echo "[5/5] Iniciando services..."
systemctl start ludoc-context-server.service
sleep 3
echo "✅ ludoc-context-server iniciado"

systemctl start ludoc-gemini-bridge.service
sleep 2
echo "✅ ludoc-gemini-bridge iniciado"
echo ""

# Verificar status
echo "========================================="
echo "  Status Final"
echo "========================================="
echo ""

echo "Context Server:"
systemctl status ludoc-context-server.service --no-pager | head -6

echo ""
echo "Gemini Bridge:"
systemctl status ludoc-gemini-bridge.service --no-pager | head -6

echo ""
echo "========================================="
echo "  ✅ Setup Concluído!"
echo "========================================="
echo ""
echo "Próximas etapas:"
echo ""
echo "1. Testar services:"
echo "   sudo systemctl status ludoc-context-server"
echo "   sudo systemctl status ludoc-gemini-bridge"
echo ""
echo "2. Ver logs em tempo real:"
echo "   sudo journalctl -u ludoc-context-server -f"
echo "   sudo journalctl -u ludoc-gemini-bridge -f"
echo ""
echo "3. Executar teste E2E:"
echo "   cd $PROJECT_DIR"
echo "   bash test-e2e-complete.sh"
echo ""
echo "4. Usar agent wrapper:"
echo "   cd $PROJECT_DIR"
echo "   bun run ./src/agent/ludoc-agent-wrapper.ts \"Sua pergunta\""
echo ""
