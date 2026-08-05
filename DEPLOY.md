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

- **Initial check**: The app automatically checks for updates 5-10 seconds after launching
- **Periodic check**: The app checks for updates every 4 hours automatically
- **Manual check**: Users can manually check via Settings > Check for Updates or via the update manager bell icon
- **Auto-download**: When an update is found, it starts downloading automatically in the background
- **Auto-install on quit**: When the app is closed, the update is applied automatically via `autoInstallOnAppQuit`
- **Manual install**: Users can click "Restart and install" to apply the update immediately
- **Later**: If users click "Later", `autoInstallOnAppQuit` ensures the update installs when they next close the app

### Update States

The auto-update system uses clear states:

| State | Description |
|---|---|
| `idle` | No update process active |
| `checking` | Currently checking for updates |
| `available` | Update found, preparing to download |
| `downloading` | Downloading update with progress info |
| `downloaded` | Download complete, ready to install |
| `installing` | Applying update and restarting |
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
- Builds the app for Windows (NSIS + ZIP)
- Publishes to GitHub Releases
- Users' apps auto-update from these releases

## Auto-Update System

- Uses `electron-updater` with GitHub provider
- Checks GitHub Releases API every 4 hours (plus initial check 5-10s after launch)
- `autoDownload = true` — downloads automatically when an update is available
- `autoInstallOnAppQuit = true` — installs on quit if update was downloaded
- Shows progress percentage, download speed, and bytes transferred
- Users can click "Restart and install" to apply immediately
- Users can click "Later" — update will install when app is closed next
- Only published (non-draft) GitHub releases are used

### Data Persistence

All user data (settings, preferences, tweaks configs) is stored in `app.getPath("userData")`, which is outside the installation directory. Updates never delete or overwrite user data.

## Testing Updates

### Prerequisites

1. A GitHub release must be published (not draft) with the new version tag
2. The `latest.yml` and `.blockmap` files must be uploaded with the release assets

### Test Steps

1. Install an older version of ChibangaRx using the NSIS installer
2. Open the old version
3. Wait 5-10 seconds for the initial update check
4. Observe the update notification appears
5. Watch the download progress in the update manager
6. Click "Restart and install"
7. Verify the app restarts and opens the new version
8. Verify user settings and data are preserved

### Important Notes

- **NSIS installer version**: Full auto-update support including silent install/uninstall
- **ZIP (portable) version**: Auto-update functionality is not guaranteed; NSIS installer is recommended for full update support
- **Dev mode**: Auto-update is disabled in development mode (`app.isPackaged === false`)

## Files Required in GitHub Releases

Each release must include these files:

1. `chibangarx-{version}-setup.exe` — NSIS installer
2. `latest.yml` — Version metadata for electron-updater
3. `chibangarx-{version}-setup.exe.blockmap` — Differential update file
4. `ChibangaRx-{version}-win.zip` — Portable ZIP (optional but recommended)

## Release Checklist

- [ ] Version in `package.json` is incremented (semver)
  - Patch: `2.38.17` → `2.38.18`
  - Minor: `2.38.18` → `2.39.0`
  - Major: `2.39.0` → `3.0.0`
- [ ] All tests pass
- [ ] Typecheck passes
- [ ] Build completes successfully
- [ ] Tag pushed to GitHub (`v{version}`)
- [ ] GitHub Actions release workflow completes
- [ ] Release is published (not draft)
- [ ] `latest.yml` and `.blockmap` files are in release assets
- [ ] NSIS installer is in release assets

## Troubleshooting

### If CI fails
- Check the GitHub Actions logs
- Fix lint/typecheck/test errors
- Push again

### If release fails
- Verify the tag format is `v*` (e.g., `v2.39.0`)
- Check GitHub Actions logs for build errors
- Ensure no draft releases block new releases

### If users don't get updates
- Verify the release was published on GitHub (not draft)
- Check that the `latest.yml` and `.blockmap` files are in release assets
- Verify the version in `package.json` matches the tag
- Users can manually check for updates in Settings
