#!/bin/bash

###############################################################################
# LUDOC P2P Integration Monitor
# 
# Roda no lado remoto (Copilot Codespace)
# Monitora fila de mensagens, processa, e responde
###############################################################################

set -e

LUDOC_DIR="/workspaces/DNP/ludoc-os/.ludoc"
QUEUE_FILE="$LUDOC_DIR/message-queue.json"
RESPONSE_FILE="$LUDOC_DIR/gemini-response.json"

echo "[LUDOC-MONITOR] 🚀 Starting P2P Message Monitor"
echo "[LUDOC-MONITOR] Queue: $QUEUE_FILE"
echo "[LUDOC-MONITOR] Response: $RESPONSE_FILE"
echo ""

# Función para processar mensagem
process_message() {
  local message=$1
  local processed_by=$2
  
  echo "[LUDOC-MONITOR] 📨 Processing message:"
  echo "[LUDOC-MONITOR]    Content: ${message:0:80}..."
  echo "[LUDOC-MONITOR]    Processor: $processed_by"
  
  # Simular processamento (na prática, chamaria Gemini API)
  sleep 2
  
  # Gerar resposta mockada
  local response="{
  \"response\": \"LUDOC Processing Complete: $message\",
  \"processedBy\": \"$processed_by\",
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"status\": \"success\"
}"
  
  echo "$response" > "$RESPONSE_FILE"
  echo "[LUDOC-MONITOR] ✅ Response saved to $RESPONSE_FILE"
}

# Monitor de fila
monitor_queue() {
  local max_wait=30  # segundos
  local elapsed=0
  
  echo "[LUDOC-MONITOR] ⏳ Waiting for messages (max $max_wait seconds)..."
  
  while [ $elapsed -lt $max_wait ]; do
    if [ -f "$QUEUE_FILE" ]; then
      local msg_count=$(jq 'length' "$QUEUE_FILE" 2>/dev/null || echo 0)
      
      if [ "$msg_count" -gt 0 ]; then
        echo "[LUDOC-MONITOR] ✅ Found $msg_count message(s) in queue"
        
        # Processar primeira mensagem
        local message=$(jq -r '.[0].text' "$QUEUE_FILE")
        local processor=$(jq -r '.[0].processedBy // "ludoc-bridge"' "$QUEUE_FILE")
        
        process_message "$message" "$processor"
        return 0
      fi
    fi
    
    sleep 1
    elapsed=$((elapsed + 1))
    echo -n "."
  done
  
  echo ""
  echo "[LUDOC-MONITOR] ⏱️  Timeout: no messages received"
  return 1
}

# Verificar que servidor está respondendo
check_server_health() {
  echo "[LUDOC-MONITOR] 🏥 Checking server health..."
  
  local health=$(curl -s http://localhost:9000/health 2>/dev/null || echo "{\"error\": \"no connection\"}")
  
  if echo "$health" | grep -q "up"; then
    echo "[LUDOC-MONITOR] ✅ Server is healthy"
    echo "    $health"
    return 0
  else
    echo "[LUDOC-MONITOR] ❌ Server not responding"
    echo "    $health"
    return 1
  fi
}

# Main
main() {
  mkdir -p "$LUDOC_DIR"
  
  check_server_health || {
    echo "[LUDOC-MONITOR] ⚠️  Server not ready; starting it..."
    bun src/api/context-server.ts 9000 > "$LUDOC_DIR/server.log" 2>&1 &
    SERVER_PID=$!
    echo "[LUDOC-MONITOR] Server PID: $SERVER_PID"
    sleep 3
  }
  
  monitor_queue
  
  echo ""
  echo "[LUDOC-MONITOR] 📋 Final Status:"
  echo "    Queue: $([ -f "$QUEUE_FILE" ] && echo "✅ exists" || echo "❌ missing")"
  echo "    Response: $([ -f "$RESPONSE_FILE" ] && echo "✅ ready" || echo "❌ waiting")"
  echo ""
  echo "[LUDOC-MONITOR] All done! Claude can now fetch response:"
  echo "    curl http://localhost:9000/context/response"
}

main "$@"
