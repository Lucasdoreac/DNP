#!/bin/bash
# Auto-install with SUDO_PASSWORD env var support

if [ -n "$SUDO_PASSWORD" ]; then
  echo "🔐 Using SUDO_PASSWORD from environment..."
  echo "$SUDO_PASSWORD" | sudo -S apt-get update -qq
  echo "$SUDO_PASSWORD" | sudo -S apt-get install -y jq
else
  echo "⚠️  SUDO_PASSWORD not set"
  echo "   Option 1: export SUDO_PASSWORD='your-password'"
  echo "   Option 2: Install manually: sudo apt-get install -y jq"
  echo "   Option 3: Use node/bun version (no jq needed)"
  exit 1
fi
