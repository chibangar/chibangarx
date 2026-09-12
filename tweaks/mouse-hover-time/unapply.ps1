try {
    $RegPath = "HKCU:\Control Panel\Desktop"
    Remove-ItemProperty -Path $RegPath -Name "MouseHoverTime" -ErrorAction SilentlyContinue
    Write-Output "Successfully reset mouse hover time"
} catch {
    Write-Error "Failed to reset mouse hover time: $_"
}