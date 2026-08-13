import RootDiv from "@/components/rootdiv"
import { useEffect, useState } from "react"
import jsonData from "../../../../package.json"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import ChangelogModal from "@/components/changelogModal"
import Toggle from "@/components/ui/Toggle"
import { toast } from "react-toastify"
import { playToggle } from "@/lib/sound"
import Card from "@/components/ui/Card"
import { Dropdown } from "@/components/ui/dropdown"
import { useTranslation } from "react-i18next"
import { isValidUserName, normalizeUserName, USER_NAME_MAX_LENGTH } from "@/lib/profile"

interface SettingsProps {
  userName: string
  onUserNameChange: (name: string) => void
}

function Settings({ userName, onUserNameChange }: SettingsProps) {
  const { t } = useTranslation()

  const themes = [
    { label: t("settings.system"), value: "system" },
    { label: t("settings.dark"), value: "dark" },
    { label: t("settings.light"), value: "light" },
    { label: t("settings.purple"), value: "purple" },
    { label: t("settings.gray"), value: "gray" },
    { label: t("settings.classic"), value: "classic" },
    { label: t("settings.space"), value: "space" },
  ]

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const [animationDirection, setAnimationDirection] = useState<"up" | "left" | "off">(
    (localStorage.getItem("pageAnimation") as "up" | "left" | "off") || "up",
  )
  const [checking, setChecking] = useState(false)
  const [posthogDisabled, setPosthogDisabled] = useState(() => {
    return localStorage.getItem("posthogDisabled") === "true"
  })
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [changelogOpen, setChangelogOpen] = useState(false)
  const [forceLocalApps, setForceLocalApps] = useState(() => {
    return localStorage.getItem("forceLocalApps") === "true"
  })
  const [defaultPackageManager, setDefaultPackageManager] = useState<"Chocolatey" | "Winget">(
    (localStorage.getItem("defaultPackageManager") as "Chocolatey" | "Winget") || "Winget",
  )
  const [hideAppIcons, setHideAppIcons] = useState<boolean>(
    localStorage.getItem("hideAppsPageAppIcons") === "true",
  )
  const [rpcEnabled, setRpcEnabled] = useState(true)
  const [rpcLoading, setRpcLoading] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("chibangarx:soundEnabled") !== "false"
  })
  const [profileName, setProfileName] = useState(userName)
  const [profileNameError, setProfileNameError] = useState(false)
  const [autostartEnabled, setAutostartEnabled] = useState(false)
  const [autostartLoading, setAutostartLoading] = useState(false)
  const [minimizeToTrayEnabled, setMinimizeToTrayEnabled] = useState(true)
  const [minimizeToTrayLoading, setMinimizeToTrayLoading] = useState(false)

  const checkForUpdates = async () => {
    try {
      setChecking(true)
      const res = await invoke({ channel: "updater:check" })
      if (res?.found) {
        toast.info(t("settings.updateAvailable") + `: ${res.version}`)
      } else if (res?.ok) {
        toast.success(t("settings.upToDate"))
      } else {
        toast.error(res?.error || t("settings.checkError"))
      }
    } catch (e) {
      toast.error(String(e))
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => {
    document.body.classList.remove("light", "purple", "dark", "gray", "classic", "space")
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      document.body.classList.add(systemTheme)
    } else if (theme) {
      document.body.classList.add(theme)
    } else {
      document.body.classList.add("dark")
    }
    localStorage.setItem("theme", theme || "dark")
  }, [theme])

  useEffect(() => {
    invoke({ channel: "rpc-enabled:get" }).then((status) => setRpcEnabled(status))
  }, [])

  useEffect(() => {
    if (posthogDisabled) {
      document.body.classList.add("ph-no-capture")
    } else {
      document.body.classList.remove("ph-no-capture")
    }
    localStorage.setItem("posthogDisabled", posthogDisabled.toString())
  }, [posthogDisabled])

  useEffect(() => {
    invoke({ channel: "autostart:get" }).then((enabled) => setAutostartEnabled(enabled))
  }, [])

  useEffect(() => {
    invoke({ channel: "minimizeToTray:get" }).then((enabled) => setMinimizeToTrayEnabled(enabled))
  }, [])

  const clearCache = async () => {
    await invoke({ channel: "clear-chibangarx-cache" })
    localStorage.removeItem("chibangarx:systemInfo")
    localStorage.removeItem("chibangarx:tweakInfo")
    toast.success(t("settings.cacheCleared"))
  }

  const handleToggleRpc = async () => {
    setRpcLoading(true)
    const newStatus = !rpcEnabled
    await invoke({ channel: "rpc-enabled:set", payload: newStatus })
    setRpcEnabled(newStatus)
    setRpcLoading(false)
    toast.success(
      t("settings.discordRpc") + " " + (newStatus ? t("common.enabled") : t("common.disabled")),
    )
  }

  const handleToggleAutostart = async () => {
    setAutostartLoading(true)
    const newStatus = !autostartEnabled
    await invoke({ channel: "autostart:set", payload: newStatus })
    setAutostartEnabled(newStatus)
    setAutostartLoading(false)
    toast.success(
      t("settings.autostart") + " " + (newStatus ? t("common.enabled") : t("common.disabled")),
    )
  }

  const handleToggleMinimizeToTray = async () => {
    setMinimizeToTrayLoading(true)
    const newStatus = !minimizeToTrayEnabled
    await invoke({ channel: "minimizeToTray:set", payload: newStatus })
    setMinimizeToTrayEnabled(newStatus)
    setMinimizeToTrayLoading(false)
    toast.success(
      t("settings.minimizeToTray") + " " + (newStatus ? t("common.enabled") : t("common.disabled")),
    )
  }

  const handleRestartExplorer = async () => {
    try {
      await invoke({ channel: "restart-explorer" })
      toast.success(t("settings.explorerRestarted"))
    } catch (e) {
      toast.error(t("settings.explorerRestartError") + String(e))
    }
  }

  return (
    <>
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">{t("settings.legacyBackups")}</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              {t("settings.legacyBackupsDesc")}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setDeleteModalOpen(false)
                invoke({ channel: "delete-old-chibangarx-backups" })
              }}
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </Modal>
      <ChangelogModal open={changelogOpen} onClose={() => setChangelogOpen(false)} />
      <RootDiv>
        <div className="min-h-screen w-full pb-16 overflow-y-auto">
          <div className="space-y-8 ">
            <SettingSection title={t("settings.appearance")}>
              <SettingCard>
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-chibangarx-text">
                    {t("settings.theme")}
                  </h3>
                  <div className="grid grid-cols-6 gap-3">
                    {themes.map((t_item) => (
                      <label
                        key={t_item.value}
                        className={`flex items-center justify-center gap-2 cursor-pointer p-3 rounded-lg border transition-all duration-200 active:scale-95 ${
                          theme === t_item.value
                            ? "border-chibangarx-primary"
                            : "border-chibangarx-border"
                        }`}
                      >
                        <input
                          type="radio"
                          name="theme"
                          value={t_item.value}
                          checked={theme === t_item.value}
                          onChange={() => setTheme(t_item.value)}
                          className="sr-only"
                        />
                        <span className="text-chibangarx-text font-medium">{t_item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </SettingCard>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.animationDirection")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.animationDesc")}
                    </p>
                  </div>
                  <Dropdown
                    value={t(`settings.${animationDirection}`)}
                    options={[t("settings.up"), t("settings.left"), t("settings.off")]}
                    onChange={(value) => {
                      const animationMap: Record<string, "up" | "left" | "off"> = {
                        [t("settings.up")]: "up",
                        [t("settings.left")]: "left",
                        [t("settings.off")]: "off",
                      }
                      const newValue = animationMap[value]
                      setAnimationDirection(newValue)
                      localStorage.setItem("pageAnimation", newValue)
                    }}
                  />
                </div>
              </SettingCard>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("audio.soundsEnabled")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("audio.soundsDesc")}
                    </p>
                  </div>
                  <Toggle
                    checked={soundEnabled}
                    onChange={() => {
                      const newValue = !soundEnabled
                      setSoundEnabled(newValue)
                      localStorage.setItem("chibangarx:soundEnabled", newValue.toString())
                      if (newValue) playToggle(true)
                    }}
                  />
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.updates")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.checkForUpdates")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.checkForUpdatesDesc")}
                    </p>
                  </div>
                  <Button onClick={checkForUpdates} disabled={checking}>
                    {checking ? t("settings.checking") : t("settings.checkForUpdates")}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>
            <SettingSection title={t("settings.appsPage")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.defaultPackageManager")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.packageManagerDesc")}
                    </p>
                  </div>
                  <Dropdown
                    value={t(
                      defaultPackageManager === "Chocolatey"
                        ? "settings.chocolatey"
                        : "settings.winget",
                    )}
                    options={[t("settings.winget"), t("settings.chocolatey")]}
                    onChange={(value) => {
                      const newValue = value === t("settings.chocolatey") ? "Chocolatey" : "Winget"
                      setDefaultPackageManager(newValue as "Chocolatey" | "Winget")
                      localStorage.setItem("defaultPackageManager", newValue)
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.hideAppIcons")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.hideAppIconsDesc")}
                    </p>
                  </div>
                  <Toggle
                    checked={hideAppIcons}
                    onChange={() => {
                      setHideAppIcons((v) => {
                        const next = !v
                        localStorage.setItem("hideAppsPageAppIcons", next.toString())
                        toast.success(
                          t("settings.hideAppIcons") +
                            " " +
                            (next ? t("common.enabled") : t("common.disabled")),
                        )
                        return next
                      })
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.forceLocal")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.forceLocalDesc")}
                    </p>
                  </div>
                  <Toggle
                    checked={forceLocalApps}
                    onChange={() => {
                      setForceLocalApps((v) => {
                        const next = !v
                        localStorage.setItem("forceLocalApps", next.toString())
                        toast.success(
                          t("settings.forceLocal") +
                            " " +
                            (next ? t("common.enabled") : t("common.disabled")),
                        )
                        return next
                      })
                    }}
                  />
                </div>
              </SettingCard>
            </SettingSection>
            <SettingSection title={t("settings.profile")}>
              <SettingCard>
                <div className="space-y-4">
                  <h3 className="text-base font-medium text-chibangarx-text">
                    {t("settings.userName")}
                  </h3>
                  <input
                    type="text"
                    value={profileName}
                    maxLength={USER_NAME_MAX_LENGTH}
                    autoComplete="name"
                    onChange={(event) => {
                      setProfileName(event.target.value)
                      if (profileNameError) setProfileNameError(false)
                    }}
                    aria-invalid={profileNameError}
                    className="ph-no-capture w-full bg-chibangarx-card border border-chibangarx-border rounded-lg px-3 py-2 text-chibangarx-text focus:ring-0 focus:outline-hidden"
                    placeholder={t("settings.enterYourName")}
                  />
                  {profileNameError && (
                    <p role="alert" className="text-sm text-red-400">
                      {t("settings.nameInvalid")}
                    </p>
                  )}
                  <p className="text-sm text-chibangarx-text-secondary">
                    {t("settings.namePrivacy")}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const normalized = normalizeUserName(profileName)
                        if (!isValidUserName(normalized)) {
                          setProfileNameError(true)
                          return
                        }
                        onUserNameChange(normalized)
                        setProfileName(normalized)
                        toast.success(t("settings.nameSaved"))
                      }}
                    >
                      {t("settings.saveName")}
                    </Button>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.privacy")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.disableAnalytics")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.analyticsDesc")}
                      <span className="inline-flex items-center gap-1 ml-2 text-yellow-500">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                        {t("settings.requiresRestart")}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={posthogDisabled}
                      onChange={() => setPosthogDisabled((v) => !v)}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        posthogDisabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-chibangarx-text-secondary bg-chibangarx-border-secondary/20"
                      }`}
                    >
                      {posthogDisabled ? t("common.disabled") : t("common.enabled")}
                    </span>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.dataManagement")}>
              <SettingCard>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.legacyBackups")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.legacyBackupsDesc")}
                    </p>
                  </div>
                  <Button variant="danger" onClick={() => setDeleteModalOpen(true)}>
                    {t("settings.deleteBackups")}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.clearCache")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.clearCacheDesc")}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={clearCache}>
                    {t("settings.clearCache")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="ml-2"
                    onClick={async () => {
                      await invoke({ channel: "open-log-folder" })
                    }}
                  >
                    {t("settings.openLogFolder")}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.other")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.discordRpc")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.discordRpcDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle checked={rpcEnabled} onChange={handleToggleRpc} disabled={rpcLoading} />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        rpcEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-chibangarx-text-secondary bg-chibangarx-border-secondary/20"
                      }`}
                    >
                      {rpcEnabled ? t("common.enabled") : t("common.disabled")}
                    </span>
                  </div>
                </div>
              </SettingCard>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.autostart")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.autostartDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={autostartEnabled}
                      onChange={handleToggleAutostart}
                      disabled={autostartLoading}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        autostartEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-chibangarx-text-secondary bg-chibangarx-border-secondary/20"
                      }`}
                    >
                      {autostartEnabled ? t("common.enabled") : t("common.disabled")}
                    </span>
                  </div>
                </div>
              </SettingCard>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.minimizeToTray")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.minimizeToTrayDesc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={minimizeToTrayEnabled}
                      onChange={handleToggleMinimizeToTray}
                      disabled={minimizeToTrayLoading}
                    />
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                        minimizeToTrayEnabled
                          ? "text-green-400 bg-green-400/10"
                          : "text-chibangarx-text-secondary bg-chibangarx-border-secondary/20"
                      }`}
                    >
                      {minimizeToTrayEnabled ? t("common.enabled") : t("common.disabled")}
                    </span>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.troubleshooting")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.restartExplorer")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.restartExplorerDesc")}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={handleRestartExplorer}>
                    {t("settings.restartExplorer")}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>

            <SettingSection title={t("settings.about")}>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">ChibangaRx</h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.version")} {jsonData.version}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="secondary" onClick={() => setChangelogOpen(true)}>
                      {t("settings.viewChangelog")}
                    </Button>
                    <div className="text-right">
                      <p className="text-sm text-chibangarx-text-secondary">
                        © {new Date().getFullYear()} ChibangaRx
                      </p>
                    </div>
                  </div>
                </div>
              </SettingCard>
            </SettingSection>
            <SettingSection title={t("settings.developerOptions")}>
              <p className="text-xs mt-0 text-chibangarx-text-secondary">
                {t("settings.devWarning")}
              </p>
              <SettingCard>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.resetPackageModal")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.resetPackageModalDesc")}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      localStorage.removeItem("hasSeenAppsWelcomeModal")
                      toast.success(t("settings.packageModalReset"))
                    }}
                  >
                    {t("settings.resetModal")}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.clearSystemInfoCache")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.clearSystemInfoCacheDesc")}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      localStorage.removeItem("chibangarx:systemInfo")
                      toast.success(t("settings.cacheClearedSuccess"))
                    }}
                  >
                    {t("common.clear")}
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex-1">
                    <h3 className="text-base font-medium text-chibangarx-text mb-1">
                      {t("settings.openDevtools")}
                    </h3>
                    <p className="text-sm text-chibangarx-text-secondary">
                      {t("settings.openDevtoolsDesc")}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      invoke({ channel: "open-devtools" })
                    }}
                  >
                    {t("settings.openDevtools")}
                  </Button>
                </div>
              </SettingCard>
            </SettingSection>
          </div>
        </div>
      </RootDiv>
    </>
  )
}
// this saves alot of time
const SettingCard = ({ children, className = "" }) => (
  <Card className={`p-4 ${className}`}>{children}</Card>
)

const SettingSection = ({ title, children }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold text-chibangarx-primary">{title}</h2>
    {children}
  </div>
)
export default Settings
