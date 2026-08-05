import { app, ipcMain, BrowserWindow, net, shell } from "electron"
import path from "path"
import { promises as fs } from "fs"

const CHECK_INTERVAL = 30 * 1000

type AvailableUpdate = {
  version: string
  releaseNotes: string
  downloadUrl: string
}

let availableUpdate: AvailableUpdate | null = null
let isDownloading = false

function githubApiRequest(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    request.setHeader("User-Agent", "ChibangaRx")
    let data = ""
    request.on("response", (response) => {
      response.on("data", (chunk) => { data += chunk.toString() })
      response.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error("Failed to parse GitHub API response"))
        }
      })
    })
    request.on("error", (err) => reject(err))
    request.end()
  })
}

function isNewerVersion(current: string, latest: string): boolean {
  const c = current.split(".").map(Number)
  const l = latest.split(".").map(Number)
  for (let i = 0; i < Math.max(c.length, l.length); i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true
    if ((l[i] || 0) < (c[i] || 0)) return false
  }
  return false
}

async function fetchLatestRelease(): Promise<{ version: string; releaseNotes: string; downloadUrl: string } | null> {
  try {
    const release = await githubApiRequest("https://api.github.com/repos/chibangar/chibangarx/releases/latest")
    if (!release.tag_name) return null
    const version = release.tag_name.replace(/^v/, "")
    const exeAsset = release.assets?.find((a: any) => a.name.endsWith("-setup.exe"))
    if (!exeAsset) return null
    return {
      version,
      releaseNotes: release.body ?? "",
      downloadUrl: exeAsset.browser_download_url,
    }
  } catch {
    return null
  }
}

async function checkAndNotify(getMainWindow: () => BrowserWindow | null): Promise<void> {
  const currentVersion = app.getVersion()
  const latest = await fetchLatestRelease()
  if (!latest) return

  console.log("[ChibangaRx] Current:", currentVersion, "| Latest:", latest.version)

  if (!isNewerVersion(currentVersion, latest.version)) {
    console.log("[ChibangaRx] Up to date")
    availableUpdate = null
    const win = getMainWindow()
    win?.webContents.send("updater:not-available", { currentVersion })
    return
  }

  console.log("[ChibangaRx] Update available:", latest.version)
  availableUpdate = latest
  const win = getMainWindow()
  win?.webContents.send("updater:available", {
    version: latest.version,
    releaseNotes: latest.releaseNotes,
  })
}

export function initAutoUpdater(getMainWindow: () => BrowserWindow | null): void {
  console.log("[ChibangaRx] Auto-updater initialized (GitHub API mode), version:", app.getVersion())

  ipcMain.handle("updater:get-version", () => app.getVersion())
  ipcMain.handle("updater:get-available", () => availableUpdate)

  ipcMain.handle("updater:check", async () => {
    console.log("[ChibangaRx] Manual update check")
    await checkAndNotify(getMainWindow)
    return { ok: true }
  })

  ipcMain.handle("updater:check-silent", async () => {
    await checkAndNotify(getMainWindow)
    return { ok: true }
  })

  ipcMain.on("updater:download", async () => {
    if (isDownloading || !availableUpdate) return
    isDownloading = true
    const win = getMainWindow()
    const update = availableUpdate

    console.log("[ChibangaRx] Downloading update:", update.version)
    win?.webContents.send("updater:downloading", { version: update.version })

    try {
      const installDir = app.getPath("userData")
      const filePath = path.join(installDir, `chibangarx-${update.version}-setup.exe`)

      await new Promise<void>((resolve, reject) => {
        const request = net.request(update.downloadUrl)
        request.setHeader("User-Agent", "ChibangaRx")
        let totalBytes = 0
        let receivedBytes = 0

        request.on("response", (response) => {
          if (response.statusCode === 302 || response.statusCode === 301) {
            const redirectUrl = response.headers["location"]
            if (redirectUrl) {
              request.abort()
              const followRequest = net.request(Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl)
              followRequest.setHeader("User-Agent", "ChibangaRx")
              followRequest.on("response", (res) => handleResponse(res))
              followRequest.on("error", reject)
              followRequest.end()
              return
            }
          }
          handleResponse(response)
        })

        function handleResponse(res: any) {
          totalBytes = parseInt(res.headers["content-length"]?.[0] || "0", 10)
          const chunks: Buffer[] = []

          res.on("data", (chunk: Buffer) => {
            chunks.push(chunk)
            receivedBytes += chunk.length
            const percent = totalBytes > 0 ? (receivedBytes / totalBytes) * 100 : 0
            win?.webContents.send("updater:download-progress", {
              percent,
              transferred: receivedBytes,
              total: totalBytes,
              bytesPerSecond: 0,
            })
          })

          res.on("end", async () => {
            try {
              const buffer = Buffer.concat(chunks)
              await fs.writeFile(filePath, buffer)
              console.log("[ChibangaRx] Download complete:", filePath)
              resolve()
            } catch (err) {
              reject(err)
            }
          })

          res.on("error", reject)
        }

        request.on("error", reject)
        request.end()
      })

      isDownloading = false
      win?.webContents.send("updater:downloaded", { version: update.version })
      console.log("[ChibangaRx] Update downloaded, ready to install")

      setTimeout(() => {
        shell.openPath(filePath)
        app.quit()
      }, 2000)
    } catch (error: any) {
      isDownloading = false
      console.error("[ChibangaRx] Download failed:", error.message)
      win?.webContents.send("updater:download-error", { error: error.message })
    }
  })

  ipcMain.handle("updater:install", () => {
    if (!availableUpdate) return { ok: false, error: "No update available" }
    const installDir = app.getPath("userData")
    const filePath = path.join(installDir, `chibangarx-${availableUpdate.version}-setup.exe`)
    shell.openPath(filePath)
    app.quit()
    return { ok: true }
  })

  setTimeout(() => {
    console.log("[ChibangaRx] Running initial update check...")
    checkAndNotify(getMainWindow)
  }, 2000)
  setInterval(() => checkAndNotify(getMainWindow), CHECK_INTERVAL)
}
