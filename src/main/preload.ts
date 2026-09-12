import { contextBridge, ipcRenderer } from "electron"

contextBridge.exposeInMainWorld("electron", {
  minimize: (): void => ipcRenderer.send("window-minimize"),
  toggleMaximize: (): void => ipcRenderer.send("window-toggle-maximize"),
  close: (): void => ipcRenderer.send("window-close"),
  invoke: (channel: string, data?: any): Promise<any> => ipcRenderer.invoke(channel, data),
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void): void => {
      ipcRenderer.on(channel, listener)
    },
    removeListener: (channel: string, listener: (...args: any[]) => void): void => {
      ipcRenderer.removeListener(channel, listener)
    },
  },
})
