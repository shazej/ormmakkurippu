<#
.SYNOPSIS
    Sets up the Node.js backend as a service using PM2 (Robust Path detection).
#>
$ErrorActionPreference = "Stop"

# Refresh Environment Variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Try to find PM2
$pm2Path = Get-Command pm2.cmd -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source
if (-not $pm2Path) {
    $roaming = "$env:APPDATA\npm\pm2.cmd"
    if (Test-Path $roaming) { $pm2Path = $roaming }
}

if (-not $pm2Path) {
    Write-Host "PM2 not found in PATH. Checking install..."
    npm list -g pm2
    throw "PM2 executable not found. Please ensure 'npm install -g pm2' succeeded."
}

Write-Host "Using PM2 at: $pm2Path"

$appDir = "C:\inetpub\wwwroot\ok\server"
Set-Location $appDir

# Alias function to call pm2 easily
function pm2 { & $pm2Path $args }

Write-Host "Starting Application with PM2..."
# Check if already running
$list = pm2 list
if ($list -match "ok-api") {
    Write-Host "Restarting existing process..."
    pm2 restart ok-api
} else {
    Write-Host "Starting new process..."
    # Set NODE_ENV to production
    $env:NODE_ENV = "production"
    # Ensure PORT is 4000
    $env:PORT = 4000
    pm2 start index.js --name "ok-api"
}

Write-Host "Saving PM2 list..."
pm2 save

# Setup PM2 Startup (Persistence)
Write-Host "Installing PM2 Startup Persistence..."
npm install pm2-windows-startup -g
$startupPath = "$env:APPDATA\npm\pm2-startup.cmd"
if (Test-Path $startupPath) {
    & $startupPath install
} else {
    Write-Warning "pm2-startup not found. Skipping persistence setup (Manual Step)."
}

Write-Host "Backend Validation (Wait 5s)..."
Start-Sleep -Seconds 5
Invoke-WebRequest "http://localhost:4000/health" -UseBasicParsing
