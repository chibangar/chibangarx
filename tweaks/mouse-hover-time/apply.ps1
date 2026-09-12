try {
    $RegPath = "HKCU:\Control Panel\Desktop"
    Set-ItemProperty -Path $RegPath -Name "MouseHoverTime" -Value 100 -Force
    Write-Output "Successfully set mouse hover time to 100ms"
} catch {
    Write-Error "Failed to set mouse hover time: $_"
}