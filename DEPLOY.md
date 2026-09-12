# Deploy Guide

## How to Release a New Version

### Option 1: Using the Deploy Script (Recommended)

1. Run the deploy script with the new version:
   ```powershell
   .\scripts\deploy.ps1 -Version "2.40.0"
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
   git commit -m "Release v2.40.0"
   ```
3. Create a tag:
   ```bash
   git tag -a v2.40.0 -m "Release v2.40.0"
   ```
4. Push:
   ```bash
   git push origin main
   git push origin v2.40.0
   ```

## How Updates Work

### For Users

- **Initial check**: The app automatically checks for updates 30 seconds after launching
- **Periodic check**: The app checks for updates every 4 hours automatically
- **Manual check**: Users can manually check via the update manager bell icon
- **No auto-download**: Updates only download when user clicks "Download update"
- **In-place update**: Updates extract directly over the current installation — no reinstall, no installer UI
- **No data loss**: User settings and data are stored in `app.getPath("userData")` which is never touched by updates

### Update Flow

1. App checks GitHub Releases for newer version
2. If found, shows "Update available" with version info and release notes
3. User clicks "Download update" → downloads zip file
4. Progress bar shows download speed and bytes
5. When done, user clicks "Restart and install"
6. App extracts zip in-place and restarts — no installer, no reinstall

### Update States

| State | Description |
|---|---|
| `idle` | No update process active |
| `checking` | Currently checking for updates |
| `available` | Update found, waiting for user to download |
| `downloading` | Downloading update with progress info |
| `downloaded` | Download complete, ready to install |
| `installing` | Extracting and restarting |
| `error` | Update check or download failed |

### For Developers

1. Push code to the `main` branch
2. CI runs automatically (lint, typecheck, tests)
3. When ready to release, use the deploy script or manual release steps above
4. GitHub Actions builds and publishes the release
5. Users receive the update automatically

## GitHub Actions Workflows

### CI (`ci.yml`)
- Runs on push to `main` and pull requests
- Runs lint, typecheck, tests, and build
- Ensures code quality before merge

### Release (`release.yml`)
- Triggers on tag push (`v*`)
- Builds the app for Windows (ZIP only)
- Publishes to GitHub Releases
- Users' apps auto-update from these releases

## Auto-Update System

- Uses `electron-updater` with GitHub provider
- Checks GitHub Releases API every 4 hours (plus initial check 30s after launch)
- `autoDownload = false` — user must click "Download update"
- `autoInstallOnAppQuit = false` — no silent installs
- In-place ZIP extraction — no NSIS installer, no reinstall
- Shows progress percentage, download speed, and bytes transferred
- Users can click "Restart and install" to apply immediately
- Only published (non-draft) GitHub releases are used

### Data Persistence

All user data (settings, preferences, tweaks configs) is stored in `app.getPath("userData")`, which is outside the installation directory. Updates never delete or overwrite user data.

## Testing Updates

### Prerequisites

1. A GitHub release must be published (not draft) with the new version tag
2. The `latest.yml` file must be uploaded with the release assets

### Test Steps

1. Install an older version of ChibangaRx
2. Open the old version
3. Wait 30 seconds for the initial update check
4. Observe the update notification appears
5. Click "Download update" and watch the progress
6. Click "Restart and install"
7. Verify the app restarts and opens the new version
8. Verify user settings and data are preserved

### Important Notes

- **ZIP updates**: In-place extraction, no installer UI, no reinstall
- **Dev mode**: Auto-update is disabled in development mode (`app.isPackaged === false`)
- **Version comparison**: Only shows update if remote version is strictly newer than current

## Files Required in GitHub Releases

Each release must include these files:

1. `ChibangaRx-{version}-win.zip` — Portable ZIP (main update file)
2. `latest.yml` — Version metadata for electron-updater

## Release Checklist

- [ ] Version in `package.json` is incremented (semver)
  - Patch: `2.39.6` → `2.39.7`
  - Minor: `2.39.6` → `2.40.0`
  - Major: `2.40.0` → `3.0.0`
- [ ] All tests pass
- [ ] Typecheck passes
- [ ] Build completes successfully
- [ ] Tag pushed to GitHub (`v{version}`)
- [ ] GitHub Actions release workflow completes
- [ ] Release is published (not draft)
- [ ] `latest.yml` file is in release assets

## Troubleshooting

### If CI fails
- Check the GitHub Actions logs
- Fix lint/typecheck/test errors
- Push again

### If release fails
- Verify the tag format is `v*` (e.g., `v2.40.0`)
- Check GitHub Actions logs for build errors
- Ensure no draft releases block new releases

### If users don't get updates
- Verify the release was published on GitHub (not draft)
- Check that the `latest.yml` file is in release assets
- Verify the version in `package.json` matches the tag
- Users can manually check for updates via the bell icon
