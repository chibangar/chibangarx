import { useState, useEffect } from "react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { Bell, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

export type UpdateState =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "installing"
  | "error"

interface UpdateStatePayload {
  version: string
  releaseNotes: string
  currentVersion: string
  newState: UpdateState
  percent: number
  downloadedBytes: number
  totalBytes: number
  downloadSpeed: number
  error: string | null
}

export default function UpdateManager(): React.ReactElement {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [updateState, setUpdateState] = useState<UpdateState>("idle")
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string>("")
  const [currentVersion, setCurrentVersion] = useState<string>("")
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return ""
    const k = 1024
    const sizes = ["B/s", "KB/s", "MB/s", "GB/s"]
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  useEffect(() => {
    let ignore = false

    const fetchVersion = async () => {
      const result = await window.electron.ipcRenderer.invoke("updater:get-version")
      if (!ignore && result) {
        setCurrentVersion(result.currentVersion)
        setUpdateState(result.newState)
        setUpdateVersion(result.version || null)
        setReleaseNotes(result.releaseNotes || "")
        setDownloadPercent(result.percent)
        setDownloadSpeed(result.downloadSpeed)
        setDownloadedBytes(result.downloadedBytes)
        setTotalBytes(result.totalBytes)
        setError(result.error)
      }
    }
    void fetchVersion()

    const onStateUpdate = (_event: unknown, payload: UpdateStatePayload) => {
      if (ignore) return
      setUpdateState(payload.newState)
      setUpdateVersion(payload.version || null)
      setReleaseNotes(payload.releaseNotes || "")
      setDownloadPercent(payload.percent)
      setDownloadSpeed(payload.downloadSpeed)
      setDownloadedBytes(payload.downloadedBytes)
      setTotalBytes(payload.totalBytes)
      setError(payload.error)
    }

    window.electron.ipcRenderer.on("updater:state", onStateUpdate)

    const interval = setInterval(() => {
      void fetchVersion()
    }, 5000)

    return () => {
      ignore = true
      clearInterval(interval)
      window.electron.ipcRenderer.removeListener("updater:state", onStateUpdate)
    }
  }, [])

  const handleCheckNow = async () => {
    const result = await window.electron.ipcRenderer.invoke("updater:check")
    if (result?.found) {
      toast.success(t("updater.updateAvailable"))
    } else if (!result?.ok) {
      toast.error(result?.error || t("updater.checkError"))
    } else {
      toast.success(t("updater.noUpdate"))
    }
  }

  const handleRestart = async () => {
    setIsInstalling(true)
    await window.electron.ipcRenderer.invoke("updater:install")
  }

  const handleDismiss = () => {
    setModalOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-chibangarx-text-secondary hover:bg-chibangarx-accent hover:text-chibangarx-primary transition-colors"
        title={t("updater.title")}
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <Bell size={14} />
        {updateState === "available" || updateState === "downloading" || updateState === "downloaded" ? (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-chibangarx-bg" />
        ) : null}
      </button>

      <Modal open={modalOpen} onClose={handleDismiss}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-5 shadow-xl max-w-lg w-full mx-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-xl font-semibold text-chibangarx-primary">{t("updater.title")}</h2>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-chibangarx-text-secondary hover:text-chibangarx-text"
              aria-label={t("common.close")}
              style={{ WebkitAppRegion: "no-drag" } as any}
            >
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-chibangarx-text-secondary mt-1">
            {t("updater.currentVersion")}: {currentVersion}
          </p>

          {updateState === "checking" && (
            <div className="py-6 text-center">
              <div className="text-chibangarx-text">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-chibangarx-primary border-t-transparent"></div>
              </div>
              <p className="mt-3 text-sm text-chibangarx-text-secondary">{t("updater.checking")}</p>
            </div>
          )}

          {(updateState === "idle" || updateState === "error") && (
            <div className="py-6 text-center">
              {updateState === "error" && error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
              {updateState === "idle" && (
                <p className="text-chibangarx-text mb-4">{t("updater.noUpdate")}</p>
              )}
              <Button onClick={handleCheckNow}>{t("updater.checkNow")}</Button>
            </div>
          )}

          {(updateState === "available" || updateState === "downloading") && updateVersion && (
            <div>
              <div className="bg-chibangarx-bg rounded-xl p-3 mb-4 border border-chibangarx-border-secondary">
                <p className="text-sm text-chibangarx-text mb-2">
                  {t("updater.newVersion")}:{" "}
                  <span className="font-bold text-chibangarx-primary">{updateVersion}</span>
                </p>
                {releaseNotes && (
                  <div className="text-xs text-chibangarx-text-secondary max-h-48 overflow-y-auto prose prose-invert prose-headings:text-chibangarx-primary prose-li:text-chibangarx-text">
                    <ReactMarkdown>{releaseNotes}</ReactMarkdown>
                  </div>
                )}
              </div>

              {updateState === "downloading" && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-chibangarx-text-secondary">
                    <span>{t("updater.downloading")}</span>
                    <span>{Math.floor(downloadPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-chibangarx-border-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chibangarx-primary rounded-full transition-all duration-300"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-chibangarx-text-secondary">
                    <span>{formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}</span>
                    <span>{formatSpeed(downloadSpeed)}</span>
                  </div>
                </div>
              )}

              {updateState === "available" && (
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setModalOpen(false)}
                    className="bg-chibangarx-border-secondary hover:bg-chibangarx-border-secondary text-chibangarx-text"
                  >
                    {t("updater.later")}
                  </Button>
                  <Button onClick={handleCheckNow}>
                    {t("updater.download")}
                  </Button>
                </div>
              )}
            </div>
          )}

          {updateState === "downloaded" && (
            <div className="text-center py-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-green-400">{t("updater.downloaded")}</p>
              </div>
              <p className="text-xs text-chibangarx-text-secondary mb-4">
                {t("updater.versionDownloaded", { version: updateVersion ?? "" })}
              </p>
              <p className="text-xs text-chibangarx-text-secondary mb-4">
                {t("updater.restartInfo")}
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="bg-chibangarx-border-secondary hover:bg-chibangarx-border-secondary text-chibangarx-text"
                >
                  {t("updater.later")}
                </Button>
                <Button
                  onClick={handleRestart}
                  disabled={isInstalling}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isInstalling ? t("updater.installing") : t("updater.restartInstall")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
