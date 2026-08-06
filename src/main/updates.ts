import { app, ipcMain, BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

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
let lastCheckedVersion: string | null = null

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

async function performUpdateCheck(): Promise<{ ok: boolean; found: boolean; error?: string }> {
  const currentVersion = app.getVersion()

  if (updateInfo.newState === "checking" || updateInfo.newState === "downloading") {
    log.info("[ChibangaRx] Update check already in progress")
    return { ok: true, found: false }
  }

  resetUpdateInfo()
  updateInfo.newState = "checking"
  sendUpdateToRenderer()

  try {
    const result = await autoUpdater.checkForUpdates()

    if (result?.updateInfo) {
      const remoteVersion = result.updateInfo.version

      if (!isVersionNewer(remoteVersion, currentVersion)) {
        log.info("[ChibangaRx] Already up to date:", currentVersion, "(remote:", remoteVersion, ")")
        updateInfo.newState = "idle"
        updateInfo.error = null
        lastCheckedVersion = remoteVersion
        sendUpdateToRenderer()
        return { ok: true, found: false }
      }

      log.info("[ChibangaRx] Update available:", remoteVersion, "(current:", currentVersion, ")")
      updateInfo.version = remoteVersion
      updateInfo.releaseNotes = typeof result.updateInfo.releaseNotes === "string" ? result.updateInfo.releaseNotes : ""
      updateInfo.newState = "available"
      updateInfo.error = null
      lastCheckedVersion = remoteVersion
      sendUpdateToRenderer()
      return { ok: true, found: true, ...updateInfo }
    } else {
      log.info("[ChibangaRx] No update info returned")
      updateInfo.newState = "idle"
      sendUpdateToRenderer()
      return { ok: true, found: false }
    }
  } catch (err: any) {
    const errMsg = err?.message ?? String(err)

    if (errMsg.includes("No published state") || errMsg.includes("404") || errMsg.includes("net::ERR")) {
      log.info("[ChibangaRx] No release found or network error (normal for dev/local):", errMsg)
      updateInfo.newState = "idle"
      updateInfo.error = null
    } else {
      log.error("[ChibangaRx] Update check error:", errMsg)
      updateInfo.newState = "error"
      updateInfo.error = errMsg
    }
    sendUpdateToRenderer()
    return { ok: false, found: false, error: errMsg }
  }
}

export function initAutoUpdater(): void {
  log.info("[ChibangaRx] Auto-updater initialized, version:", app.getVersion())

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
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (err: any) {
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
    void app.whenReady().then(() => {
      autoUpdater.quitAndInstall(false, true)
    })
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
