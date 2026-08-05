import { ipcMain } from "electron"
import { executePowerShell } from "@main/powershell"
import { shell } from "electron"
import log from "electron-log"
import { mainWindow } from "@main/windowState"

console.log = log.log
console.error = log.error

interface DriverInfo {
  deviceName: string
  manufacturer: string
  driverVersion: string
  driverDate: string
  deviceClass: string
  hardwareId: string
  isUpToDate?: boolean
  latestVersion?: string
  releaseNotes?: string
  downloadUrl?: string
  category: "chipset" | "motherboard" | "gpu" | "network" | "audio" | "storage" | "other"
}

interface DriverUpdateResult {
  success: boolean
  output?: string
  error?: string
}

// PowerShell script to get installed drivers
const getInstalledDriversScript = [
  "try {",
  '    $drivers = Get-CimInstance Win32_PnPSignedDriver | Where-Object {',
  '        $_.DriverVersion -and $_.DriverVersion -ne "" -and $_.DeviceName -and $_.DeviceName -ne ""',
  "    } | Select-Object DeviceName, Manufacturer, DriverVersion, DriverDate, DeviceClass, HardwareID",
  "",
  "    $result = @()",
  "    foreach ($driver in $drivers) {",
  '        $category = "other"',
  '        $className = if ($driver.DeviceClass) { $driver.DeviceClass.ToLower() } else { "" }',
  "",
  '        if ($className -match "system|bridge|processor|acpi|pci") {',
  '            $category = "chipset"',
  '        } elseif ($className -match "display|video|3d") {',
  '            $category = "gpu"',
  '        } elseif ($className -match "net|ethernet|wifi|wireless") {',
  '            $category = "network"',
  '        } elseif ($className -match "media|audio|sound") {',
  '            $category = "audio"',
  '        } elseif ($className -match "disk|storage|scsi|ide|ahci|nvme|raid") {',
  '            $category = "storage"',
  "        }",
  "",
  "        $result += @{",
  "            deviceName = $driver.DeviceName",
  "            manufacturer = $driver.Manufacturer",
  "            driverVersion = $driver.DriverVersion",
  '            driverDate = if ($driver.DriverDate) { $driver.DriverDate.ToString() } else { "" }',
  "            deviceClass = $driver.DeviceClass",
  '            hardwareId = if ($driver.HardwareID) { $driver.HardwareID[0] } else { "" }',
  "            category = $category",
  "        }",
  "    }",
  "",
  "    $result = $result | Sort-Object category, deviceName",
  "    return $result | ConvertTo-Json -Depth 3",
  "} catch {",
  "    return @{ error = $_.Exception.Message } | ConvertTo-Json",
  "}",
].join("\n")

// PowerShell script to get motherboard info
const getMotherboardInfoScript = [
  "try {",
  "    $board = Get-CimInstance Win32_BaseBoard",
  "    $bios = Get-CimInstance Win32_BIOS",
  "    $cs = Get-CimInstance Win32_ComputerSystem",
  "",
  "    return @{",
  "        manufacturer = $board.Manufacturer",
  "        product = $board.Product",
  "        version = $board.Version",
  "        biosManufacturer = $bios.Manufacturer",
  "        biosVersion = $bios.SMBIOSBIOSVersion",
  "        biosDate = $bios.ReleaseDate.ToString()",
  "        systemManufacturer = $cs.Manufacturer",
  "        systemProduct = $cs.Model",
  "    } | ConvertTo-Json -Depth 3",
  "} catch {",
  "    return @{ error = $_.Exception.Message } | ConvertTo-Json",
  "}",
].join("\n")

