try {
    $RegPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications"
    Set-ItemProperty -Path $RegPath -Name "DisableWebAccountState" -Value 1 -Type DWord -Force
    Set-ItemProperty -Path $RegPath -Name "DisableWindowsFromAnyBackgroundApp" -Value 1 -Type DWord -Force
    Write-Output "Successfully disabled background app permissions"
} catch {
    Write-Error "Failed to disable background app permissions: $_"
}