import { useEffect, useRef, useState } from "react"
import { Play, Pause, SkipForward, Volume2, VolumeX, Minimize, Maximize, Download, Share2, Settings2 } from "lucide-react"
import Button from "./ui/button"
import Card from "./ui/Card"

interface ClipMetadata {
  id: string
  filePath: string
  name: string
  duration: number
  game: string | null
  favorite: boolean
}

interface ClipPlayerProps {
  clip: ClipMetadata | null
  onClose: () => void
}

export default function ClipPlayer({ clip, onClose }: ClipPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [showControls, setShowControls] = useState(true)

  // Atualizar metadados do clip
  useEffect(() => {
    if (clip && videoRef.current) {
      // Carregar ficheiro de vídeo
      videoRef.current.src = clip.filePath

      // Restaurar estado
      if (playing) videoRef.current.play().catch(console.error)

      // Configurar speed se não for o padrão
      videoRef.current.playbackRate = speed
    }

    return () => {
      // Limpar quando o componente é desmontado
      const url = videoRef.current?.src
      if (url && !url.startsWith("blob:") && !url.startsWith("data:")) {
        URL.revokeObjectURL(url)
      }
    }
  }, [clip, playing])

  // Resetar estado do clip quando mudar
  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setShowControls(true)

    if (videoRef.current) {
      videoRef.current.load()
      videoRef.current.currentTime = 0
    }
  }, [clip?.id])

  // Auto-play quando o clip é aberto
  useEffect(() => {
    if (clip && !isMuted) {
      // Verificar se o volume está acima de 50%
      const checkAutoplay = async () => {
        if (volume > 0.5) {
          await videoRef.current?.play().catch(console.error)
          setPlaying(true)
        }
      }
      checkAutoplay()
    }

    return () => {
      // Cleanup do autoplay quando o clip é fechado
    }
  }, [clip, isMuted, volume])

  // Resetar timer de controles quando interagir
  const handleControlInteraction = () => {
    setShowControls(true)

    // Auto-hide após 3 segundos sem interação
    setTimeout(() => {
      setShowControls(false)
    }, 3000)
  }

  // Atualizar tempo atual ao reproduzir
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Atualizar duração total
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      videoRef.current.playbackRate = speed
    }
  }

  // Controle de volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)

    if (videoRef.current) {
      videoRef.current.volume = newVolume

      // Toggle mute se volume for 0
      setIsMuted(newVolume === 0)
    }

    setShowControls(true)
  }

  // Mute/Unmute
  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted
      setIsMuted(newMuted)
      videoRef.current.muted = newMuted

      if (!newMuted && volume === 0) {
        setVolume(1)
        videoRef.current.volume = 1
      }
    }
  }

  // Avançar/Recuar (10 segundos)
  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime += 10
    }
    handleControlInteraction()
  }

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime -= 10
    }
    handleControlInteraction()
  }

  // Play/Pause
  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (playing) {
        await videoRef.current.pause()
        setPlaying(false)
      } else {
        await videoRef.current.play()
        setPlaying(true)
      }
    }
    handleControlInteraction()
  }

  // Fullscreen
  const toggleFullscreen = async () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    }
    handleControlInteraction()
  }

  // Formatar tempo em HH:MM:SS,mm:ss ou mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00"

    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)

    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`
    }

    return `${seconds}.${milliseconds.toString().padStart(2, "0")}`
  }


  // Atualizar Discord RPC quando o clip é reproduzido
  useEffect(() => {
    if (clip?.game) {
      // Opcional: Atualizar RPC
      // invoke({ channel: "rpc:update-game" })
    }

    return () => {
      // Cleanup quando o clip é fechado
    }
  }, [clip])

  // Renderizar player
  if (!clip) {
    return (
      <Card className="p-8 text-center">
        <div className="text-chibangarx-text-muted">
          <Settings2 size={48} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Sem clip selecionado</h3>
          <p className="text-sm mt-2">Selecione um clip para reproduzir.</p>
        </div>
      </Card>
    )
  }

  
  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden aspect-video"
      onMouseMove={handleControlInteraction}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={clip.filePath}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        className="w-full h-full"
      />

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Top bar com info */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-start justify-between">
          <div className="text-white">
            <h3 className="font-semibold truncate max-w-[200px]">{clip.name}</h3>
            {clip.game && (
              <p className="text-xs text-white/70">{clip.game}</p>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" title="Download">
              <Download size={16} />
            </Button>

            <Button variant="secondary" size="sm" title="Partilhar">
              <Share2 size={16} />
            </Button>

            <Button variant="secondary" size="sm" onClick={onClose} title="Fechar">
              <Minimize size={16} className="rotate-45" />
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center gap-3">
          <button
            onClick={skipBackward}
            className="text-white hover:text-white/80 transition-colors"
          >
            <SkipForward size={20} className="-scale-x-100" />
          </button>

          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => {
              videoRef.current!.currentTime = parseFloat(e.target.value)
            }}
            className="flex-1 h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-chibangarx-primary [&::-webkit-slider-thumb]:rounded-full"
          />

          <button
            onClick={skipForward}
            className="text-white hover:text-white/80 transition-colors"
          >
            <SkipForward size={20} />
          </button>
        </div>

        {/* Center play button when paused */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={togglePlayPause}
              className="w-20 h-20 bg-chibangarx-primary/90 rounded-full flex items-center justify-center text-white hover:bg-chibangarx-primary transition-colors shadow-lg backdrop-blur-sm pointer-events-auto"
            >
              <Play size={32} className="ml-1" />
            </button>
          </div>
        )}

        {/* Bottom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            {/* Play/Pause */}
            <button onClick={togglePlayPause} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              {playing ? (
                <Pause size={20} />
              ) : (
                <Play size={20} />
              )}
            </button>

            {/* Mute toggle */}
            <div className="flex items-center gap-2 group relative">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title={isMuted ? "Ligar som" : "Silenciar"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={20} />
                ) : (
                  <Volume2 size={20} />
                )}
              </button>

              {/* Volume slider */}
              <div className="hidden group-hover:flex items-center gap-2 w-32 bg-black/50 rounded-full p-1">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-chibangarx-primary [&::-webkit-slider-thumb]:rounded-full"
                />
              </div>
            </div>

            {/* Time display */}
            <span className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration || clip.duration)}
            </span>
          </div>

          {/* Speed and fullscreen */}
          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <select
              value={speed}
              onChange={(e) => {
                setSpeed(parseFloat(e.target.value))
                if (videoRef.current) {
                  videoRef.current.playbackRate = parseFloat(e.target.value)
                }
              }}
              className="bg-black/50 text-white text-sm px-2 py-1 rounded outline-none border border-white/10"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={document.fullscreenElement ? "Sair do modo de ecrã inteiro" : "Ecrã inteiro"}
            >
              {document.fullscreenElement ? (
                <Minimize size={20} />
              ) : (
                <Maximize size={20} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