// PowerShell script to check Windows Update for drivers
const checkWindowsUpdateDriversScript = [
  "try {",
  "    $updateSession = New-Object -ComObject Microsoft.Update.Session",
  "    $updateSearcher = $updateSession.CreateUpdateSearcher()",
  "",
  '    $searchResult = $updateSearcher.Search("Type=\'Driver\'")',
  "",
  "    $drivers = @()",
  "    foreach ($update in $searchResult.Updates) {",
  "        $drivers += @{",
  "            title = $update.Title",
  "            description = $update.Description",
  "            driverModel = $update.DriverModel",
  "            hardwareId = $update.DriverHardwareId",
  "            version = $update.DriverVerDate",
  "            manufacturer = $update.MufacturerName",
  "            publishedDate = $update.LastDeploymentChangeTime.ToString()",
  "        }",
  "    }",
  "",
  "    return @{",
  "        drivers = $drivers",
  "        count = $searchResult.Updates.Count",
  "        success = $true",
  "    } | ConvertTo-Json -Depth 4",
  "} catch {",
  "    return @{ error = $_.Exception.Message; success = $false } | ConvertTo-Json -Depth 3",
  "}",
].join("\n")

// PowerShell script to install a driver update
function getInstallDriverScript(title: string): string {
  const escapedTitle = title.replace(/'/g, "''")
  return [
    "try {",
    "    $updateSession = New-Object -ComObject Microsoft.Update.Session",
    "    $updateSearcher = $updateSession.CreateUpdateSearcher()",
    "",
    '    $searchResult = $updateSearcher.Search("Type=\'Driver\'")',
    "",
    "    $targetUpdate = $null",
    "    foreach ($update in $searchResult.Updates) {",
    `        if ($update.Title -like "*${escapedTitle}*") {`,
    "            $targetUpdate = $update",
    "            break",
    "        }",
    "    }",
    "",
    "    if (-not $targetUpdate) {",
  '        return @{ error = "Driver update not found"; success = $false } | ConvertTo-Json',
    "    }",
    "",
    "    $downloads = New-Object Microsoft.Update.UpdateColl",
    "    $downloads.Add($targetUpdate) | Out-Null",
    "",
    "    $downloader = $updateSession.CreateUpdateDownloader()",
    "    $downloader.Updates = $downloads",
    "    $downloader.Download()",
    "",
    "    $installations = New-Object Microsoft.Update.UpdateColl",
    "    $installations.Add($targetUpdate) | Out-Null",
    "",
    "    $installer = $updateSession.CreateUpdateInstaller()",
    "    $installer.Updates = $installations",
    "    $result = $installer.Install()",
    "",
    "    return @{",
    "        result = $result.ResultCode",
    "        rebootRequired = $result.RebootRequired",
    "        success = $true",
    "    } | ConvertTo-Json",
    "} catch {",
    "    return @{ error = $_.Exception.Message; success = $false } | ConvertTo-Json",
    "}",
  ].join("\n")
}

// PowerShell script to open Windows Update
const openWindowsUpdateScript = 'Start-Process "ms-settings:windowsupdate-action"'

async function getInstalledDrivers(): Promise<{ success: boolean; drivers?: DriverInfo[]; error?: string }> {
  try {
    const result = await executePowerShell(null, {
      script: getInstalledDriversScript,
      name: "Get-Installed-Drivers",
    })

    if (!result.success || !result.output) {
      return { success: false, error: result.error || "Failed to get drivers" }
    }

    const parsed = JSON.parse(result.output)
    if (parsed.error) {
      return { success: false, error: parsed.error }
    }

    const drivers: DriverInfo[] = (parsed || []).map((d: any) => ({
      deviceName: d.deviceName || "Unknown Device",
      manufacturer: d.manufacturer || "Unknown",
      driverVersion: d.driverVersion || "Unknown",
      driverDate: d.driverDate || "",
      deviceClass: d.deviceClass || "",
      hardwareId: d.hardwareId || "",
      category: d.category || "other",
    }))

    return { success: true, drivers }
  } catch (error: any) {
    console.error("Failed to get installed drivers:", error)
    return { success: false, error: error.message }
  }
}

async function getMotherboardInfo(): Promise<{ success: boolean; info?: any; error?: string }> {
  try {
    const result = await executePowerShell(null, {
      script: getMotherboardInfoScript,
      name: "Get-Motherboard-Info",
    })

    if (!result.success || !result.output) {
      return { success: false, error: result.error || "Failed to get motherboard info" }
    }

    const parsed = JSON.parse(result.output)
    if (parsed.error) {
      return { success: false, error: parsed.error }
    }

    return { success: true, info: parsed }
  } catch (error: any) {
    console.error("Failed to get motherboard info:", error)
    return { success: false, error: error.message }
  }
}

async function checkWindowsUpdateDrivers(): Promise<{
  success: boolean
  drivers?: any[]
  count?: number
  error?: string
}> {
  try {
    const result = await executePowerShell(null, {
      script: checkWindowsUpdateDriversScript,
      name: "Check-Windows-Update-Drivers",
    })

    if (!result.success || !result.output) {
      return { success: false, error: result.error || "Failed to check Windows Update" }
    }

    const parsed = JSON.parse(result.output)
    if (parsed.error) {
      return { success: false, error: parsed.error }
    }

    return {
      success: true,
      drivers: parsed.drivers || [],
      count: parsed.count || 0,
    }
  } catch (error: any) {
    console.error("Failed to check Windows Update drivers:", error)
    return { success: false, error: error.message }
  }
}

async function installDriverUpdate(
  _event: any,
  title: string,
): Promise<DriverUpdateResult> {
  try {
    const script = getInstallDriverScript(title)
    const result = await executePowerShell(null, {
      script,
      name: "Install-Driver-Update",
    })

    if (!result.success) {
      return { success: false, error: result.error || "Failed to install driver" }
    }

    const parsed = JSON.parse(result.output || "{}")
    if (parsed.error) {
      return { success: false, error: parsed.error }
    }

    if (parsed.rebootRequired) {
      mainWindow?.webContents.send("driver:reboot-required")
    }

    return {
      success: true,
      output: parsed.rebootRequired ? "Reboot required to complete installation" : "Driver installed successfully",
    }
  } catch (error: any) {
    console.error("Failed to install driver update:", error)
    return { success: false, error: error.message }
  }
}

async function openWindowsUpdate(): Promise<void> {
  try {
    await executePowerShell(null, {
      script: openWindowsUpdateScript,
      name: "Open-Windows-Update",
    })
  } catch (error: any) {
    console.error("Failed to open Windows Update:", error)
  }
}

async function searchDriverOnline(
  _event: any,
  query: string,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const encodedQuery = encodeURIComponent(query)
    const url = `https://www.google.com/search?q=${encodedQuery}+driver+download`
    shell.openExternal(url)
    return { success: true, url }
  } catch (error: any) {
    console.error("Failed to search driver online:", error)
    return { success: false, error: error.message }
  }
}

export const setupDriverHandlers = (): void => {
  ipcMain.handle("drivers:get-installed", getInstalledDrivers)
  ipcMain.handle("drivers:get-motherboard", getMotherboardInfo)
  ipcMain.handle("drivers:check-updates", checkWindowsUpdateDrivers)
  ipcMain.handle("drivers:install-update", installDriverUpdate)
  ipcMain.handle("drivers:open-windows-update", openWindowsUpdate)
  ipcMain.handle("drivers:search-online", searchDriverOnline)
  console.log("[ChibangaRx main/drivers.ts]: Driver handlers setup complete")
}

export const cleanupDriverHandlers = (): void => {
  ipcMain.removeHandler("drivers:get-installed")
  ipcMain.removeHandler("drivers:get-motherboard")
  ipcMain.removeHandler("drivers:check-updates")
  ipcMain.removeHandler("drivers:install-update")
  ipcMain.removeHandler("drivers:open-windows-update")
  ipcMain.removeHandler("drivers:search-online")
}
