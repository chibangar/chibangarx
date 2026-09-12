try {
    $RegPath = "HKCU:\SOFTWARE\Policies\Microsoft\Windows\CurrentVersion\PushNotifications"
    if (!(Test-Path $RegPath)) {
        New-Item -Path $RegPath -Force | Out-Null
    }
    Set-ItemProperty -Path $RegPath -Name "NoToastApplicationNotification" -Value 1 -Type DWord -Force
    Write-Output "Successfully disabled toast notifications"
} catch {
    Write-Error "Failed to disable notifications: $_"
}