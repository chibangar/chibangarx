import { useEffect, useRef, useState } from "react"
import { CircleStop, FolderOpen, RefreshCw, Save, Video } from "lucide-react"
import { useTranslation } from "react-i18next"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import { invoke } from "@/lib/electron"

interface CaptureSource {
  id: string
  name: string
  thumbnail: string
}

interface ClipChunk {
  blob: Blob
  timestamp: number
}

export default function Clips(): React.ReactElement {
  const { t } = useTranslation()
  const [sources, setSources] = useState<CaptureSource[]>([])
  const [selectedSource, setSelectedSource] = useState("")
  const [clipDuration, setClipDuration] = useState(60)
  const [recording, setRecording] = useState(false)
  const [loadingSources, setLoadingSources] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<ClipChunk[]>([])
  const durationRef = useRef(clipDuration)
  const saveClipRef = useRef<() => Promise<void>>(async () => undefined)

  useEffect(() => {
    durationRef.current = clipDuration
  }, [clipDuration])

  const loadSources = async () => {
    setLoadingSources(true)
    try {
      const available = (await invoke({ channel: "clips:get-sources" })) as CaptureSource[]
      setSources(available)
      if (!selectedSource && available.length > 0) setSelectedSource(available[0].id)
    } catch {
      setMessage(t("clips.sourcesError"))
    } finally {
      setLoadingSources(false)
    }
  }

  useEffect(() => {
    loadSources()

    const handleShortcut = () => {
      void saveClipRef.current()
    }
    window.electron.ipcRenderer.on("clips:save-request", handleShortcut)
    return () => {
      window.electron.ipcRenderer.removeListener("clips:save-request", handleShortcut)
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const startRecording = async () => {
    if (!selectedSource) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: selectedSource,
          },
        } as MediaTrackConstraints,
      })
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm"
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size === 0) return
        const now = Date.now()
        chunksRef.current.push({ blob: event.data, timestamp: now })
        const keepFrom = now - Math.max(durationRef.current * 1000, 300_000)
        chunksRef.current = chunksRef.current.filter((chunk) => chunk.timestamp >= keepFrom)
      }
      recorder.start(1000)
      recorderRef.current = recorder
      streamRef.current = stream
      setRecording(true)
      setMessage(t("clips.recordingStarted"))
    } catch {
      setMessage(t("clips.captureError"))
    }
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    recorderRef.current = null
    streamRef.current = null
    setRecording(false)
    setMessage(t("clips.recordingStopped"))
  }

  const saveClip = async () => {
    if (saving || chunksRef.current.length === 0) return
    setSaving(true)
    const cutoff = Date.now() - durationRef.current * 1000
    const recentChunks = chunksRef.current.filter((chunk) => chunk.timestamp >= cutoff)
    const firstChunk = chunksRef.current[0]
    const blobs = firstChunk && recentChunks[0] !== firstChunk ? [firstChunk.blob, ...recentChunks.map((chunk) => chunk.blob)] : recentChunks.map((chunk) => chunk.blob)

    try {
      const data = await new Blob(blobs, { type: "video/webm" }).arrayBuffer()
      const filePath = await invoke({ channel: "clips:save", payload: { data } })
      setMessage(t("clips.saved", { path: filePath }))
    } catch {
      setMessage(t("clips.saveError"))
    } finally {
      setSaving(false)
    }
  }

  saveClipRef.current = saveClip

  return (
    <RootDiv>
      <div className="mx-auto max-w-5xl space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-chibangarx-text">{t("clips.title")}</h1>
          <p className="text-sm text-chibangarx-text-secondary">{t("clips.description")}</p>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-chibangarx-primary/15 p-3 text-chibangarx-primary">
              <Video size={24} />
            </div>
            <div>
              <h2 className="font-semibold text-chibangarx-text">{t("clips.captureTitle")}</h2>
              <p className="text-sm text-chibangarx-text-secondary">{t("clips.captureDescription")}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_260px]">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-chibangarx-text">{t("clips.window")}</label>
                <button type="button" onClick={loadSources} className="text-chibangarx-primary" title={t("clips.refresh")}>
                  <RefreshCw size={16} className={loadingSources ? "animate-spin" : ""} />
                </button>
              </div>
              <select
                value={selectedSource}
                onChange={(event) => setSelectedSource(event.target.value)}
                disabled={recording || loadingSources}
                className="w-full rounded-lg border border-chibangarx-border bg-chibangarx-bg px-3 py-2 text-sm text-chibangarx-text"
              >
                {sources.length === 0 && <option value="">{t("clips.noWindows")}</option>}
                {sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}
              </select>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <label htmlFor="clip-duration" className="font-medium text-chibangarx-text">{t("clips.duration")}</label>
                <span className="text-chibangarx-primary">{clipDuration}s</span>
              </div>
              <input
                id="clip-duration"
                type="range"
                min="10"
                max="300"
                step="10"
                value={clipDuration}
                onChange={(event) => setClipDuration(Number(event.target.value))}
                disabled={recording}
                className="w-full accent-chibangarx-primary"
              />
              <div className="mt-1 flex justify-between text-xs text-chibangarx-text-muted"><span>10s</span><span>300s</span></div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!recording ? (
              <Button onClick={startRecording} disabled={!selectedSource || loadingSources}><Video size={16} className="mr-2" />{t("clips.start")}</Button>
            ) : (
              <Button variant="danger" onClick={stopRecording}><CircleStop size={16} className="mr-2" />{t("clips.stop")}</Button>
            )}
            <Button variant="secondary" onClick={saveClip} disabled={!recording || saving}><Save size={16} className="mr-2" />{t("clips.save")}</Button>
            <Button variant="secondary" onClick={() => invoke({ channel: "open-clips-folder" })}><FolderOpen size={16} className="mr-2" />{t("clips.openFolder")}</Button>
          </div>

          <p className="mt-4 text-sm text-chibangarx-text-secondary">{t("clips.shortcut")}</p>
          {message && <p className="mt-2 text-sm text-chibangarx-primary">{message}</p>}
        </Card>
      </div>
    </RootDiv>
  )
}
