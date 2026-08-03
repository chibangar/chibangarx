import { useState, useEffect } from "react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { Bell } from "lucide-react"

interface UpdatePayload {
  version?: string
  message?: string
  percent?: number
  releaseNotes?: string
}

export default function UpdateManager(): React.ReactElement {
  const [modalOpen, setModalOpen] = useState(false)
  const [hasUpdate, setHasUpdate] = useState(false)
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState<string>("")
  const [currentVersion, setCurrentVersion] = useState<string>("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

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
    }
    const onNotAvailable = () => {
      setHasUpdate(false)
    }
    const onError = () => {
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
    }

    window.electron.ipcRenderer.on("updater:available", onAvailable)
    window.electron.ipcRenderer.on("updater:not-available", onNotAvailable)
    window.electron.ipcRenderer.on("updater:error", onError)
    window.electron.ipcRenderer.on("updater:download-progress", onProgress)
    window.electron.ipcRenderer.on("updater:downloaded", onDownloaded)

    return () => {
      window.electron.ipcRenderer.removeListener("updater:available", onAvailable)
      window.electron.ipcRenderer.removeListener("updater:not-available", onNotAvailable)
      window.electron.ipcRenderer.removeListener("updater:error", onError)
      window.electron.ipcRenderer.removeListener("updater:download-progress", onProgress)
      window.electron.ipcRenderer.removeListener("updater:downloaded", onDownloaded)
    }
  }, [])

  const handleDownload = async () => {
    setIsDownloading(true)
    setDownloadPercent(0)
    await window.electron.ipcRenderer.invoke("updater:download")
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    await window.electron.ipcRenderer.invoke("updater:install")
  }

  const handleCheckNow = async () => {
    setIsDownloading(false)
    setDownloadPercent(0)
    setIsDownloaded(false)
    await window.electron.ipcRenderer.invoke("updater:check")
  }

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="relative h-8 w-8 inline-flex items-center justify-center rounded-md text-sparkle-text-secondary hover:bg-sparkle-accent hover:text-sparkle-primary transition-colors"
        title="Updates"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <Bell size={14} />
        {hasUpdate && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-sparkle-bg" />
        )}
      </button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-5 shadow-xl max-w-lg w-full mx-4">
          <h2 className="text-xl font-semibold mb-1 text-sparkle-primary">Updates</h2>
          <p className="text-xs text-sparkle-text-secondary mb-4">
            Current version: {currentVersion}
          </p>

          {!hasUpdate && !isDownloaded && (
            <div className="text-center py-6">
              <p className="text-sparkle-text mb-4">No updates available. You're up to date.</p>
              <Button onClick={handleCheckNow}>Check now</Button>
            </div>
          )}

          {hasUpdate && !isDownloaded && (
            <div>
              <div className="bg-sparkle-bg rounded-xl p-3 mb-4 border border-sparkle-border-secondary">
                <p className="text-sm text-sparkle-text">
                  New version available: <span className="font-bold text-sparkle-primary">{updateVersion}</span>
                </p>
                {releaseNotes && (
                  <div className="mt-2 text-xs text-sparkle-text-secondary max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {releaseNotes}
                  </div>
                )}
              </div>
              {isDownloading ? (
                <div>
                  <div className="flex justify-between text-xs text-sparkle-text-secondary mb-1">
                    <span>Downloading...</span>
                    <span>{Math.floor(downloadPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-sparkle-border-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sparkle-primary rounded-full transition-all duration-300"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <Button onClick={handleCheckNow} className="bg-sparkle-border-secondary hover:bg-sparkle-border text-sparkle-text">
                    Check again
                  </Button>
                  <Button onClick={handleDownload}>
                    Download update
                  </Button>
                </div>
              )}
            </div>
          )}

          {isDownloaded && (
            <div className="text-center py-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
                <p className="text-sm text-green-400">
                  Update downloaded successfully!
                </p>
              </div>
              <p className="text-xs text-sparkle-text-secondary mb-4">
                The app will restart to apply the update.
              </p>
              <Button onClick={handleInstall} disabled={isInstalling} className="bg-green-600 hover:bg-green-700">
                {isInstalling ? "Restarting..." : "Restart and install"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
