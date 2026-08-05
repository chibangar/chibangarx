import { useState, useEffect } from "react"
import { Loader2, Menu, Minus, Shield, Square, Terminal, X, User, Globe, Users, Lock } from "lucide-react"
import { close, minimize, toggleMaximize } from "../lib/electron"
import chibangarxLogo from "../../../../resources/chibangarxlogo.png"
import Card from "./ui/Card"
import useAppInstallStore from "@/store/appInstallStore"
import InstallConsoleModal from "./installConsoleModal"
import { useTranslation } from "react-i18next"
import UpdateManager from "./updatemanager"
import { playClick, playMinimize, playMaximize, playClose } from "@/lib/sound"
import AdminLoginModal from "./adminLoginModal"

interface TitleBarProps {
  onToggleSidebar: () => void
  sidebarCollapsed: boolean
  adminStatus: boolean | null
}

function TitleBar({
  onToggleSidebar,
  sidebarCollapsed: _sidebarCollapsed,
  adminStatus,
}: TitleBarProps): React.ReactElement {
  const { t } = useTranslation()
  const { apps, action } = useAppInstallStore()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const [adminLoginOpen, setAdminLoginOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [country, setCountry] = useState("")
  const [onlineCount, setOnlineCount] = useState(0)
  const actionText = action === "uninstall" ? t("titlebar.uninstalling") : t("titlebar.installing")

  const currentApp = apps.find((app) => app.status === "installing")
  const remainingCount = apps.filter((app) => app.status === "pending").length

  useEffect(() => {
    if (adminStatus) {
      void window.electron.ipcRenderer.invoke("admin:status").then((status: any) => {
        if (status?.isAdmin) {
          setUsername(status.username)
          setCountry(status.country)
          setOnlineCount(status.onlineCount)
        }
      })
    }
  }, [adminStatus])

  const handleAdminClick = () => {
    if (adminStatus) {
      void window.electron.ipcRenderer.invoke("admin:logout")
      window.location.reload()
    } else {
      setAdminLoginOpen(true)
    }
  }

  const handleAdminLogin = (isAdmin: boolean) => {
    setAdminLoginOpen(false)
    if (isAdmin) {
      window.location.reload()
    }
  }

  return (
    <>
      <InstallConsoleModal open={consoleOpen} onClose={() => setConsoleOpen(false)} />
      <AdminLoginModal open={adminLoginOpen} onClose={handleAdminLogin} />
      <div
        style={{ WebkitAppRegion: "drag" } as any}
        className="h-[50px] fixed top-0 left-0 right-0 flex justify-between items-center pl-4 bg-chibangarx-bg z-50"
      >
        <div className="flex items-center gap-3 h-full pr-4">
          <button
            onClick={() => { playClick(); onToggleSidebar() }}
            className="h-7 w-7 inline-flex items-center justify-center text-chibangarx-text-secondary hover:bg-chibangarx-accent transition-colors rounded"
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            <Menu size={16} />
          </button>
          <img src={chibangarxLogo} alt="ChibangaRx" className="h-5 w-5" />
          <span className="text-chibangarx-text text-sm font-medium">ChibangaRx</span>
          <div className="bg-chibangarx-card border border-chibangarx-border-secondary p-1 rounded-xl text-center text-xs text-chibangarx-text-secondary px-2">
            {t("nav.beta")} v2.28
          </div>
        </div>
        <div>
          {apps.length > 0 && (
            <Card
              key="install-status"
              className="p-2 text-xs flex items-center gap-2 animate-in fade-in zoom-in duration-300 fill-mode-both cursor-pointer hover:bg-chibangarx-accent transition-colors"
              onClick={() => setConsoleOpen(true)}
              style={{ WebkitAppRegion: "no-drag" } as any}
            >
              <Loader2 className="animate-spin text-xs w-4 h-4" />
              {apps.length === 1
                ? `${actionText} ${apps[0].name}`
                 : currentApp
                   ? `${actionText} ${currentApp.name}, ${remainingCount} ${t("titlebar.left")}`
                   : `${actionText} ${apps.length} ${t("titlebar.apps")}`}
              <Terminal className="w-3 h-3 text-chibangarx-primary" />
            </Card>
          )}
        </div>

        <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" } as any}>
          {adminStatus && username && (
            <div className="flex items-center gap-3 text-xs text-chibangarx-text-secondary px-3 py-1.5 bg-chibangarx-card border border-chibangarx-border-secondary rounded-xl">
              <div className="flex items-center gap-1">
                <User size={12} />
                <span>{username}</span>
              </div>
              <div className="w-px h-3 bg-chibangarx-border-secondary" />
              <div className="flex items-center gap-1">
                <Globe size={12} />
                <span className="uppercase">{country || "??"}</span>
              </div>
              <div className="w-px h-3 bg-chibangarx-border-secondary" />
              <div className="flex items-center gap-1">
                <Users size={12} />
                <span>{onlineCount}</span>
              </div>
            </div>
          )}
          <UpdateManager />
          <button
            onClick={handleAdminClick}
            className={`h-12.5 w-12 inline-flex items-center justify-center transition-colors rounded ${
              adminStatus
                ? "text-chibangarx-primary bg-chibangarx-primary/10 hover:bg-chibangarx-primary/20"
                : "text-chibangarx-text-secondary hover:bg-chibangarx-accent"
            }`}
            title={adminStatus ? t("titlebar.adminMode") : t("titlebar.enterAdminMode")}
            style={{ WebkitAppRegion: "no-drag" } as any}
          >
            {adminStatus ? (
              <Shield className="w-5 h-5" />
            ) : (
              <Lock className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => { playMinimize(); minimize() }}
            className="h-12.5 w-12 inline-flex items-center justify-center text-chibangarx-text-secondary hover:bg-chibangarx-accent transition-colors"
          >
            <Minus size={16} />
          </button>
          <button
            onClick={() => { playMaximize(); toggleMaximize() }}
            className="h-12.5 w-12 inline-flex items-center justify-center text-chibangarx-text-secondary hover:bg-chibangarx-accent transition-colors"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => { playClose(); close() }}
            className="h-12.5 w-12 inline-flex items-center justify-center text-chibangarx-text-secondary hover:bg-red-600 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </>
  )
}

export default TitleBar
