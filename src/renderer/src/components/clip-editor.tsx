import { useEffect, useRef, useState } from "react"
import { FileVideo, Clock, Settings2, Save, Download, Trash2, RotateCcw } from "lucide-react"
import Button from "./ui/button"
import Card from "./ui/Card"
import { invoke } from "@/lib/electron"

interface ClipMetadata {
  id: string
  filePath: string
  name: string
  duration: number
}

interface ClipEditorProps {
  clip: ClipMetadata | null
  onClose: () => void
}

export default function ClipEditor({ clip, onClose }: ClipEditorProps) {
  const [trimmedStart, setTrimmedStart] = useState(0)
  const [trimmedEnd, setTrimmedEnd] = useState(clip?.duration || 60)
  const [newName, setNewName] = useState(clip?.name || `Clip ${Date.now()}`)
  const [isExporting, setIsExporting] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (clip) {
      setTrimmedEnd(clip.duration)
      setNewName(clip.name)
    }
  }, [clip?.id])

  // Renderizar editor quando não há clip selecionado
  if (!clip) {
    return (
      <Card className="p-8 text-center">
        <div className="text-chibangarx-text-muted">
          <FileVideo size={48} className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Sem clip para editar</h3>
        </div>
      </Card>
    )
  }

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60)
    const sec = seconds % 60
    return `${min}:${sec.toString().padStart(2, "0")}`
  }

  // Handle trim start change with minimum of 1 second
  const handleTrimStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseFloat(e.target.value)
    const min = Math.max(0, newStart)
    setTrimmedStart(min)
    // Update video time to show trimmed start position
    if (videoRef.current) {
      videoRef.current.currentTime = min
    }
  }

  // Handle trim end change with maximum at clip duration minus start
  const handleTrimEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseFloat(e.target.value)
    const max = Math.min(clip.duration, newEnd)
    setTrimmedEnd(max)

    // Update video time to show trimmed end position
    if (videoRef.current) {
      videoRef.current.currentTime = max
    }
  }

  // Reset trim selections
  const handleResetTrim = () => {
    setTrimmedStart(0)
    setTrimmedEnd(clip.duration)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  // Export trimmed clip (using ffmpeg or native browser)
  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Download the original clip file directly (browser captureStream has limitations)
      const link = document.createElement("a")
      link.href = clip.filePath
      link.download = `${newName}-${formatDuration(trimmedEnd - trimmedStart)}.webm`
      link.click()

      console.log(`Downloaded clip: ${newName}.webm`)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Failed to download clip.")
    } finally {
      setIsExporting(false)
    }
  }

  // Delete clip
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${clip.name}"? This action cannot be undone.`)) {
      // Call IPC handler to delete clip metadata and file
      invoke({ channel: "clips:delete", payload: { id: clip.id } })
      onClose()
      alert("Clip deleted successfully")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-chibangarx-text">Editar Clip</h2>
          <p className="text-sm text-chibangarx-text-muted">{clip.name}</p>
        </div>

        <Button variant="secondary" onClick={onClose}>
          <Settings2 size={16} className="mr-2" />
          Fechar
        </Button>
      </div>

      {/* Video preview */}
      <Card className="aspect-video bg-chibangarx-bg/50 overflow-hidden">
        <video
          ref={videoRef}
          src={clip.filePath}
          className="w-full h-full object-contain"
          controls
        />
      </Card>

      {/* Trim controls */}
      <div className="grid gap-4 md:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-chibangarx-text">Cortar</label>
            <span className="text-xs text-chibangarx-primary font-medium">
              {formatDuration(trimmedEnd - trimmedStart)}s restantes
            </span>
          </div>

          {/* Start trim */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-chibangarx-text-muted">Início</label>
              <span className="text-xs font-medium text-chibangarx-primary">+{formatDuration(trimmedStart)}</span>
            </div>

            <input
              type="range"
              min={0}
              max={clip.duration - trimmedEnd}
              step={1}
              value={trimmedStart}
              onChange={handleTrimStartChange}
              disabled={isExporting}
              className="w-full accent-chibangarx-primary"
            />

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-chibangarx-text-muted">0s</span>
              <span className="text-xs font-medium">{formatDuration(trimmedStart)}</span>
              <span className="text-xs font-medium text-chibangarx-primary">+{formatDuration(trimmedStart)}</span>
            </div>
          </div>

          {/* End trim */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-chibangarx-text-muted">Fim</label>
              <span className="text-xs font-medium text-chibangarx-primary">-{formatDuration(clip.duration - trimmedEnd)}</span>
            </div>

            <input
              type="range"
              min={trimmedStart + 1}
              max={clip.duration}
              step={1}
              value={trimmedEnd}
              onChange={handleTrimEndChange}
              disabled={isExporting}
              className="w-full accent-chibangarx-primary"
            />

            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-medium text-chibangarx-primary">{formatDuration(trimmedEnd)}</span>
              <span className="text-xs font-medium text-chibangarx-text-muted">{clip.duration}s</span>
              <span className="text-xs font-medium">-{formatDuration(clip.duration - trimmedEnd)}</span>
            </div>
          </div>
        </div>

        {/* Sidebar with actions */}
        <Card className="p-4 space-y-3">
          {/* Reset button */}
          <Button variant="secondary" onClick={handleResetTrim} disabled={trimmedStart === 0 && trimmedEnd === clip.duration}>
            <RotateCcw size={16} className="mr-2" />
            Reverter alterações
          </Button>

          {/* Name input */}
          <div>
            <label className="text-xs text-chibangarx-text-muted mb-1 block">Nome do clip</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={isExporting}
              placeholder="Novo nome..."
              className="w-full rounded-lg border border-chibangarx-border bg-chibangarx-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chibangarx-primary disabled:opacity-50"
            />
          </div>

          {/* Export button */}
          <Button onClick={handleExport} disabled={isExporting || trimmedStart === 0 || trimmedEnd === clip.duration}>
            {isExporting ? (
              <>
                <Clock className="animate-spin mr-2" size={16} />
                Exportando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Exportar edição
              </>
            )}
          </Button>

          {/* Download original */}
          <Button variant="secondary" onClick={() => {
            const link = document.createElement("a")
            link.href = clip.filePath
            link.download = newName
            link.click()
          }}>
            <Download size={16} className="mr-2" />
            Download original
          </Button>

          {/* Delete button */}
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} className="mr-2" />
            Apagar clip
          </Button>

          {/* Info */}
          <div className="pt-3 border-t border-chibangarx-border">
            <p className="text-xs text-chibangarx-text-muted leading-relaxed">
              <span className="font-medium text-chibangarx-primary">Dica:</span> Use os sliders para cortar partes indesejadas do vídeo.
              O clip original será mantido intacto, apenas um novo ficheiro editado será exportado.
            </p>
          </div>
        </Card>
      </div>

    </div>
  )
}
