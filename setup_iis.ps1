<#
.SYNOPSIS
    Configures IIS for the frontend and reverse proxy.
#>
Import-Module WebAdministration
$ErrorActionPreference = "Stop"

$siteName = "OkApp"
$port = 80
$physPath = "C:\inetpub\wwwroot\ok\client\dist"

# 1. Stop Default Web Site
Write-Host "Stopping 'Default Web Site'..."
Stop-WebSite -Name "Default Web Site" -ErrorAction SilentlyContinue

# 2. Check/Create Site
if (Get-WebSite -Name $siteName -ErrorAction SilentlyContinue) {
    Write-Host "Site '$siteName' exists. Removing to ensure clean state..."
    Remove-WebSite -Name $siteName
}

Write-Host "Creating Site '$siteName' on Port $port..."
New-WebSite -Name $siteName -Port $port -PhysicalPath $physPath -Force

# 3. Create web.config (URL Rewrite + Reverse Proxy)
$webConfigPath = "$physPath\web.config"
$webConfigContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="ReverseProxyApi" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:4000/api/{R:1}" />
                </rule>
                <rule name="ReactRoutes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/" />
                </rule>
            </rules>
        </rewrite>
    </system.webServer>
</configuration>
"@
$webConfigContent | Set-Content $webConfigPath -Encoding UTF8
Write-Host "web.config created."

# 4. Verify URL Rewrite Module
# (Difficult to check deterministically from PS without deeper inspection, assuming installed as per requirements)

# 5. Permission Check
# Ensure IUSR has read access to dist
$acl = Get-Acl $physPath
$permission = "IUSR","ReadAndExecute","Allow"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.AddAccessRule($accessRule)
Set-Acl $physPath $acl
Write-Host "Permissions updated for IUSR."

Write-Host "IIS Setup Complete. Verify at http://localhost/"
