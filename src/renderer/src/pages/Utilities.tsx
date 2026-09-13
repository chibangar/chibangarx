import RootDiv from "@/components/rootdiv"
import Button from "@/components/ui/button"
import Card from "@/components/ui/Card"
import Toggle from "@/components/ui/Toggle"
import {
  GpuIcon,
  HardDrive,
  Monitor,
  GlobeIcon,
  Zap,
  Computer,
  Volume2Icon,
  WifiIcon,
  Wrench,
  Star,
  NetworkIcon,
  BluetoothIcon,
  SearchIcon,
} from "lucide-react"
import { useState, useEffect } from "react"
import { invoke } from "@/lib/electron"
import { toast } from "react-toastify"
import log from "electron-log/renderer"
import { Dropdown } from "@/components/ui/dropdown"
import Modal from "@/components/ui/modal"
import { LargeInput } from "@/components/ui/input"
import { useTranslation } from "react-i18next"

type Utility = {
  key: string
  command?: string
  descKey: string
  state: boolean
  icon: React.ReactNode
  type: "button" | "toggle" | "dropdown"
  buttonKey?: string
  options?: string[]
  checkScript?: string
  applyScript?: string | Record<string, string>
  unapplyScript?: string
  runScript?: string
}

const utilities: Utility[] = [
  {
    key: "utilities.diskCleaner",
    command: "cleanmgr",
    descKey: "utilities.diskCleanerDesc",
    state: true,
    icon: <HardDrive />,
    type: "button",
    buttonKey: "utilities.diskCleanerButton",
    runScript: "run-utilities.diskCleaner",
  },
  {
    key: "utilities.storageSense",
    descKey: "utilities.storageSenseDesc",
    state: true,
    icon: <Computer />,
    type: "toggle",
    checkScript: "check-utilities.storageSense",
    applyScript: "apply-utilities.storageSense",
    unapplyScript: "unapply-utilities.storageSense",
  },
  {
    key: "utilities.systemInformation",
    command: "msinfo32",
    descKey: "utilities.systemInformationDesc",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonKey: "utilities.systemInformationButton",
    runScript: "run-utilities.systemInformation",
  },
  {
    key: "utilities.fastStartup",
    descKey: "utilities.fastStartupDesc",
    state: false,
    icon: <Zap />,
    type: "toggle",
    checkScript: "check-utilities.fastStartup",
    applyScript: "apply-utilities.fastStartup",
    unapplyScript: "unapply-utilities.fastStartup",
  },
  {
    key: "utilities.graphicsDriver",
    descKey: "utilities.graphicsDriverDesc",
    state: false,
    icon: <GpuIcon />,
    type: "button",
    buttonKey: "utilities.graphicsDriverButton",
    runScript: "run-utilities.graphicsDriver",
  },
  {
    key: "utilities.windowsSearch",
    descKey: "utilities.windowsSearchDesc",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonKey: "utilities.windowsSearchButton",
    runScript: "run-utilities.windowsSearch",
  },
  {
    key: "utilities.powerPlan",
    descKey: "utilities.powerPlanDesc",
    state: false,
    icon: <Monitor />,
    type: "dropdown",
    options: ["Balanced", "High Performance", "Power Saver", "Ultimate Performance"],
    checkScript: "check-utilities.powerPlan",
    applyScript: {
      Balanced: "apply-utilities.powerPlan-Balanced",
      "High Performance": "apply-utilities.powerPlan-High Performance",
      "Power Saver": "apply-utilities.powerPlan-Power Saver",
      "Ultimate Performance": "apply-utilities.powerPlan-Ultimate Performance",
    },
  },
  {
    key: "utilities.flushDnsCache",
    command: "ipconfig /flushdns",
    descKey: "utilities.flushDnsCacheDesc",
    state: false,
    icon: <GlobeIcon />,
    type: "button",
    buttonKey: "utilities.flushDnsCacheButton",
    runScript: "run-utilities.flushDnsCache",
  },
  {
    key: "utilities.releaseIp",
    command: "ipconfig /release",
    descKey: "utilities.releaseIpDesc",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonKey: "utilities.releaseIpButton",
    runScript: "run-utilities.releaseIp",
  },
  {
    key: "utilities.renewIp",
    command: "ipconfig /renew",
    descKey: "utilities.renewIpDesc",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonKey: "utilities.renewIpButton",
    runScript: "run-utilities.renewIp",
  },
  {
    key: "utilities.fixBluetooth",
    descKey: "utilities.fixBluetoothDesc",
    state: false,
    icon: <BluetoothIcon />,
    type: "button",
    buttonKey: "utilities.fixBluetoothButton",
    runScript: "run-utilities.fixBluetooth",
  },
  {
    key: "utilities.systemFileChecker",
    command: "sfc /scannow",
    descKey: "utilities.systemFileCheckerDesc",
    state: false,
    icon: <Wrench />,
    type: "button",
    buttonKey: "utilities.systemFileCheckerButton",
    runScript: "run-utilities.systemFileChecker",
  },
  {
    key: "utilities.dismHealthRestore",
    command: "dism /restorehealth",
    descKey: "utilities.dismHealthRestoreDesc",
    state: false,
    icon: <Star />,
    type: "button",
    buttonKey: "utilities.dismHealthRestoreButton",
    runScript: "run-utilities.dismHealthRestore",
  },
  {
    key: "utilities.checkDisk",
    command: "chkdsk",
    descKey: "utilities.checkDiskDesc",
    state: false,
    icon: <HardDrive />,
    type: "button",
    buttonKey: "utilities.checkDiskButton",
    runScript: "run-utilities.checkDisk",
  },
  {
    key: "utilities.restartAudioService",
    descKey: "utilities.restartAudioServiceDesc",
    state: false,
    icon: <Volume2Icon />,
    type: "button",
    buttonKey: "utilities.restartAudioServiceButton",
    runScript: "run-utilities.restartAudioService",
  },
  {
    key: "utilities.networkReset",
    command: "netsh",
    descKey: "utilities.networkResetDesc",
    state: false,
    icon: <WifiIcon />,
    type: "button",
    buttonKey: "utilities.networkResetButton",
    runScript: "run-utilities.networkReset",
  },
]

