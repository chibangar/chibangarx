import { app, ipcMain, BrowserWindow, net, shell } from "electron"
import { autoUpdater } from "electron-updater"
import log from "electron-log"
import { join } from "path"
import { createWriteStream } from "fs"
import { execFile } from "child_process"

autoUpdater.logger = log
;(autoUpdater.logger as any).transports.file.level = "info"

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

// Use GitHub's CDN-backed release assets directly. The built-in GitHub provider
// queries the rate-limited REST API before reading latest.yml, which can return
// 403 for otherwise healthy public releases.
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://github.com/chibangar/chibangarx/releases/latest/download",
})

// Force dev mode to use dev-app-update.yml
if (!app.isPackaged) {
  autoUpdater.forceDevUpdateConfig = true
}

const CHECK_INTERVAL = 4 * 60 * 60 * 1000 // 4 hours
const INITIAL_CHECK_DELAY = 10_000 // 10 seconds after launch

type UpdateState =
  "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "error"

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

interface ReleaseHistoryEntry {
  tagName: string
  name: string
  body: string
  publishedAt: string
  url: string
  prerelease: boolean
}

let historyCache: { data: ReleaseHistoryEntry[]; expiresAt: number } | null = null
let githubApiBackoffUntil = 0

const UPDATE_ERROR_TEMPORARY = "updateTemporarilyUnavailable"
const UPDATE_ERROR_GENERIC = "updateCheckFailed"

function friendlyUpdateError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  return /403|429|rate limit|ERR_INTERNET_DISCONNECTED|ENOTFOUND|network/i.test(message)
    ? UPDATE_ERROR_TEMPORARY
    : UPDATE_ERROR_GENERIC
}

async function fetchGitHubJson(url: string): Promise<any> {
  if (Date.now() < githubApiBackoffUntil) throw new Error(UPDATE_ERROR_TEMPORARY)
  const response = await fetch(url)
  if (response.status === 403 || response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after")) || 15 * 60
    githubApiBackoffUntil = Date.now() + retryAfter * 1000
    throw new Error(UPDATE_ERROR_TEMPORARY)
  }
  if (!response.ok) throw new Error(UPDATE_ERROR_GENERIC)
  return response.json()
}

function hasInstallerAsset(release: any): boolean {
  return !!release?.assets?.some(
    (a: any) =>
      typeof a.name === "string" &&
      a.name.toLowerCase().endsWith(".exe") &&
      a.name.toLowerCase().includes("setup"),
  )
}

async function fetchLatestReleaseWithInstaller(): Promise<any> {
  const latest = await fetchGitHubJson(
    "https://api.github.com/repos/chibangar/chibangarx/releases/latest",
  )
  if (hasInstallerAsset(latest)) return latest

  const releases = await fetchGitHubJson(
    "https://api.github.com/repos/chibangar/chibangarx/releases?per_page=10",
  )
  const release = releases.find(hasInstallerAsset)
  if (!release) throw new Error(UPDATE_ERROR_GENERIC)
  return release
}

async function fetchReleaseHistory(): Promise<ReleaseHistoryEntry[]> {
  if (historyCache && Date.now() < historyCache.expiresAt) {
    return historyCache.data
  }

  const releases = await fetchGitHubJson(
    "https://api.github.com/repos/chibangar/chibangarx/releases?per_page=10",
  )
  const data: ReleaseHistoryEntry[] = releases.map((r: any) => ({
    tagName: r.tag_name,
    name: r.name,
    body: r.body || "",
    publishedAt: r.published_at,
    url: r.html_url,
    prerelease: !!r.prerelease,
  }))

  historyCache = { data, expiresAt: Date.now() + 5 * 60 * 1000 }
  return data
}

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

