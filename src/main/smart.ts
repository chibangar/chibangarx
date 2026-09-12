import { ipcMain } from "electron"
import os from "os"
import si from "systeminformation"
import log from "electron-log"
import { TtlCache } from "@main/cache"
import { detectGPU } from "@main/gpu"
import { executePowerShell } from "@main/powershell"
import { loadTweaks } from "@main/tweakHandler"
import type { SmartAnalysis, SmartProfile, SmartRecommendation } from "../types"

console.log = log.log
console.error = log.error
console.warn = log.warn

const analysisCache = new TtlCache<SmartAnalysis>(5 * 60 * 1000)

const PORTABLE_PC_SYSTEM_TYPES = new Set([2, 8, 9, 10, 14, 15])

async function getPcSystemType(): Promise<number> {
  try {
    const result = await executePowerShell(null, {
      script: "(Get-CimInstance Win32_ComputerSystem).PCSystemType",
      name: "Get-PcSystemType",
    })
    const parsed = parseInt(result.output?.trim() || "", 10)
    return Number.isNaN(parsed) ? 1 : parsed
  } catch (error) {
    console.error("Failed to detect PC system type:", error)
    return 1
  }
}

async function getPrimaryDiskType(): Promise<string> {
  try {
    const [diskLayout, fsSize, blockDevices] = await Promise.all([
      si.diskLayout(),
      si.fsSize(),
      si.blockDevices(),
    ])

    const cDrive = (fsSize as any).find((d: any) => d.mount.toUpperCase().startsWith("C:"))
    if (!cDrive) return "Unknown"

    const cBlock = (blockDevices as any).find(
      (b: any) => b.mount && b.mount.toUpperCase().startsWith("C:"),
    )
    if (!cBlock) return "Unknown"

    const disk = (diskLayout as any).find(
      (d: any) =>
        d.device?.toLowerCase() === cBlock.device?.toLowerCase() ||
        d.name?.toLowerCase().includes(cBlock.name?.toLowerCase()),
    )
    return disk?.type || "Unknown"
  } catch (error) {
    console.error("Failed to detect primary disk type:", error)
    return "Unknown"
  }
}

async function analyzeSystem(refresh = false): Promise<SmartAnalysis> {
  if (!refresh) {
    const cached = analysisCache.get("analysis")
    if (cached) return cached
  }
  analysisCache.delete("analysis")

  try {
    const [cpuData, osInfo, gpuInfo, pcSystemType] = await Promise.all([
      si.cpu(),
      si.osInfo(),
      detectGPU(),
      getPcSystemType(),
    ])

    const ramGB = Math.round(os.totalmem() / 1024 / 1024 / 1024)
    const cores = (cpuData as any).physicalCores || 0
    const threads = (cpuData as any).threads || cores
    const vramGB = parseFloat(gpuInfo.vram) || 0
    const isWin11 = (osInfo as any).build >= 22000
    const isLaptop = PORTABLE_PC_SYSTEM_TYPES.has(pcSystemType)

    const diskType = await getPrimaryDiskType()
    const isSSD = ["SSD", "NVMe"].includes(diskType)

    let score = 0

    if (ramGB >= 32) score += 30
    else if (ramGB >= 16) score += 25
    else if (ramGB >= 8) score += 15
    else score += 8

    if (threads >= 16) score += 25
    else if (threads >= 8) score += 20
    else if (threads >= 4) score += 12
    else score += 6

    if (gpuInfo.hasGPU && vramGB >= 8) score += 30
    else if (gpuInfo.hasGPU && vramGB >= 4) score += 22
    else if (gpuInfo.hasGPU) score += 15
    else score += 5

    if (isSSD) score += 15
    else score += 5

    const classification: SmartProfile["classification"] =
      score >= 75 ? "gaming" : score >= 50 ? "mid" : "low"

    const profile: SmartProfile = {
      cpu: (cpuData as any).brand || "Unknown",
      cores,
      threads,
      ramGB,
      gpu: gpuInfo.model,
      vramGB,
      hasGPU: gpuInfo.hasGPU,
      isNvidia: gpuInfo.isNvidia,
      isLaptop,
      isWin11,
      isSSD,
      diskType,
      score,
      classification,
    }

    const tweaks = await loadTweaks()
    const recommendations = buildRecommendations(profile, tweaks)

    const analysis: SmartAnalysis = { profile, recommendations }
    analysisCache.set("analysis", analysis)
    return analysis
  } catch (error) {
    console.error("Failed to analyze system:", error)
    throw error
  }
}

