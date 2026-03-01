#!/bin/bash
# LUDOS OS - ONE COMMAND TO START EVERYTHING

set -e

echo "🚀 LUDOS OS - Complete Auto-Start"
echo "=================================="
echo ""

# Check dependencies
echo "📋 Checking dependencies..."
if ! command -v bun &> /dev/null; then
  echo "❌ bun NOT FOUND"
  echo "   Install from: https://bun.sh"
  exit 1
fi
echo "✅ bun OK"
echo ""

# Kill existing
echo "🧹 Cleaning up existing services..."
pkill -f "context-server" 2>/dev/null || true
pkill -f "bridge-permanent" 2>/dev/null || true
sleep 2
echo "✅ Cleanup done"
echo ""

# Start Context Server
echo "1/3 Starting Context Server..."
bun run ./dist/api/context-server.js > /tmp/ludoc-context-server.log 2>&1 &
CONTEXT_PID=$!
echo "    PID: $CONTEXT_PID"
sleep 2

# Start Bridge
echo "2/3 Starting Bridge..."
bun run ./src/api/bridge-permanent.ts > /tmp/ludoc-bridge.log 2>&1 &
BRIDGE_PID=$!
echo "    PID: $BRIDGE_PID"
sleep 2

# Health check
echo "3/3 Health check..."
HEALTH=$(curl -s http://0.0.0.0:9000/health || echo "failed")
if [[ "$HEALTH" == *"up"* ]]; then
  echo "    ✅ Context Server UP"
else
  echo "    ❌ Context Server DOWN"
  echo ""
  echo "Context Server log:"
  tail -20 /tmp/ludoc-context-server.log
  exit 1
fi

echo ""
echo "✅ ALL SERVICES RUNNING"
echo "======================="
echo ""
echo "Context Server: PID $CONTEXT_PID"
echo "Bridge:         PID $BRIDGE_PID"
echo ""
echo "📋 ONE-TIME SETUP (Windows):"
echo "   Open PowerShell in your Gemini CLI window and run:"
echo ""
echo "   powershell.exe -ExecutionPolicy Bypass -File $(wslpath -w $(pwd)/scripts/watcher-windows.ps1)"
echo ""
echo "   After that, EVERYTHING is 100% automatic:"
echo "   You send → Server validates → Bridge queues → Windows watcher executes → Gemini responds"
echo ""
echo "✨ Ready to receive commands!"
