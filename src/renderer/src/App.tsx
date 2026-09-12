import { useState, useEffect, useRef } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import TitleBar from "./components/titlebar"
import Nav from "./components/nav"
import StarField from "./components/StarField"
import "./app.css"
import { ToastContainer, Slide, toast } from "react-toastify"
import Home from "./pages/Home"
import Smart from "./pages/Smart"
import Tweaks from "./pages/Tweaks"
import Clean from "./pages/Clean"
import Apps from "./pages/Apps"
import Utilities from "./pages/Utilities"
import DNS from "./pages/DNS"
import Settings from "./pages/Settings"
import Backup from "./pages/Backup"
import FirstTime from "./components/firsttime"
import ChangelogModal from "./components/changelogModal"
import useAppInstallStore from "./store/appInstallStore"
import useOnlineStore from "./store/online"
import { CURRENT_VERSION } from "./lib/version"
import { useTranslation } from "react-i18next"
import Debloat from "./pages/Debloat"
import NoAdmin from "./components/noAdmin"
import ProSettings from "./pages/ProSettings"
import Clips from "./pages/Clips"
import Drivers from "./pages/Drivers"
import GameClips from "./pages/GameClips"
import Updates from "./pages/Updates"
import { playSuccess, playError, playBoot, speakWelcome } from "./lib/sound"
import StartupSplash from "./components/StartupSplash"
import NameOnboarding from "./components/NameOnboarding"
import galaxyBackground from "./assets/galaxy-background.jpg"
import { loadUserName, saveUserName } from "./lib/profile"

function App() {
  const [startupComplete, setStartupComplete] = useState(false)
  const [userName, setUserName] = useState(loadUserName)
  const welcomeSpoken = useRef(false)
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "system")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    localStorage.getItem("sidebarCollapsed") === "true",
  )
  const [adminStatus, setAdminStatus] = useState<boolean | null>(null)
  const { setAppStatus, clearApps } = useAppInstallStore()
  const { setOnline } = useOnlineStore()
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setTimeout(() => setStartupComplete(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!startupComplete || !userName || welcomeSpoken.current) return
    welcomeSpoken.current = true
    const timer = setTimeout(() => speakWelcome(userName), 250)
    return () => clearTimeout(timer)
  }, [startupComplete, userName])

  useEffect(() => {
    const listeners = {
      "install-progress": (_event: unknown, message: string) => {
        setAppStatus(message, "installing")
      },
      "install-complete": () => {
        clearApps()
        playSuccess()
        toast.success(t("common.operationSuccess"))
      },
      "install-error": () => {
        clearApps()
        playError()
        toast.error(t("common.operationError"))
      },
    }

    Object.entries(listeners).forEach(([channel, listener]) => {
      window.electron.ipcRenderer.on(channel, listener)
    })

    return () => {
      Object.keys(listeners).forEach((channel) => {
        window.electron.ipcRenderer.removeListener(channel, listeners[channel])
      })
    }
  }, [setAppStatus, clearApps])

  useEffect(() => {
    const applyTheme = (theme) => {
      document.body.classList.remove("light", "purple", "dark", "gray", "classic", "space")
      if (theme === "system" || !theme) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        document.body.classList.add(systemTheme)
        document.body.setAttribute("data-theme", systemTheme)
      } else {
        document.body.classList.add(theme)
        document.body.setAttribute("data-theme", theme)
      }
    }

    applyTheme(theme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemThemeChange = () => {
      if ((localStorage.getItem("theme") || "system") === "system") applyTheme("system")
    }

    const handleStorageChange = (e) => {
      if (e.key === "theme") setTheme(e.newValue || "system")
    }

    mediaQuery.addEventListener("change", handleSystemThemeChange)
    window.addEventListener("storage", handleStorageChange)

    if (localStorage.getItem("posthogDisabled") === "true") {
      document.body.classList.add("ph-no-capture")
    } else {
      document.body.classList.remove("ph-no-capture")
    }

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [theme])

  const toggleSidebar = () => {
    const newCollapsed = !sidebarCollapsed
    setSidebarCollapsed(newCollapsed)
    localStorage.setItem("sidebarCollapsed", newCollapsed.toString())
  }
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [setOnline])

  const [changelogOpen, setChangelogOpen] = useState(false)

  useEffect(() => {
    const lastSeen = localStorage.getItem("chibangarx:changelogSeenVersion")
    if (lastSeen !== CURRENT_VERSION) {
      const timer = setTimeout(() => setChangelogOpen(true), 500)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  useEffect(() => {
    window.electron.ipcRenderer.invoke("get-admin-status").then((isAdmin: boolean) => {
      setAdminStatus(isAdmin)
    })
    playBoot()
  }, [])

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden bg-chibangarx-bg text-chibangarx-text">
      <img
        src={galaxyBackground}
        alt=""
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover object-center opacity-35"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-chibangarx-bg/75"
      />
      {theme === "space" && <StarField />}
      {startupComplete && userName && <FirstTime />}
      <ChangelogModal
        open={startupComplete && Boolean(userName) && changelogOpen}
        onClose={() => {
          localStorage.setItem("chibangarx:changelogSeenVersion", CURRENT_VERSION)
          setChangelogOpen(false)
        }}
      />
      <NoAdmin
        open={startupComplete && Boolean(userName) && adminStatus === false}
        onClose={() => setAdminStatus(true)}
      />
      {!startupComplete ? (
        <StartupSplash />
      ) : !userName ? (
        <NameOnboarding onComplete={setUserName} />
      ) : (
        <>
          <TitleBar
            onToggleSidebar={toggleSidebar}
            sidebarCollapsed={sidebarCollapsed}
            adminStatus={adminStatus}
          />
          <Nav collapsed={sidebarCollapsed} />
          <div className="relative z-10 flex flex-1 pt-[50px]">
            <main
              className={`flex-1 p-6 rounded-tl-2xl border-t border-l border-chibangarx-border transition-all duration-300 ease-in-out ${sidebarCollapsed ? "ml-16" : "ml-52"}`}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/smart" element={<Smart />} />
                <Route path="/tweaks" element={<Tweaks />} />
                <Route path="/debloat" element={<Debloat />} />
                <Route path="/clean" element={<Clean />} />
                <Route path="/backup" element={<Backup />} />
                <Route path="/utilities" element={<Utilities />} />
                <Route path="/dns" element={<DNS />} />
                <Route path="/apps" element={<Apps />} />
                <Route
                  path="/settings"
                  element={
                    <Settings
                      userName={userName}
                      onUserNameChange={(name) => setUserName(saveUserName(name))}
                    />
                  }
                />
                <Route path="/pro-settings" element={<ProSettings />} />
                <Route path="/clips" element={<GameClips />} />
                <Route path="/drivers" element={<Drivers />} />
                <Route path="/updates" element={<Updates />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </>
      )}
      <ToastContainer
        stacked
        limit={5}
        position="bottom-right"
        theme="dark"
        transition={Slide}
        hideProgressBar
        pauseOnFocusLoss={false}
      />
    </div>
  )
}

export default App
