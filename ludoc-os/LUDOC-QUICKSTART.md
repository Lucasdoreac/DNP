# LUDOS OS - Quick Start

## 🚀 One-Time Setup

### 1. Start WSL Services (run ONCE)
```bash
ludoc-start
```

### 2. Start Windows Watcher (run ONCE)

**Option A:** Double-click `C:\Users\ludoc\DNP\ludoc-os\scripts\LUDOWatcher.bat`

**Option B:** In PowerShell (your Gemini CLI window):
```powershell
powershell.exe -ExecutionPolicy Bypass -File C:\Users\ludoc\DNP\ludoc-os\scripts\watcher-windows.ps1
```

## 💡 Daily Usage

### Send command
```bash
ludoc-send "Explain quantum computing"
```

### Check response
```bash
ludoc-response
```

### Quick test
```bash
ludoc-test
```

### Check status
```bash
ludoc-status
```

### Watch logs
```bash
ludoc-logs
```

## 🛑 Stop Services
```bash
ludoc-stop
```

## 🔄 Restart
```bash
ludoc-stop && ludoc-start
```

## 📋 Available Commands

- `ludoc-start` - Start all LUDOS services
- `ludoc-stop` - Stop all services
- `ludoc-status` - Check service status
- `ludoc-send` - Send command to Gemini
- `ludoc-response` - Get latest response
- `ludoc-logs` - Watch bridge logs
- `ludoc-test` - Quick E2E test

## 🎯 Flow

```
You type: ludoc-send "your question"
  ↓
PGP signs → Server validates → Bridge queues
  ↓
Windows Watcher picks up → Gemini CLI executes
  ↓
Response saved → You read: ludoc-response
```

**100% automatic after initial setup!**
