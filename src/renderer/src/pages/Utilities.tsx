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
    runScript: "cleanmgr /sagerun:1",
  },
  {
    key: "utilities.storageSense",
    descKey: "utilities.storageSenseDesc",
    state: true,
    icon: <Computer />,
    type: "toggle",
    checkScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (Test-Path $path) {
  $value = Get-ItemProperty -Path $path -Name "01" -ErrorAction SilentlyContinue
  if ($value."01" -eq 1) { Write-Output "enabled" } else { Write-Output "disabled" }
} else {
  Write-Output "disabled"
}`,
    applyScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (-not (Test-Path $path)) {
  New-Item -Path $path -Force | Out-Null
}
Set-ItemProperty -Path $path -Name "01" -Value 1`,
    unapplyScript: `
$path = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy"
if (Test-Path $path) {
  Set-ItemProperty -Path $path -Name "01" -Value 0
}`,
  },
  {
    key: "utilities.systemInformation",
    command: "msinfo32",
    descKey: "utilities.systemInformationDesc",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonKey: "utilities.systemInformationButton",
    runScript: "msinfo32",
  },
  {
    key: "utilities.fastStartup",
    descKey: "utilities.fastStartupDesc",
    state: false,
    icon: <Zap />,
    type: "toggle",
    checkScript: `
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (Test-Path $path) {
    $value = Get-ItemProperty -Path $path -Name "HiberbootEnabled" -ErrorAction SilentlyContinue
    if ($value.HiberbootEnabled -eq 1) { Write-Output "enabled" } else { Write-Output "disabled" }
} else {
    Write-Output "disabled"
}`,
    applyScript: `
powercfg /hibernate on
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (!(Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
Set-ItemProperty -Path $path -Name "HiberbootEnabled" -Type DWord -Value 1
`,
    unapplyScript: `
$path = "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power"
if (Test-Path $path) { Set-ItemProperty -Path $path -Name "HiberbootEnabled" -Type DWord -Value 0 }
`,
  },
  {
    key: "utilities.graphicsDriver",
    descKey: "utilities.graphicsDriverDesc",
    state: false,
    icon: <GpuIcon />,
    type: "button",
    buttonKey: "utilities.graphicsDriverButton",
    runScript: `
$gpus = Get-PnpDevice -Class Display -Status OK -ErrorAction SilentlyContinue
if ($gpus) {
    foreach ($gpu in $gpus) {
        Write-Output "Restarting $($gpu.FriendlyName)..."
        Disable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false
        Start-Sleep -Seconds 2
        Enable-PnpDevice -InstanceId $gpu.InstanceId -Confirm:$false
    }
    Write-Output "Graphics driver restart completed."
} else {
    Write-Output "No active display devices found."
}
`,
  },
  {
    key: "utilities.windowsSearch",
    descKey: "utilities.windowsSearchDesc",
    state: false,
    icon: <Monitor />,
    type: "button",
    buttonKey: "utilities.windowsSearchButton",
    runScript: `
try {
    Get-AppxPackage Microsoft.Windows.Search | Reset-AppxPackage
    Write-Output "Microsoft.Windows.Search restart completed."
}
catch {
    Write-Output "An error occured while resetting Microsoft.Windows.Search."
}
try {
    Get-AppxPackage MicrosoftWindows.Client.CBS | Reset-AppxPackage
    Write-Output "MicrosoftWindows.Client.CBS restart completed."
}
catch {
    Write-Output "An error occured while resetting MicrosoftWindows.Client.CBS."
}
`,
  },
  {
    key: "utilities.powerPlan",
    descKey: "utilities.powerPlanDesc",
    state: false,
    icon: <Monitor />,
    type: "dropdown",
    options: ["Balanced", "High Performance", "Power Saver", "Ultimate Performance"],
    checkScript: `
$current = powercfg /getactivescheme
if ($current -match "Power saver") { Write-Output "Power Saver" }
elseif ($current -match "High performance") { Write-Output "High Performance" }
elseif ($current -match "Ultimate Performance") { Write-Output "Ultimate Performance" }
else { Write-Output "Balanced" }
`,
    applyScript: {
      Balanced: `powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e`,
      "High Performance": `powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c`,
      "Power Saver": `powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a`,
      "Ultimate Performance": `
$ultimatePlan = powercfg -l | Select-String "Ultimate Performance"

if (-not $ultimatePlan) {
    Write-Host "Ultimate Performance plan not found. Creating..."
    powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61
} else {
    Write-Host "Ultimate Performance plan already exists."
}

$ultimatePlanGUID = (powercfg -l | Select-String "Ultimate Performance").ToString().Split()[3]

if ($ultimatePlanGUID) {
    powercfg -setactive $ultimatePlanGUID 2>$null
    Write-Host "Ultimate Performance power plan is now active."
} else {
    Write-Host "Failed to find Ultimate Performance plan GUID."
}
`,
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
    runScript: `
ipconfig /flushdns
Write-Output "DNS cache flushed."
`,
  },
  {
    key: "utilities.releaseIp",
    command: "ipconfig /release",
    descKey: "utilities.releaseIpDesc",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonKey: "utilities.releaseIpButton",
    runScript: `
ipconfig /release
Write-Output "IP address released. You are temporarily disconnected from the network."
`,
  },
  {
    key: "utilities.renewIp",
    command: "ipconfig /renew",
    descKey: "utilities.renewIpDesc",
    state: false,
    icon: <NetworkIcon />,
    type: "button",
    buttonKey: "utilities.renewIpButton",
    runScript: `
ipconfig /renew
Write-Output "New IP address obtained successfully."
`,
  },
  {
    key: "utilities.fixBluetooth",
    descKey: "utilities.fixBluetoothDesc",
    state: false,
    icon: <BluetoothIcon />,
    type: "button",
    buttonKey: "utilities.fixBluetoothButton",
    runScript: `
Stop-Service -Name "bthserv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "bthserv" -ErrorAction SilentlyContinue
Write-Output "Bluetooth services restarted."
`,
  },
  {
    key: "utilities.systemFileChecker",
    command: "sfc /scannow",
    descKey: "utilities.systemFileCheckerDesc",
    state: false,
    icon: <Wrench />,
    type: "button",
    buttonKey: "utilities.systemFileCheckerButton",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "sfc /scannow; Write-Output 'System File Checker completed'"

`,
  },
  {
    key: "utilities.dismHealthRestore",
    command: "dism /restorehealth",
    descKey: "utilities.dismHealthRestoreDesc",
    state: false,
    icon: <Star />,
    type: "button",
    buttonKey: "utilities.dismHealthRestoreButton",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dism /online /cleanup-image /restorehealth; Write-Output 'DISM Health Restore completed'"

`,
  },
  {
    key: "utilities.checkDisk",
    command: "chkdsk",
    descKey: "utilities.checkDiskDesc",
    state: false,
    icon: <HardDrive />,
    type: "button",
    buttonKey: "utilities.checkDiskButton",
    runScript: `
Start-Process powershell -ArgumentList "-NoExit", "-Command", "chkdsk /f /r /x; Write-Output 'Check Disk completed'"

`,
  },
  {
    key: "utilities.restartAudioService",
    descKey: "utilities.restartAudioServiceDesc",
    state: false,
    icon: <Volume2Icon />,
    type: "button",
    buttonKey: "utilities.restartAudioServiceButton",
    runScript: `
Stop-Service -Name "Audiosrv" -Force -ErrorAction SilentlyContinue
Start-Service -Name "Audiosrv" -ErrorAction SilentlyContinue
Write-Output "Audio service restarted."
`,
  },
  {
    key: "utilities.networkReset",
    command: "netsh",
    descKey: "utilities.networkResetDesc",
    state: false,
    icon: <WifiIcon />,
    type: "button",
    buttonKey: "utilities.networkResetButton",
    runScript: `
netsh winsock reset
netsh int ip reset
Write-Output "Network stack reset. Restart your PC to apply changes."
`,
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
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.key}`,
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
              channel: "run-powershell",
              payload: {
                script: util.checkScript,
                name: `check-${util.key}`,
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
          channel: "run-powershell",
          payload: {
            script,
            name: `${newState ? "apply" : "unapply"}-${util.key}`,
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
            channel: "run-powershell",
            payload: {
              script,
              name: `apply-${util.key}-${value}`,
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
          channel: "run-powershell",
          payload: {
            script: util.runScript,
            name: `run-${util.key}`,
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
        <div className="bg-sparkle-card border border-sparkle-border rounded-2xl p-4 shadow-2xl max-w-lg w-full mx-4 flex flex-col items-center text-center">
           <h1 className="text-3xl font-bold text-sparkle-text mb-4">
             {t("utilities.whatsNew")}
           </h1>

           <p className="text-sparkle-text-secondary mb-6">
             {t("utilities.redesignDesc")}
           </p>

           <p className="text-sparkle-text-secondary mb-4 text-sm">
             {t("utilities.modalDesc1")}
             <br />
             <br />
             {t("utilities.modalDesc2")}
             <br />
             <br />
             {t("utilities.modalDesc3")}
             <br />
             <br />
             <p className="text-sparkle-primary">
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
            <p className="text-sparkle-text-secondary flex text-center items-center justify-center gap-2">
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
                        <p className="text-xs text-sparkle-primary">
                          {t("utilities.cmdLabel")}:{" "}
                          <code className="bg-sparkle-border p-0.5 rounded-md">{util.command}</code>
                        </p>
                      )}
                    </div>
                    <p className="text-sm  text-sparkle-text-secondary">{t(util.descKey)}</p>
                  </div>
                  <div className="flex justify-end ml-auto">
                    {util.type === "toggle" &&
                      (loadingStates[util.key] ? (
                        <div className="w-6 h-6 border-2 border-sparkle-border-secondary border-t-sparkle-primary rounded-full animate-spin" />
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
                        <div className="w-6 h-6 border-2 border-sparkle-border-secondary border-t-sparkle-primary rounded-full animate-spin" />
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