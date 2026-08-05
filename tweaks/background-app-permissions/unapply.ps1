try {
    $RegPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\BackgroundAccessApplications"
    Remove-ItemProperty -Path $RegPath -Name "DisableWebAccountState" -ErrorAction SilentlyContinue
    Remove-ItemProperty -Path $RegPath -Name "DisableWindowsFromAnyBackgroundApp" -ErrorAction SilentlyContinue
    Write-Output "Successfully re-enabled background app permissions"
} catch {
    Write-Error "Failed to re-enable background app permissions: $_"
}