import {
  app,
  shell,
  BrowserWindow,
  desktopCapturer,
  globalShortcut,
  session,
  dialog,
} from "electron"
import { ipcMain } from "./secure-ipc"
import { promises as fs } from "fs"
import path, { join } from "path"
import { pathToFileURL } from "url"
import log from "electron-log"
import { setupPowerShellHandlers } from "@main/powershell"
import { setupSystemHandlers } from "@main/system"
import { setupTweaksHandlers } from "@main/tweakHandler"
import { setupDNSHandlers } from "@main/dnsHandler"
import { setupBackupHandlers } from "@main/backup"
import { setupDebloatHandlers } from "@main/debloat"
import { setupDriverHandlers } from "@main/drivers"
import { setupSegraHandlers, setSegraMainWindow } from "@main/segra"
import { setupSmartHandlers } from "@main/smart"
import { setupClipsHandlers, initClipBufferSystem } from "./clips"
import { initAutoUpdater } from "@main/updates"
import { setMainWindow } from "@main/windowState"
import { createTray } from "@main/tray"
import Store from "electron-store"
import { is } from "@main/utils"
import { startDiscordRPC } from "@main/rpc"
import { rendererDocumentUrl } from "./secure-ipc"
import { isAllowedExternalUrl, isTrustedDocument, secureWebPreferences } from "./runtime-policy"

console.log = log.log
console.error = log.error
console.warn = log.warn

log.initialize()

const store = new Store()

// Handle minimize to tray on close
let shouldQuit = false

let selectedCaptureSourceId: string | null = null

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
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "chibangarx.ico")
    : path.join(__dirname, "../../resources/chibangarx.ico")
  console.log("[ChibangaRx]: createWindow called")
  console.log("[ChibangaRx]: __dirname =", __dirname)
  console.log("[ChibangaRx]: icon path =", iconPath)
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
      icon: iconPath,
      webPreferences: {
        ...secureWebPreferences(app.isPackaged),
        preload: join(__dirname, "../preload/index.js"),
        spellcheck: false,
      },
    })
    console.log("[ChibangaRx]: BrowserWindow created")
    setMainWindow(mainWindow)
    setSegraMainWindow(mainWindow)
    try {
      createTray(mainWindow)
    } catch (err) {
      // The tray is optional; never leave the application running without a window.
      console.error("[ChibangaRx]: Tray creation failed:", err)
    }
  } catch (err: any) {
    console.error("[ChibangaRx]: BrowserWindow creation failed:", err)
    throw err
  }

  mainWindow.webContents.setWindowOpenHandler((details: Electron.HandlerDetails) => {
    if (isAllowedExternalUrl(details.url)) void shell.openExternal(details.url).catch(console.error)
    return { action: "deny" }
  })
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!isTrustedDocument(url, rendererDocumentUrl())) event.preventDefault()
  })
  mainWindow.webContents.on("will-frame-navigate", (event) => {
    if (!event.isMainFrame || !isTrustedDocument(event.url, rendererDocumentUrl())) event.preventDefault()
  })
  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (!isTrustedDocument(url, rendererDocumentUrl())) event.preventDefault()
  })
  mainWindow.webContents.on("will-attach-webview", (event) => event.preventDefault())

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

  // Handle close to tray
  mainWindow.on("close", (event) => {
    if (!shouldQuit && store.get("minimizeToTray") !== false) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.on(
    "did-fail-load",
    (_event: Electron.Event, errorCode: number, errorDescription: string) => {
      console.error("[ChibangaRx]: Renderer failed to load:", errorCode, errorDescription)
    },
  )
}
app
  .whenReady()
  .then(() => {
    session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
      if (!mainWindow || request.frame !== mainWindow.webContents.mainFrame ||
          !isTrustedDocument(request.frame.url, rendererDocumentUrl()) || !selectedCaptureSourceId) {
        callback({})
        return
      }
      const sources = await desktopCapturer.getSources({ types: ["window", "screen"] })
      const selected = sources.find((source) => source.id === selectedCaptureSourceId)
      callback(selected ? { video: selected } : {})
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
    setupSegraHandlers()
    setupSmartHandlers()
    if (store.get("rpcEnabled") !== false) {
      startDiscordRPC()
    }
    console.log("[ChibangaRx]: Handlers setup complete")

    // Hotkey global para salvar clip (Configurável nas Settings)
    const defaultHotkey = "CommandOrControl+Shift+S"
    globalShortcut.register(defaultHotkey, () => {
      mainWindow?.webContents.send("clips:save-request")
    })

    // Setup handlers de clips com buffer circular + metadados
    setupClipsHandlers((sourceId) => { selectedCaptureSourceId = sourceId })

    // Iniciar buffer circular por defeito (60 segundos)
    initClipBufferSystem({ enabled: true, duration: 60 })

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
        shouldQuit = true
        app.quit()
      }
    })

    // Handlers para eventos da aba Clips
    ipcMain.on("clips:minimize-request", () => {
      if (mainWindow) mainWindow.minimize()
    })

    ipcMain.on("clips:maximize-request", () => {
      if (mainWindow) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize()
        } else {
          mainWindow.maximize()
        }
      }
    })

    ipcMain.on("clips:close-request", () => {
      if (mainWindow) {
        shouldQuit = true
        app.quit()
      }
    })

    ipcMain.handle("ambient-music:choose-file", async () => {
      if (!mainWindow) return null
      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Selecionar música ambiente",
        properties: ["openFile"],
        filters: [{ name: "Áudio", extensions: ["mp3", "wav", "m4a", "aac", "ogg", "flac"] }],
      })
      if (result.canceled || result.filePaths.length === 0) return null

      const filePath = result.filePaths[0]
      return {
        path: filePath,
        url: pathToFileURL(filePath).toString(),
        name: path.basename(filePath),
      }
    })

    // Auto-start handlers
    ipcMain.handle("autostart:get", () => {
      return app.getLoginItemSettings().openAtLogin
    })

    ipcMain.handle("autostart:set", (_event: Electron.IpcMainInvokeEvent, enabled: boolean) => {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        path: app.getPath("exe"),
        args: [],
      })
      return app.getLoginItemSettings().openAtLogin
    })

    // Minimize to tray handlers
    ipcMain.handle("minimizeToTray:get", () => {
      return store.get("minimizeToTray") !== false
    })

    ipcMain.handle(
      "minimizeToTray:set",
      (_event: Electron.IpcMainInvokeEvent, enabled: boolean) => {
        store.set("minimizeToTray", enabled)
        return enabled
      },
    )

    ipcMain.handle("get-resources-path", () => {
      if (app.isPackaged) {
        return join(path.dirname(app.getPath("exe")), "resources")
      }
      return join(app.getAppPath(), "../resources")
    })

    ipcMain.handle("open-devtools", () => {
      if (!app.isPackaged && mainWindow) {
        mainWindow.webContents.openDevTools()
      }
    })

    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    app.on("will-quit", () => {
      globalShortcut.unregisterAll()
    })
  })
  .catch((err: any) => {
    console.error("[ChibangaRx]: app.whenReady failed:", err)
  })
