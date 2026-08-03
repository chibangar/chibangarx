import { Tray, Menu, app, BrowserWindow } from "electron"
import path from "path"

export function createTray(mainWindow: BrowserWindow): Tray {
  const tray = new Tray(path.join(__dirname, "../../resources/chibangarx2.ico"))

  const contextMenu = Menu.buildFromTemplate([
    { label: "Abrir ChibangaRx", click: (): void => mainWindow.show() },
    { label: "Encerrar", click: (): void => app.quit() },
  ])

  tray.setToolTip("ChibangaRx")
  tray.setTitle("ChibangaRx")
  tray.setContextMenu(contextMenu)
  tray.on("click", (): void => ToggleWindowState(mainWindow))

  return tray
}

function ToggleWindowState(mainWindow: BrowserWindow): void {
  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
}
