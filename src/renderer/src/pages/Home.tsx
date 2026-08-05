import { useState, useEffect } from "react"
import RootDiv from "@/components/rootdiv"
import { Cpu, HardDrive, Zap, MemoryStick, Gpu } from "lucide-react"
import InfoCard from "@/components/infocard"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import useSystemStore from "@/store/systemInfo"
import log from "electron-log/renderer"
import Greeting from "@/components/greeting"
import { MonitorCog } from "lucide-react"
import { Wrench } from "lucide-react"
import Card from "@/components/ui/Card"
import { useTranslation } from "react-i18next"
import Planet from "@/components/Planet"
function Home() {
  const { t } = useTranslation()
  const systemInfo = useSystemStore((state) => state.systemInfo)
  const setSystemInfo = useSystemStore((state) => state.setSystemInfo)
  const [tweakInfo, setTweakInfo] = useState(() => {
    try {
      const cached = localStorage.getItem("chibangarx:tweakInfo")
      return cached ? JSON.parse(cached) : null
    } catch (err) {
      console.error("Failed to parse tweakInfo cache", err)
      return null
    }
  })
  const router = useNavigate()
  const [loading, setLoading] = useState(true)
  const [usingCache, setUsingCache] = useState(false)
  const [activeTweaks, setActiveTweaks] = useState(() => {
    try {
      const cached = localStorage.getItem("chibangarx:activeTweaks")
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })

  const goToTweaks = () => {
    router("tweaks")
  }

  const fetchActiveTweaks = async () => {
    try {
      const active = await invoke({ channel: "tweak:active" })
      setActiveTweaks(active)
      localStorage.setItem("chibangarx:activeTweaks", JSON.stringify(active))
    } catch (err) {
      console.error("Failed to fetch active tweaks:", err)
    }
  }

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("chibangarx:systemInfo")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          setSystemInfo(parsed)
          setUsingCache(true)
          setLoading(false)
        } catch (err) {
          console.warn("Failed to parse systemInfo cache", err)
        }
      }

      invoke({ channel: "get-system-info" })
        .then((info) => {
          useSystemStore.setState((state) => {
            const merged = { ...state.systemInfo, ...info }
            localStorage.setItem("chibangarx:systemInfo", JSON.stringify(merged))
            return { systemInfo: merged }
          })
          setUsingCache(false)
          log.info("Fetched system info")
        })
        .catch((err) => {
          log.error("Error fetching system info:", err)
          console.error("Error fetching system info:", err)
        })
        .finally(() => setLoading(false))
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      const cached = localStorage.getItem("chibangarx:tweakInfo")
      if (cached) {
        try {
          setTweakInfo(JSON.parse(cached))
        } catch (err) {
          console.error("Failed to parse tweakInfo cache", err)
        }
      }

      invoke({ channel: "tweaks:fetch" })
        .then((tweaks) => {
          setTweakInfo(tweaks)
          localStorage.setItem("chibangarx:tweakInfo", JSON.stringify(tweaks))
        })
        .catch((err) => {
          console.error("Error fetching tweak info:", err)
        })
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const idleHandle = requestIdleCallback(() => {
      fetchActiveTweaks()
    })

    return () => cancelIdleCallback(idleHandle)
  }, [])

  useEffect(() => {
    const handleExtraInfo = (_event: any, extra: Record<string, any>) => {
      useSystemStore.setState((state) => {
        const merged = { ...state.systemInfo, ...extra }
        localStorage.setItem("chibangarx:systemInfo", JSON.stringify(merged))
        return { systemInfo: merged }
      })
    }

    window.electron.ipcRenderer.on("system-info-extra", handleExtraInfo)
    return () => {
      window.electron.ipcRenderer.removeListener("system-info-extra", handleExtraInfo)
    }
  }, [])

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 GB"
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB"
  }

  if (loading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64 flex-col gap-4">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-[3px] border-chibangarx-border rounded-full"></div>
            <div
              className="absolute inset-0 border-[3px] border-transparent border-t-chibangarx-primary rounded-full animate-spin"
              role="status"
              aria-label="loading"
            ></div>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <p className="text-chibangarx-text-dark font-medium">{t("home.loading")}</p>
            <p className="text-chibangarx-text-muted text-sm">
              {t("home.loadingSubtitle")}
            </p>
          </div>
          <p className="text-xs text-chibangarx-secondary bg-chibangarx-accent px-3 py-1.5 rounded-full mt-1">
            {t("home.canUseWhileLoading")}
          </p>
        </div>
      </RootDiv>
    )
  }

  const isSpaceTheme = document.body.classList.contains("space")

  return (
    <RootDiv>
      <div className="max-w-[1800px] mx-auto relative">
        {isSpaceTheme && (
          <>
            <div className="absolute -top-2 right-8 opacity-60 pointer-events-none">
              <Planet size={90} variant="saturn" />
            </div>
            <div className="absolute top-40 -right-4 opacity-40 pointer-events-none">
              <Planet size={50} variant="neptune" />
            </div>
            <div className="absolute bottom-20 left-4 opacity-30 pointer-events-none">
              <Planet size={35} variant="mars" />
            </div>
          </>
        )}
        <Greeting />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <InfoCard
            icon={Cpu}
            iconBgColor="bg-blue-500/10"
            iconColor="text-blue-500"
            title={t("home.cpu")}
            subtitle={t("home.cpuSubtitle")}
            items={[
              { label: t("home.model"), value: systemInfo?.cpu_model || t("home.unknown") },
              { label: t("home.cores"), value: `${systemInfo?.cpu_cores || "0"} ${t("home.cores").toLowerCase()}` },
            ]}
          />

          <InfoCard
            icon={Gpu}
            iconBgColor="bg-teal-500/10"
            iconColor="text-teal-500"
            title={t("home.gpu")}
            subtitle={t("home.gpuSubtitle")}
            items={
              systemInfo?.hasGPU
                ? [
                    { label: t("home.model"), value: systemInfo?.gpu_model || t("home.loading") },
                    { label: t("home.vram"), value: systemInfo?.vram || t("home.loading") },
                  ]
                : [
                    { label: t("home.model"), value: systemInfo?.integrated_gpu || t("home.loading") },
                    { label: t("home.type"), value: t("home.integrated") },
                  ]
            }
          />

          <InfoCard
            icon={MemoryStick}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-500"
            title={t("home.memory")}
            subtitle={t("home.memorySubtitle")}
            items={[
              { label: t("home.totalMemory"), value: formatBytes(systemInfo?.memory_total) },
              { label: t("home.type"), value: systemInfo?.memory_type || t("home.unknown") },
            ]}
          />

          <InfoCard
            icon={MonitorCog}
            iconBgColor="bg-red-500/10"
            iconColor="text-red-500"
            title={t("home.system")}
            subtitle={t("home.systemSubtitle")}
            items={[
              { label: t("home.os"), value: systemInfo?.os || t("home.unknown") },
              { label: t("home.version"), value: systemInfo?.os_version || t("home.unknown") },
            ]}
          />

          <InfoCard
            icon={HardDrive}
            iconBgColor="bg-orange-500/10"
            iconColor="text-orange-500"
            title={t("home.storage")}
            subtitle={t("home.storageSubtitle")}
            items={[
              { label: t("home.primaryDisk"), value: systemInfo?.disk_model || t("home.loading") },
              { label: t("home.totalSpace"), value: systemInfo?.disk_size || t("home.loading") },
            ]}
          />

          <InfoCard
            icon={Wrench}
            iconBgColor="bg-green-500/10"
            iconColor="text-green-500"
            title={t("home.tweaks")}
            subtitle={t("home.tweaksSubtitle")}
            items={[
              { label: t("home.availableTweaks"), value: `${tweakInfo?.length || 0} ${t("nav.tweaks")}` },
              { label: t("home.activeTweaks"), value: `${activeTweaks.length || 0} ${t("nav.active")}` },
            ]}
          />
        </div>
        <Card className="bg-chibangarx-card backdrop-blur-xs rounded-xl border border-chibangarx-border hover:shadow-xs overflow-hidden p-3 w-full mt-4 flex gap-4 items-center">
          <div className="p-3 bg-green-500/10 rounded-lg items-center justify-center text-center">
            <Wrench className="text-green-500" size={24} />
          </div>
          <div>
            <h1 className="font-medium text-chibangarx-text">{t("home.slowPc")}</h1>
            <p className="text-chibangarx-text-secondary">
              {t("home.slowPcDesc")}
            </p>
          </div>
          <div className="ml-auto">
            <Button variant="outline" className="flex items-center gap-2" onClick={goToTweaks}>
              <Zap size={18} /> {t("home.visitTweaks")}
            </Button>
          </div>
        </Card>
        <p className="text-xs text-chibangarx-text-secondary text-center mt-4">
          {usingCache ? t("home.loadingLatest") : ""}
        </p>
      </div>
    </RootDiv>
  )
}

export default Home
