<#
.SYNOPSIS
    Sets up the Node.js backend as a service using PM2.
#>
$ErrorActionPreference = "Stop"

Write-Host "Installing PM2 globally..."
npm install -g pm2

$appDir = "C:\inetpub\wwwroot\ok\server"
Set-Location $appDir

Write-Host "Starting Application with PM2..."
# Check if already running
$running = pm2 list | Select-String "ok-api"
if ($running) {
    Write-Host "Restarting existing process..."
    pm2 restart ok-api
} else {
    Write-Host "Starting new process..."
    # Set NODE_ENV to production
    $env:NODE_ENV = "production"
    $env:PORT = 4000
    pm2 start index.js --name "ok-api"
}

Write-Host "Saving PM2 list..."
pm2 save

# Setup PM2 Startup (Persistence)
# Note: pm2-startup might need user interaction or specific library.
# The user asked for "PM2 Windows service" which usually implies pm2-installer or similar.
# But `pm2 startup` on Windows often suggests `npm install pm2-windows-startup -g` then `pm2-startup install`.
Write-Host "Installing PM2 Startup Persistence..."
npm install pm2-windows-startup -g
pm2-startup install

Write-Host "Backend Validation..."
Start-Sleep -Seconds 5
Invoke-WebRequest "http://localhost:4000/health" -UseBasicParsing
