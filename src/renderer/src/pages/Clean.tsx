import Button from "@/components/ui/button"
import Toggle from "@/components/ui/Toggle"
import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import RootDiv from "@/components/rootdiv"
import {
  Icon,
  FileX,
  Gauge,
  Trash2,
  Download,
  Image,
  Bug,
  LoaderCircle,
} from "lucide-react"
import { broom } from "@lucide/lab"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import Card from "@/components/ui/Card"
import { useTranslation } from "react-i18next"

export type CleanupType = {
  id: string
  label: string
  path: string
  description: string
  icon: React.ReactNode
  script: string
  sizeScript: string
}

const cleanupKeys: Record<string, { labelKey: string; descKey: string }> = {
  temp: { labelKey: "temp", descKey: "temp" },
  prefetch: { labelKey: "prefetch", descKey: "prefetch" },
  recyclebin: { labelKey: "recyclebin", descKey: "recyclebin" },
  "windows-update": { labelKey: "windowsupdate", descKey: "windowsupdate" },
  thumbnails: { labelKey: "thumbnails", descKey: "thumbnails" },
  errorreports: { labelKey: "errorreports", descKey: "errorreports" },
}

export const cleanups: CleanupType[] = [
  {
    id: "temp",
    label: "Clean Temporary Files",
    path: "C:\\Windows\\Temp",
    description: "Remove system and user temporary files.",
    icon: <FileX className="w-5 h-5" />,
    script: "cleanup-temp",
    sizeScript: "size-temp",
  },
  {
    id: "prefetch",
    label: "Clean Prefetch Files",
    path: "C:\\Windows\\Prefetch",
    description: "Delete files from the Windows Prefetch folder.",
    icon: <Gauge className="w-5 h-5" />,
    script: "cleanup-prefetch",
    sizeScript: "size-prefetch",
  },
  {
    id: "recyclebin",
    label: "Empty Recycle Bin",
    path: "Recycle Bin",
    description: "Permanently remove files from the Recycle Bin.",
    icon: <Trash2 className="w-5 h-5" />,
    script: "cleanup-recyclebin",
    sizeScript: "size-recyclebin",
  },
  {
    id: "windows-update",
    label: "Clean Windows Update Cache",
    path: "C:\\Windows\\SoftwareDistribution\\Download",
    description: "Remove Windows Update downloaded installation files.",
    icon: <Download className="w-5 h-5" />,
    script: "cleanup-windows-update",
    sizeScript: "size-windows-update",
  },
  {
    id: "thumbnails",
    label: "Clear Thumbnail Cache",
    path: "C:\\Users\\<User>\\AppData\\Local\\Microsoft\\Windows\\Explorer",
    description: "Remove cached thumbnail images used by File Explorer.",
    icon: <Image className="w-5 h-5" />,
    script: "cleanup-thumbnails",
    sizeScript: "size-thumbnails",
  },
  {
    id: "errorreports",
    label: "Clear Error Reports",
    path: "C:\\Users\\<User>\\AppData\\Local\\CrashDumps",
    description: "Remove error report and crash dump files.",
    icon: <Bug className="w-5 h-5" />,
    script: "cleanup-errorreports",
    sizeScript: "size-errorreports",
  },
]

