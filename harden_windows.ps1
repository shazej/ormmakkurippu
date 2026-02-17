<#
.SYNOPSIS
    Windows Server Hardening & Audit Script
    Run as Administrator
#>

Write-Host "━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 1: Checking Open Ports" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"
$ports = Get-NetTCPConnection -State Listen
$ports | Select-Object LocalAddress, LocalPort, OwningProcess | Format-Table -AutoSize

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 2: Web Server Verification" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"
Write-Host "Checking for IIS..."
$iis = Get-Service -Name W3SVC -ErrorAction SilentlyContinue
if ($iis -and $iis.Status -eq 'Running') {
    Write-Host "✔ IIS is RUNNING" -ForegroundColor Green
    Get-WebBinding | Format-Table -AutoSize
} else {
    Write-Host "⚠ IIS not running or not detected." -ForegroundColor Yellow
}

Write-Host "Checking for Node/PM2 process..."
Get-Process | Where-Object { $_.ProcessName -eq "node" } | Format-Table Id, ProcessName, WorkingSet -AutoSize

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 3: Firewall Hardening" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"

# 1. Allow Custom RDP Port
Write-Host "Configuring RDP (Port 8349)..."
New-NetFirewallRule -DisplayName "Sec_Allow_RDP_8349" -Direction Inbound -LocalPort 8349 -Protocol TCP -Action Allow -Profile Any -Force
Write-Host "✔ Allowed TCP 8349" -ForegroundColor Green

# 2. Allow Web Ports
Write-Host "Configuring Web (80/443)..."
New-NetFirewallRule -DisplayName "Sec_Allow_HTTP" -Direction Inbound -LocalPort 80 -Protocol TCP -Action Allow -Profile Any -Force
New-NetFirewallRule -DisplayName "Sec_Allow_HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow -Profile Any -Force
Write-Host "✔ Allowed TCP 80, 443" -ForegroundColor Green

# 3. Block SMB (Public)
Write-Host "Blocking SMB (445) on Public Profiles..."
Set-NetFirewallRule -DisplayGroup "File and Printer Sharing" -Enabled False -Profile Public
New-NetFirewallRule -DisplayName "Sec_Block_SMB_Public" -Direction Inbound -LocalPort 445 -Protocol TCP -Action Block -Profile Public
Write-Host "✔ Blocked SMB on Public Network" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "STEP 4: RDP Security (NLA)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━"
# Enable NLA
(Get-WmiObject -class "Win32_TSGeneralSetting" -Namespace root\cimv2\terminalservices -Filter "TerminalName='RDP-Tcp'").SetUserAuthenticationRequired(1)
Write-Host "✔ Network Level Authentication (NLA) Enabled" -ForegroundColor Green

Write-Host "`n━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "AUDIT COMPLETE" -ForegroundColor Cyan
Write-Host "Please verify: Cloudflare Proxy is ON and Origin IP is hidden."
Pause
