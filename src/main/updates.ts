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

async function checkForUpdatesViaAPI(): Promise<{ version: string; notes: string } | null> {
  return new Promise((resolve) => {
    const url = "https://api.github.com/repos/chibangar/chibangarx/releases/latest"
    const request = net.request(url)
    request.setHeader("User-Agent", "ChibangaRx")
    let data = ""
    request.on("response", (response) => {
      response.on("data", (chunk) => { data += chunk.toString() })
      response.on("end", () => {
        try {
          const release = JSON.parse(data)
          if (release.tag_name) {
            const latestVersion = release.tag_name.replace(/^v/, "")
            resolve({
              version: latestVersion,
              notes: release.body ?? "",
            })
          } else {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      })
    })
    request.on("error", () => resolve(null))
    request.end()
  })
}

function isNewerVersion(current: string, latest: string): boolean {
  const currentParts = current.split(".").map(Number)
  const latestParts = latest.split(".").map(Number)

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const c = currentParts[i] || 0
    const l = latestParts[i] || 0
    if (l > c) return true
    if (l < c) return false
  }
  return false
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.channel = "latest"
  autoUpdater.disableDifferentialDownload = false

  if (!app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
  }

  console.log("[ChibangaRx] Auto-updater initialized, current version:", app.getVersion())
  console.log("[ChibangaRx] Differential download:", !autoUpdater.disableDifferentialDownload)

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
    console.log("[ChibangaRx] Current version:", app.getVersion())
    console.log("[ChibangaRx] isPackaged:", app.isPackaged)

    try {
      const result = await autoUpdater.checkForUpdates()
      console.log("[ChibangaRx] Check result:", result?.updateInfo?.version ?? "none")
      return { ok: true, updateInfo: result?.updateInfo ?? null }
    } catch (error: any) {
      console.error("[ChibangaRx] electron-updater check failed:", error.message)
      console.log("[ChibangaRx] Falling back to GitHub API check...")

      try {
        const latestRelease = await checkForUpdatesViaAPI()
        if (latestRelease) {
          const currentVersion = app.getVersion()
          console.log("[ChibangaRx] Latest release:", latestRelease.version)
          console.log("[ChibangaRx] Current:", currentVersion)

          if (isNewerVersion(currentVersion, latestRelease.version)) {
            console.log("[ChibangaRx] Update available via API:", latestRelease.version)
            availableUpdate = {
              version: latestRelease.version,
              releaseNotes: latestRelease.notes,
            }
            const win = getMainWindow()
            win?.webContents.send("updater:available", {
              version: latestRelease.version,
              releaseNotes: latestRelease.notes,
            })
            return { ok: true, updateInfo: { version: latestRelease.version } }
          } else {
            console.log("[ChibangaRx] App is up to date")
            return { ok: true, updateInfo: null }
          }
        }
        return { ok: false, error: "Could not check for updates" }
      } catch (apiError: any) {
        console.error("[ChibangaRx] API check also failed:", apiError.message)
        return { ok: false, error: String(apiError) }
      }
    }
  })

  ipcMain.on("updater:download", async () => {
    console.log("[ChibangaRx] Downloading update...")
    const win = getMainWindow()
    win?.webContents.send("updater:downloading", {})
    try {
      await autoUpdater.downloadUpdate()
      console.log("[ChibangaRx] Download complete")
    } catch (error: any) {
      console.error("[ChibangaRx] Download failed:", error.message)
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
  } catch (err: any) {
    console.error("[ChibangaRx] Auto check failed:", err.message)
    console.log("[ChibangaRx] Trying API fallback...")
    try {
      const latestRelease = await checkForUpdatesViaAPI()
      if (latestRelease) {
        const currentVersion = app.getVersion()
        if (isNewerVersion(currentVersion, latestRelease.version)) {
          console.log("[ChibangaRx] Update found via API fallback:", latestRelease.version)
        }
      }
    } catch (apiErr) {
      console.error("[ChibangaRx] API fallback also failed:", apiErr)
    }
  }
}