function Clean() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string[]>([])
  const [loadingQueue, setLoadingQueue] = useState<string[]>([])
  const [lastClean, setLastClean] = useState(
    localStorage.getItem("last-clean") || t("clean.notCleanedYet"),
  )
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanupResults, setCleanupResults] = useState({})
  const [currentSizes, setCurrentSizes] = useState<Record<string, number>>({})
  const [loadingSizes, setLoadingSizes] = useState(false)

  const toggleCleanup = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const formatBytes = (bytes) => {
    if (bytes === 0 || !bytes) return "0 B"
    const sizes = ["B", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`
  }

  async function fetchSizes(silent = false) {
    if (!silent) setLoadingSizes(true)

    await Promise.all(
      cleanups
        .filter((cleanup) => cleanup.sizeScript)
        .map(async (cleanup) => {
          try {
            const result = await invoke({
              channel: "maintenance:run",
              payload: { operation: cleanup.sizeScript },
            })
            const resultStr = result?.output || "0"
            setCurrentSizes((prev) => ({
              ...prev,
              [cleanup.id]: parseInt(resultStr.trim(), 10) || 0,
            }))
          } catch (err) {
            log.error(`Failed to fetch size for ${cleanup.id}: ${err}`)
            setCurrentSizes((prev) => ({ ...prev, [cleanup.id]: 0 }))
          }
        }),
    )

    if (!silent) setLoadingSizes(false)
  }

  useEffect(() => {
    fetchSizes()
  }, [])

  const totalSize = Object.values(currentSizes).reduce((sum, size) => sum + (size || 0), 0)
  const totalFreed = Object.values(cleanupResults as Record<string, number>).reduce(
    (sum: number, size) => sum + (size || 0),
    0,
  )

  async function runSelectedCleanups() {
    toast.dismiss()
    setIsCleaning(true)
    setLoadingQueue([])
    setCleanupResults({})
    let anySuccess = false
    let newResults = {}

    for (const cleanup of cleanups) {
      if (!selected.includes(cleanup.id)) continue
      setLoadingQueue((q) => [...q, cleanup.id])
      const keys = cleanupKeys[cleanup.id]
      const translatedLabel = keys ? t(`clean.cleanupLabels.${keys.labelKey}`) : cleanup.label
      const toastId = toast.loading(`${t("clean.running")} ${translatedLabel}...`)
        try {
        const result = await invoke({
          channel: "maintenance:run",
          payload: { operation: cleanup.script },
        })

        const resultStr = result?.output || "0"
        const freedSpace = parseInt(resultStr.trim(), 10) || 0
        newResults[cleanup.id] = freedSpace

        toast.update(toastId, {
          render: `${translatedLabel} ${t("clean.completed")}! ${formatBytes(freedSpace)} ${t("clean.cleared")}.`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
        anySuccess = true
      } catch (err: any) {
        toast.update(toastId, {
          render: `${t("clean.failed")}: ${err.message || err}`,
          type: "error",
          isLoading: false,
          autoClose: 4000,
        })
        log.error(`Failed to run ${cleanup.id} cleanup: ${err.message || err}`)
      }
    }

    if (anySuccess) {
      const now = new Date().toLocaleString()
      setLastClean(now)
      localStorage.setItem("last-clean", now)
      setCleanupResults(newResults)
      fetchSizes(true)
    }

    setLoadingQueue([])
    setIsCleaning(false)
  }

  return (
    <RootDiv>
      <div className="flex flex-col gap-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex items-center justify-center p-3 rounded-xl bg-teal-500/10">
            <Icon iconNode={broom} className="text-teal-500" size={28} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-chibangarx-text mb-1">{t("clean.title")}</h2>
            <p className="text-sm text-chibangarx-text-secondary">
              {t("clean.lastCleaned")}{" "}<span className="font-medium">{lastClean}</span>
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <p className="text-sm text-chibangarx-text-secondary">
                {loadingSizes ? (
                  t("clean.calculating")
                ) : (
                  <>
                    {t("clean.totalSize")}:{" "}
                    <span className="font-medium text-teal-500">{formatBytes(totalSize)}</span>
                  </>
                )}
              </p>
              {totalFreed > 0 && (
                <p className="text-sm text-green-500">
                  {t("clean.totalFreed")}{" "} <span className="font-medium">{formatBytes(totalFreed)}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {selected.length > 0 ? (
              <Button onClick={() => setSelected([])} variant="secondary" className="mr-2">
                {t("clean.unselectAll")}
              </Button>
            ) : (
              <Button
                onClick={() => setSelected(cleanups.map((c) => c.id))}
                variant="secondary"
                className="mr-2"
              >
                {t("clean.selectAll")}
              </Button>
            )}
            <Button
              onClick={runSelectedCleanups}
              disabled={isCleaning || selected.length === 0}
              size="md"
              variant="primary"
              className="min-w-45 flex items-center justify-center gap-2 text-base font-semibold"
            >
              {isCleaning ? (
                <>
                  <LoaderCircle className="animate-spin" size={18} />
                  <span>{t("clean.cleaning")}</span>
                </>
              ) : (
                <>
                  <Icon iconNode={broom} size={18} />
                  <span>{t("clean.cleanSelected")}</span>
                </>
              )}
            </Button>
          </div>
        </Card>
        <Card className="flex flex-col divide-y divide-chibangarx-border p-0 mb-10">
          {cleanups.map((cleanup, idx) => {
            const isSelected = selected.includes(cleanup.id)
            const currentSize = currentSizes[cleanup.id]
            const freedSpace = cleanupResults[cleanup.id]
            const keys = cleanupKeys[cleanup.id]
            const translatedLabel = keys ? t(`clean.cleanupLabels.${keys.labelKey}`) : cleanup.label
            const translatedDescription = keys ? t(`clean.cleanupDescriptions.${keys.descKey}`) : cleanup.description
            return (
              <div
                key={cleanup.id}
                className={`relative flex items-center justify-between px-6 py-5 ${idx === 0 ? "rounded-t-xl" : ""} ${idx === cleanups.length - 1 ? "rounded-b-xl" : ""} group hover:bg-chibangarx-card/50 transition-colors`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-chibangarx-border/50 text-chibangarx-text-secondary">
                    {cleanup.icon}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-semibold text-chibangarx-text truncate">
                        {translatedLabel}
                      </span>
                      {freedSpace ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/20 text-green-500">
                          {formatBytes(freedSpace)} {t("clean.freed")}
                        </span>
                      ) : null}
                    </div>
                    <span className="text-sm text-chibangarx-text-secondary mt-1">{translatedDescription}</span>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-chibangarx-text-muted flex items-center gap-1">
                        <span className="font-medium">{t("clean.size")}:</span>
                        {loadingSizes ? (
                          <span className="text-chibangarx-text-secondary">{t("clean.calculating")}</span>
                        ) : currentSize !== undefined ? (
                          <span className="text-teal-500 font-medium">
                            {formatBytes(currentSize)}
                          </span>
                        ) : (
                          <span className="text-chibangarx-text-secondary">{t("clean.unknown")}</span>
                        )}
                      </span>
                      {cleanup.path && cleanup.path !== "Recycle Bin" && (
                        <span className="text-xs text-chibangarx-text-muted truncate max-w-xs">
                          {cleanup.path}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex items-center">
                  <Toggle
                    checked={isSelected}
                    onChange={() => toggleCleanup(cleanup.id)}
                    disabled={isCleaning}
                  />
                </div>
                {loadingQueue.includes(cleanup.id) && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 rounded-xl">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-chibangarx-border border border-chibangarx-border-secondary">
                      <LoaderCircle className="animate-spin text-teal-500" size={18} />
                      <span className="text-sm font-medium text-teal-600">{t("clean.cleaning")}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      </div>
    </RootDiv>
  )
}

export default Clean
