try {
    $RegPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"
    if (!(Test-Path $RegPath)) {
        New-Item -Path $RegPath -Force | Out-Null
    }
    Set-ItemProperty -Path $RegPath -Name "DisableActivityFeed" -Value 1 -Type DWord -Force
    Write-Output "Successfully disabled activity history"
} catch {
    Write-Error "Failed to disable activity history: $_"
}