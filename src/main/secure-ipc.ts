import { app, ipcMain as nativeIpcMain, dialog } from "electron"
import type { IpcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron"
import { join } from "path"
import { pathToFileURL } from "url"
import { mainWindow } from "./windowState"
import { isTrustedSender } from "./runtime-policy"
import { invokeChannels, sendChannels } from "../shared/ipc-channels"

export function rendererDocumentUrl(): string {
  return !app.isPackaged && process.env.ELECTRON_RENDERER_URL
    ? process.env.ELECTRON_RENDERER_URL
    : pathToFileURL(join(__dirname, "../renderer/index.html")).href
}

function assertSender(event: IpcMainEvent | IpcMainInvokeEvent): void {
  if (!isTrustedSender(event, mainWindow?.webContents, rendererDocumentUrl())) {
    throw new Error("IPC sender is not the trusted application frame")
  }
}

const destructiveChannels = new Set([
  "restart", "restart-explorer", "clear-chibangarx-cache", "uninstall-apps",
  "delete-all-restore-points", "delete-old-chibangarx-backups", "restore-restore-point",
  "clips:delete", "segra:DeleteContent", "segra:DeleteMultipleContent",
  "tweak:apply", "tweak:unapply", "dns:apply", "dns:reset", "install-winget",
  "install-chocolatey", "drivers:install-update", "drivers:install-amd",
  "drivers:download-and-install-amd",
])

export async function confirmOperation(detail: string): Promise<void> {
  if (!mainWindow || mainWindow.isDestroyed()) throw new Error("Application window unavailable")
  const result = await dialog.showMessageBox(mainWindow, {
    type: "warning", title: "Confirmar operação", message: "Pretende continuar com esta operação?",
    detail, buttons: ["Cancelar", "Continuar"], defaultId: 0, cancelId: 0, noLink: true,
  })
  if (result.response !== 1) throw new Error("Operation cancelled")
}

// Every application handler goes through the same window AND main-frame check.
export const ipcMain = {
  handle(channel: string, listener: Parameters<IpcMain["handle"]>[1]): void {
    if (!(invokeChannels as readonly string[]).includes(channel)) throw new Error(`Unknown IPC channel: ${channel}`)
    nativeIpcMain.handle(channel, async (event, ...args) => {
      assertSender(event)
      if (destructiveChannels.has(channel)) {
        await confirmOperation(channel)
        assertSender(event)
      }
      return listener(event, ...args)
    })
  },
  on(channel: string, listener: (event: IpcMainEvent, ...args: any[]) => void): void {
    if (!(sendChannels as readonly string[]).includes(channel)) throw new Error(`Unknown IPC channel: ${channel}`)
    nativeIpcMain.on(channel, (event, ...args) => {
      try { assertSender(event) } catch { return }
      listener(event, ...args)
    })
  },
  removeHandler(channel: string): void { nativeIpcMain.removeHandler(channel) },
}
