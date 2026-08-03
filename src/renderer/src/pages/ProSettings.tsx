import { useState, useEffect } from "react"
import RootDiv from "@/components/rootdiv"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"

interface ProSettingsData {
  players: Array<{
    name: string
    team: string
    settings: Record<string, string>
  }>
  categories: string[]
}

export default function ProSettings() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ProSettingsData | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(
          "https://prosettings.net/games/cs2/",
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const html = await response.text()
        const players = extractPlayers(html)
        const categories = extractCategories(html)
        setData({ players, categories })
      } catch (err) {
        console.error("Failed to fetch pro settings:", err)
        setError(t("proSettings.fetchError"))
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [t])

  const extractPlayers = (html: string): ProSettingsData["players"] => {
    const players: ProSettingsData["players"] = []
    const playerRegex = /<h3[^>]*>(.*?)<\/h3>/g
    let match
    while ((match = playerRegex.exec(html)) !== null) {
      const name = match[1].trim()
      if (name && name.length < 50) {
        players.push({
          name,
          team: "",
          settings: {},
        })
      }
    }
    return players.slice(0, 20)
  }

  const extractCategories = (): string[] => {
    return ["Crosshair", "Video", "Gameplay", "Audio", "Mouse", "Keyboard"]
  }

  if (loading) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64">
          <p className="text-chibangarx-text-secondary">
            {t("proSettings.loading")}
          </p>
        </div>
      </RootDiv>
    )
  }

  if (error) {
    return (
      <RootDiv>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-red-500">{error}</p>
          <Button onClick={() => window.location.reload()}>
            {t("common.retry")}
          </Button>
        </div>
      </RootDiv>
    )
  }

  return (
    <RootDiv>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-chibangarx-text">
            {t("proSettings.title")}
          </h1>
          <a
            href="https://prosettings.net/games/cs2/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-500 hover:text-blue-400 transition-colors"
          >
            {t("proSettings.visitWebsite")}
            <ExternalLink size={16} />
          </a>
        </div>

            {data && data.players.length > 0 ? (
              <div className="space-y-4">
                {data.players.map((player, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-chibangarx-text">
                          {player.name}
                        </h3>
                        {player.team && (
                          <p className="text-sm text-chibangarx-text-secondary">
                            {player.team}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-4">
                <p className="text-chibangarx-text-secondary">
                  {t("proSettings.noData")}
                </p>
              </Card>
            )}
      </div>
    </RootDiv>
  )
}
