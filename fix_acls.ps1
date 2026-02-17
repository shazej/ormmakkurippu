$ErrorActionPreference = "Stop"
$uName = "antigravity"
$sshDir = "C:\Users\$uName\.ssh"
$authFile = "$sshDir\authorized_keys"

Write-Host "Fixing ACLs for $uName..."

# Rules
# Note: Using ArgumentList for New-Object to avoid parsing issues
$ruleSystem = New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList "SYSTEM","FullControl","Allow"
$ruleAdmin = New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList "Administrators","FullControl","Allow"
$ruleUser = New-Object System.Security.AccessControl.FileSystemAccessRule -ArgumentList $uName,"FullControl","Allow"

# 1. Fix File ACL
$acl = Get-Acl $authFile
$acl.SetAccessRuleProtection($true, $false) # (isProtected, preserveInheritance) -> Force clean slate
$acl.AddAccessRule($ruleSystem)
$acl.AddAccessRule($ruleAdmin)
$acl.AddAccessRule($ruleUser)
Set-Acl -Path $authFile -AclObject $acl

# 2. Fix Folder ACL
$dAcl = Get-Acl $sshDir
$dAcl.SetAccessRuleProtection($true, $false)
$dAcl.AddAccessRule($ruleSystem)
$dAcl.AddAccessRule($ruleAdmin)
$dAcl.AddAccessRule($ruleUser)
Set-Acl -Path $sshDir -AclObject $dAcl

Write-Host "✔ ACLs Fixed for $authFile" -ForegroundColor Green
Write-Host "Try connecting now."
