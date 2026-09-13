import { contextBridge, ipcRenderer } from "electron"
import { eventChannels, invokeChannels, sendChannels } from "../shared/ipc-channels"
import type { MaintenanceRequest } from "../main/operations"

type Listener = (...args: any[]) => void
const listeners = new Map<string, Map<Listener, Listener>>()
function allowed(channels: readonly string[], channel: string): void {
  if (!channels.includes(channel)) throw new Error("IPC channel is not allowed")
}

const bridge = {
  async invoke(channel: string, ...args: unknown[]): Promise<any> {
    allowed(invokeChannels, channel)
    return ipcRenderer.invoke(channel, ...args)
  },
  send(channel: string, ...args: unknown[]): void {
    allowed(sendChannels, channel)
    ipcRenderer.send(channel, ...args)
  },
  on(channel: string, listener: Listener): () => void {
    allowed(eventChannels, channel)
    bridge.removeListener(channel, listener)
    // Preserve existing callback argument positions without exposing the Electron event.
    const wrapped = (_event: unknown, ...args: unknown[]) => listener(undefined, ...args)
    const channelListeners = listeners.get(channel) ?? new Map<Listener, Listener>()
    channelListeners.set(listener, wrapped)
    listeners.set(channel, channelListeners)
    ipcRenderer.on(channel, wrapped)
    return () => bridge.removeListener(channel, listener)
  },
  removeListener(channel: string, listener: Listener): void {
    allowed(eventChannels, channel)
    const registered = listeners.get(channel)
    const wrapped = registered?.get(listener)
    if (wrapped) ipcRenderer.removeListener(channel, wrapped)
    registered?.delete(listener)
    if (registered?.size === 0) listeners.delete(channel)
  },
  removeAllListeners(channel: string): void {
    allowed(eventChannels, channel)
    for (const listener of listeners.get(channel)?.keys() ?? []) bridge.removeListener(channel, listener)
  },
}

const electron = {
  ipcRenderer: bridge,
  minimize: () => bridge.send("window-minimize"),
  toggleMaximize: () => bridge.send("window-toggle-maximize"),
  close: () => bridge.send("window-close"),
}
const api = {
  runMaintenance: (request: MaintenanceRequest): Promise<{ success: boolean; output?: string; error?: string }> =>
    bridge.invoke("maintenance:run", request),
}

export type ElectronBridge = typeof electron
export type AppBridge = typeof api
contextBridge.exposeInMainWorld("electron", electron)
contextBridge.exposeInMainWorld("api", api)
