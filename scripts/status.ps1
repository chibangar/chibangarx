Write-Host "ChibangaRx Repository Status" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

# Git status
Write-Host "`nGit Status:" -ForegroundColor Yellow
git status

# Git log
Write-Host "`nRecent Commits:" -ForegroundColor Yellow
git log --oneline -10

# Remote
Write-Host "`nRemote:" -ForegroundColor Yellow
git remote -v

# Current version
Write-Host "`nCurrent Version:" -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
Write-Host "v$($packageJson.version)"

# Check if there are unpushed commits
Write-Host "`nUnpushed Commits:" -ForegroundColor Yellow
$unpushed = git log origin/main..HEAD --oneline
if ($unpushed) {
    Write-Host $unpushed
} else {
    Write-Host "None"
}

# Check if there are untagged versions
Write-Host "`nLatest Tag:" -ForegroundColor Yellow
$latestTag = git describe --tags --abbrev=0 2>$null
if ($latestTag) {
    Write-Host $latestTag
} else {
    Write-Host "No tags found"
}
