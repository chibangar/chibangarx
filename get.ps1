# ChibangaRx Installer Script
# Usage: irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex

$repo = "chibangar/chibangarx"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "ChibangaRx-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "       ChibangaRx Installer" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Fetch latest release
Write-Host "[..] Checking for latest release..." -ForegroundColor Yellow
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
}
catch {
    Write-Host "[X] Failed to contact GitHub API." -ForegroundColor Red
    Write-Host "[X] Check your internet connection and try again." -ForegroundColor Red
    return
}

$tag = $release.tag_name
$versionLabel = $tag -replace "^v", ""
Write-Host "[OK] Latest version: v$versionLabel" -ForegroundColor Green

# Find installer
$asset = $release.assets | Where-Object { $_.name -match "^chibangarx-.*-setup\.exe$" -or $_.name -match "^sparkle-.*-setup\.exe$" }

if (-not $asset) {
    Write-Host "[X] No installer found in release $tag" -ForegroundColor Red
    Write-Host "[X] Available files:" -ForegroundColor Yellow
    $release.assets | ForEach-Object { Write-Host "    - $($_.name)" }
    return
}

Write-Host "[OK] Found: $($asset.name)" -ForegroundColor Green

# Download
$downloadPath = Join-Path $env:TEMP $asset.name
Write-Host "[..] Downloading..." -ForegroundColor Yellow

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $downloadPath -UseBasicParsing
    Write-Host "[OK] Download complete!" -ForegroundColor Green
}
catch {
    Write-Host "[X] Download failed." -ForegroundColor Red
    return
}

# Run installer
Write-Host "[..] Launching installer..." -ForegroundColor Yellow
try {
    Start-Process -FilePath $downloadPath -Verb RunAs
    Start-Sleep -Seconds 3
    Remove-Item -Path $downloadPath -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Installer launched!" -ForegroundColor Green
}
catch {
    Write-Host "[X] Failed to launch installer." -ForegroundColor Red
}

Write-Host ""
Write-Host "Thanks for using ChibangaRx!" -ForegroundColor Cyan
