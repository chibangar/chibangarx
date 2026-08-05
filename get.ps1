# ChibangaRx Portable Launcher
# Usage: irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex

$repo = "chibangar/chibangarx"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "ChibangaRx-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

# Fetch latest release
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
}
catch { return }

$tag = $release.tag_name
$versionLabel = $tag -replace "^v", ""

# Find zip
$asset = $release.assets | Where-Object { $_.name -match "\.zip$" }
if (-not $asset) { return }

# Create temp folder
$appDir = Join-Path $env:TEMP "ChibangaRx-$versionLabel"
if (Test-Path $appDir) { Remove-Item -Recurse -Force $appDir }
New-Item -ItemType Directory -Path $appDir -Force | Out-Null

# Download zip
$zipPath = Join-Path $env:TEMP $asset.name
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $zipPath -UseBasicParsing
}
catch { return }

# Extract
try {
    Expand-Archive -Path $zipPath -DestinationPath $appDir -Force
    Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
}
catch { return }

# Find exe
$exe = Get-ChildItem -Path $appDir -Recurse -Filter "chibangarx.exe" | Select-Object -First 1
if (-not $exe) { return }

# Launch app
Start-Process -FilePath $exe.FullName -WindowStyle Hidden

# Close PowerShell window
Stop-Process -Id $PID -Force
