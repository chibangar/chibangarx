param(
    [string]$Owner = "chibangar",
    [string]$Repo = "chibangarx"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking for updates on GitHub..." -ForegroundColor Cyan

# Get current version
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$currentVersion = $packageJson.version
Write-Host "Current version: v$currentVersion" -ForegroundColor Yellow

# Get latest release from GitHub API
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases/latest" -Headers @{
        "User-Agent" = "ChibangaRx-UpdateChecker"
    }
    
    $latestVersion = $release.tag_name -replace "^v", ""
    Write-Host "Latest version: v$latestVersion" -ForegroundColor Green
    
    # Compare versions
    $currentParts = $currentVersion -split "\."
    $latestParts = $latestVersion -split "\."
    
    $updateAvailable = $false
    for ($i = 0; $i -lt $latestParts.Count; $i++) {
        if ($i -ge $currentParts.Count) {
            $updateAvailable = $true
            break
        }
        
        $currentNum = [int]$currentParts[$i]
        $latestNum = [int]$latestParts[$i]
        
        if ($latestNum -gt $currentNum) {
            $updateAvailable = $true
            break
        } elseif ($latestNum -lt $currentNum) {
            break
        }
    }
    
    if ($updateAvailable) {
        Write-Host "`nUpdate available!" -ForegroundColor Red
        Write-Host "Download: $($release.html_url)" -ForegroundColor Cyan
        Write-Host "Release notes:" -ForegroundColor Yellow
        Write-Host $release.body
    } else {
        Write-Host "`nYou're up to date!" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking for updates: $_" -ForegroundColor Red
}
