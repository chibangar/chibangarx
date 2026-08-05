# Deploy Guide

## How to Release a New Version

### Option 1: Using the Deploy Script (Recommended)

1. Run the deploy script with the new version:
   ```powershell
   .\scripts\deploy.ps1 -Version "2.39.0"
   ```

2. The script will:
   - Update `package.json` with the new version
   - Create a commit
   - Create a git tag
   - Push to GitHub
   - Trigger GitHub Actions to build and publish the release

### Option 2: Manual Release

1. Update the version in `package.json`
2. Commit changes:
   ```bash
   git add package.json
   git commit -m "Release v2.39.0"
   ```
3. Create a tag:
   ```bash
   git tag -a v2.39.0 -m "Release v2.39.0"
   ```
4. Push:
   ```bash
   git push origin main
   git push origin v2.39.0
   ```

## How Updates Work

### For Users

- The app checks for updates every 30 seconds
- When an update is available, a notification appears in the app
- Users can download and install updates directly from the app
- Updates are downloaded from GitHub Releases

### For Developers

1. Push code to the `main` branch
2. CI runs automatically (lint, typecheck, tests)
3. When ready to release, use the deploy script
4. GitHub Actions builds and publishes the release
5. Users receive the update automatically

## GitHub Actions Workflows

### CI (`ci.yml`)
- Runs on push to `main` and pull requests
- Runs lint, typecheck, tests, and build
- Ensures code quality before merge

### Release (`release.yml`)
- Triggers on tag push (`v*`)
- Builds the app for Windows (NSIS + ZIP)
- Publishes to GitHub Releases
- Users' apps auto-update from these releases

## Auto-Update System

- Uses `electron-updater` with GitHub provider
- Checks GitHub Releases API every 30 seconds
- Downloads and installs updates automatically
- Shows progress and notifications in the app

## Troubleshooting

### If CI fails
- Check the GitHub Actions logs
- Fix lint/typecheck/test errors
- Push again

### If release fails
- Check if `GH_TOKEN` secret is set in GitHub repository settings
- Verify the tag format is `v*` (e.g., `v2.39.0`)
- Check GitHub Actions logs for build errors

### If users don't get updates
- Verify the release was published on GitHub
- Check that the version in `package.json` matches the tag
- Users can manually check for updates in Settings
