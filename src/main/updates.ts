import { app, ipcMain, BrowserWindow, net } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import { join } from "path"
import { createWriteStream } from "fs"
import { execFile } from "child_process"

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Force dev mode to use dev-app-update.yml
if (!app.isPackaged) {
  autoUpdater.forceDevUpdateConfig = true
}

const CHECK_INTERVAL = 4 * 60 * 60 * 1000 // 4 hours
const INITIAL_CHECK_DELAY = 10_000 // 10 seconds after launch

type UpdateState = "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "error"

interface UpdateInfo {
  version: string
  releaseNotes: string
  currentVersion: string
  newState: UpdateState
  percent: number
  downloadedBytes: number
  totalBytes: number
  downloadSpeed: number
  error: string | null
}

let updateInfo: UpdateInfo = {
  version: "",
  releaseNotes: "",
  currentVersion: app.getVersion(),
  newState: "idle",
  percent: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadSpeed: 0,
  error: null,
}

let checkTimer: NodeJS.Timeout | null = null

function sendUpdateToRenderer(): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed()) {
    win.webContents.send("updater:state", { ...updateInfo })
  }
}

function getMainWindow(): BrowserWindow | null {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
}

function resetUpdateInfo(): void {
  updateInfo = {
    version: "",
    releaseNotes: "",
    currentVersion: app.getVersion(),
    newState: "idle",
    percent: 0,
    downloadedBytes: 0,
    totalBytes: 0,
    downloadSpeed: 0,
    error: null,
  }
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
}

function filterRelevantUpdates(updates: any[]): any[] {
  if (!Array.isArray(updates)) return []

  const currentVersion = app.getVersion()
  const currentVersionNum = currentVersion.split(".").map(Number)

  return updates
    .filter(update => {
      if (!update.version) return false

      const updateVersionNum = update.version.split(".").map(Number)

      for (let i = 0; i < Math.max(currentVersionNum.length, updateVersionNum.length); i++) {
        const c = currentVersionNum[i] || 0
        const u = updateVersionNum[i] || 0

        if (u > c) return true
        if (u < c) return false
      }
      return false
    })
    .sort((a, b) => {
      const versionA = a.version.split(".").map(Number)
      const versionB = b.version.split(".").map(Number)

      for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
        const va = versionA[i] || 0
        const vb = versionB[i] || 0

        if (va !== vb) return vb - va
      }
      return 0
    })
    .slice(0, 5)
}

function isVersionNewer(remote: string, local: string): boolean {
  return compareVersions(remote, local) > 0
}

function startPeriodicChecks(): void {
  if (checkTimer) clearInterval(checkTimer)
  checkTimer = setInterval(() => {
    if (updateInfo.newState === "idle" || updateInfo.newState === "error") {
      log.info("[ChibangaRx] Scheduled update check")
      void performUpdateCheck()
    }
  }, CHECK_INTERVAL)
}

