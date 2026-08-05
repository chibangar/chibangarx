import type { BrowserWindow } from "electron"

export const logo = "[ChibangaRx]:"

export let mainWindow: BrowserWindow | null = null

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win
}
