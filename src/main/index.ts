import { app, shell, BrowserWindow, ipcMain, desktopCapturer, globalShortcut, session } from "electron"
import { promises as fs } from "fs"
import path, { join } from "path"
import log from "electron-log"
import { setupPowerShellHandlers } from "@main/powershell"
import { setupSystemHandlers } from "@main/system"
import { setupTweaksHandlers } from "@main/tweakHandler"
import { setupDNSHandlers } from "@main/dnsHandler"
import { setupBackupHandlers } from "@main/backup"
import { setupDebloatHandlers } from "@main/debloat"
import { setupDriverHandlers } from "@main/drivers"
import { initAutoUpdater } from "@main/updates"
import { setMainWindow } from "@main/windowState"
import Store from "electron-store"
import { is } from "@main/utils"
import { startDiscordRPC } from "@main/rpc"

console.log = log.log
console.error = log.error
console.warn = log.warn

log.initialize()

const store = new Store()

let selectedCaptureSourceId: string | null = null

ipcMain.handle("clips:get-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: { width: 320, height: 180 },
  })

  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
  }))
})

ipcMain.handle("clips:set-source", (_event: Electron.IpcMainInvokeEvent, sourceId: string) => {
  selectedCaptureSourceId = sourceId
})

ipcMain.handle(
  "clips:save",
  async (_event: Electron.IpcMainInvokeEvent, payload: { data: ArrayBuffer }) => {
    const clipsDirectory = join(app.getPath("videos"), "ChibangaRx Clips")
    await fs.mkdir(clipsDirectory, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[.:]/g, "-")
    const filePath = join(clipsDirectory, `clip-${timestamp}.webm`)
    await fs.writeFile(filePath, Buffer.from(payload.data))
    return filePath
  },
)

ipcMain.handle("open-clips-folder", async () => {
  const clipsDirectory = join(app.getPath("videos"), "ChibangaRx Clips")
  await fs.mkdir(clipsDirectory, { recursive: true })
  await shell.openPath(clipsDirectory)
})

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  console.log("[ChibangaRx]: createWindow called")
  console.log("[ChibangaRx]: __dirname =", __dirname)
   console.log("[ChibangaRx]: icon path =", path.join(__dirname, "../../resources/chibangarx.ico"))
  console.log("[ChibangaRx]: preload path =", join(__dirname, "../preload/index.js"))
  console.log("[ChibangaRx]: renderer path =", join(__dirname, "../renderer/index.html"))

  try {
    mainWindow = new BrowserWindow({
      width: 1380,
      backgroundColor: "#0c121f",
      height: 760,
      // minWidth: 1380,
      // minHeight: 760,
      minWidth: 790,
      center: true,
      frame: false,
      show: false,
      autoHideMenuBar: true,
       icon: path.join(__dirname, "../../resources/chibangarx.ico"),
      webPreferences: {
        preload: join(__dirname, "../preload/index.js"),
        devTools: app.isPackaged ? false : true,
        sandbox: false,
        webviewTag: true,
        spellcheck: false,
      },
    })
    console.log("[ChibangaRx]: BrowserWindow created")
    setMainWindow(mainWindow)
  } catch (err: any) {
    console.error("[ChibangaRx]: BrowserWindow creation failed:", err)
    throw err
  }

  mainWindow.webContents.setWindowOpenHandler((details: Electron.HandlerDetails) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    console.log("[ChibangaRx]: Loading renderer from URL:", process.env["ELECTRON_RENDERER_URL"])
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    console.log("[ChibangaRx]: Loading renderer from file")
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }

  mainWindow.once("ready-to-show", () => {
    console.log("[ChibangaRx]: Window ready to show")
    mainWindow!.show()
  })

  mainWindow.webContents.on(
    "did-fail-load",
    (_event: Electron.Event, errorCode: number, errorDescription: string) => {
      console.error("[ChibangaRx]: Renderer failed to load:", errorCode, errorDescription)
    },
  )
}
app.commandLine.appendSwitch("no-sandbox")
app
  .whenReady()
  .then(() => {
    session.defaultSession.setDisplayMediaRequestHandler(async (_request, callback) => {
      const sources = await desktopCapturer.getSources({ types: ["window", "screen"] })
      const selected = sources.find((source) => source.id === selectedCaptureSourceId)
      callback({ video: selected ?? sources[0] })
    })
    console.log("[ChibangaRx]: App ready, creating window...")
    try {
      createWindow()
      console.log("[ChibangaRx]: Window created successfully")
    } catch (err: any) {
      console.error("[ChibangaRx]: createWindow failed:", err)
    }
    initAutoUpdater()
    console.log("[ChibangaRx]: Auto updater initialized")
    setupPowerShellHandlers()
    setupSystemHandlers()
    setupTweaksHandlers()
    setupDNSHandlers()
    setupBackupHandlers()
    setupDebloatHandlers()
    setupDriverHandlers()
    if (store.get("rpcEnabled") !== false) {
      startDiscordRPC()
    }
    console.log("[ChibangaRx]: Handlers setup complete")

    globalShortcut.register("CommandOrControl+Shift+F10", () => {
      mainWindow?.webContents.send("clips:save-request")
    })

    ipcMain.on("window-minimize", () => {
      if (mainWindow) mainWindow.minimize()
    })

    ipcMain.on("window-toggle-maximize", () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    })

    ipcMain.on("window-close", () => {
      if (mainWindow) {
        app.quit()
      }
    })

    ipcMain.handle("get-resources-path", () => {
      if (app.isPackaged) {
        return join(path.dirname(app.getPath("exe")), "resources")
      }
      return join(app.getAppPath(), "../resources")
    })

    ipcMain.handle("open-devtools", () => {
      if (mainWindow) {
        mainWindow.webContents.openDevTools()
      }
    })

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on("will-quit", () => globalShortcut.unregisterAll())
  })
  .catch((err: any) => {
    console.error("[ChibangaRx]: app.whenReady failed:", err)
  })
