import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  CloudDownload,
  Loader2,
  RefreshCw,
  Check,
  History,
  ExternalLink,
  Bell,
  Package,
  AlertTriangle,
  Download,
  FolderOpen,
} from "lucide-react"
import RootDiv from "@/components/rootdiv"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/button"
import { toast } from "react-toastify"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export type UpdateState =
  "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "error"

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

interface ReleaseHistoryEntry {
  tagName: string
  name: string
  body: string
  publishedAt: string
  url: string
  prerelease: boolean
}

interface LatestAsset {
  name: string
  url: string
  size: number
}

interface LatestRelease {
  version: string
  tagName: string
  assets: LatestAsset[]
}

interface AssetDownload {
  percent: number
  downloading: boolean
  done: boolean
  path?: string
}

export default function Updates() {
  const { t } = useTranslation()
  const [currentVersion, setCurrentVersion] = useState("")
  const [updateState, setUpdateState] = useState<UpdateState>("idle")
  const [updateVersion, setUpdateVersion] = useState<string | null>(null)
  const [releaseNotes, setReleaseNotes] = useState("")
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [downloadSpeed, setDownloadSpeed] = useState(0)
  const [downloadedBytes, setDownloadedBytes] = useState(0)
  const [totalBytes, setTotalBytes] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<ReleaseHistoryEntry[]>([])
  const [latestRelease, setLatestRelease] = useState<LatestRelease | null>(null)
  const [assetDownloads, setAssetDownloads] = useState<Record<string, AssetDownload>>({})
  const [isChecking, setIsChecking] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  const getErrorMessage = (code: string | null): string =>
    code === "updateTemporarilyUnavailable"
      ? t("updater.temporarilyUnavailable")
      : t("updater.checkError")

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

  const loadHistory = async () => {
    try {
      const releases = await window.electron.ipcRenderer.invoke("updater:history")
      setHistory(releases || [])
    } catch (err: any) {
      console.error("Failed to load release history:", err)
    }
  }

  const loadLatestAssets = async () => {
    try {
      const release = await window.electron.ipcRenderer.invoke("updater:latest-assets")
      setLatestRelease(release)
    } catch (err: any) {
      console.error("Failed to load latest release assets:", err)
    }
  }

  const loadVersion = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke("updater:get-version")
      if (result) {
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
    } catch {}
  }

  useEffect(() => {
    void loadVersion()
    void loadHistory()
    void loadLatestAssets()

    const onStateUpdate = (_event: unknown, payload: UpdateStatePayload) => {
      setUpdateState(payload.newState)
      setUpdateVersion(payload.version || null)
      setReleaseNotes(payload.releaseNotes || "")
      setDownloadPercent(payload.percent)
      setDownloadSpeed(payload.downloadSpeed)
      setDownloadedBytes(payload.downloadedBytes)
      setTotalBytes(payload.totalBytes)
      setError(payload.error)
    }

    const onAssetProgress = (_event: unknown, payload: { name: string; percent: number }) => {
      setAssetDownloads((prev) => {
        const current = prev[payload.name]
        if (!current || !current.downloading) return prev
        return { ...prev, [payload.name]: { ...current, percent: payload.percent } }
      })
    }

    window.electron.ipcRenderer.on("updater:state", onStateUpdate)
    window.electron.ipcRenderer.on("updater:asset-progress", onAssetProgress)
    return () => {
      window.electron.ipcRenderer.removeListener("updater:state", onStateUpdate)
      window.electron.ipcRenderer.removeListener("updater:asset-progress", onAssetProgress)
    }
  }, [])

  const handleCheckNow = async () => {
    if (isChecking) return
    setIsChecking(true)
    try {
      const result = await window.electron.ipcRenderer.invoke("updater:check")
      if (result?.found) {
        toast.success(t("updatesPage.updateAvailable"))
      } else if (!result?.ok && result?.error) {
        toast.error(getErrorMessage(result.error))
      } else {
        toast.success(t("updatesPage.upToDate"))
      }
    } catch (err: any) {
      toast.error(err?.message || t("updatesPage.error"))
    } finally {
      setIsChecking(false)
    }
  }

  const handleDownload = async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke("updater:download")
      if (!result?.ok && result?.error) {
        toast.error(getErrorMessage(result.error))
      }
    } catch (err: any) {
      toast.error(err?.message || t("updatesPage.error"))
    }
  }

  const handleRestart = async () => {
    setIsInstalling(true)
    await window.electron.ipcRenderer.invoke("updater:install")
  }

  const handleDownloadAsset = async (asset: LatestAsset) => {
    if (assetDownloads[asset.name]?.downloading) return
    setAssetDownloads((prev) => ({
      ...prev,
      [asset.name]: { percent: 0, downloading: true, done: false },
    }))
    try {
      const result = await window.electron.ipcRenderer.invoke("updater:download-asset", {
        url: asset.url,
        name: asset.name,
      })
      if (result?.ok) {
        setAssetDownloads((prev) => ({
          ...prev,
          [asset.name]: { percent: 100, downloading: false, done: true, path: result.path },
        }))
        toast.success(t("updatesPage.downloadComplete", { name: asset.name }))
      }
    } catch (err: any) {
      console.error("Asset download failed:", err)
      toast.error(err?.message || t("updatesPage.error"))
      setAssetDownloads((prev) => ({
        ...prev,
        [asset.name]: { percent: 0, downloading: false, done: false },
      }))
    }
  }

  const showDownloadProgress = updateState === "downloading"

  return (
    <RootDiv>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-chibangarx-text flex items-center gap-2">
              <CloudDownload className="w-6 h-6 text-chibangarx-primary" />
              {t("updatesPage.title")}
            </h1>
            <p className="text-sm text-chibangarx-text-secondary mt-1">
              {t("updatesPage.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-chibangarx-text-muted">
                {t("updatesPage.currentVersion")}
              </p>
              <p className="text-sm font-medium text-chibangarx-text">v{currentVersion}</p>
            </div>
            <Button onClick={handleCheckNow} disabled={isChecking || showDownloadProgress}>
              {isChecking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("updatesPage.checking")}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> {t("updatesPage.checkNow")}
                </>
              )}
            </Button>
          </div>
        </div>

        {updateState === "checking" && (
          <Card className="p-6 flex items-center justify-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-chibangarx-primary" />
            <span className="text-chibangarx-text-secondary text-sm">
              {t("updatesPage.checking")}
            </span>
          </Card>
        )}

        {(updateState === "idle" || updateState === "error") && (
          <Card className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-xl">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-chibangarx-text">{t("updatesPage.upToDate")}</p>
              <p className="text-sm text-chibangarx-text-secondary">
                {t("updatesPage.currentVersion")}: v{currentVersion}
              </p>
            </div>
            {updateState === "error" && error && (
              <p className="text-sm text-red-400">{getErrorMessage(error)}</p>
            )}
          </Card>
        )}

        {(updateState === "available" ||
          updateState === "downloading" ||
          updateState === "downloaded") &&
          updateVersion && (
            <Card className="p-6 border-chibangarx-primary/30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-chibangarx-primary/10 rounded-xl">
                    <Bell className="w-6 h-6 text-chibangarx-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-chibangarx-text-muted uppercase tracking-wider">
                      {t("updatesPage.updateAvailable")}
                    </p>
                    <p className="text-xl font-semibold text-chibangarx-text">
                      {t("updatesPage.newVersion", { version: updateVersion })}
                    </p>
                  </div>
                </div>
                {updateState === "downloaded" && (
                  <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                    {t("updatesPage.downloaded")}
                  </span>
                )}
              </div>

              {releaseNotes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-chibangarx-text mb-2">
                    {t("updatesPage.whatChanged")}
                  </p>
                  <div className="bg-chibangarx-bg rounded-xl p-4 border border-chibangarx-border-secondary text-sm text-chibangarx-text-secondary max-h-72 overflow-y-auto custom-scrollbar prose prose-invert prose-headings:text-chibangarx-primary prose-li:text-chibangarx-text prose-p:text-chibangarx-text-secondary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{releaseNotes}</ReactMarkdown>
                  </div>
                </div>
              )}

              {showDownloadProgress && (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs text-chibangarx-text-secondary">
                    <span>{t("updatesPage.downloading")}</span>
                    <span>{Math.floor(downloadPercent)}%</span>
                  </div>
                  <div className="w-full h-2 bg-chibangarx-border-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-chibangarx-primary rounded-full transition-all duration-300"
                      style={{ width: `${downloadPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-chibangarx-text-secondary">
                    <span>
                      {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                    </span>
                    <span>{formatSpeed(downloadSpeed)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3">
                {updateState === "available" && (
                  <>
                    <Button variant="secondary" onClick={handleCheckNow} disabled={isChecking}>
                      {t("updatesPage.later")}
                    </Button>
                    <Button onClick={handleDownload}>
                      <CloudDownload className="w-4 h-4" /> {t("updatesPage.download")}
                    </Button>
                  </>
                )}
                {updateState === "downloaded" && (
                  <Button
                    onClick={handleRestart}
                    disabled={isInstalling}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isInstalling ? t("updatesPage.installing") : t("updatesPage.restartInstall")}
                  </Button>
                )}
              </div>
            </Card>
          )}

        <div className="pt-2">
          <h2 className="text-lg font-semibold text-chibangarx-text flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-chibangarx-primary" />
            {t("updatesPage.downloads")}
          </h2>
          <p className="text-xs text-chibangarx-text-muted mb-4">
            {t("updatesPage.downloadsDesc")}
          </p>

          {latestRelease && latestRelease.assets.length > 0 ? (
            <Card className="p-5">
              <p className="text-sm text-chibangarx-text mb-4">
                {t("updatesPage.latestRelease", { version: latestRelease.version })}
              </p>
              <div className="space-y-3">
                {latestRelease.assets.map((asset) => {
                  const dl = assetDownloads[asset.name]
                  const sizeMB = asset.size ? (asset.size / 1024 / 1024).toFixed(1) : null
                  return (
                    <div
                      key={asset.name}
                      className="flex items-center gap-3 p-3 rounded-xl bg-chibangarx-bg border border-chibangarx-border-secondary"
                    >
                      <div className="p-2 bg-chibangarx-accent rounded-lg shrink-0">
                        <Package className="w-4 h-4 text-chibangarx-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium text-chibangarx-text truncate"
                          title={asset.name}
                        >
                          {asset.name}
                        </p>
                        {sizeMB && (
                          <p className="text-xs text-chibangarx-text-muted">{sizeMB} MB</p>
                        )}
                        {dl?.downloading && (
                          <div className="w-full h-1.5 bg-chibangarx-border-secondary rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-chibangarx-primary rounded-full transition-all duration-300"
                              style={{ width: `${dl.percent}%` }}
                            />
                          </div>
                        )}
                      </div>
                      {dl?.done ? (
                        <Button
                          variant="secondary"
                          onClick={() =>
                            window.electron.ipcRenderer.invoke("updater:open-downloads")
                          }
                        >
                          <FolderOpen className="w-4 h-4" /> {t("updatesPage.openFolder")}
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleDownloadAsset(asset)}
                          disabled={dl?.downloading}
                        >
                          {dl?.downloading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> {dl.percent}%
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" /> {t("updatesPage.downloadAsset")}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center text-chibangarx-text-secondary text-sm">
              {t("updatesPage.historyEmpty")}
            </Card>
          )}
        </div>

        <div className="pt-2">
          <h2 className="text-lg font-semibold text-chibangarx-text flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-chibangarx-primary" />
            {t("updatesPage.history")}
          </h2>

          {history.length === 0 ? (
            <Card className="p-6 text-center text-chibangarx-text-secondary text-sm">
              {t("updatesPage.historyEmpty")}
            </Card>
          ) : (
            <div className="space-y-4">
              {history.map((release) => {
                const isCurrent = release.tagName.replace("v", "") === currentVersion
                return (
                  <Card key={release.tagName} className="p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="p-2 bg-chibangarx-accent rounded-lg">
                          <Package className="w-5 h-5 text-chibangarx-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-chibangarx-text">
                            {release.name || release.tagName}
                          </p>
                          <p className="text-xs text-chibangarx-text-muted">
                            {release.tagName}
                            {release.publishedAt &&
                              ` · ${t("updatesPage.released", {
                                date: new Date(release.publishedAt).toLocaleDateString(),
                              })}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCurrent && (
                          <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
                            {t("updatesPage.current")}
                          </span>
                        )}
                        {release.prerelease && (
                          <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 text-xs font-medium">
                            {t("updatesPage.prerelease")}
                          </span>
                        )}
                        <button
                          className="p-2 rounded-lg text-chibangarx-text-secondary hover:bg-chibangarx-accent hover:text-chibangarx-primary transition-all"
                          title={t("updatesPage.viewOnGithub")}
                          onClick={() => window.open(release.url, "_blank")}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {release.body ? (
                      <div className="text-sm text-chibangarx-text-secondary prose prose-invert prose-headings:text-chibangarx-primary prose-li:text-chibangarx-text prose-p:text-chibangarx-text-secondary max-h-56 overflow-y-auto custom-scrollbar">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{release.body}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm text-chibangarx-text-muted flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {t("updatesPage.noNotes")}
                      </p>
                    )}
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RootDiv>
  )
}
