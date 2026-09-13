import { useMemo } from "react"
import { FileVideo, Star, Calendar, Monitor, Clock, Gamepad2, Trash2, RefreshCw } from "lucide-react"
import Button from "./ui/button"
import Card from "./ui/Card"

interface ClipMetadata {
  id: string
  filePath: string
  name: string
  duration: number
  size: number
  resolution: string
  fps: number
  game: string | null
  timestamp: number
  favorite: boolean
  tags?: string[]
}

interface ClipGridProps {
  clips: ClipMetadata[]
  loading: boolean
  onOpenClip: (clip: ClipMetadata) => void
}

// Função para formatar duração em segundos
const formatDuration = (seconds: number): string => {
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
}

// Formatar tamanho do ficheiro
const formatSize = (bytes: number): string => {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

export default function ClipGrid({ clips, loading, onOpenClip }: ClipGridProps) {
  // Formatar lista de tags para exibição
  const getTagsDisplay = (tags?: string[]) => {
    if (!tags || tags.length === 0) return null
    return tags.slice(0, 3).map(tag => (
      <span key={tag} className="text-xs bg-chibangarx-primary/10 text-chibangarx-primary px-2 py-1 rounded-full">
        {tag}
      </span>
    ))
  }

  // Criar layout em grid responsivo
  const gridClass = useMemo(() => {
    if (clips.length === 0) return "grid-cols-1"
    if (clips.length <= 3) return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    if (clips.length <= 6) return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
  }, [clips.length])

  // Função para obter ícone baseado no tipo de clip
  const getIcon = (clip: ClipMetadata) => {
    if (clip.favorite) return <Star size={20} className="text-chibangarx-primary fill-current" />
    return <FileVideo size={20} className="text-chibangarx-primary" />
  }

  // Formatar data do clip
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const daysDiff = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMs < 3600000) return "Agora" // Hoje
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)} horas atrás`
    if (daysDiff === 1) return "Ontem"
    if (daysDiff <= 7) return `${daysDiff} dias atrás`

    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "2-digit" })
  }

  // Renderizar lista vazia quando não há clips
  if (clips.length === 0 && !loading) {
    return (
      <div className="text-center py-16 bg-chibangarx-bg/50 rounded-xl border-2 border-dashed border-chibangarx-border">
        <FileVideo size={48} className="mx-auto mb-4 text-chibangarx-text-muted" />
        <p className="text-chibangarx-text-secondary">Nenhum clip encontrado.</p>
        <p className="text-sm text-chibangarx-text-muted mt-2">Grave seus primeiros clips jogando!</p>
      </div>
    )
  }

  // Renderizar grid de clips
  return (
    <div className={`grid gap-4 md:gap-6 ${gridClass}`}>
      {clips.map(clip => (
        <Card key={clip.id} className="group overflow-hidden transition-all hover:shadow-lg hover:border-chibangarx-primary/50">
          {/* Thumbnail ou placeholder */}
          <div className="relative aspect-video bg-chibangarx-bg/50 flex items-center justify-center overflow-hidden">
            {/* Usar thumbnail se disponível, senão placeholder com informações */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />

            <div className="relative z-10 text-center p-4">
              {getIcon(clip)}
              <p className="text-xs text-chibangarx-text-muted mt-2 truncate max-w-full">
                {clip.name || clip.game || "Clip"}
              </p>

              {/* Info badges */}
              <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-chibangarx-text-muted">
                <Monitor size={10} />
                <span>{clip.resolution}</span>
                <span>•</span>
                <Clock size={10} />
                <span>{formatDuration(clip.duration)} • {clip.fps}fps</span>
              </div>
            </div>

            {/* Game tag */}
            {clip.game && (
              <div className="absolute top-2 left-2 bg-chibangarx-primary/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Gamepad2 size={12} />
                {clip.game}
              </div>
            )}

            {/* Favorite badge */}
            {clip.favorite && (
              <div className="absolute top-2 right-2 bg-chibangarx-accent/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Star size={12} />
                Favorito
              </div>
            )}
          </div>

          {/* Clip info */}
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-chibangarx-text truncate" title={clip.name}>
                  {clip.name || clip.game || "Clip"}
                </h3>
                <p className="text-xs text-chibangarx-text-muted truncate mt-1">
                  {clip.game ? `${clip.name} • ${clip.game}` : ""}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="secondary" size="sm" onClick={() => onOpenClip(clip)} title="Ver clip">
                  <FileVideo size={16} />
                </Button>

                <Button variant="secondary" size="sm" onClick={() => {
                  // Implementar funcionalidade de marcar/desmarcar favorito
                  console.log(`Toggle favorite for ${clip.id}`)
                }} title={clip.favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                  <Star size={16} className={clip.favorite ? "fill-current text-chibangarx-accent" : ""} />
                </Button>

                <Button variant="secondary" size="sm" onClick={() => {
                  // Implementar abrir ficheiro na pasta de clips
                  console.log(`Open file: ${clip.filePath}`)
                }} title="Abrir ficheiro">
                  <FileVideo size={16} className="text-blue-500" />
                </Button>

                <Button variant="secondary" size="sm" onClick={() => {
                  // Implementar edição de clip
                  console.log(`Edit clip: ${clip.id}`)
                }} title="Editar">
                  <FileVideo size={16} className="text-orange-500" />
                </Button>

                <Button variant="secondary" size="sm" onClick={() => {
                  // Confirmar antes de deletar
                  if (confirm(`Tem a certeza que deseja apagar "${clip.name}"?`)) {
                    // Implementar deletar clip
                    console.log(`Delete clip: ${clip.id}`)
                  }
                }} title="Apagar">
                  <Trash2 size={16} className="text-red-500" />
                </Button>
              </div>
            </div>

            {/* Metadata grid */}
            <div className="flex items-center gap-3 text-xs text-chibangarx-text-muted">
              {clip.duration > 0 && (
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDuration(clip.duration)}</span>
                </div>
              )}

              {clip.fps > 0 && (
                <div className="flex items-center gap-1">
                  <Monitor size={12} />
                  <span>{clip.fps}fps</span>
                </div>
              )}

              {(clip as any).size && (
                <div className="flex items-center gap-1">
                  <FileVideo size={12} />
                  <span>{formatSize((clip as any).size)}</span>
                </div>
              )}

              {getTagsDisplay(clip.tags)}
            </div>
          </div>

          {/* Footer com data */}
          <div className="px-4 py-2 bg-chibangarx-bg/50 border-t border-chibangarx-border flex items-center justify-between">
            <span className="text-xs text-chibangarx-text-muted flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(clip.timestamp)}
            </span>

            {/* Duração rápida */}
            <span className="text-xs text-chibangarx-primary font-medium">
              {formatDuration(clip.duration)}
            </span>
          </div>
        </Card>
      ))}

      {/* Loading placeholder */}
      {loading && (
        <div className="col-span-full flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-chibangarx-text-muted animate-pulse">
            <RefreshCw size={20} className="animate-spin" />
            <span>Carregando clips...</span>
          </div>
        </div>
      )}
    </div>
  )
}
