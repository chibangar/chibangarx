param(
    [switch]$SkipTests
)

$ErrorActionPreference = "Stop"

Write-Host "Building ChibangaRx..." -ForegroundColor Cyan

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pnpm install

# Run lint
if (-not $SkipTests) {
    Write-Host "Running lint..." -ForegroundColor Yellow
    pnpm lint
    if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
}

# Run typecheck
if (-not $SkipTests) {
    Write-Host "Running typecheck..." -ForegroundColor Yellow
    pnpm typecheck
    if ($LASTEXITCODE -ne 0) { throw "Typecheck failed" }
}

# Run tests
if (-not $SkipTests) {
    Write-Host "Running tests..." -ForegroundColor Yellow
    pnpm test
    if ($LASTEXITCODE -ne 0) { throw "Tests failed" }
}

# Build Vite
Write-Host "Building Vite..." -ForegroundColor Yellow
pnpm build:vite
if ($LASTEXITCODE -ne 0) { throw "Vite build failed" }

Write-Host "Build completed successfully!" -ForegroundColor Green
