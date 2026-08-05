try {
    $RegPath = "HKLM:\SOFTWARE\Policies\Microsoft\Windows\System"
    Remove-ItemProperty -Path $RegPath -Name "DisableActivityFeed" -ErrorAction SilentlyContinue
    Write-Output "Successfully re-enabled activity history"
} catch {
    Write-Error "Failed to re-enable activity history: $_"
}