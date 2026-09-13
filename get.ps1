# ChibangaRx Installer Launcher
# Usage: irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex

$repo = "chibangar/chibangarx"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "ChibangaRx-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

Write-Host "A obter a ultima release de $repo..." -ForegroundColor Cyan

# Fetch latest release
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers
}
catch {
    Write-Host "Falha ao contactar a GitHub API: $($_.Exception.Message)" -ForegroundColor Red
    return
}

$tag = $release.tag_name
$versionLabel = $tag -replace "^v", ""
Write-Host "Ultima release: $tag" -ForegroundColor Green

# O workflow release.yml publica o instalador Setup.exe (+ blockmap e latest.yml).
# Nao existe asset .zip nas releases, por isso o instalador e a fonte principal.
# Mantem-se fallback para .zip portatil caso venha a existir em releases futuras.
$asset = $release.assets | Where-Object { $_.name -match "Setup\.exe$" } | Select-Object -First 1
$isInstaller = $true
if (-not $asset) {
    $asset = $release.assets | Where-Object { $_.name -match "\.zip$" } | Select-Object -First 1
    $isInstaller = $false
}
if (-not $asset) {
    Write-Host "Nenhum instalador (.exe) ou portatil (.zip) encontrado na release $tag." -ForegroundColor Red
    Write-Host "Ver assets em: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Yellow
    return
}

$sizeMB = [math]::Round($asset.size / 1MB, 1)
Write-Host "A descarregar $($asset.name) ($sizeMB MB)..." -ForegroundColor Cyan

# Download
$dlPath = Join-Path $env:TEMP $asset.name
try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $dlPath -UseBasicParsing
}
catch {
    Write-Host "Falha no download: $($_.Exception.Message)" -ForegroundColor Red
    return
}

if ($isInstaller) {
    # Instalador NSIS one-click por-utilizador (nao precisa de admin)
    Write-Host "A iniciar o instalador..." -ForegroundColor Green
    Start-Process -FilePath $dlPath
    return
}

# Fallback: zip portatil
$appDir = Join-Path $env:TEMP "ChibangaRx-$versionLabel"
if (Test-Path $appDir) { Remove-Item -Recurse -Force $appDir }
New-Item -ItemType Directory -Path $appDir -Force | Out-Null

try {
    Expand-Archive -Path $dlPath -DestinationPath $appDir -Force
    Remove-Item -Path $dlPath -Force -ErrorAction SilentlyContinue
}
catch {
    Write-Host "Falha ao extrair o zip: $($_.Exception.Message)" -ForegroundColor Red
    return
}

$exe = Get-ChildItem -Path $appDir -Recurse -Filter "chibangarx.exe" | Select-Object -First 1
if (-not $exe) {
    Write-Host "chibangarx.exe nao encontrado dentro do zip." -ForegroundColor Red
    return
}

Write-Host "A iniciar o ChibangaRx..." -ForegroundColor Green
Start-Process -FilePath $exe.FullName
