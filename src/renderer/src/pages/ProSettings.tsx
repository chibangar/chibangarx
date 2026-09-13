import RootDiv from "@/components/rootdiv"
import { useTranslation } from "react-i18next"
import { ExternalLink } from "lucide-react"

export default function ProSettings() {
  const { t } = useTranslation()
  return (
    <RootDiv>
      <div className="flex h-full flex-col gap-4">
        <h1 className="text-2xl font-bold text-chibangarx-text">{t("proSettings.title")}</h1>
        <p className="text-sm text-chibangarx-text-secondary">{t("proSettings.description")}</p>
        <a href="https://prosettings.net/games/cs2/" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start rounded-lg bg-chibangarx-primary px-4 py-2 text-white">
          <ExternalLink size={16} />{t("proSettings.openExternal")}
        </a>
      </div>
    </RootDiv>
  )
}
