import { useEffect, useState, useCallback } from "react"
import { FolderOpen, Search, Filter, Gamepad2, Settings } from "lucide-react"
import { useTranslation } from "react-i18next"
import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import { invoke } from "@/lib/electron"
import ClipGrid from "@/components/clip-grid"

interface CaptureSource {
  id: string
  name: string
  thumbnail: string
  gameId?: string | null
  isGame?: boolean
}

export default function Clips() {
  const { t } = useTranslation()
  const [selectedSource, setSelectedSource] = useState<string | undefined>()
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState({
    type: "all" as "all" | "today" | "week" | "month" | "favorites" | "game",
    gameId: undefined as string | undefined,
    searchQuery: "",
    sortOrder: "newest" as "newest" | "oldest" | "duration" | "size",
  })

  const handleGlobalSave = useCallback(async () => {
    try {
      await invoke({ channel: "clips:list" })
      setMessage(t("clips.saved"))
    } catch (error) {
      console.error("[Clips] Save request failed:", error)
    }
  }, [t])

  useEffect(() => {
    const loadSources = async () => {
      try {
        const available = await invoke({ channel: "clips:get-sources" }) as CaptureSource[]
        if (!selectedSource && available.length > 0) setSelectedSource(available[0].id)
      } catch (error) {
        console.error("[Clips] Failed to load sources:", error)
        setMessage(t("clips.sourcesError"))
      }
    }

    const handleShortcut = () => {
      void handleGlobalSave()
    }

    window.electron.ipcRenderer.on("clips:save-request", handleShortcut)
    loadSources()

    return () => {
      window.electron.ipcRenderer.removeListener("clips:save-request", handleShortcut)
    }
  }, [handleGlobalSave, t])

  const openClipFolder = async () => {
    await invoke({ channel: "open-clips-folder" })
  }

  return (
    <RootDiv>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-chibangarx-text flex items-center gap-3">
              <Gamepad2 size={32} className="text-chibangarx-primary" />
              {t("clips.title")}
            </h1>
            <p className="text-sm text-chibangarx-text-secondary mt-1">{t("clips.description")}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={openClipFolder}>
              <FolderOpen size={16} className="mr-2" />
              {t("clips.openFolder")}
            </Button>
            <Button variant="primary" onClick={() => invoke({ channel: "settings:open" })}>
              <Settings size={16} className="mr-2" />
              {t("clips.settings")}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Game filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} />
              <select
                value={filter.gameId || ""}
                onChange={(e) => setFilter({ ...filter, gameId: e.target.value || undefined })}
                className="rounded-lg border border-chibangarx-border bg-chibangarx-bg px-3 py-2 text-sm"
              >
                <option value="">Todos os jogos</option>
              </select>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search size={16} />
              <input
                type="text"
                placeholder="Pesquisar clips..."
                value={filter.searchQuery}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
                className="flex-1 rounded-lg border border-chibangarx-border bg-chibangarx-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-chibangarx-primary"
              />
            </div>

            {/* Sort */}
            <select
              value={filter.sortOrder}
              onChange={(e) => setFilter({ ...filter, sortOrder: e.target.value as any })}
              className="rounded-lg border border-chibangarx-border bg-chibangarx-bg px-3 py-2 text-sm"
            >
              <option value="newest">{t("clips.sortNewest")}</option>
              <option value="oldest">{t("clips.sortOldest")}</option>
              <option value="duration">{t("clips.sortDuration")}</option>
              <option value="size">{t("clips.sortSize")}</option>
            </select>
          </div>
        </Card>

        {/* Clips Grid */}
        <ClipGrid clips={[]} loading={false} onOpenClip={() => {}} />

        {/* Message notification */}
        {message && (
          <Card className="p-4 bg-chibangarx-primary/10 border-l-4 border-l-chibangarx-primary animate-in fade-in slide-in-from-bottom-2">
            <p className="text-chibangarx-primary">{message}</p>
          </Card>
        )}

      </div>
    </RootDiv>
  )
}