function buildRecommendations(
  profile: SmartProfile,
  tweaks: Array<{ name: string; title?: string }>,
): SmartRecommendation[] {
  const byName = new Map(tweaks.map((t) => [t.name, t]))
  const recommendations: SmartRecommendation[] = []

  const add = (
    tweakId: string,
    priority: SmartRecommendation["priority"],
    reasonCode: string,
    reasonArgs: Record<string, string | number> = {},
  ): void => {
    if (!byName.has(tweakId)) return
    recommendations.push({ tweakId, priority, reasonCode, reasonArgs })
  }

  add("disable-telemetry", "recommended", "privacy")
  add("disable-copilot", "recommended", "privacy")
  add("disable-recall", "recommended", "privacy")
  add("disable-location-tracking", "recommended", "privacy")
  add("disable-activity-history", "recommended", "privacy")
  add("disable-consumer-features", "recommended", "privacy")
  add("disable-wifi-sense", "recommended", "privacy")
  add("disable-lockscreen-tips", "optional", "privacy")
  add("disable-notifications", "optional", "privacy")
  add("disable-rdp-warnings", "optional", "privacy")
  add("disable-ms-bing-integration", "optional", "privacy")

  add("set-services-to-manual", "recommended", "perf")
  add("wpbt", "recommended", "perf")

  if (profile.ramGB < 16) {
    add("disable-background-ms-store-apps", "recommended", "lowRam", { ram: profile.ramGB })
    add("background-app-permissions", "recommended", "lowRam", { ram: profile.ramGB })
  }
  if (profile.ramGB < 8) {
    add("startup-delay-apps", "recommended", "lowRam", { ram: profile.ramGB })
    add("disable-core-isolation", "caution", "lowEnd")
  }

  if (profile.isLaptop) {
    add("disable-background-ms-store-apps", "recommended", "laptop")
    add("background-app-permissions", "recommended", "laptop")
    add("startup-delay-apps", "optional", "laptop")
  }

  if (!profile.isSSD) {
    add("startup-delay-apps", "recommended", "hdd")
  }

  const gaming = profile.classification === "gaming" || (profile.hasGPU && profile.ramGB >= 16)
  if (gaming) {
    add("enable-game-mode", "recommended", "gaming", { gpu: profile.gpu })
    add("disable-gamebar", "recommended", "gaming", { gpu: profile.gpu })
    add("disable-mouse-acceleration", "optional", "gaming", { gpu: profile.gpu })
    add("set-win32-priority-separation", "optional", "gaming", { gpu: profile.gpu })
    add("disable-dynamic-ticking", "optional", "gaming", { gpu: profile.gpu })
    if (profile.isWin11 && profile.hasGPU) {
      add("enable-hags", "recommended", "gaming", { gpu: profile.gpu })
      add("enable-optimization-for-windowed-games", "recommended", "gaming", { gpu: profile.gpu })
    }
    if (profile.isNvidia) {
      add("optimize-nvidia-settings", "recommended", "nvidia", { gpu: profile.gpu })
    }
    if (!profile.isLaptop) {
      add("ultimate-performance-plan", "caution", "gaming", { gpu: profile.gpu })
      add("disable-hibernation", "caution", "desktop")
    }
  }

  if (profile.classification === "low") {
    add("disable-core-isolation", "caution", "lowEnd")
    add("disable-defender-rtp", "caution", "lowEnd")
    add("menu-show-delay-zero", "optional", "lowEnd")
    add("disable-dynamic-ticking", "optional", "lowEnd")
  }

  if (profile.isSSD) {
    add("disable-fast-startup", "optional", "ssd")
  }

  const priorityRank: Record<SmartRecommendation["priority"], number> = {
    recommended: 0,
    optional: 1,
    caution: 2,
  }

  const deduped = new Map<string, SmartRecommendation>()
  for (const rec of recommendations) {
    const existing = deduped.get(rec.tweakId)
    if (!existing || priorityRank[rec.priority] < priorityRank[existing.priority]) {
      deduped.set(rec.tweakId, rec)
    }
  }

  return [...deduped.values()].sort(
    (a, b) => priorityRank[a.priority] - priorityRank[b.priority],
  )
}

export const setupSmartHandlers = (): void => {
  ipcMain.handle(
    "smart:analyze",
    async (_event: Electron.IpcMainInvokeEvent, options?: { refresh?: boolean }) =>
      analyzeSystem(options?.refresh),
  )
  console.log("[ChibangaRx main/smart.ts]: Smart handlers setup complete")
}

export const cleanupSmartHandlers = (): void => {
  ipcMain.removeHandler("smart:analyze")
}