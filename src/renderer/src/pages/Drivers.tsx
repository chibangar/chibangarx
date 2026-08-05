import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { useTranslation } from "react-i18next"
import {
  Cpu,
  HardDrive,
  Network,
  Music,
  MonitorDot,
  Box,
  RefreshCw,
  Download,
  Search,
  ExternalLink,
  LoaderCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Wrench,
} from "lucide-react"
import log from "electron-log/renderer"

interface DriverInfo {
  deviceName: string
  manufacturer: string
  driverVersion: string
  driverDate: string
  deviceClass: string
  hardwareId: string
  category: "chipset" | "motherboard" | "gpu" | "network" | "audio" | "storage" | "other"
}

interface MotherboardInfo {
  manufacturer: string
  product: string
  version: string
  biosManufacturer: string
  biosVersion: string
  biosDate: string
  systemManufacturer: string
  systemProduct: string
}

interface WindowsUpdateDriver {
  title: string
  description: string
  driverModel: string
  hardwareId: string
  version: string
  manufacturer: string
  publishedDate: string
}

const categoryIcons: Record<string, React.ReactNode> = {
  chipset: <Cpu size={18} />,
  motherboard: <Box size={18} />,
  gpu: <MonitorDot size={18} />,
  network: <Network size={18} />,
  audio: <Music size={18} />,
  storage: <HardDrive size={18} />,
  other: <Wrench size={18} />,
}

const categoryColors: Record<string, string> = {
  chipset: "text-blue-500",
  motherboard: "text-purple-500",
  gpu: "text-green-500",
  network: "text-cyan-500",
  audio: "text-pink-500",
  storage: "text-orange-500",
  other: "text-gray-500",
}

