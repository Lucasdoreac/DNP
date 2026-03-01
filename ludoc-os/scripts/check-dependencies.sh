#!/bin/bash
# LUDOC Dependencies Check - NO SUDO REQUIRED

echo "[LUDOC] Checking dependencies..."

MISSING=0

# Check bun
if ! command -v bun &> /dev/null; then
  echo "❌ bun NOT FOUND"
  MISSING=1
fi

if [ $MISSING -eq 1 ]; then
  echo "❌ MISSING CRITICAL DEPENDENCIES"
  echo "   Install bun from: https://bun.sh"
  exit 1
fi

echo "✅ All dependencies present (jq not needed - using bun/node)"
exit 0
