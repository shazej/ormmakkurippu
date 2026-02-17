<#
.SYNOPSIS
    Secure Multi-User SSH Enabler for Windows Server (GOLDEN VERSION)
    Run as Administrator.
    Includes fixes for: ACLs, File Encoding, Home Directory Resolution, Admin Groups.
.PARAMETER SshPort
    Port to listen on (Default: 2222)
#>

param (
    [int]$SshPort = 2222
)

# --- CONFIGURATION ---
$UsersAndKeys = @(
    @{ 
        Username = "antigravity"; 
        PublicKey = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIA0mE5/ClnyQtuicIgETh/7XA/IGy99JAv2ZKnxLJ9mI antigravity-mac-access" 
        IsAdmin = $true
    }
)
# ---------------------

$ErrorActionPreference = "Stop"
function Write-Log ($Message, $Color="Cyan") { Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color }

Write-Log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Log " STARTING FINAL SSH SETUP (Port $SshPort)"
Write-Log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Install OpenSSH
$sshCapability = Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Server*'
if ($sshCapability.State -ne 'Installed') {
    Write-Log "Installing OpenSSH..."
    Add-WindowsCapability -Online -Name $sshCapability.Name
}

# 2. Service Config
Stop-Service sshd -ErrorAction SilentlyContinue
Set-Service -Name sshd -StartupType 'Automatic'

# 3. Harden sshd_config
$configPath = "$env:ProgramData\ssh\sshd_config"
if (-not (Test-Path $configPath)) { Start-Service sshd; Stop-Service sshd }

# Backup
Copy-Item $configPath "$configPath.bak_$(Get-Date -Format 'yyyyMMddHHmmss')" -Force

# Read & Sanitize Config
$lines = Get-Content $configPath
$newLines = @()
foreach ($line in $lines) {
    if ($line -match "^#?Port\s+" -or 
        $line -match "^#?PubkeyAuthentication" -or 
        $line -match "^#?PasswordAuthentication" -or 
        $line -match "^#?PermitEmptyPasswords" -or 
        $line -match "^#?PermitRootLogin" -or 
        $line -match "^#?AuthorizedKeysFile" -or 
        $line -match "^#?StrictModes" -or
        $line -match "^Match Group administrators") { 
        # Skip to override later
    } else {
        $newLines += $line
    }
}

# Enforce Working Settings
$finalConfig = @(
    "Port $SshPort",
    "PubkeyAuthentication yes",
    "PasswordAuthentication no",
    "PermitEmptyPasswords no",
    "PermitRootLogin no",
    "StrictModes no",  # Critical for some Windows environments
    "AuthorizedKeysFile C:/Users/%u/.ssh/authorized_keys" # Critical: Absolute path forces correct lookup
) + $newLines

$finalConfig | Set-Content $configPath -Encoding Ascii
Write-Log "✔ sshd_config Re-written (Safe Mode)." "Green"

# 4. User & Key Setup
foreach ($userDef in $UsersAndKeys) {
    $uName = $userDef.Username
    
    # Create User
    if (-not (Get-LocalUser -Name $uName -ErrorAction SilentlyContinue)) {
        Write-Log "Creating user: $uName"
        $safeC = ((33..126) | Get-Random -Count 20 | % {[char]$_}) -join ""
        New-LocalUser -Name $uName -Password (ConvertTo-SecureString $safeC -AsPlainText -Force) -PasswordNeverExpires       
    }
    if ($userDef.IsAdmin) { Add-LocalGroupMember -Group "Administrators" -Member $uName -ErrorAction SilentlyContinue }

    # Dirs
    $userDir = "C:\Users\$uName"
    if (-not (Test-Path $userDir)) { New-Item -Type Directory -Path $userDir -Force | Out-Null }
    $sshDir = "$userDir\.ssh"
    if (-not (Test-Path $sshDir)) { New-Item -Type Directory -Path $sshDir -Force | Out-Null }
    
    # Key File (Force ASCII)
    $authFile = "$sshDir\authorized_keys"
    $userDef.PublicKey | Out-File -FilePath $authFile -Encoding ascii -Force

    # ACLs (Strict)
    Write-Log "Fixing ACLs for $uName..."
    $acl = Get-Acl $authFile
    $acl.SetAccessRuleProtection($true, $false)
    
    $ruleSystem = New-Object System.Security.AccessControl.FileSystemAccessRule("SYSTEM","FullControl","Allow")
    $ruleAdmin = New-Object System.Security.AccessControl.FileSystemAccessRule("Administrators","FullControl","Allow")
    $ruleUser = New-Object System.Security.AccessControl.FileSystemAccessRule($uName,"FullControl","Allow")
    
    $acl.AddAccessRule($ruleSystem)
    $acl.AddAccessRule($ruleAdmin)
    $acl.AddAccessRule($ruleUser)
    Set-Acl -Path $authFile -AclObject $acl
    
    # Folder ACL
    $dAcl = Get-Acl $sshDir
    $dAcl.SetAccessRuleProtection($true, $false)
    $dAcl.AddAccessRule($ruleSystem)
    $dAcl.AddAccessRule($ruleAdmin)
    $dAcl.AddAccessRule($ruleUser)
    Set-Acl -Path $sshDir -AclObject $dAcl
    
    Write-Log "✔ Keys set for $uName" "Green"
}

# 5. Firewall
Get-NetFirewallRule -DisplayName "LP_SSH_*" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName "LP_SSH_Open_$SshPort" -Direction Inbound -Protocol TCP -LocalPort $SshPort -Action Allow -Profile Any
Write-Log "✔ Firewall TCP $SshPort ALLOWED" "Green"

# 6. Restart
Restart-Service sshd
Write-Log "✔ SSHD Restarted." "Green"
Write-Log "Should be ready to connect."
