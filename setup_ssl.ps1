<#
.SYNOPSIS
    Binds the generated self-signed certificate to OkApp on Port 443 with SNI.
#>
Import-Module WebAdministration
$ErrorActionPreference = "Stop"

$siteName = "OkApp"
$hostName = "ok.lumen-path.com"
$thumbprint = "C18EBC93E3A07B8BBD1B23E7260CA18CA5D68B72"

Write-Host "Configuring SSL for $siteName ($hostName)..."

# 1. Remove existing HTTPS binding if any (to avoid duplicates/errors)
$bindings = Get-WebBinding -Name $siteName -Protocol "https"
if ($bindings) {
    Write-Host "Removing existing HTTPS bindings..."
    Remove-WebBinding -Name $siteName -Protocol "https"
}

# 2. Add New Binding
Write-Host "Adding Binding..."
New-WebBinding -Name $siteName -IPAddress "*" -Port 443 -Protocol https -HostHeader $hostName -SslFlags 1

# 3. Assign Certificate
Write-Host "Assigning Certificate ($thumbprint)..."
# We need to access the binding object we just created
$binding = Get-WebBinding -Name $siteName -Protocol "https"
# AddSslCertificate installs the cert for the binding.
# Note: For SNI (SslFlags=1), this command handles the association in IIS 8+.
$binding.AddSslCertificate($thumbprint, "My")

Write-Host "SSL Binding Complete."

# Validation
Get-WebBinding -Name $siteName
