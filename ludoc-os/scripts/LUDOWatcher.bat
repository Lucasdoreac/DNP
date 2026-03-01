@echo off
REM LUDOS Windows Watcher - Double-click to start
REM This will start the watcher in your Gemini CLI window

echo Starting LUDOS Windows Watcher...
echo.

REM Check if running in WSL
wsl echo "WSL detected" >nul 2>&1
if errorlevel 1 (
    echo ERROR: WSL not found
    pause
    exit /b 1
)

REM Get the script path
set SCRIPT_PATH=%~dp0watcher-windows.ps1

echo Starting PowerShell script: %SCRIPT_PATH%
echo.
echo Press Ctrl+C to stop the watcher
echo.

REM Start the watcher
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_PATH%"

pause
