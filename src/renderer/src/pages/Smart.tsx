import { useEffect, useMemo, useState } from "react"
import {
  Sparkles,
  Cpu,
  MemoryStick,
  Gpu,
  HardDrive,
  Laptop,
  Monitor,
  RefreshCw,
  Check,
  AlertTriangle,
  Star,
  Info,
  Loader2,
} from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"
import RootDiv from "@/components/rootdiv"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/button"
import Checkbox from "@/components/ui/Checkbox"
import Tooltip from "@/components/ui/tooltip"
import { invoke } from "@/lib/electron"
import useRestartStore from "@/store/restartState"
import { playSuccess } from "@/lib/sound"
import type { SmartAnalysis, SmartRecommendation, Tweak } from "@/types/index"

const priorityStyles: Record<string, string> = {
  recommended: "bg-green-500/10 text-green-400 border-green-500/30",
  optional: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  caution: "bg-orange-500/10 text-orange-400 border-orange-500/30",
}

function Smart() {
  const { t } = useTranslation()
  const [analysis, setAnalysis] = useState<SmartAnalysis | null>(null)
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const { setNeedsRestart } = useRestartStore()

  const loadData = async (refresh = false) => {
    setIsLoading(true)
    try {
      const [analysisResult, fetchedTweaks, states] = await Promise.all([
        invoke({ channel: "smart:analyze", payload: refresh ? { refresh: true } : undefined }),
        invoke({ channel: "tweaks:fetch" }),
        invoke({ channel: "tweak-states:load" }),
      ])
      setAnalysis(analysisResult)
      setTweaks(fetchedTweaks)
      const parsedStates: Record<string, boolean> = states ? JSON.parse(states) : {}
      setToggleStates(parsedStates)
      setSelected(
        new Set(
          analysisResult.recommendations
            .filter((r) => r.priority === "recommended")
            .map((r) => r.tweakId),
        ),
      )
    } catch (error) {
      console.error("Failed to load smart analysis:", error)
      toast.error(t("smart.analyzeError"))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const tweakById = useMemo(() => {
    const map = new Map<string, Tweak>()
    for (const tweak of tweaks) map.set(tweak.name, tweak)
    return map
  }, [tweaks])

  const applySelected = async () => {
    const toApply = (analysis?.recommendations || []).filter((r) => selected.has(r.tweakId))
    if (toApply.length === 0) return

    setIsApplying(true)
    const newStates = { ...toggleStates }

    for (const rec of toApply) {
      const tweak = tweakById.get(rec.tweakId)
      if (!tweak) continue

      const loadingToastId = toast.loading(
        `${t("smart.applyingTweak")} ${tweak.title || rec.tweakId}`,
      )

      try {
        newStates[rec.tweakId] = true
        setToggleStates({ ...newStates })
        await invoke({ channel: "tweak-states:save", payload: JSON.stringify(newStates) })
        await invoke({ channel: "tweak:apply", payload: rec.tweakId })
        if (tweak.restart) setNeedsRestart(true)
        toast.update(loadingToastId, {
          render: `${t("smart.appliedTweak")} ${tweak.title || rec.tweakId}`,
          type: "success",
          isLoading: false,
          autoClose: 2000,
        })
      } catch (error) {
        console.error(`Error applying tweak ${rec.tweakId}:`, error)
        toast.update(loadingToastId, {
          render: `${t("smart.failedTweak")} ${tweak.title || rec.tweakId}`,
          type: "error",
          isLoading: false,
          autoClose: 2000,
        })
        newStates[rec.tweakId] = false
      }
    }

    setToggleStates({ ...newStates })
    setSelected(new Set())
    setIsApplying(false)
    playSuccess()
  }

  const toggleRecommendation = (tweakId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tweakId)) next.delete(tweakId)
      else next.add(tweakId)
      return next
    })
  }

  if (isLoading || !analysis) {
    return (
      <RootDiv>
        <div className="flex items-center justify-center h-64 flex-col gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-chibangarx-primary" />
          <p className="text-slate-400">{t("smart.analyzing")}</p>
        </div>
      </RootDiv>
    )
  }

  const { profile } = analysis
  const classificationLabel =
    profile.classification === "gaming"
      ? t("smart.classification.gaming")
      : profile.classification === "mid"
        ? t("smart.classification.mid")
        : t("smart.classification.low")

  const classificationStyle =
    profile.classification === "gaming"
      ? "bg-teal-500/10 text-teal-400 border-teal-500/30"
      : profile.classification === "mid"
        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"

  const hardwareItems = [
    {
      icon: Cpu,
      label: t("smart.profile.cpu"),
      value: `${profile.cpu}`,
      detail: `${profile.cores} ${t("smart.profile.cores")} / ${profile.threads} ${t("smart.profile.threads")}`,
    },
    {
      icon: MemoryStick,
      label: t("smart.profile.ram"),
      value: `${profile.ramGB} GB`,
      detail: profile.ramGB < 8 ? t("smart.profile.ramLow") : "",
    },
    {
      icon: Gpu,
      label: t("smart.profile.gpu"),
      value: profile.gpu,
      detail: profile.hasGPU
        ? `${profile.vramGB} GB VRAM${profile.isNvidia ? " · NVIDIA" : ""}`
        : t("smart.profile.integrated"),
    },
    {
      icon: HardDrive,
      label: t("smart.profile.storage"),
      value: profile.diskType,
      detail: profile.isSSD ? t("smart.profile.ssd") : t("smart.profile.hdd"),
    },
    {
      icon: profile.isLaptop ? Laptop : Monitor,
      label: t("smart.profile.pcType"),
      value: profile.isLaptop ? t("smart.profile.laptop") : t("smart.profile.desktop"),
      detail: profile.isWin11 ? "Windows 11" : "Windows 10",
    },
  ]

  return (
    <RootDiv>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-chibangarx-text flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-chibangarx-primary" />
              {t("smart.title")}
            </h1>
            <p className="text-sm text-chibangarx-text-secondary mt-1">{t("smart.subtitle")}</p>
          </div>
          <Button variant="secondary" onClick={() => void loadData(true)}>
            <RefreshCw className="w-4 h-4" /> {t("smart.refresh")}
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-chibangarx-text">{t("smart.profile.title")}</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full border text-xs font-medium ${classificationStyle}`}>
                {classificationLabel}
              </span>
              <Tooltip content={`${profile.score} / 100`} delay={0.3} side="left">
                <span className="text-xs text-chibangarx-text-muted">{t("smart.profile.score")}</span>
              </Tooltip>
            </div>
          </div>

          <div className="w-full h-2 bg-chibangarx-border-secondary rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-chibangarx-primary to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${profile.score}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {hardwareItems.map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-chibangarx-bg border border-chibangarx-border-secondary">
                <div className="p-2 bg-chibangarx-accent rounded-lg shrink-0">
                  <item.icon className="w-4 h-4 text-chibangarx-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-chibangarx-text-muted">{item.label}</p>
                  <p className="text-sm font-medium text-chibangarx-text truncate" title={item.value}>
                    {item.value}
                  </p>
                  {item.detail && (
                    <p className="text-xs text-chibangarx-text-secondary truncate">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chibangarx-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-chibangarx-primary" />
              {t("smart.recommendations")}
              <span className="text-xs font-normal text-chibangarx-text-muted">
                ({analysis.recommendations.length})
              </span>
            </h2>
            <Button onClick={() => void applySelected()} disabled={isApplying || selected.size === 0}>
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("smart.applying")}
                </>
              ) : (
                t("smart.applySelected", { count: selected.size })
              )}
            </Button>
          </div>

          <p className="text-xs text-chibangarx-text-muted mb-4">{t("smart.compatibilityNote")}</p>

          {analysis.recommendations.length === 0 ? (
            <Card className="p-6 text-center text-chibangarx-text-secondary text-sm">
              {t("smart.noRecommendations")}
            </Card>
          ) : (
            <div className="space-y-3">
              {analysis.recommendations.map((rec: SmartRecommendation) => {
                const tweak = tweakById.get(rec.tweakId)
                const isApplied = !!toggleStates[rec.tweakId]
                const isSelected = selected.has(rec.tweakId)
                const priorityLabel =
                  rec.priority === "recommended"
                    ? t("smart.priority.recommended")
                    : rec.priority === "optional"
                      ? t("smart.priority.optional")
                      : t("smart.priority.caution")

                return (
                  <Card key={rec.tweakId} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <Checkbox
                          checked={isSelected}
                          disabled={isApplied}
                          onChange={() => toggleRecommendation(rec.tweakId)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-chibangarx-text">
                            {tweak?.title || rec.tweakId}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-medium ${priorityStyles[rec.priority]}`}
                          >
                            {priorityLabel}
                          </span>
                          {isApplied && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 text-[10px] uppercase tracking-wider font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> {t("smart.applied")}
                            </span>
                          )}
                        </div>
                        {tweak?.description && (
                          <p className="text-sm text-chibangarx-text-secondary mt-1">
                            {tweak.description}
                          </p>
                        )}
                        <p className="text-xs text-chibangarx-text-muted mt-2 flex items-center gap-1.5">
                          {rec.priority === "caution" ? (
                            <AlertTriangle className="w-3 h-3 text-orange-400" />
                          ) : rec.priority === "recommended" ? (
                            <Star className="w-3 h-3 text-green-400" />
                          ) : (
                            <Info className="w-3 h-3 text-blue-400" />
                          )}
                          {t(`smart.reasons.${rec.reasonCode}`, rec.reasonArgs)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RootDiv>
  )
}

export default Smart