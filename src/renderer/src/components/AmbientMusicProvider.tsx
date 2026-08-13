import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react"

const TRACK_PATH_KEY = "chibangarx:ambientMusicPath"
const TRACK_URL_KEY = "chibangarx:ambientMusicUrl"
const TRACK_NAME_KEY = "chibangarx:ambientMusicName"
const VOLUME_KEY = "chibangarx:ambientMusicVolume"
const DEFAULT_VOLUME = 0.15

interface SelectedTrack {
  path: string
  url: string
  name: string
}

interface AmbientMusicContextValue {
  trackName: string
  isPlaying: boolean
  volume: number
  chooseTrack: (playAfterSelection?: boolean) => Promise<void>
  togglePlayback: () => Promise<void>
  setVolume: (volume: number) => void
  clearTrack: () => void
}

const AmbientMusicContext = createContext<AmbientMusicContextValue | null>(null)

function loadVolume(): number {
  const stored = Number(localStorage.getItem(VOLUME_KEY))
  return Number.isFinite(stored) && stored >= 0 && stored <= 0.5 ? stored : DEFAULT_VOLUME
}

export function AmbientMusicProvider({ children }: { children: ReactNode }): React.ReactElement {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [track, setTrack] = useState<SelectedTrack | null>(() => {
    const path = localStorage.getItem(TRACK_PATH_KEY)
    const url = localStorage.getItem(TRACK_URL_KEY)
    const name = localStorage.getItem(TRACK_NAME_KEY)
    return path && url && name ? { path, url, name } : null
  })
  const [volume, updateVolume] = useState(loadVolume)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
    localStorage.setItem(VOLUME_KEY, String(volume))
  }, [volume])

  const startPlayback = async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }

  const chooseTrack = async (playAfterSelection = false) => {
    const selected = (await window.electron.ipcRenderer.invoke(
      "ambient-music:choose-file",
    )) as SelectedTrack | null
    if (!selected) return

    audioRef.current?.pause()
    setIsPlaying(false)
    setTrack(selected)
    localStorage.setItem(TRACK_PATH_KEY, selected.path)
    localStorage.setItem(TRACK_URL_KEY, selected.url)
    localStorage.setItem(TRACK_NAME_KEY, selected.name)

    if (playAfterSelection) window.setTimeout(() => void startPlayback(), 0)
  }

  const togglePlayback = async () => {
    if (!track) {
      await chooseTrack(true)
      return
    }
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      await startPlayback()
    }
  }

  const setVolume = (nextVolume: number) => {
    updateVolume(Math.min(0.5, Math.max(0, nextVolume)))
  }

  const clearTrack = () => {
    audioRef.current?.pause()
    setIsPlaying(false)
    setTrack(null)
    localStorage.removeItem(TRACK_PATH_KEY)
    localStorage.removeItem(TRACK_URL_KEY)
    localStorage.removeItem(TRACK_NAME_KEY)
  }

  const value = useMemo(
    () => ({
      trackName: track?.name ?? "",
      isPlaying,
      volume,
      chooseTrack,
      togglePlayback,
      setVolume,
      clearTrack,
    }),
    [track, isPlaying, volume],
  )

  return (
    <AmbientMusicContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        src={track?.url}
        loop
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />
    </AmbientMusicContext.Provider>
  )
}

export function useAmbientMusic(): AmbientMusicContextValue {
  const context = useContext(AmbientMusicContext)
  if (!context) throw new Error("useAmbientMusic must be used within AmbientMusicProvider")
  return context
}
