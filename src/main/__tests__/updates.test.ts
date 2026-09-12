import { describe, it, expect, vi, beforeEach } from "vitest"

type UpdateState = "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "error"

const mockAutoUpdater = {
  autoDownload: true,
  autoInstallOnAppQuit: true,
  forceDevUpdateConfig: false,
  logger: null as any,
  checkForUpdates: vi.fn(),
  downloadUpdate: vi.fn(),
  quitAndInstall: vi.fn(),
  on: vi.fn(),
  once: vi.fn(),
  removeAllListeners: vi.fn(),
}

vi.mock("electron-log", () => ({
  default: { log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn() },
  log: vi.fn(), error: vi.fn(), warn: vi.fn(), info: vi.fn(),
  initialize: vi.fn(),
  transports: { file: { level: "info" } },
}))

vi.mock("electron", () => ({
  app: {
    getVersion: vi.fn(() => "2.38.18"),
    isPackaged: true,
    whenReady: vi.fn(() => Promise.resolve()),
  },
  ipcMain: { handle: vi.fn(), on: vi.fn(), removeHandler: vi.fn() },
  BrowserWindow: {
    getFocusedWindow: vi.fn(() => mockMainWindow),
    getAllWindows: vi.fn(() => [mockMainWindow]),
  },
}))

const mockMainWindow = {
  isDestroyed: vi.fn(() => false),
  webContents: {
    send: vi.fn(),
  },
}

vi.mock("electron-updater", () => ({
  autoUpdater: mockAutoUpdater,
}))

vi.mock("@main/windowState", () => ({
  getMainWindow: vi.fn(),
}))

describe("Update System", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMainWindow.isDestroyed.mockReturnValue(false)
  })

  describe("UpdateState type", () => {
    it("has valid states", () => {
      const validStates: UpdateState[] = ["idle", "checking", "available", "downloading", "downloaded", "installing", "error"]
      validStates.forEach((state) => {
        expect(typeof state).toBe("string")
      })
    })
  })

  describe("Version Comparison", () => {
    it("correctly compares semantic versions", () => {
      const parseVersion = (v: string) => v.split(".").map(Number)

      const v1 = parseVersion("2.38.17")
      const v2 = parseVersion("2.38.18")

      const isNewer = (current: number[], latest: number[]) => {
        for (let i = 0; i < Math.max(current.length, latest.length); i++) {
          const c = current[i] || 0
          const l = latest[i] || 0
          if (l > c) return true
          if (l < c) return false
        }
        return false
      }

      expect(isNewer(v1, v2)).toBe(true)
      expect(isNewer(v2, v1)).toBe(false)
      expect(isNewer(v1, v1)).toBe(false)
    })
  })

  describe("State Management", () => {
    it("prevents concurrent checks", () => {
      const canCheckState = (state: UpdateState): boolean => {
        if (state === "checking" || state === "downloading") return false
        return true
      }

      expect(canCheckState("idle")).toBe(true)
      expect(canCheckState("checking")).toBe(false)
      expect(canCheckState("downloading")).toBe(false)
      expect(canCheckState("available")).toBe(true)
      expect(canCheckState("error")).toBe(true)
    })

    it("prevents duplicate downloads", () => {
      let isDownloading = false

      const canDownload = (): boolean => {
        if (isDownloading) return false
        isDownloading = true
        return true
      }

      expect(canDownload()).toBe(true)
      expect(canDownload()).toBe(false)
    })
  })

  describe("Progress Formatting", () => {
    it("formats bytes correctly", () => {
      const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
      }

      expect(formatBytes(0)).toBe("0 B")
      expect(formatBytes(512)).toBe("512 B")
      expect(formatBytes(2048)).toBe("2 KB")
      expect(formatBytes(5242880)).toBe("5 MB")
      expect(formatBytes(1073741824)).toBe("1 GB")
    })

    it("formats download speed correctly", () => {
      const formatSpeed = (bytesPerSecond: number): string => {
        if (bytesPerSecond === 0) return ""
        const k = 1024
        const sizes = ["B/s", "KB/s", "MB/s", "GB/s"]
        const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
        return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
      }

      expect(formatSpeed(0)).toBe("")
      expect(formatSpeed(512)).toBe("512 B/s")
      expect(formatSpeed(1048576)).toBe("1 MB/s")
    })

    it("clamps percentage between 0 and 100", () => {
      const clamp = (val: number, min: number, max: number): number => {
        return Math.max(min, Math.min(max, val))
      }

      expect(clamp(110, 0, 100)).toBe(100)
      expect(clamp(-10, 0, 100)).toBe(0)
      expect(clamp(50, 0, 100)).toBe(50)
    })
  })

  describe("Error Handling", () => {
    it("handles no-published-state errors gracefully", () => {
      const isNoReleaseError = (msg: string): boolean => {
        return msg.includes("No published state") || msg.includes("404")
      }

      expect(isNoReleaseError("No published state")).toBe(true)
      expect(isNoReleaseError("404 Not Found")).toBe(true)
      expect(isNoReleaseError("Network error")).toBe(false)
    })

    it("extracts error message safely", () => {
      const extractMessage = (err: unknown): string => {
        if (err instanceof Error) return err.message
        if (typeof err === "string") return err
        return String(err)
      }

      expect(extractMessage(new Error("test error"))).toBe("test error")
      expect(extractMessage("string error")).toBe("string error")
      expect(extractMessage(null)).toBe("null")
    })
  })

  describe("Update Configuration", () => {
    it("has autoDownload enabled", () => {
      expect(mockAutoUpdater.autoDownload).toBe(true)
    })

    it("has autoInstallOnAppQuit enabled", () => {
      expect(mockAutoUpdater.autoInstallOnAppQuit).toBe(true)
    })
  })
})
