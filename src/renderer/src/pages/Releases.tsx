import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Github, ExternalLink } from "lucide-react"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"

export default function Releases() {
  const { t } = useTranslation()

  useEffect(() => {
    window.open("https://github.com/chibangar/chibangarxbolt/releases", "_blank")
  }, [])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 p-4 bg-chibangarx-primary/20 rounded-full w-16 h-16 flex items-center justify-center">
          <Github className="w-8 h-8 text-chibangarx-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">{t("nav.releases")}</h2>
        <p className="text-chibangarx-text-secondary mb-6">
          A abrir a página de releases do GitHub...
        </p>
        <Button
          variant="secondary"
          onClick={() => window.open("https://github.com/chibangar/chibangarxbolt/releases", "_blank")}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t("common.openExternal") || "Abrir no navegador"}
        </Button>
      </Card>
    </div>
  )
}