async function performUpdateCheck(): Promise<{ ok: boolean; found: boolean; error?: string | null; version?: string; releaseNotes?: string; currentVersion?: string; newState?: UpdateState; percent?: number; downloadedBytes?: number; totalBytes?: number; downloadSpeed?: number }> {
  const currentVersion = app.getVersion()

  if (updateInfo.newState === "checking" || updateInfo.newState === "downloading") {
    log.info("[ChibangaRx] Update check already in progress")
    return { ok: true, found: false }
  }

  resetUpdateInfo()
  updateInfo.newState = "checking"
  sendUpdateToRenderer()

  // Always use GitHub API directly for reliable version check
  try {
    log.info("[ChibangaRx] Checking GitHub releases for update... Current version:", currentVersion)
    const response = await fetch("https://api.github.com/repos/chibangar/chibangarx/releases?per_page=10")
    if (response.ok) {
      const releases = await response.json()
      const relevantReleases = filterRelevantUpdates(releases)

      if (relevantReleases.length > 0) {
        const latestRelease = relevantReleases[0]
        const remoteVersion = latestRelease.tag_name?.replace("v", "")

        log.info("[ChibangaRx] GitHub relevant releases:", relevantReleases.map(r => r.tag_name))
        log.info("[ChibangaRx] Latest relevant release:", remoteVersion)

        if (remoteVersion && isVersionNewer(remoteVersion, currentVersion)) {
          log.info("[ChibangaRx] UPDATE AVAILABLE:", currentVersion, "->", remoteVersion)
          updateInfo.version = remoteVersion
          updateInfo.releaseNotes = latestRelease.body || ""
          updateInfo.newState = "available"
          updateInfo.error = null
          sendUpdateToRenderer()
          return { ok: true, found: true, ...updateInfo }
        }
      }

      log.info("[ChibangaRx] Already up to date:", currentVersion)
      updateInfo.newState = "idle"
      updateInfo.error = null
      sendUpdateToRenderer()
      return { ok: true, found: false }
    }
  } catch (err: any) {
    log.error("[ChibangaRx] GitHub API check failed:", err.message)
  }

  // Fallback to electron-updater
  try {
    log.info("[ChibangaRx] Trying electron-updater fallback...")
    const result = await autoUpdater.checkForUpdates()

    if (result?.updateInfo) {
      const remoteVersion = result.updateInfo.version

      if (isVersionNewer(remoteVersion, currentVersion)) {
        log.info("[ChibangaRx] electron-updater: update found:", remoteVersion)
        updateInfo.version = remoteVersion
        updateInfo.releaseNotes = typeof result.updateInfo.releaseNotes === "string" ? result.updateInfo.releaseNotes : ""
        updateInfo.newState = "available"
        updateInfo.error = null
        sendUpdateToRenderer()
        return { ok: true, found: true, ...updateInfo }
      }
    }

    log.info("[ChibangaRx] electron-updater: no update found")
    updateInfo.newState = "idle"
    updateInfo.error = null
    sendUpdateToRenderer()
    return { ok: true, found: false }
  } catch (err: any) {
    const errMsg = err?.message ?? String(err)
    log.error("[ChibangaRx] electron-updater error:", errMsg)

    updateInfo.newState = "error"
    updateInfo.error = errMsg
    sendUpdateToRenderer()
    return { ok: false, found: false, error: errMsg }
  }
}

