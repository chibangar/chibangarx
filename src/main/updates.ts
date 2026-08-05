import { app, ipcMain, BrowserWindow, net } from "electron"
import { autoUpdater, UpdateInfo } from "electron-updater"

const CHECK_INTERVAL = 30 * 1000

type AvailableUpdate = {
  version: string
  releaseNotes: string
}

let availableUpdate: AvailableUpdate | null = null

async function fetchReleaseBody(version: string): Promise<string> {
  return new Promise((resolve) => {
    const url = `https://api.github.com/repos/chibangar/chibangarx/releases/tags/v${version}`
    const request = net.request(url)
    request.setHeader("User-Agent", "ChibangaRx")
    let data = ""
    request.on("response", (response) => {
      response.on("data", (chunk) => { data += chunk.toString() })
      response.on("end", () => {
        try {
          const release = JSON.parse(data)
          resolve(release.body ?? "")
        } catch {
          resolve("")
        }
      })
    })
    request.on("error", () => resolve(""))
    request.end()
  })
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.channel = "latest"

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
  }

  console.log("[ChibangaRx] Auto-updater initialized, current version:", app.getVersion())

  autoUpdater.on("update-available", async (info: UpdateInfo) => {
    console.log("[ChibangaRx] Update available:", info.version)
    const releaseNotes = await fetchReleaseBody(info.version)
    availableUpdate = { version: info.version, releaseNotes }
    const win = getMainWindow()
    win?.webContents.send("updater:available", {
      version: info.version,
      releaseNotes,
    })
  })

  autoUpdater.on("update-not-available", () => {
    console.log("[ChibangaRx] No update available")
    availableUpdate = null
    const win = getMainWindow()
    win?.webContents.send("updater:not-available", { currentVersion: app.getVersion() })
  })

  autoUpdater.on("error", (err: Error) => {
    console.error("[ChibangaRx] Auto-updater error:", err.message)
    const win = getMainWindow()
    win?.webContents.send("updater:error", { message: err.message })
  })

  autoUpdater.on("download-progress", (progress: any) => {
    const win = getMainWindow()
    win?.webContents.send("updater:download-progress", {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    })
  })

  autoUpdater.on("update-downloaded", (info: UpdateInfo) => {
    console.log("[ChibangaRx] Update downloaded:", info.version, "- installing...")
    const win = getMainWindow()
    win?.webContents.send("updater:downloaded", { version: info.version })
    setTimeout(() => {
      autoUpdater.quitAndInstall(false, true)
    }, 2000)
  })

  ipcMain.handle("updater:get-version", () => app.getVersion())
  ipcMain.handle("updater:get-available", () => availableUpdate)

  ipcMain.handle("updater:check", async () => {
    console.log("[ChibangaRx] Manual update check triggered")
    try {
      const result = await autoUpdater.checkForUpdates()
      console.log("[ChibangaRx] Check result:", result?.updateInfo?.version ?? "none")
      return { ok: true, updateInfo: result?.updateInfo ?? null }
    } catch (error: any) {
      console.error("[ChibangaRx] Check failed:", error.message)
      return { ok: false, error: String(error) }
    }
  })

  ipcMain.on("updater:download", async () => {
    console.log("[ChibangaRx] Downloading update...")
    try {
      await autoUpdater.downloadUpdate()
      console.log("[ChibangaRx] Download complete")
    } catch (error: any) {
      console.error("[ChibangaRx] Download failed:", error.message)
      const win = getMainWindow()
      win?.webContents.send("updater:download-error", { error: String(error) })
    }
  })

  ipcMain.handle("updater:install", () => {
    try {
      autoUpdater.quitAndInstall(false, true)
      return { ok: true }
    } catch (error: any) {
      return { ok: false, error: String(error) }
    }
  })

  setTimeout(() => {
    console.log("[ChibangaRx] Running initial update check...")
    triggerAutoUpdateCheck()
  }, 1000)
  setInterval(() => triggerAutoUpdateCheck(), CHECK_INTERVAL)
}

export async function triggerAutoUpdateCheck(): Promise<void> {
  try {
    console.log("[ChibangaRx] Checking for updates...")
    await autoUpdater.checkForUpdates()
  } catch (err) {
    console.error("[ChibangaRx] Auto check failed:", err)
  }
}