async function performUpdateCheck(): Promise<{
  ok: boolean
  found: boolean
  error?: string | null
  version?: string
  releaseNotes?: string
  currentVersion?: string
  newState?: UpdateState
  percent?: number
  downloadedBytes?: number
  totalBytes?: number
  downloadSpeed?: number
}> {
  const currentVersion = app.getVersion()

  if (updateInfo.newState === "checking" || updateInfo.newState === "downloading") {
    log.info("[ChibangaRx] Update check already in progress")
    return { ok: true, found: false }
  }

  resetUpdateInfo()
  updateInfo.newState = "checking"
  sendUpdateToRenderer()

  // Read latest.yml directly through electron-updater. This endpoint is CDN-backed
  // and does not consume the unauthenticated GitHub REST API quota.
  try {
    log.info("[ChibangaRx] Checking release metadata. Current version:", currentVersion)
    const result = await autoUpdater.checkForUpdates()

    if (result?.updateInfo) {
      const remoteVersion = result.updateInfo.version

      if (isVersionNewer(remoteVersion, currentVersion)) {
        log.info("[ChibangaRx] electron-updater: update found:", remoteVersion)
        updateInfo.version = remoteVersion
        updateInfo.releaseNotes =
          typeof result.updateInfo.releaseNotes === "string" ? result.updateInfo.releaseNotes : ""
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
    const errMsg = friendlyUpdateError(err)
    log.error("[ChibangaRx] Update metadata check failed:", err)

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

  ipcMain.handle("updater:history", async () => {
    try {
      return await fetchReleaseHistory()
    } catch (err: any) {
      log.error("[ChibangaRx] Failed to fetch release history:", err.message)
      throw err
    }
  })

  ipcMain.handle("updater:latest-assets", async () => {
    try {
      const release = await fetchLatestReleaseWithInstaller()
      const assets = (release.assets || [])
        .filter((a: any) => a.name?.endsWith(".exe") || a.name?.endsWith(".zip"))
        .map((a: any) => ({
          name: a.name,
          url: a.browser_download_url,
          size: a.size || 0,
        }))
      return {
        version: release.tag_name?.replace("v", ""),
        tagName: release.tag_name,
        assets,
      }
    } catch (err: any) {
      log.error("[ChibangaRx] Failed to fetch latest release assets:", err.message)
      throw err
    }
  })

  ipcMain.handle(
    "updater:download-asset",
    async (
      _event: Electron.IpcMainInvokeEvent,
      options: { url: string; name: string },
    ): Promise<{ ok: boolean; path: string }> => {
      const { url, name } = options || {}
      if (!url || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/releases\/download\//.test(url)) {
        throw new Error("Invalid download URL")
      }

      const downloadsDir = app.getPath("downloads")
      const filePath = join(downloadsDir, name)
      const response = await net.fetch(url)
      if (!response.ok) throw new Error(`Download failed: ${response.status}`)

      const contentLength = Number(response.headers.get("content-length")) || 0
      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const writer = createWriteStream(filePath)
      let downloaded = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        downloaded += value.length
        writer.write(Buffer.from(value))
        const win = getMainWindow()
        win?.webContents.send("updater:asset-progress", {
          name,
          percent: contentLength > 0 ? Math.round((downloaded / contentLength) * 100) : 0,
          downloaded,
          total: contentLength,
        })
      }

      await new Promise<void>((resolve, reject) => {
        writer.end((err) => (err ? reject(err) : resolve()))
      })

      log.info("[ChibangaRx] Asset downloaded:", filePath)
      return { ok: true, path: filePath }
    },
  )

  ipcMain.handle("updater:open-downloads", () => {
    shell.openPath(app.getPath("downloads"))
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
      log.error("[ChibangaRx] Download failed:", err)
      updateInfo.newState = "error"
      updateInfo.error = friendlyUpdateError(err)
      sendUpdateToRenderer()
      return { ok: false, error: updateInfo.error }
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
    const rawMessage = err?.message ?? String(err)
    const errMsg = friendlyUpdateError(err)
    log.error("[ChibangaRx] Auto-updater error:", rawMessage)

    if (rawMessage.includes("No published state") || rawMessage.includes("404")) {
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
