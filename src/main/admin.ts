import { ipcMain } from "electron"
import Store from "electron-store"
import log from "electron-log"

const store = new Store()

const ADMIN_PASSWORD = process.env["CHIBANGARX_ADMIN_PASSWORD"] || "admin123"

interface AdminState {
  isAdmin: boolean
  username: string
  country: string
  onlineCount: number
  sessionId: string | null
}

let adminState: AdminState = {
  isAdmin: false,
  username: "",
  country: "",
  onlineCount: 0,
  sessionId: null,
}

function detectCountry(): string {
  const locale = Intl.DateTimeFormat().resolvedOptions().timeZone
  const countryMap: Record<string, string> = {
    "America/New_York": "US",
    "America/Los_Angeles": "US",
    "America/Chicago": "US",
    "Europe/London": "GB",
    "Europe/Paris": "FR",
    "Europe/Berlin": "DE",
    "Europe/Madrid": "ES",
    "Europe/Lisbon": "PT",
    "Asia/Tokyo": "JP",
    "Asia/Singapore": "SG",
    "Asia/Shanghai": "CN",
    "Asia/Kolkata": "IN",
    "Australia/Sydney": "AU",
    "America/Sao_Paulo": "BR",
    "America/Mexico_City": "MX",
    "Europe/Moscow": "RU",
  }
  for (const [tz, country] of Object.entries(countryMap)) {
    if (locale.includes(tz.split("/")[0])) {
      return country
    }
  }
  return locale.split("/")[0].substring(0, 2).toUpperCase()
}

function getUsername(): string {
  try {
    const { userInfo } = require("os")
    return userInfo().username || "Unknown"
  } catch {
    return "Unknown"
  }
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function setupAdminHandlers(): void {
  ipcMain.handle("admin:login", async (_event, password: string): Promise<{ success: boolean; message: string }> => {
    log.info("[ChibangaRx] Admin login attempt")
    if (password === ADMIN_PASSWORD) {
      adminState.isAdmin = true
      adminState.username = getUsername()
      adminState.country = detectCountry()
      adminState.sessionId = generateSessionId()
      adminState.onlineCount = Math.floor(Math.random() * 20) + 1
      log.info("[ChibangaRx] Admin login successful, user:", adminState.username, "country:", adminState.country)
      return { success: true, message: "Login successful" }
    }
    log.warn("[ChibangaRx] Admin login failed - incorrect password")
    return { success: false, message: "Incorrect password" }
  })

  ipcMain.handle("admin:logout", () => {
    log.info("[ChibangaRx] Admin logout")
    adminState = {
      isAdmin: false,
      username: "",
      country: "",
      onlineCount: 0,
      sessionId: null,
    }
    return { success: true }
  })

  ipcMain.handle("admin:status", () => {
    return { ...adminState }
  })

  ipcMain.handle("admin:check-expiry", () => {
    return { ...adminState }
  })

  log.info("[ChibangaRx] Admin handlers setup complete")
}

export function cleanupAdminHandlers(): void {
  ipcMain.removeHandler("admin:login")
  ipcMain.removeHandler("admin:logout")
  ipcMain.removeHandler("admin:status")
  ipcMain.removeHandler("admin:check-expiry")
}

export function isStoredAdmin(): boolean {
  const storedAdmin = store.get("adminMode") as boolean
  return storedAdmin === true
}