export function initAutoUpdater(): void {
  log.info("[ChibangaRx] Auto-updater initialized, version:", app.getVersion())
  log.info("[ChibangaRx] Packaged:", app.isPackaged)

  ipcMain.handle("updater:get-version", () => {
    return { ...updateInfo }
  })

  ipcMain.handle("updater:check", async () => {
    return await performUpdateCheck()
  })

  ipcMain.handle("updater:download", async () => {
    if (updateInfo.newState === "downloading") {
      return { ok: true }
    }
    if (updateInfo.newState !== "available" && updateInfo.newState !== "error") {
      log.info("[ChibangaRx] No update available to download")
      return { ok: false, error: "No update available" }
    }
    log.info("[ChibangaRx] User requested download update")
    updateInfo.newState = "downloading"
    updateInfo.error = null
    sendUpdateToRenderer()

    try {
      // Fetch release info from GitHub API
      const response = await fetch("https://api.github.com/repos/chibangar/chibangarx/releases/latest")
      if (!response.ok) throw new Error(`GitHub API returned ${response.status}`)

      const release = await response.json()
      // Find the NSIS installer asset
      const asset = release.assets?.find((a: any) =>
        a.name?.endsWith(".exe") && a.name?.includes("Setup")
      )
      if (!asset) throw new Error("No installer found in release assets")

      const downloadUrl = asset.browser_download_url
      log.info("[ChibangaRx] Downloading from:", downloadUrl)

      // Use Electron's net.fetch to download (bypasses CORS/auth issues)
      const downloadResponse = await net.fetch(downloadUrl)
      if (!downloadResponse.ok) throw new Error(`Download failed: ${downloadResponse.status}`)

      const contentLength = Number(downloadResponse.headers.get("content-length")) || 0
      updateInfo.totalBytes = contentLength

      const tempDir = app.getPath("temp")
      const installerPath = join(tempDir, asset.name)

      // Download with progress tracking
      const body = downloadResponse.body
      if (!body) throw new Error("No response body")

      const reader = body.getReader()
      const writer = createWriteStream(installerPath)
      let downloaded = 0
      const startTime = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        downloaded += value.length
        writer.write(Buffer.from(value))

        updateInfo.downloadedBytes = downloaded
        updateInfo.percent = contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0
        const elapsed = (Date.now() - startTime) / 1000
        updateInfo.downloadSpeed = elapsed > 0 ? downloaded / elapsed : 0
        sendUpdateToRenderer()
      }

      writer.end()
      log.info("[ChibangaRx] Download complete:", installerPath)

      updateInfo.newState = "downloaded"
      updateInfo.percent = 100
      sendUpdateToRenderer()

      // Store the installer path for installation
      ;(updateInfo as any).installerPath = installerPath
      return { ok: true }
    } catch (err: any) {
      log.error("[ChibangaRx] Download failed:", err.message)
      updateInfo.newState = "error"
      updateInfo.error = err.message
      sendUpdateToRenderer()
      return { ok: false, error: err.message }
    }
  })

  ipcMain.handle("updater:install", () => {
    log.info("[ChibangaRx] User requested to install update")
    updateInfo.newState = "installing"
    sendUpdateToRenderer()

    const installerPath = (updateInfo as any).installerPath
    if (installerPath) {
      log.info("[ChibangaRx] Running installer:", installerPath)
      // Run the NSIS installer silently, then quit
      execFile(installerPath, ["/S"], () => {
        app.quit()
      })
    } else {
      // Fallback to electron-updater
      autoUpdater.quitAndInstall(false, true)
    }
    return { ok: true }
  })

  // Initial check after 10 seconds
  setTimeout(() => {
    log.info("[ChibangaRx] Running initial update check...")
    void performUpdateCheck()
  }, INITIAL_CHECK_DELAY)

  // Periodic checks every 4 hours
  startPeriodicChecks()

  // electron-updater events
  autoUpdater.on("checking-for-update", () => {
    log.info("[ChibangaRx] Checking for update...")
    updateInfo.newState = "checking"
    updateInfo.error = null
    sendUpdateToRenderer()
  })

  autoUpdater.on("update-available", (info) => {
    const currentVersion = app.getVersion()
    const remoteVersion = info.version

    if (!isVersionNewer(remoteVersion, currentVersion)) {
      log.info("[ChibangaRx] Auto event: already up to date:", remoteVersion)
      updateInfo.newState = "idle"
      sendUpdateToRenderer()
      return
    }

    log.info("[ChibangaRx] Auto event: update available:", remoteVersion)
    updateInfo.version = remoteVersion
    updateInfo.releaseNotes = typeof info.releaseNotes === "string" ? info.releaseNotes : ""
    updateInfo.newState = "available"
    updateInfo.error = null
    sendUpdateToRenderer()
  })

  autoUpdater.on("update-not-available", () => {
    log.info("[ChibangaRx] Up to date, version:", app.getVersion())
    updateInfo.newState = "idle"
    updateInfo.error = null
    sendUpdateToRenderer()
  })

  autoUpdater.on("download-progress", (progress: any) => {
    updateInfo.percent = Math.round(progress.percent)
    updateInfo.downloadedBytes = progress.downloaded || 0
    updateInfo.totalBytes = progress.total || 0
    updateInfo.downloadSpeed = progress.downloadSpeed || 0
    updateInfo.newState = "downloading"
    sendUpdateToRenderer()
  })

  autoUpdater.on("update-downloaded", (info) => {
    log.info("[ChibangaRx] Update downloaded, ready to install:", info.version)
    updateInfo.version = info.version
    updateInfo.releaseNotes = typeof info.releaseNotes === "string" ? info.releaseNotes : ""
    updateInfo.newState = "downloaded"
    updateInfo.percent = 100
    sendUpdateToRenderer()
  })

  autoUpdater.on("error", (err) => {
    const errMsg = err?.message ?? String(err)
    log.error("[ChibangaRx] Auto-updater error:", errMsg)

    if (errMsg.includes("No published state") || errMsg.includes("404") || errMsg.includes("net::ERR")) {
      log.info("[ChibangaRx] No release found or network error (normal for dev/local builds)")
      updateInfo.newState = "idle"
      updateInfo.error = null
    } else {
      updateInfo.newState = "error"
      updateInfo.error = errMsg
    }
    sendUpdateToRenderer()
  })
}