function Utilities() {
  const { t } = useTranslation()
  const [dropdownValues, setDropdownValues] = useState<Record<string, string>>({})
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filteredUtilities = utilities.filter(
    (util) =>
      t(util.key).toLowerCase().includes(search.toLowerCase()) ||
      t(util.descKey).toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    if (localStorage.getItem("utilitiesModalShown") !== "true") {
      setModalOpen(true)
    }
  }, [])

  useEffect(() => {
    const checkAllStates = async () => {
      const checkPromises = utilities.map(async (util) => {
        if (util.type === "toggle" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.key]: true }))
          try {
            const result = await invoke({
              channel: "maintenance:run",
              payload: {
                operation: util.checkScript,
              },
            })
            if (result.success) {
              const isEnabled = result.output.trim().toLowerCase() === t("utilities.stateEnabled").toLowerCase()
              setToggleStates((prev) => ({ ...prev, [util.key]: isEnabled }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.key}:`, error)
            log.error(`Failed to check ${util.key}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.key]: false }))
          }
        } else if (util.type === "dropdown" && util.checkScript) {
          setLoadingStates((prev) => ({ ...prev, [util.key]: true }))
          try {
            const result = await invoke({
              channel: "maintenance:run",
              payload: {
                operation: util.checkScript,
              },
            })
            if (result.success) {
              const value = result.output.trim()
              setDropdownValues((prev) => ({ ...prev, [util.key]: value }))
            }
          } catch (error) {
            console.error(`Failed to check ${util.key}:`, error)
            log.error(`Failed to check ${util.key}:`, error)
          } finally {
            setLoadingStates((prev) => ({ ...prev, [util.key]: false }))
          }
        }
      })

      await Promise.all(checkPromises)
    }

    checkAllStates()
  }, [t])

  const handleToggleChange = async (util: Utility, newState: boolean) => {
    toast.dismiss()
    const previousState = toggleStates[util.key]
    setToggleStates((prev) => ({ ...prev, [util.key]: newState }))

    const script = newState ? util.applyScript : util.unapplyScript
    if (script) {
      const loadingToastId = toast.loading(
        `${newState ? t("utilities.applying") : t("utilities.unapplying")} ${t(util.key)}...`,
      )
      try {
        const result = await invoke({
          channel: "maintenance:run",
          payload: {
            operation: script,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }
        toast.update(loadingToastId, {
          render: `${newState ? t("utilities.applied") : t("utilities.unapplied")} ${t(util.key)}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error toggling ${util.key}:`, error)
        log.error(`Error toggling ${util.key}:`, error)
        setToggleStates((prev) => ({ ...prev, [util.key]: previousState }))
        toast.update(loadingToastId, {
          render: `${t("utilities.failed")} ${newState ? t("utilities.applying") : t("utilities.unapplying")} ${t(util.key)}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  const handleDropdownChange = async (util: Utility, value: string) => {
    toast.dismiss()
    const previousValue = dropdownValues[util.key]
    setDropdownValues((prev) => ({ ...prev, [util.key]: value }))

    if (util.applyScript) {
      const script =
        typeof util.applyScript === "object" ? util.applyScript[value] : util.applyScript
      if (script) {
        const loadingToastId = toast.loading(`${t("utilities.applying")} ${t(util.key)}: ${value}...`)
        try {
          const result = await invoke({
            channel: "maintenance:run",
            payload: {
              operation: script,
            },
          })
          if (!result.success) {
            throw new Error(result.error || "Failed to execute script")
          }
          toast.update(loadingToastId, {
            render: `${t("utilities.applied")} ${t(util.key)}: ${value}`,
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        } catch (error) {
          console.error(`Error applying ${util.key}:`, error)
          log.error(`Error applying ${util.key}:`, error)
          setDropdownValues((prev) => ({ ...prev, [util.key]: previousValue }))
          toast.update(loadingToastId, {
            render: `${t("utilities.failed")} ${t("utilities.applying")} ${t(util.key)}: ${value}`,
            type: "error",
            isLoading: false,
            autoClose: 3000,
          })
        }
      }
    }
  }

  const handleButtonClick = async (util: Utility) => {
    toast.dismiss()
    if (util.runScript) {
      const loadingToastId = toast.loading(`${t("utilities.running")} ${t(util.key)}...`)
      try {
        const result = await invoke({
          channel: "maintenance:run",
          payload: {
            operation: util.runScript,
          },
        })
        if (!result.success) {
          throw new Error(result.error || "Failed to execute script")
        }
        toast.update(loadingToastId, {
          render: `${t(util.key)} ${t("utilities.completed")}`,
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } catch (error) {
        console.error(`Error running ${util.key}:`, error)
        log.error(`Error running ${util.key}:`, error)
        toast.update(loadingToastId, {
          render: `${t("utilities.failed")} ${t(util.key)}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
      }
    }
  }

  return (
    <>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-2xl max-w-lg w-full mx-4 flex flex-col items-center text-center">
           <h1 className="text-3xl font-bold text-chibangarx-text mb-4">
             {t("utilities.whatsNew")}
           </h1>

           <p className="text-chibangarx-text-secondary mb-6">
             {t("utilities.redesignDesc")}
           </p>

           <p className="text-chibangarx-text-secondary mb-4 text-sm">
             {t("utilities.modalDesc1")}
             <br />
             <br />
             {t("utilities.modalDesc2")}
             <br />
             <br />
             {t("utilities.modalDesc3")}
             <br />
             <br />
             <p className="text-chibangarx-primary">
               {t("utilities.modalDesc4")}
             </p>
             <br /> <br />
           </p>

           <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
             <Button
               onClick={() => {
                 setModalOpen(false)
                 localStorage.setItem("utilitiesModalShown", "true")
               }}
             >
               {t("utilities.gotIt")}
             </Button>
           </div>
        </div>
      </Modal>

      <RootDiv>
        <div className="flex gap-4 flex-col mb-10 mr-4">
          <LargeInput
            placeholder={t("utilities.searchPlaceholder")}
            className="w-full"
            icon={SearchIcon}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          {filteredUtilities.length === 0 && (
            <p className="text-chibangarx-text-secondary flex text-center items-center justify-center gap-2">
              {t("utilities.noMatch")}
            </p>
          )}
          {filteredUtilities !== null &&
            filteredUtilities.map((util) => {
              return (
                <Card className="p-4 flex items-center gap-4" key={util.key}>
                  {util.icon}
                  <div>
                    <div className="flex gap-3 items-center">
                      <h1>{t(util.key)}</h1>{" "}
                      {util.command && (
                        <p className="text-xs text-chibangarx-primary">
                          {t("utilities.cmdLabel")}:{" "}
                          <code className="bg-chibangarx-border p-0.5 rounded-md">{util.command}</code>
                        </p>
                      )}
                    </div>
                    <p className="text-sm  text-chibangarx-text-secondary">{t(util.descKey)}</p>
                  </div>
                  <div className="flex justify-end ml-auto">
                    {util.type === "toggle" &&
                      (loadingStates[util.key] ? (
                        <div className="w-6 h-6 border-2 border-chibangarx-border-secondary border-t-chibangarx-primary rounded-full animate-spin" />
                      ) : (
                        <Toggle
                          checked={toggleStates[util.key] || false}
                          onChange={(checked: boolean) => handleToggleChange(util, checked)}
                        />
                      ))}
                    {util.type === "button" && (
                      <Button onClick={() => handleButtonClick(util)}>{t(util.buttonKey || "common.ok")}</Button>
                    )}
                    {util.type === "dropdown" &&
                      (loadingStates[util.key] ? (
                        <div className="w-6 h-6 border-2 border-chibangarx-border-secondary border-t-chibangarx-primary rounded-full animate-spin" />
                      ) : (
                         <Dropdown
                          options={util.options || []}
                          value={dropdownValues[util.key] || util.options?.[0] || ""}
                          onChange={(value) => handleDropdownChange(util, value)}
                        />
                      ))}
                  </div>
                </Card>
              )
            })}
        </div>
      </RootDiv>
    </>
  )
}

export default Utilities
