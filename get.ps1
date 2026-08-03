# ChibangaRx Portable Launcher
# Usage: irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex

$repo = "chibangar/chibangarx"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "ChibangaRx-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "       ChibangaRx Portable" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Fetch latest release
Write-Host "[..] Checking for latest release..." -ForegroundColor Yellow
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
}
catch {
    Write-Host "[X] Failed to contact GitHub API." -ForegroundColor Red
    return
}

$tag = $release.tag_name
$versionLabel = $tag -replace "^v", ""
Write-Host "[OK] Latest version: v$versionLabel" -ForegroundColor Green

# Find zip
$asset = $release.assets | Where-Object { $_.name -match "\.zip$" }

if (-not $asset) {
    Write-Host "[X] No portable zip found in release $tag" -ForegroundColor Red
    return
}

Write-Host "[OK] Found: $($asset.name)" -ForegroundColor Green

# Create temp folder
$appDir = Join-Path $env:TEMP "ChibangaRx-$versionLabel"
if (Test-Path $appDir) { Remove-Item -Recurse -Force $appDir }
New-Item -ItemType Directory -Path $appDir -Force | Out-Null

# Download zip
$zipPath = Join-Path $env:TEMP $asset.name
Write-Host "[..] Downloading portable version..." -ForegroundColor Yellow

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing
    Write-Host "[OK] Download complete!" -ForegroundColor Green
}
catch {
    Write-Host "[X] Download failed." -ForegroundColor Red
    return
}

# Extract
Write-Host "[..] Extracting..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
    Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Extracted!" -ForegroundColor Green
}
catch {
    Write-Host "[X] Extraction failed." -ForegroundColor Red
    return
}

# Find exe
$exe = Get-ChildItem -Path $appDir -Recurse -Filter "chibangarx.exe" | Select-Object -First 1

if (-not $exe) {
    Write-Host "[X] Could not find chibangarx.exe" -ForegroundColor Red
    return
}

# Launch
Write-Host "[..] Launching ChibangaRx..." -ForegroundColor Yellow
Start-Process -FilePath $exe.FullName
Write-Host "[OK] ChibangaRx is running!" -ForegroundColor Green
Write-Host ""
Write-Host "Files are in: $appDir" -ForegroundColor DarkGray
