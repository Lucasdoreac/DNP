# Migration: File-Based IPC → HTTP API

**Date:** 2026-03-01
**Status:** COMPLETE

## What Changed

Removed file-based IPC (incoming.txt/response.txt) that caused WSL/Windows file locking issues. The Context Server already had a complete HTTP API - we just needed to use it properly.

## Root Cause of Problems

We wasted hours debugging file-based IPC because:
1. **Windows file locking** - When PowerShell reads a file, Windows locks it for WSL writes
2. **WSL 9P protocol latency** - Accessing `\\wsl$` paths is slow and unreliable
3. **Race conditions** - Write → Read → Delete happening simultaneously causes errors
4. **Exit code 144** - Permission/cannot access errors due to file locks

**The solution already existed:** Context Server on port 9000 with HTTP endpoints.

## Components Removed

### Scripts (6 files):
- `scripts/watcher-windows.ps1` - File polling (v1-v3)
- `scripts/gemini-bridge-api.sh` - JSON queue polling (obsolete)
- `scripts/gemini-bridge.sh` - JSON queue polling (obsolete)
- `scripts/gemini-bridge-simple.sh` - Test echo script
- `scripts/bridge-to-watcher.sh` - Writes to incoming.txt
- `scripts/watch-commands.sh` - Watches incoming.txt

### Code (1 file):
- `src/api/bridge-permanent.ts` - Used incoming.txt/response.txt

### Runtime Artifacts:
- `.ludoc/incoming.txt` - File-based IPC input
- `.ludoc/response.txt` - File-based IPC output

## Current Architecture (HTTP-Based)

### Context Server Endpoints

```typescript
POST /context/dispatch   - Queue signed message from dispatcher
GET  /context/next       - Poll for next message (Gemini CLI)
POST /context/response   - Submit response (Gemini CLI)
GET  /health             - Health check
```

### Active Components

- `src/api/context-server.ts` - HTTP server (0.0.0.0:9000)
- `src/api/dispatcher.ts` - Sends commands via HTTP POST
- `scripts/watcher-http.ps1` - HTTP-based watcher (polls /context/next)
- `scripts/start-ludoc.sh` - Service orchestration

### Flow

```
You → ludoc-send "command"
  ↓
Dispatcher → POST /context/dispatch (PGP signed)
  ↓
Context Server → Validates + Enqueues
  ↓
Watcher HTTP → GET /context/next (polls every 2s)
  ↓
Gemini CLI → Executes command
  ↓
Watcher HTTP → POST /context/response
  ↓
Context Server → Saves to gemini-response.json
  ↓
You → ludoc-response (reads result)
```

## How to Use (After Migration)

### Start Context Server:
```bash
cd /mnt/c/Users/ludoc/DNP/ludoc-os
bun src/api/context-server.js
```

### Start Gemini CLI Watcher (Windows PowerShell):
```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\Users\ludoc\DNP\ludoc-os\scripts\watcher-http.ps1
```

### Send Command:
```bash
export LUDOC_PASSPHRASE="ludoc-wsl2-2026"
bun src/api/dispatcher.ts --send "What is 2+2?" --host 0.0.0.0 --port 9000
```

### Or use alias (if configured):
```bash
ludoc-send "What is 2+2?"
ludoc-response
```

## Benefits of HTTP Approach

1. **No file locking issues** - Eliminates ALL WSL/Windows cross-boundary problems
2. **Better error handling** - HTTP status codes vs file existence checks
3. **Scalable** - Can add multiple watchers/clients easily
4. **Standard** - RESTful API is well-understood and testable
5. **Reliable** - No race conditions or permission errors
6. **Testable** - Can use curl/Postman to test endpoints directly

## Testing After Migration

```bash
# 1. Start Context Server
bun src/api/context-server.js &
SERVER_PID=$!

# 2. Test health endpoint
sleep 2
curl http://127.0.0.1:9000/health
# Expected: {"status":"up","peerId":"..."}

# 3. Test GET /context/next
curl http://127.0.0.1:9000/context/next
# Expected: {"success":true,"message":null} (empty queue)

# 4. Send test command
export LUDOC_PASSPHRASE="ludoc-wsl2-2026"
bun src/api/dispatcher.ts --send "Test" --host 0.0.0.0 --port 9000
# Expected: [DISPATCHER] ✅ Dispatch accepted

# 5. Check queue
cat .ludoc/message-queue.json
# Expected: JSON array with test message

# 6. Cleanup
kill $SERVER_PID
```

## Rollback (If Needed)

If something breaks after this migration:

```bash
# Option 1: Checkout pre-cleanup tag
git checkout pre-cleanup-http-migration

# Option 2: View what was removed
git diff pre-cleanup-http-migration HEAD

# Option 3: Restore specific files from tag
git checkout pre-cleanup-http-migration -- scripts/deleted-file.ps1
```

## Lessons Learned

### What Went Wrong

1. **Overengineering** - Created complex file-based IPC when HTTP already existed
2. **Not checking existing code** - Should have verified Context Server endpoints first
3. **Chasing symptoms** - Debugged path issues instead of questioning the approach
4. **Ignoring standards** - RESTful APIs are the standard for a reason

### What Went Right

1. **HTTP endpoints** - Context Server was well-designed from the start
2. **Adding 2 endpoints** - GET /context/next and POST /context/response solved everything
3. **PowerShell HTTP support** - Invoke-RestMethod works perfectly across WSL boundary
4. **Eventually asking "why?"** - Led to discovering the solution already existed

### Code Review Takeaways

> "We spent 2+ hours debugging file paths when the solution was 20 lines of HTTP endpoints."
>
> "The Context Server ALREADY had the infrastructure. We just didn't look."
>
> "HTTP > Files for cross-OS communication. Always."

## Future Improvements

1. **WebSocket support** - Instead of polling, use WebSocket for real-time updates
2. **Authentication** - Add API key or token-based auth to Context Server
3. **Rate limiting** - Prevent abuse of /context/dispatch endpoint
4. **Message priority** - Add priority field for urgent messages
5. **Batch processing** - Allow multiple messages in one request

## Related Documentation

- `README.md` - Phase 2.3: P2P Communication
- `docs/ludoc/QUICK-START-PRODUCTION.md` - Setup instructions
- `src/api/context-server.ts` - HTTP server implementation
- `scripts/watcher-http.ps1` - HTTP-based watcher

## Migration Date

2026-03-01

## Migration Author

LUDOC OS - Claude Code (Session: Brownfield Cleanup)
