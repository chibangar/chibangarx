try {
    $RegPath = "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer"
    Set-ItemProperty -Path $RegPath -Name "StartupDelayInMSec" -Value 120000 -Type DWord -Force
    Write-Output "Successfully set startup delay to 120000ms"
} catch {
    Write-Error "Failed to set startup delay: $_"
}