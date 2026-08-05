param(
    [Parameter(Mandatory=$true)]
    [string]$Version,
    
    [string]$Message = "Release v$Version"
)

$ErrorActionPreference = "Stop"

Write-Host "Deploying ChibangaRx v$Version..." -ForegroundColor Cyan

# Update version in package.json
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

Write-Host "Updated package.json to v$Version" -ForegroundColor Green

# Stage changes
git add package.json

# Commit
git commit -m $Message

# Create tag
git tag -a "v$Version" -m "Release v$Version"

# Push commits and tags
git push origin main
git push origin "v$Version"

Write-Host "Deployed v$Version successfully!" -ForegroundColor Green
Write-Host "GitHub Actions will now build and publish the release." -ForegroundColor Yellow
