import { beforeEach, describe, expect, it, vi } from "vitest"

const fake = vi.hoisted(() => ({
  exposed: {} as Record<string, any>, listeners: new Map<string, Function>(), calls: [] as unknown[][],
}))
vi.mock("electron", () => ({
  contextBridge: { exposeInMainWorld: (key: string, value: unknown) => { fake.exposed[key] = value } },
  ipcRenderer: {
    invoke: async (...args: unknown[]) => { fake.calls.push(args); return "done" },
    send: (...args: unknown[]) => { fake.calls.push(args) },
    on: (channel: string, listener: Function) => { fake.listeners.set(channel, listener) },
    removeListener: (channel: string, listener: Function) => {
      if (fake.listeners.get(channel) === listener) fake.listeners.delete(channel)
    },
  },
}))
vi.mock("@electron-toolkit/preload", async () => ({
  electronAPI: { ipcRenderer: (await import("electron")).ipcRenderer },
}))

beforeEach(async () => {
  vi.resetModules()
  fake.exposed = {}; fake.listeners.clear(); fake.calls = []
  vi.stubGlobal("window", fake.exposed)
  await import("../../preload/index")
})

describe("restricted renderer bridge", () => {
  it("rejects arbitrary channels before contacting main", async () => {
    const bridge = fake.exposed.electron.ipcRenderer
    await expect(bridge.invoke("run-powershell", { script: "malicious" })).rejects.toThrow()
    expect(() => bridge.send("arbitrary-channel")).toThrow()
    expect(() => bridge.on("arbitrary-channel", () => {})).toThrow()
    expect(fake.calls).toHaveLength(0)
  })
  it("dispatches declared operations and never gives the callback an Electron event", async () => {
    const bridge = fake.exposed.electron.ipcRenderer
    await expect(bridge.invoke("get-system-info")).resolves.toBe("done")
    const received: unknown[][] = []
    const callback = (...args: unknown[]) => { received.push(args) }
    bridge.on("install-output", callback)
    fake.listeners.get("install-output")!({ sender: { dangerous: true } }, { line: "ok" })
    expect(received).toEqual([[undefined, { line: "ok" }]])
    bridge.removeListener("install-output", callback)
    expect(fake.listeners.size).toBe(0)
    expect(fake.exposed.electron.process).toBeUndefined()
    expect(bridge.sendSync).toBeUndefined()
  })
})
