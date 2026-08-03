import { useState, useRef, useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function AudioPlayer(): React.ReactElement {
  const { t } = useTranslation()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("chibangarx:musicVolume")
    return saved !== null ? Number(saved) : 30
  })
  const [audioSrc, setAudioSrc] = useState<string | null>(null)

  useEffect(() => {
    const loadAudio = async () => {
      try {
        const resourcesPath = await window.electron.ipcRenderer.invoke("get-resources-path")
        setAudioSrc(`file:///${resourcesPath.replace(/\\/g, "/")}/bgmusic.mp3`)
        setPlaying(true)
      } catch (err) {
        console.error("[AudioPlayer] Failed to get resources path:", err)
      }
    }
    loadAudio()
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume / 100
    }
  }, [volume, muted])

  useEffect(() => {
    if (!audioRef.current || !audioSrc) return
    if (playing) {
      audioRef.current.play().catch(() => setPlaying(false))
    } else {
      audioRef.current.pause()
    }
  }, [playing, audioSrc])

  const handlePlayPause = () => {
    if (!audioRef.current) return
    setPlaying((p) => !p)
  }

  const handleMute = () => {
    setMuted((m) => !m)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setVolume(v)
    localStorage.setItem("chibangarx:musicVolume", v.toString())
    if (v > 0 && muted) setMuted(false)
  }

  return (
    <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: "no-drag" } as any}>
      {audioSrc && (
        <audio ref={audioRef} src={audioSrc} loop preload="auto" />
      )}
      <button
        onClick={handlePlayPause}
        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-chibangarx-text-secondary hover:bg-chibangarx-accent hover:text-chibangarx-primary transition-colors"
         title={playing ? t("audio.pause") : t("audio.play")}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        )}
      </button>
      <button
        onClick={handleMute}
        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-chibangarx-text-secondary hover:bg-chibangarx-accent hover:text-chibangarx-primary transition-colors"
         title={muted ? t("audio.unmute") : t("audio.mute")}
      >
        {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={muted ? 0 : volume}
        onChange={handleVolumeChange}
        className="w-20 h-1 accent-chibangarx-primary cursor-pointer"
         title={t("audio.volume", { volume })}
      />
    </div>
  )
}
