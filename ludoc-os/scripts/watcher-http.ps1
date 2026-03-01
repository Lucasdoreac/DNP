# LUDOS Gemini CLI Watcher - HTTP Version (NO FILES!)
# Polls Context Server for commands via HTTP

$serverUrl = "http://127.0.0.1:9000"

Write-Host "🚀 LUDOS Gemini CLI Watcher (HTTP)" -ForegroundColor Green
Write-Host "Polling: $serverUrl/context/next" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Red
Write-Host ""

$counter = 0
while ($true) {
    try {
        # Poll for next command
        $response = Invoke-RestMethod -Uri "$serverUrl/context/next" -Method GET -ContentType "application/json"
        
        if ($response.message) {
            $counter++
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] #$counter 📨 $($response.message.Substring(0, [Math]::Min(60, $response.message.Length)))" -ForegroundColor Cyan
            
            # Execute with gemini CLI
            $sw = [Diagnostics.Stopwatch]::StartNew()
            $geminiResponse = gemini -p $response.message 2>&1
            $sw.Stop()
            
            # Send response back via HTTP
            $body = @{
                message = $response.message
                response = $geminiResponse
            } | ConvertTo-Json
            
            $postResponse = Invoke-RestMethod -Uri "$serverUrl/context/response" -Method POST -Body $body -ContentType "application/json"
            
            Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ✅ Processed in $($sw.Elapsed.Seconds)s ($($geminiResponse.Length) chars)" -ForegroundColor Green
        }
    } catch {
        Write-Host "[$(Get-Date -Format 'HH:mm:ss')] ❌ Error: $_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 2
}
