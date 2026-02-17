<#
.SYNOPSIS
    Secure SSH Enabler Script
    Run as Administrator via RDP
#>

$ErrorActionPreference = "Stop"
$myIP = "178.152.214.160"
$sshKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA0mE5/ClnyQtuicIgETh/7XA/IGy99JAv2ZKnxLJ9mI antigravity-mac-access"

Write-Host "━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Install OpenSSH Server" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"

if (-not (Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*').State -eq 'Installed') {
    Write-Host "Installing OpenSSH Server..."
    Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
} else {
    Write-Host "OpenSSH Server already installed."
}

Write-Host "Starting SSH Service..."
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Secure Firewall (Allow $myIP ONLY)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"

# Remove old broad rules
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*SSH*" } | Remove-NetFirewallRule -ErrorAction SilentlyContinue

# Add specific rule
New-NetFirewallRule -DisplayName "Secure_SSH_Allow_MyIP" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 22 `
    -RemoteAddress $myIP `
    -Action Allow `
    -Profile Any `
    -Force

Write-Host "✔ Firewall configured: Port 22 allowed ONLY from $myIP" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Configure Authorized Keys" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"

$sshDir = "C:\Users\Administrator\.ssh"
if (-not (Test-Path $sshDir)) {
    New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
}

$authFile = "$sshDir\authorized_keys"
$sshKey | Out-File -FilePath $authFile -Encoding ascii -Force

# Fix Permissions (Critical for SSH on Windows)
# Disable inheritance, verify Administrator access
icacls $sshDir /inheritance:r
icacls $sshDir /grant Administrator:F
icacls $authFile /inheritance:r
icacls $authFile /grant Administrator:F

Write-Host "✔ Authorized Keys updated." -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: Service Restart" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"
Restart-Service sshd
Write-Host "SSH Service Restarted."

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "READY TO CONNECT" -ForegroundColor Cyan
Write-Host "Run from Mac: ssh -i ~/.ssh/id_windows_ed25519 Administrator@101.53.150.23"
