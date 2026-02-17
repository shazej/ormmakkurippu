$logFile = "$env:ProgramData\ssh\logs\sshd.log"
if (-not (Test-Path $logFile)) {
    Write-Host "Log file not found at $logFile"
    # Try enabling logging in config if not present
    $configPath = "$env:ProgramData\ssh\sshd_config"
    Add-Content $configPath "`nLogLevel DEBUG3`nSyslogFacility LOCAL0"
    Restart-Service sshd
    Write-Host "Enabled DEBUG3 logging and restarted sshd. Try connecting again, then run this script again."
} else {
    Get-Content $logFile -Tail 50
}
