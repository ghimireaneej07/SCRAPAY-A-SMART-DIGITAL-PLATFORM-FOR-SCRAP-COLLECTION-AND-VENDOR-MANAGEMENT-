$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".devservers.json"

if (-not (Test-Path $pidFile)) {
    Write-Host "No .devservers.json found. Nothing to stop."
    exit 0
}

$state = Get-Content $pidFile | ConvertFrom-Json
$pids = @($state.backend_pid, $state.frontend_pid) | Where-Object { $_ }

foreach ($p in $pids) {
    $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping PID $p ($($proc.ProcessName))"
        Stop-Process -Id $p -Force
    } else {
        Write-Host "PID $p is not running."
    }
}

Remove-Item $pidFile -Force
Write-Host "Stopped."
