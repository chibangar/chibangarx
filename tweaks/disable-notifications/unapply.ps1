try {
    $RegPath = "HKCU:\SOFTWARE\Policies\Microsoft\Windows\CurrentVersion\PushNotifications"
    Remove-ItemProperty -Path $RegPath -Name "NoToastApplicationNotification" -ErrorAction SilentlyContinue
    Write-Output "Successfully re-enabled toast notifications"
} catch {
    Write-Error "Failed to re-enable notifications: $_"
}