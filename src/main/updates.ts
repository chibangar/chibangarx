import { app, ipcMain, BrowserWindow } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import path from "path"
import { promises as fs } from "fs"

const CHECK_INTERVAL = 30 * 1000
const STAGING_DIR = path.join(app.getPath("userData"), "update-staging")

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.forceDevUpdateConfig = false

let pendingUpdate: { version: string; releaseNotes: string } | null = null
let isDownloading = false

async function applyUpdate(): Promise<void> {
  if (!pendingUpdate) return

  const appDir = path.dirname(app.getPath("exe"))
  const resourcesDir = path.join(appDir, "resources")

  console.log("[ChibangaRx] Applying update:", pendingUpdate.version)

  try {
    const appAsar = path.join(STAGING_DIR, "resources", "app.asar")
    try {
      await fs.access(appAsar)
    } catch {
      console.log("[ChibangaRx] No staged update found")
      return
    }

    const destAsar = path.join(resourcesDir, "app.asar")
    await fs.copyFile(appAsar, destAsar)

    const stagedResources = path.join(STAGING_DIR, "resources")
    try {
      const entries = await fs.readdir(stagedResources, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.name === "app.asar") continue
        const srcPath = path.join(stagedResources, entry.name)
        const destPath = path.join(resourcesDir, entry.name)
        if (entry.isDirectory()) {
          try { await fs.cp(srcPath, destPath, { recursive: true }) } catch {}
        } else {
          try { await fs.copyFile(srcPath, destPath) } catch {}
        }
      }
    } catch {}

    await fs.rm(STAGING_DIR, { recursive: true, force: true }).catch(() => {})
    console.log("[ChibangaRx] Update applied successfully")
    pendingUpdate = null
  } catch (err: any) {
    console.error("[ChibangaRx] Failed to apply update:", err.message)
  }
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  console.log("[ChibangaRx] Auto-updater initialized (silent background mode), version:", app.getVersion())

  ipcMain.handle("updater:get-version", () => app.getVersion())
  ipcMain.handle("updater:get-available", () => pendingUpdate)

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
    if (isDownloading) return
    console.log("[ChibangaRx] User accepted update, starting background download")
    autoUpdater.downloadUpdate()
  })

  ipcMain.handle("updater:install", () => {
    // No-op: update is applied silently on quit
    return { ok: true }
  })

  // electron-updater events
  autoUpdater.on("checking-for-update", () => {
    console.log("[ChibangaRx] Checking for update...")
  })

  autoUpdater.on("update-available", (info) => {
    console.log("[ChibangaRx] Update available:", info.version)
    const notes = typeof info.releaseNotes === "string" ? info.releaseNotes : ""
    pendingUpdate = { version: info.version, releaseNotes: notes }
    const win = getMainWindow()
    win?.webContents.send("updater:available", {
      version: info.version,
      releaseNotes: notes,
    })
    // Auto-start background download
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
    console.log("[ChibangaRx] Update downloaded, will apply on next quit")
    isDownloading = false
    const win = getMainWindow()
    win?.webContents.send("updater:downloaded", { version: pendingUpdate?.version ?? "" })
  })

  autoUpdater.on("error", (err) => {
    console.error("[ChibangaRx] Auto-updater error:", err.message)
    isDownloading = false
    const win = getMainWindow()
    win?.webContents.send("updater:error", { message: err.message })
  })

  // Apply pending update on quit
  app.on("will-quit", () => {
    if (pendingUpdate) {
      // Run synchronously before quit
      applyUpdate()
    }
  })

  // Check every 30s
  setTimeout(() => {
    console.log("[ChibangaRx] Running initial update check...")
    autoUpdater.checkForUpdates().catch(() => {})
  }, 5000)
  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, CHECK_INTERVAL)
}
