# LUDOC OS - Deprecated Components

## ❌ File-Based Communication (OBSOLETE)

The following components tried to use files for IPC between WSL and Windows.
They caused lock issues, permission errors, and timeouts.

### Scripts to DELETE:
- `scripts/watcher-windows.ps1` (v1-v3 - file-based versions)
- `scripts/gemini-bridge-api.sh`
- `scripts/gemini-bridge.sh`
- `scripts/bridge-to-watcher.sh`

### Files to IGNORE:
- `.ludoc/incoming.txt` (used by old file-based watcher)
- `.ludoc/response.txt` (used by old file-based watcher)

## ✅ Current Architecture (HTTP-based)

### Active Components:
- `src/api/context-server.ts` - HTTP API on port 9000
- `src/api/dispatcher.ts` - Sends commands via HTTP POST
- `scripts/watcher-http.ps1` - Polls server via HTTP (NO FILES!)
- `scripts/start-ludoc.sh` - Starts all services

### Endpoints:
- `POST /context/dispatch` - Queue signed command
- `GET /context/next` - Poll for next command
- `POST /context/response` - Submit response
- `GET /health` - Health check

## Migration Date: 2026-03-01

All file-based IPC was replaced with HTTP polling to solve:
- Windows file locking issues
- WSL/Windows filesystem sync delays
- Permission errors (exit code 144)
- Timeout issues
