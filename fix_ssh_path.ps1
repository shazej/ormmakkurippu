<#
.SYNOPSIS
    Fixes SSH "Home Directory" resolution issue by enforcing absolute path for authorized keys.
#>

$ErrorActionPreference = "Stop"
$configPath = "$env:ProgramData\ssh\sshd_config"

Write-Host "Forcing Absolute Path for AuthorizedKeysFile..."

$content = Get-Content $configPath
$newLines = @()

# Remove existing AuthorizedKeysFile directives (comment them out)
foreach ($line in $content) {
    if ($line -match "^AuthorizedKeysFile\s+") {
        $newLines += "# $line (Replaced)"
    } else {
        $newLines += $line
    }
}

# Prepend the absolute path fix
$finalConfig = @(
    "AuthorizedKeysFile C:/Users/%u/.ssh/authorized_keys"
) + $newLines

$finalConfig | Set-Content $configPath -Encoding Ascii

Write-Host "Restarting sshd..."
Restart-Service sshd

Write-Host "Done. Check if connection works." -ForegroundColor Green
$uName = "antigravity"
$sshDir = "C:\Users\$uName\.ssh"
Write-Host "Verifying Directory Exists: $sshDir -> $(Test-Path $sshDir)"
