import { createElement, useEffect, useRef, useState } from "react"
import RootDiv from "@/components/rootdiv"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ArrowRight, ExternalLink, RefreshCw } from "lucide-react"

const PRO_SETTINGS_URL = "https://prosettings.net/games/cs2/"

type EmbeddedWebview = HTMLElement & {
  canGoBack: () => boolean
  canGoForward: () => boolean
  goBack: () => void
  goForward: () => void
  reload: () => void
}

const controlClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-chibangarx-text-secondary transition-colors hover:bg-chibangarx-border-secondary hover:text-chibangarx-text disabled:cursor-not-allowed disabled:opacity-40"

export default function ProSettings() {
  const { t } = useTranslation()
  const webviewRef = useRef<EmbeddedWebview | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview) return undefined

    const updateNavigation = () => {
      setCanGoBack(webview.canGoBack())
      setCanGoForward(webview.canGoForward())
    }
    const handleStartLoading = () => {
      setLoading(true)
      setFailed(false)
    }
    const handleStopLoading = () => {
      setLoading(false)
      updateNavigation()
    }
    const handleLoadFailure = () => {
      setLoading(false)
      setFailed(true)
    }

    webview.addEventListener("did-start-loading", handleStartLoading)
    webview.addEventListener("did-stop-loading", handleStopLoading)
    webview.addEventListener("did-navigate", updateNavigation)
    webview.addEventListener("did-navigate-in-page", updateNavigation)
    webview.addEventListener("did-fail-load", handleLoadFailure)

    return () => {
      webview.removeEventListener("did-start-loading", handleStartLoading)
      webview.removeEventListener("did-stop-loading", handleStopLoading)
      webview.removeEventListener("did-navigate", updateNavigation)
      webview.removeEventListener("did-navigate-in-page", updateNavigation)
      webview.removeEventListener("did-fail-load", handleLoadFailure)
    }
  }, [])

  const webview = createElement("webview", {
    ref: (element: EmbeddedWebview | null) => {
      webviewRef.current = element
    },
    src: PRO_SETTINGS_URL,
    partition: "persist:prosettings",
    allowpopups: "false",
    className: "h-full w-full border-0",
  })

  return (
    <RootDiv>
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-chibangarx-text">
              {t("proSettings.title")}
            </h1>
            <p className="text-sm text-chibangarx-text-secondary">
              {t("proSettings.description")}
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-chibangarx-border bg-chibangarx-card p-1">
            <button
              type="button"
              className={controlClass}
              disabled={!canGoBack}
              onClick={() => webviewRef.current?.goBack()}
              title={t("proSettings.back")}
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              className={controlClass}
              disabled={!canGoForward}
              onClick={() => webviewRef.current?.goForward()}
              title={t("proSettings.forward")}
            >
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className={controlClass}
              onClick={() => webviewRef.current?.reload()}
              title={t("proSettings.reload")}
            >
              <RefreshCw size={16} />
            </button>
            <a
              href={PRO_SETTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={controlClass}
              title={t("proSettings.openExternal")}
            >
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-chibangarx-border bg-white">
          {webview}
          {loading && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-chibangarx-bg/80">
              <p className="text-sm text-chibangarx-text-secondary">
                {t("proSettings.loading")}
              </p>
            </div>
          )}
          {failed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-chibangarx-bg p-6 text-center">
              <p className="text-chibangarx-text-secondary">
                {t("proSettings.fetchError")}
              </p>
              <button
                type="button"
                className="rounded-lg bg-chibangarx-primary px-4 py-2 text-sm font-medium text-white hover:brightness-110"
                onClick={() => webviewRef.current?.reload()}
              >
                {t("common.retry")}
              </button>
            </div>
          )}
        </div>
      </div>
    </RootDiv>
  )
}
