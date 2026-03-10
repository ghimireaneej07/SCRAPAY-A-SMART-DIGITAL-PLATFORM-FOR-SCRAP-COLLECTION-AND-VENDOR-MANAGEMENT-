$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$pidFile = Join-Path $root ".devservers.json"

if (-not (Test-Path $pidFile)) {
    Write-Host "No .devservers.json found. Nothing to stop."
    exit 0
}

$state = Get-Content $pidFile | ConvertFrom-Json
$pids = @($state.backend_pid, $state.frontend_pid) | Where-Object { $_ }

foreach ($pid in $pids) {
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping PID $pid ($($proc.ProcessName))"
        Stop-Process -Id $pid -Force
    } else {
        Write-Host "PID $pid is not running."
    }
}

Remove-Item $pidFile -Force
Write-Host "Stopped."
