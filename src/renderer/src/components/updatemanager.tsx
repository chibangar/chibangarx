import { useState, useEffect } from "react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { Bell, Download, X } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

interface UpdatePayload {
  version?: string
  message?: string
  percent?: number
  releaseNotes?: string
  error?: string
}

export default function UpdateManager(): React.ReactElement {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string>("")
  const [currentVersion, setCurrentVersion] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [showUpdateNotice, setShowUpdateNotice] = useState(false)

  useEffect(() => {
    window.electron.ipcRenderer.invoke("updater:get-version").then((v: string) => {
      setCurrentVersion(v)
    })

    const onAvailable = (_e: any, payload: UpdatePayload) => {
      setHasUpdate(true)
      setUpdateVersion(payload?.version ?? null)
      setReleaseNotes(payload?.releaseNotes ?? "")
      setIsDownloading(false)
      setDownloadPercent(0)
      setIsDownloaded(false)
      setShowUpdateNotice(true)
    }
    const onNotAvailable = () => {
      setHasUpdate(false)
    }
    const onError = (_e: any, payload: UpdatePayload) => {
      console.error("[UpdateManager] Error:", payload?.message)
      setIsDownloading(false)
    }
    const onProgress = (_e: any, payload: UpdatePayload) => {
      setIsDownloading(true)
      setDownloadPercent(Math.max(0, Math.min(100, payload.percent || 0)))
    }
    const onDownloaded = () => {
      setIsDownloading(false)
      setDownloadPercent(100)
      setIsDownloaded(true)
      toast.success(t("updater.downloaded"))
    }
    const onDownloadError = (_e: any, payload: UpdatePayload) => {
      console.error("[UpdateManager] Download error:", payload?.error)
      toast.error(payload?.error ?? t("updater.downloadError"))
      setIsDownloading(false)
    }

    const onDownloading = () => {
      setIsDownloading(true)
      setDownloadPercent(0)
      setIsDownloaded(false)
    }

    window.electron.ipcRenderer.on("updater:available", onAvailable)
    window.electron.ipcRenderer.on("updater:not-available", onNotAvailable)
    window.electron.ipcRenderer.on("updater:error", onError)
    window.electron.ipcRenderer.on("updater:downloading", onDownloading)
    window.electron.ipcRenderer.on("updater:download-progress", onProgress)
    window.electron.ipcRenderer.on("updater:downloaded", onDownloaded)
    window.electron.ipcRenderer.on("updater:download-error", onDownloadError)

    // Check again after listeners are attached so a fast response is not missed.
    void window.electron.ipcRenderer
      .invoke("updater:get-available")
      .then((payload: UpdatePayload | null) => {
        if (payload) onAvailable(null, payload)
      })
      .catch(() => undefined)
    void window.electron.ipcRenderer.invoke("updater:check")

    return () => {
      window.electron.ipcRenderer.removeListener("updater:available", onAvailable)
      window.electron.ipcRenderer.removeListener("updater:not-available", onNotAvailable)
      window.electron.ipcRenderer.removeListener("updater:error", onError)
      window.electron.ipcRenderer.removeListener("updater:downloading", onDownloading)
      window.electron.ipcRenderer.removeListener("updater:download-progress", onProgress)
      window.electron.ipcRenderer.removeListener("updater:downloaded", onDownloaded)
      window.electron.ipcRenderer.removeListener("updater:download-error", onDownloadError)
    }
  }, [])

  const handleDownload = () => {
    setIsDownloading(true)
    setDownloadPercent(0)
    setIsDownloaded(false)
    setShowUpdateNotice(false)
    window.electron.ipcRenderer.send("updater:download")
  }

  const handleCheckNow = async () => {
    setIsDownloading(false)
    setDownloadPercent(0)
    setIsDownloaded(false)
    await window.electron.ipcRenderer.invoke("updater:check")
  }

  return (
    <>
      {showUpdateNotice && hasUpdate && !isDownloaded && (
        <div className="fixed right-4 top-14 z-[9998] w-[min(22rem,calc(100vw-2rem))] animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="rounded-xl border border-chibangarx-primary/40 bg-chibangarx-card p-4 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-chibangarx-text">
                  {t("updater.newVersion")}
                </p>
                <p className="mt-1 text-xs text-chibangarx-text-secondary">
                  {t("updater.versionAvailable", { version: updateVersion ?? "" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUpdateNotice(false)}
                className="text-chibangarx-text-secondary hover:text-chibangarx-text"
                aria-label={t("common.close")}
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUpdateNotice(false)
                  setModalOpen(true)
                }}
              >
                {t("updater.details")}
              </Button>
              <Button onClick={handleDownload}>
                <Download size={14} className="mr-1.5" />
                {t("updater.download")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setModalOpen(true)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-chibangarx-text-secondary hover:bg-chibangarx-accent hover:text-chibangarx-primary transition-colors"
        title={t("updater.title")}
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <Bell size={14} />
        {hasUpdate && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-chibangarx-bg" />
        )}
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-5 shadow-xl max-w-lg w-full mx-4">
          <h2 className="text-xl font-semibold mb-1 text-chibangarx-primary">{t("updater.title")}</h2>
          <p className="text-xs text-chibangarx-text-secondary mb-4">
            {t("updater.currentVersion")}: {currentVersion}
          </p>

          {!hasUpdate && !isDownloaded && (
            <div className="text-center py-6">
              <p className="text-chibangarx-text mb-4">{t("updater.noUpdate")}</p>
              <Button onClick={handleCheckNow}>{t("updater.checkNow")}</Button>
            </div>
          )}

          {hasUpdate && !isDownloaded && (
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
              {isDownloading ? (
                <div>
                  <div className="flex justify-between text-xs text-chibangarx-text-secondary mb-1">
                    <span>{t("updater.downloading")}</span>
                    <span>{Math.floor(downloadPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-chibangarx-border-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chibangarx-primary rounded-full transition-all duration-300"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleCheckNow}
                    className="bg-chibangarx-border-secondary hover:bg-chibangarx-border text-chibangarx-text"
                  >
                    {t("updater.checkAgain")}
                  </Button>
                  <Button onClick={handleDownload}>{t("updater.download")}</Button>
                </div>
              )}
            </div>
          )}

          {isDownloaded && (
            <div className="text-center py-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-green-400">{t("updater.downloaded")}</p>
              </div>
              <p className="text-xs text-chibangarx-text-secondary mb-4">
                {t("updater.appliedOnClose")}
              </p>
              <Button
                onClick={() => setModalOpen(false)}
                className="bg-green-600 hover:bg-green-700"
              >
                {t("updater.understood")}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
