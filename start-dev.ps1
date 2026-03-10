param(
    [switch]$NoMigrate,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

$backendLog = Join-Path $root "backend_server.log"
$backendErr = Join-Path $root "backend_server.err.log"
$frontendLog = Join-Path $root "frontend_server.log"
$frontendErr = Join-Path $root "frontend_server.err.log"
$pidFile = Join-Path $root ".devservers.json"

if (Test-Path $pidFile) {
    Write-Host "Existing .devservers.json found. Stopping previous servers first..."
    & (Join-Path $root "stop-dev.ps1")
}

$busy = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object {
    $_.LocalPort -in 8000, 5173
}
if ($busy) {
    if ($Force) {
        Write-Host "Ports in use. Stopping conflicting processes..."
        $busy | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    } else {
        Write-Host "Ports 8000/5173 are already in use. Stop those processes first, or use -Force."
        $busy | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table
        exit 1
    }
}

if (-not $NoMigrate) {
    Write-Host "Running backend migrations..."
    python .\scrapay-backend\manage.py migrate
}

Write-Host "Starting backend on http://localhost:8000 ..."
$backend = Start-Process -FilePath "python" `
    -ArgumentList ".\scrapay-backend\manage.py","runserver","0.0.0.0:8000" `
    -WorkingDirectory $root `
    -RedirectStandardOutput $backendLog `
    -RedirectStandardError $backendErr `
    -PassThru

Write-Host "Starting frontend on http://localhost:5173 ..."
$frontend = Start-Process -FilePath "npm" `
    -ArgumentList "--prefix","scrapay-frontend","run","dev","--","--host","0.0.0.0","--port","5173" `
    -WorkingDirectory $root `
    -RedirectStandardOutput $frontendLog `
    -RedirectStandardError $frontendErr `
    -PassThru

@{
    backend_pid = $backend.Id
    frontend_pid = $frontend.Id
    started_at = (Get-Date).ToString("s")
} | ConvertTo-Json | Set-Content -Path $pidFile

Write-Host ""
Write-Host "Started successfully."
Write-Host "Backend PID : $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "Logs:"
Write-Host "  $backendLog"
Write-Host "  $frontendLog"
Write-Host ""
Write-Host "Use .\stop-dev.ps1 to stop both servers."
