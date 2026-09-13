# ChibangaRx Installer Launcher
# Usage: irm https://raw.githubusercontent.com/chibangar/chibangarx/main/get.ps1 | iex

$repo = "chibangar/chibangarx"
$apiUrl = "https://api.github.com/repos/$repo/releases/latest"
$headers = @{
    "User-Agent" = "ChibangaRx-Fetcher"
    "Accept"     = "application/vnd.github.v3+json"
}

Write-Host ""
Write-Host "Como queres instalar o ChibangaRx?" -ForegroundColor Cyan
Write-Host "  [1] Setup      - instalador por-utilizador (recomendado)"
Write-Host "  [2] Portable   - sem instalar, corre direto da pasta"
$choice = ""
try {
    $choice = (Read-Host "Escolhe 1 ou 2 [1]").Trim()
}
catch {
    $choice = ""
}
if ($choice -eq "") { $choice = "1" }

$wantPortable = $choice -eq "2"

Write-Host ""
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

# Assets publicados pelo workflow release.yml:
#   *-Setup.exe      -> instalador NSIS por-utilizador
#   *-portable.exe   -> portable (disponivel desde a v2.45.20)
$setupAsset = $release.assets | Where-Object { $_.name -match "Setup\.exe$" } | Select-Object -First 1
$portableAsset = $release.assets | Where-Object { $_.name -match "portable\.exe$" } | Select-Object -First 1

if ($wantPortable -and (-not $portableAsset)) {
    Write-Host "A release $tag ainda nao tem Portable (disponivel desde a v2.45.20)." -ForegroundColor Yellow
    if ($setupAsset) {
        Write-Host "A usar o Setup em vez disso..." -ForegroundColor Yellow
        $wantPortable = $false
    }
    else {
        Write-Host "Nenhum instalador encontrado. Ver: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Red
        return
    }
}

if ($wantPortable) {
    $asset = $portableAsset
}
else {
    $asset = $setupAsset
    # Fallback para .zip portatil legado caso o Setup nao exista
    if (-not $asset) {
        $asset = $release.assets | Where-Object { $_.name -match "\.zip$" } | Select-Object -First 1
    }
}
if (-not $asset) {
    Write-Host "Nenhum instalador (.exe) ou portatil encontrado na release $tag." -ForegroundColor Red
    Write-Host "Ver assets em: https://github.com/$repo/releases/tag/$tag" -ForegroundColor Yellow
    return
}

$sizeMB = [math]::Round($asset.size / 1MB, 1)
Write-Host "A descarregar $($asset.name) ($sizeMB MB)..." -ForegroundColor Cyan

$isSetup = $asset.name -match "Setup\.exe$"
if ($isSetup) {
    $dlPath = Join-Path $env:TEMP $asset.name
}
else {
    $dlDir = Join-Path $env:USERPROFILE "Downloads"
    if (-not (Test-Path $dlDir)) { $dlDir = $env:TEMP }
    $dlPath = Join-Path $dlDir $asset.name
}

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $asset.browser_download_url -OutFile $dlPath -UseBasicParsing
}
catch {
    Write-Host "Falha no download: $($_.Exception.Message)" -ForegroundColor Red
    return
}

if ($isSetup) {
    # Instalador NSIS one-click por-utilizador (nao precisa de admin)
    Write-Host "A iniciar o instalador..." -ForegroundColor Green
    Start-Process -FilePath $dlPath
    return
}

$isZip = $asset.name -match "\.zip$"
if ($isZip) {
    # Zip portatil legado
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

    Write-Host "A iniciar o ChibangaRx portable..." -ForegroundColor Green
    Start-Process -FilePath $exe.FullName
    return
}

# Portable .exe: corre direto, sem instalar
Write-Host "Portable guardado em: $dlPath" -ForegroundColor Green
Write-Host "A iniciar o ChibangaRx portable..." -ForegroundColor Green
Start-Process -FilePath $dlPath
