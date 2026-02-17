$ErrorActionPreference = "Stop"
$uName = "antigravity"
$key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA0mE5/ClnyQtuicIgETh/7XA/IGy99JAv2ZKnxLJ9mI antigravity-mac-access"
$sshDir = "C:\Users\$uName\.ssh"
$authFile = "$sshDir\authorized_keys"
$configPath = "$env:ProgramData\ssh\sshd_config"

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host " FINAL SSH RECOVERY FIX" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Fix Key Encoding (Force ASCII)
Write-Host "1. Re-writing authorized_keys (ASCII)..."
if (-not (Test-Path $sshDir)) { New-Item -Type Directory -Path $sshDir -Force }
$key | Out-File -FilePath $authFile -Encoding ascii -Force
Write-Host "   ✔ Key saved." -ForegroundColor Green

# 2. Fix sshd_config (Disable StrictModes)
Write-Host "2. Disabling StrictModes in config..."
$content = Get-Content $configPath
$newContent = @()
foreach ($line in $content) {
    if ($line -match "^#?StrictModes") {
        # Skip existing
    } elseif ($line -match "^#?PubkeyAuthentication") {
        # Skip existing
        continue
    } else {
        $newContent += $line
    }
}

# Add forced settings at top
$finalConfig = @(
    "StrictModes no",
    "PubkeyAuthentication yes"
) + $newContent

$finalConfig | Set-Content $configPath -Encoding Ascii
Write-Host "   ✔ StrictModes disabled." -ForegroundColor Green

# 3. Restart Service
Write-Host "3. Restarting SSHD..."
Restart-Service sshd
Write-Host "   ✔ Service Restarted." -ForegroundColor Green

Write-Host "`nREADY. Try connecting now." -ForegroundColor Cyan
