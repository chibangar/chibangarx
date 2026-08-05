import { app, ipcMain, BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"

const CHECK_INTERVAL = 30 * 1000

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.forceDevUpdateConfig = false

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  console.log("[ChibangaRx] Auto-updater initialized (electron-updater differential), version:", app.getVersion())

  ipcMain.handle("updater:get-version", () => app.getVersion())

  ipcMain.handle("updater:check", async () => {
    console.log("[ChibangaRx] Manual update check")
    try {
      const result = await autoUpdater.checkForUpdates()
      if (result?.updateInfo) {
        const win = getMainWindow()
        win?.webContents.send("updater:available", {
          version: result.updateInfo.version,
          releaseNotes: result.updateInfo.releaseNotes ?? "",
        })
      } else {
        const win = getMainWindow()
        win?.webContents.send("updater:not-available", { currentVersion: app.getVersion() })
      }
    } catch (err: any) {
      console.error("[ChibangaRx] Update check failed:", err.message)
    }
    return { ok: true }
  })

  ipcMain.handle("updater:check-silent", async () => {
    try {
      await autoUpdater.checkForUpdates()
    } catch {}
    return { ok: true }
  })

  ipcMain.on("updater:download", () => {
    console.log("[ChibangaRx] Starting differential update download")
    autoUpdater.downloadUpdate()
  })

  ipcMain.handle("updater:install", () => {
    console.log("[ChibangaRx] Installing update (quitAndInstall)")
    autoUpdater.quitAndInstall(false, true)
    return { ok: true }
  })

  // Events from electron-updater → renderer
  autoUpdater.on("checking-for-update", () => {
    console.log("[ChibangaRx] Checking for update...")
  })

  autoUpdater.on("update-available", (info) => {
    console.log("[ChibangaRx] Update available:", info.version)
    const win = getMainWindow()
    win?.webContents.send("updater:available", {
      version: info.version,
      releaseNotes: info.releaseNotes ?? "",
    })
    // Auto-start download
    autoUpdater.downloadUpdate()
  })

  autoUpdater.on("update-not-available", () => {
    console.log("[ChibangaRx] Up to date")
    const win = getMainWindow()
    win?.webContents.send("updater:not-available", { currentVersion: app.getVersion() })
  })

  autoUpdater.on("download-progress", (progress) => {
    const win = getMainWindow()
    win?.webContents.send("updater:download-progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on("update-downloaded", () => {
    console.log("[ChibangaRx] Update downloaded, ready to restart")
    const win = getMainWindow()
    win?.webContents.send("updater:downloaded", { version: app.getVersion() })
  })

  autoUpdater.on("error", (err) => {
    console.error("[ChibangaRx] Auto-updater error:", err.message)
    const win = getMainWindow()
    win?.webContents.send("updater:error", { message: err.message })
  })

  // Initial check after 5s, then every 30s
  setTimeout(() => {
    console.log("[ChibangaRx] Running initial update check...")
    autoUpdater.checkForUpdates().catch(() => {})
  }, 5000)
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, CHECK_INTERVAL)
}