export default function Drivers() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [drivers, setDrivers] = useState<DriverInfo[]>([])
  const [motherboardInfo, setMotherboardInfo] = useState<MotherboardInfo | null>(null)
  const [windowsUpdates, setWindowsUpdates] = useState<WindowsUpdateDriver[]>([])
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [installingDriver, setInstallingDriver] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [updateCount, setUpdateCount] = useState(0)
  const [selectedUpdate, setSelectedUpdate] = useState<WindowsUpdateDriver | null>(null)

  // AMD Chipset state
  const [amdInfo, setAmdInfo] = useState<{ isAMD: boolean; cpuName: string; currentVersion: string; driverName: string; deviceCount: number } | null>(null)
  const [amdLatestVersion, setAmdLatestVersion] = useState<string | null>(null)
  const [amdDownloadUrl, setAmdDownloadUrl] = useState<string | null>(null)
  const [amdHighlights, setAmdHighlights] = useState<string[]>([])
  const [amdDownloading, setAmdDownloading] = useState(false)
  const [amdDownloadProgress, setAmdDownloadProgress] = useState(0)
  const [amdError, setAmdError] = useState<string | null>(null)
  const [checkingAMD, setCheckingAMD] = useState(false)

  useEffect(() => {
    loadDriverData()
    checkAMDChipset()
  }, [])

  useEffect(() => {
    const onProgress = (_e: any, data: any) => {
      setAmdDownloadProgress(data.percent || 0)
    }
    const onComplete = (_e: any, data: any) => {
      setAmdDownloading(false)
      setAmdDownloadProgress(100)
      toast.success(t("drivers.amdDownloadComplete"))
      if (data?.filePath) {
        installAMDChipsetDriver(data.filePath)
      }
    }
    const onError = (_e: any, data: any) => {
      setAmdDownloading(false)
      setAmdError(data.error || "Download failed")
      toast.error(data.error || t("drivers.amdDownloadFailed"))
    }

    window.electron.ipcRenderer.on("amd:download-progress", onProgress)
    window.electron.ipcRenderer.on("amd:download-complete", onComplete)
    window.electron.ipcRenderer.on("amd:download-error", onError)

    return () => {
      window.electron.ipcRenderer.removeListener("amd:download-progress", onProgress)
      window.electron.ipcRenderer.removeListener("amd:download-complete", onComplete)
      window.electron.ipcRenderer.removeListener("amd:download-error", onError)
    }
  }, [])

  async function loadDriverData() {
    setLoading(true)
    try {
      const [driversResult, mbResult] = await Promise.all([
        invoke({ channel: "drivers:get-installed" }),
        invoke({ channel: "drivers:get-motherboard" }),
      ])

      if (driversResult.success && driversResult.drivers) {
        setDrivers(driversResult.drivers)
      }

      if (mbResult.success && mbResult.info) {
        setMotherboardInfo(mbResult.info)
      }
    } catch (error) {
      log.error("Failed to load driver data:", error)
      toast.error(t("common.operationError"))
    } finally {
      setLoading(false)
    }
  }

  async function checkAMDChipset() {
    setCheckingAMD(true)
    setAmdError(null)
    try {
      const result = await invoke({ channel: "drivers:check-amd" })
      if (result.success && result.isAMD) {
        setAmdInfo({
          isAMD: true,
          cpuName: result.cpuName || "",
          currentVersion: result.currentVersion || "",
          driverName: result.driverName || "",
          deviceCount: result.deviceCount || 0,
        })
        // Fetch latest version from AMD
        const versionResult = await invoke({ channel: "drivers:fetch-amd-version" })
        if (versionResult.success && versionResult.version) {
          setAmdLatestVersion(versionResult.version)
          setAmdDownloadUrl(versionResult.downloadUrl || "")
          setAmdHighlights(versionResult.highlights || [])
        }
      } else {
        setAmdInfo({ isAMD: false, cpuName: "", currentVersion: "", driverName: "", deviceCount: 0 })
      }
    } catch (error: any) {
      log.error("Failed to check AMD chipset:", error)
      setAmdError(error.message || "Failed to check AMD chipset")
    } finally {
      setCheckingAMD(false)
    }
  }

  async function downloadAMDChipset() {
    const url = amdDownloadUrl || ""
    const version = amdLatestVersion || "latest"
    setAmdDownloading(true)
    setAmdDownloadProgress(0)
    setAmdError(null)
    try {
      await invoke({
        channel: "drivers:download-and-install-amd",
        payload: { downloadUrl: url, version },
      })
    } catch (error: any) {
      log.error("Failed to download AMD chipset:", error)
      setAmdDownloading(false)
      setAmdError(error.message || "Download failed")
    }
  }

  async function installAMDChipsetDriver(filePath: string) {
    try {
      const result = await invoke({ channel: "drivers:install-amd", payload: filePath })
      if (result.success) {
        toast.success(t("drivers.amdInstallSuccess"))
      } else {
        toast.error(result.error || t("drivers.amdInstallFailed"))
      }
    } catch (error: any) {
      log.error("Failed to install AMD chipset:", error)
      toast.error(error.message || t("drivers.amdInstallFailed"))
    }
  }

  async function checkForUpdates() {
    setCheckingUpdates(true)
    try {
      const result = await invoke({ channel: "drivers:check-updates" })
      if (result.success && result.drivers) {
        setWindowsUpdates(result.drivers)
        setUpdateCount(result.count || result.drivers.length)
        if (result.drivers.length > 0) {
          toast.success(t("drivers.updatesFound", { count: result.drivers.length }))
        } else {
          toast.info(t("drivers.noUpdatesAvailable"))
        }
      } else {
        toast.error(result.error || t("common.operationError"))
      }
    } catch (error) {
      log.error("Failed to check for updates:", error)
      toast.error(t("common.operationError"))
    } finally {
      setCheckingUpdates(false)
    }
  }

  async function installDriver(title: string) {
    setInstallingDriver(title)
    try {
      const result = await invoke({ channel: "drivers:install-update", payload: title })
      if (result.success) {
        toast.success(result.output || t("drivers.installSuccess"))
        setWindowsUpdates((prev) => prev.filter((d) => d.title !== title))
        setUpdateCount((prev) => Math.max(0, prev - 1))
      } else {
        toast.error(result.error || t("drivers.installFailed"))
      }
    } catch (error) {
      log.error("Failed to install driver:", error)
      toast.error(t("drivers.installFailed"))
    } finally {
      setInstallingDriver(null)
    }
  }

  async function openWindowsUpdate() {
    try {
      await invoke({ channel: "drivers:open-windows-update" })
    } catch (error) {
      log.error("Failed to open Windows Update:", error)
    }
  }

  async function searchDriverOnline(deviceName: string, manufacturer: string) {
    const query = `${manufacturer} ${deviceName} driver download`
    try {
      await invoke({ channel: "drivers:search-online", payload: query })
    } catch (error) {
      log.error("Failed to search driver online:", error)
    }
  }

  function getFilteredDrivers(): Record<string, DriverInfo[]> {
    const filtered = drivers.filter((d) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        d.deviceName.toLowerCase().includes(query) ||
        d.manufacturer.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query)
      )
    })

    const grouped: Record<string, DriverInfo[]> = {}
    for (const driver of filtered) {
      if (!grouped[driver.category]) {
        grouped[driver.category] = []
      }
      grouped[driver.category].push(driver)
    }

    return grouped
  }

  function getCategoryLabel(category: string): string {
    return t(`drivers.categories.${category}`)
  }

  const groupedDrivers = getFilteredDrivers()
  const categories = Object.keys(groupedDrivers).sort()

  if (loading) {
    return (
      <RootDiv>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <LoaderCircle className="w-12 h-12 text-chibangarx-primary animate-spin" />
          <p className="text-chibangarx-text-secondary">{t("drivers.loading")}</p>
        </div>
      </RootDiv>
    )
  }

  return (
    <RootDiv>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-chibangarx-text">{t("drivers.title")}</h1>
            <p className="text-sm text-chibangarx-text-secondary mt-1">{t("drivers.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={checkForUpdates}
              disabled={checkingUpdates}
            >
              {checkingUpdates ? (
                <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              {checkingUpdates ? t("drivers.checking") : t("drivers.checkUpdates")}
            </Button>
            <Button onClick={openWindowsUpdate}>
              <ExternalLink className="w-4 h-4 mr-2" />
              {t("drivers.windowsUpdate")}
            </Button>
          </div>
        </div>

        {/* Motherboard Info */}
        {motherboardInfo && (
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-chibangarx-primary/10 rounded-lg">
                <Box className="w-5 h-5 text-chibangarx-primary" />
              </div>
              <h2 className="text-lg font-semibold text-chibangarx-text">
                {t("drivers.motherboard")}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.manufacturer")}</p>
                <p className="text-sm text-chibangarx-text">{motherboardInfo.manufacturer}</p>
              </div>
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.model")}</p>
                <p className="text-sm text-chibangarx-text">{motherboardInfo.product}</p>
              </div>
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.biosVersion")}</p>
                <p className="text-sm text-chibangarx-text">{motherboardInfo.biosVersion}</p>
              </div>
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.biosDate")}</p>
                <p className="text-sm text-chibangarx-text">{motherboardInfo.biosDate}</p>
              </div>
            </div>
          </Card>
        )}

        {/* AMD Chipset Section */}
        {checkingAMD ? (
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <LoaderCircle className="w-5 h-5 text-chibangarx-primary animate-spin" />
              <p className="text-chibangarx-text-secondary">{t("drivers.checkingAMD")}</p>
            </div>
          </Card>
        ) : amdInfo?.isAMD ? (
          <Card className="p-5 border-orange-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <Cpu className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-chibangarx-text">
                  AMD Chipset
                </h2>
                <p className="text-xs text-chibangarx-text-secondary">
                  {amdInfo.cpuName}
                </p>
              </div>
              {amdLatestVersion && amdInfo.currentVersion !== amdLatestVersion && (
                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full font-medium">
                  {t("drivers.updateAvailable")}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.installedVersion")}</p>
                <p className="text-sm text-chibangarx-text font-medium">
                  {amdInfo.currentVersion || <span className="text-yellow-500">{t("drivers.versionNotDetected")}</span>}
                </p>
                {amdInfo.driverName && (
                  <p className="text-xs text-chibangarx-text-secondary mt-1">{amdInfo.driverName}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.latestVersion")}</p>
                <p className="text-sm text-chibangarx-text font-medium">{amdLatestVersion || "..."}</p>
              </div>
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.chipsetDevices")}</p>
                <p className="text-sm text-chibangarx-text font-medium">{amdInfo.deviceCount}</p>
              </div>
            </div>

            {amdLatestVersion && amdInfo.currentVersion && amdInfo.currentVersion === amdLatestVersion && (
              <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-500 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  {t("drivers.amdUpToDate")}
                </p>
              </div>
            )}

            {/* Always show download section for AMD */}
            {amdLatestVersion && amdInfo.currentVersion !== amdLatestVersion && (
              <div className="mt-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-chibangarx-text mb-2">
                  {t("drivers.amdUpdateDescription")}
                </p>

                {amdHighlights.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-chibangarx-text mb-2">{t("drivers.improvements")}:</p>
                    <ul className="space-y-1">
                      {amdHighlights.map((highlight, idx) => (
                        <li key={idx} className="text-xs text-chibangarx-text-secondary flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {amdError && (
                  <p className="text-xs text-red-500 mb-3">{amdError}</p>
                )}

                {amdDownloading ? (
                  <div>
                    <div className="flex justify-between text-xs text-chibangarx-text-secondary mb-1">
                      <span>{t("drivers.downloading")}</span>
                      <span>{Math.round(amdDownloadProgress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-chibangarx-border-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full transition-all duration-300"
                        style={{ width: `${amdDownloadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={downloadAMDChipset} className="bg-orange-600 hover:bg-orange-700">
                      <Download className="w-4 h-4 mr-2" />
                      {amdLatestVersion ? `${t("drivers.downloadVersion")} ${amdLatestVersion}` : t("drivers.downloadFromAMD")}
                    </Button>
                    <Button variant="secondary" onClick={checkAMDChipset}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {t("drivers.refresh")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Download button when no latest version detected */}
            {!amdLatestVersion && (
              <div className="mt-4 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <p className="text-sm text-chibangarx-text mb-2">
                  {t("drivers.amdUpdateDescription")}
                </p>
                {amdError && (
                  <p className="text-xs text-red-500 mb-3">{amdError}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={downloadAMDChipset} className="bg-orange-600 hover:bg-orange-700">
                    <Download className="w-4 h-4 mr-2" />
                    {t("drivers.downloadFromAMD")}
                  </Button>
                  <Button variant="secondary" onClick={checkAMDChipset}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t("drivers.refresh")}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ) : amdInfo && !amdInfo.isAMD ? null : null}

        {/* Windows Update Drivers */}
        {windowsUpdates.length > 0 && (
          <Card className="p-5 border-green-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Download className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-chibangarx-text">
                    {t("drivers.availableUpdates")}
                  </h2>
                  <p className="text-xs text-chibangarx-text-secondary">
                    {t("drivers.updatesCount", { count: windowsUpdates.length })}
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setWindowsUpdates([])
                  setUpdateCount(0)
                }}
              >
                {t("drivers.dismiss")}
              </Button>
            </div>
            <div className="space-y-3">
              {windowsUpdates.map((update, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-chibangarx-bg rounded-lg border border-chibangarx-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-chibangarx-text font-medium truncate">
                      {update.title}
                    </p>
                    {update.description && (
                      <p className="text-xs text-chibangarx-text-secondary mt-1 line-clamp-2">
                        {update.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      {update.manufacturer && (
                        <span className="text-xs text-chibangarx-text-secondary">
                          {update.manufacturer}
                        </span>
                      )}
                      {update.publishedDate && (
                        <span className="text-xs text-chibangarx-text-secondary">
                          {update.publishedDate}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedUpdate(update)}
                    >
                      <Info className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => installDriver(update.title)}
                      disabled={installingDriver === update.title}
                    >
                      {installingDriver === update.title ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5 mr-1" />
                      )}
                      {t("drivers.install")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-chibangarx-text-secondary" />
          <input
            type="text"
            placeholder={t("drivers.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-chibangarx-card border border-chibangarx-border rounded-xl text-sm text-chibangarx-text placeholder:text-chibangarx-text-secondary focus:outline-none focus:border-chibangarx-primary transition-colors"
          />
        </div>

        {/* Driver Categories */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-chibangarx-text-secondary">{t("drivers.noDriversFound")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryDrivers = groupedDrivers[category]
              const isExpanded = expandedCategory === category || expandedCategory === null

              return (
                <Card key={category} className="overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedCategory(isExpanded && categories.length > 1 ? null : category)
                    }
                    className="w-full flex items-center justify-between p-4 hover:bg-chibangarx-border-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`${categoryColors[category]}`}>
                        {categoryIcons[category]}
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm font-semibold text-chibangarx-text">
                          {getCategoryLabel(category)}
                        </h3>
                        <p className="text-xs text-chibangarx-text-secondary">
                          {categoryDrivers.length} {t("drivers.devices")}
                        </p>
                      </div>
                    </div>
                    {categories.length > 1 && (
                      <div className="text-chibangarx-text-secondary">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-chibangarx-border">
                      <table className="w-full">
                        <thead>
                          <tr className="text-xs text-chibangarx-text-secondary border-b border-chibangarx-border">
                            <th className="text-left px-4 py-2 font-medium">{t("drivers.device")}</th>
                            <th className="text-left px-4 py-2 font-medium">{t("drivers.manufacturer")}</th>
                            <th className="text-left px-4 py-2 font-medium">{t("drivers.version")}</th>
                            <th className="text-left px-4 py-2 font-medium">{t("drivers.date")}</th>
                            <th className="text-right px-4 py-2 font-medium">{t("drivers.actions")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {categoryDrivers.map((driver, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-chibangarx-border last:border-b-0 hover:bg-chibangarx-border-secondary/20 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <p className="text-sm text-chibangarx-text font-medium">
                                  {driver.deviceName}
                                </p>
                                {driver.hardwareId && (
                                  <p className="text-xs text-chibangarx-text-secondary mt-0.5 max-w-[200px] truncate">
                                    {driver.hardwareId}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-chibangarx-text-secondary">
                                  {driver.manufacturer}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-chibangarx-text font-mono">
                                  {driver.driverVersion}
                                </p>
                              </td>
                              <td className="px-4 py-3">
                                <p className="text-sm text-chibangarx-text-secondary">
                                  {driver.driverDate || "-"}
                                </p>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    searchDriverOnline(driver.deviceName, driver.manufacturer)
                                  }
                                  title={t("drivers.searchOnline")}
                                >
                                  <Search className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-chibangarx-primary">{drivers.length}</p>
            <p className="text-xs text-chibangarx-text-secondary mt-1">{t("drivers.totalDrivers")}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {drivers.filter((d) => d.category === "chipset" || d.category === "motherboard").length}
            </p>
            <p className="text-xs text-chibangarx-text-secondary mt-1">{t("drivers.coreDrivers")}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{updateCount}</p>
            <p className="text-xs text-chibangarx-text-secondary mt-1">{t("drivers.pendingUpdates")}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-chibangarx-text-secondary">
              {new Set(drivers.map((d) => d.manufacturer)).size}
            </p>
            <p className="text-xs text-chibangarx-text-secondary mt-1">{t("drivers.manufacturers")}</p>
          </Card>
        </div>

        {/* Info */}
        <Card className="p-4 bg-chibangarx-primary/5 border-chibangarx-primary/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-chibangarx-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm text-chibangarx-text">{t("drivers.infoTitle")}</p>
              <p className="text-xs text-chibangarx-text-secondary mt-1">
                {t("drivers.infoDescription")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Update Detail Modal */}
      <Modal open={!!selectedUpdate} onClose={() => setSelectedUpdate(null)}>
        {selectedUpdate && (
          <div className="bg-chibangarx-card p-5 rounded-2xl border border-chibangarx-border text-chibangarx-text w-[90vw] max-w-lg">
            <h2 className="text-lg font-semibold mb-3">{t("drivers.updateDetails")}</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-chibangarx-text-secondary">{t("drivers.updateName")}</p>
                <p className="text-sm">{selectedUpdate.title}</p>
              </div>
              {selectedUpdate.description && (
                <div>
                  <p className="text-xs text-chibangarx-text-secondary">{t("drivers.description")}</p>
                  <p className="text-sm">{selectedUpdate.description}</p>
                </div>
              )}
              {selectedUpdate.manufacturer && (
                <div>
                  <p className="text-xs text-chibangarx-text-secondary">{t("drivers.manufacturer")}</p>
                  <p className="text-sm">{selectedUpdate.manufacturer}</p>
                </div>
              )}
              {selectedUpdate.publishedDate && (
                <div>
                  <p className="text-xs text-chibangarx-text-secondary">{t("drivers.releaseDate")}</p>
                  <p className="text-sm">{selectedUpdate.publishedDate}</p>
                </div>
              )}
              {selectedUpdate.hardwareId && (
                <div>
                  <p className="text-xs text-chibangarx-text-secondary">{t("drivers.hardwareId")}</p>
                  <p className="text-sm font-mono text-xs break-all">{selectedUpdate.hardwareId}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setSelectedUpdate(null)}>
                {t("common.close")}
              </Button>
              <Button
                onClick={() => {
                  installDriver(selectedUpdate.title)
                  setSelectedUpdate(null)
                }}
                disabled={installingDriver === selectedUpdate.title}
              >
                {installingDriver === selectedUpdate.title ? (
                  <LoaderCircle className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                {t("drivers.install")}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </RootDiv>
  )
}
