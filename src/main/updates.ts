import { app, ipcMain, BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

const CHECK_INTERVAL = 4 * 60 * 60 * 1000 // 4 hours
const INITIAL_CHECK_DELAY = 5000 + Math.floor(Math.random() * 5000) // 5-10 seconds

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

function startPeriodicChecks(): void {
  if (checkTimer) clearInterval(checkTimer)
  checkTimer = setInterval(() => {
    if (updateInfo.newState === "idle" || updateInfo.newState === "error") {
      log.info("[ChibangaRx] Scheduled update check")
      void autoUpdater.checkForUpdates().catch(() => {})
    }
  }, CHECK_INTERVAL)
}

export function initAutoUpdater(): void {
  log.info("[ChibangaRx] Auto-updater initialized, version:", app.getVersion())

  ipcMain.handle("updater:get-version", () => {
    return { ...updateInfo }
  })

  ipcMain.handle("updater:check", async () => {
    if (updateInfo.newState === "checking" || updateInfo.newState === "downloading") {
      log.info("[ChibangaRx] Update check already in progress")
      sendUpdateToRenderer()
      return { ok: true, ...updateInfo }
    }
    resetUpdateInfo()
    updateInfo.newState = "checking"
    sendUpdateToRenderer()
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result?.updateInfo) {
        updateInfo.version = result.updateInfo.version
        updateInfo.releaseNotes = typeof result.updateInfo.releaseNotes === "string" ? result.updateInfo.releaseNotes : ""
        updateInfo.newState = "available"
        sendUpdateToRenderer()
        return { ok: true, found: true, ...updateInfo }
      } else {
        updateInfo.newState = "idle"
        sendUpdateToRenderer()
        return { ok: true, found: false, ...updateInfo }
      }
    } catch (err: any) {
      updateInfo.newState = "error"
      updateInfo.error = err.message
      sendUpdateToRenderer()
      return { ok: false, ...updateInfo }
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

  // Initial check after 5-10 seconds
  setTimeout(() => {
    if (app.isPackaged) {
      log.info("[ChibangaRx] Running initial update check...")
      void autoUpdater.checkForUpdates().catch(() => {})
    }
  }, INITIAL_CHECK_DELAY)

  // Periodic checks every 4 hours
  if (app.isPackaged) {
    startPeriodicChecks()
  }

  // electron-updater events
  autoUpdater.on("checking-for-update", () => {
    log.info("[ChibangaRx] Checking for update...")
    updateInfo.newState = "checking"
    updateInfo.error = null
    sendUpdateToRenderer()
  })

  autoUpdater.on("update-available", (info) => {
    log.info("[ChibangaRx] Update available:", info.version)
    updateInfo.version = info.version
    updateInfo.releaseNotes = typeof info.releaseNotes === "string" ? info.releaseNotes : ""
    updateInfo.newState = "available"
    updateInfo.error = null
    sendUpdateToRenderer()
  })

  autoUpdater.on("update-not-available", () => {
    log.info("[ChibangaRx] Up to date, version:", app.getVersion())
    updateInfo.newState = "idle"
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
    if (errMsg.includes("No published state") || errMsg.includes("404")) {
      log.info("[ChibangaRx] No release found - this is normal for dev/local builds")
      updateInfo.newState = "idle"
    } else {
      updateInfo.newState = "error"
      updateInfo.error = errMsg
    }
    sendUpdateToRenderer()
  })
}
