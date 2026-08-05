try {
    $RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer"
    Remove-ItemProperty -Path $RegPath -Name "StartupDelayInMSec" -ErrorAction SilentlyContinue
    Write-Output "Successfully removed startup delay"
} catch {
    Write-Error "Failed to remove startup delay: $_"
}