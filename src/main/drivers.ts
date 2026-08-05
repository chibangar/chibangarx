import { ipcMain, net, shell, app } from "electron"
import { executePowerShell } from "@main/powershell"
import { promises as fs } from "fs"
import path from "path"
import log from "electron-log"
import https from "https"
import http from "http"
import { URL } from "url"
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

// AMD Chipset detection and download
const AMD_CHIPSET_CHECK_SCRIPT = [
  "try {",
  "    $cpu = Get-CimInstance Win32_Processor",
  "    $isAMD = $cpu.Name -match 'AMD|Ryzen|Athlon'",
  "",
  "    if (-not $isAMD) {",
  '        return @{ isAMD = $false } | ConvertTo-Json',
  "    }",
  "",
  "    $amdVersion = ''",
  "    $amdName = ''",
  "",
  "    # Search all uninstall registry paths for AMD Chipset",
  '    $uninstallPaths = @(',
  '        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",',
  '        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall"',
  "    )",
  "",
  "    foreach ($uninstallPath in $uninstallPaths) {",
  "        if (Test-Path $uninstallPath) {",
  '            $apps = Get-ChildItem $uninstallPath -ErrorAction SilentlyContinue | Get-ItemProperty | Where-Object {',
  '                $_.DisplayName -match "AMD.*Chipset" -or $_.DisplayName -match "AMD.*GPIO" -or $_.DisplayName -match "AMD.*PCI" -or $_.DisplayName -match "AMD.*Power" -or $_.DisplayName -match "Ryzen.*Chipset"',
  "            }",
  "            foreach ($app in $apps) {",
  "                if ($app.DisplayVersion -and -not $amdVersion) {",
  "                    $amdVersion = $app.DisplayVersion",
  "                    $amdName = $app.DisplayName",
  "                }",
  "            }",
  "        }",
  "    }",
  "",
  "    # Also check WMI for AMD driver versions",
  "    if (-not $amdVersion) {",
  '        $amdDrivers = Get-CimInstance Win32_PnPSignedDriver | Where-Object {',
  '            $_.Manufacturer -match "AMD" -and ($_.DeviceClass -match "system|bridge|processor|acpi|pci")',
  "        }",
  "        foreach ($driver in $amdDrivers) {",
  "            if ($driver.DriverVersion -and -not $amdVersion) {",
  "                $amdVersion = $driver.DriverVersion",
  "                $amdName = $driver.DeviceName",
  "            }",
  "        }",
  "    }",
  "",
  "    # Get all AMD system devices count",
  '    $amdDevices = Get-CimInstance Win32_PnPSignedDriver | Where-Object {',
  '        $_.Manufacturer -match "AMD" -and ($_.DeviceClass -match "system|bridge|processor|acpi|pci|USB")',
  "    }",
  "",
  "    return @{",
  "        isAMD = $true",
  "        cpuName = $cpu.Name",
  "        currentVersion = $amdVersion",
  "        driverName = $amdName",
  "        deviceCount = $amdDevices.Count",
  "    } | ConvertTo-Json -Depth 3",
  "} catch {",
  '    return @{ error = $_.Exception.Message } | ConvertTo-Json',
  "}",
].join("\n")

async function checkAMDChipset(): Promise<{
  success: boolean
  isAMD?: boolean
  cpuName?: string
  currentVersion?: string
  driverName?: string
  deviceCount?: number
  error?: string
}> {
  try {
    const result = await executePowerShell(null, {
      script: AMD_CHIPSET_CHECK_SCRIPT,
      name: "Check-AMD-Chipset",
    })

    if (!result.success || !result.output) {
      return { success: false, error: result.error || "Failed to check AMD chipset" }
    }

    const parsed = JSON.parse(result.output)
    if (parsed.error) {
      return { success: false, error: parsed.error }
    }

    return {
      success: true,
      isAMD: parsed.isAMD || false,
      cpuName: parsed.cpuName || "",
      currentVersion: parsed.currentVersion || "",
      driverName: parsed.driverName || "",
      deviceCount: parsed.deviceCount || 0,
    }
  } catch (error: any) {
    console.error("Failed to check AMD chipset:", error)
    return { success: false, error: error.message }
  }
}

async function fetchAMDLatestVersion(): Promise<{
  success: boolean
  version?: string
  downloadUrl?: string
  releaseNotes?: string
  highlights?: string[]
  error?: string
}> {
  // Primary: get actual latest version from notFoxils/AMD-Chipset-Drivers repo
  try {
    const linkContent = await new Promise<string>((resolve, reject) => {
      const request = net.request("https://raw.githubusercontent.com/notFoxils/AMD-Chipset-Drivers/main/configs/link.txt")
      request.setHeader("User-Agent", "ChibangaRx")
      let data = ""
      request.on("response", (response) => {
        response.on("data", (chunk) => { data += chunk.toString() })
        response.on("end", () => resolve(data))
      })
      request.on("error", reject)
      request.end()
    })

    const downloadUrl = linkContent.trim()
    // Extract version from URL like https://drivers.amd.com/drivers/amd_chipset_software_8.05.04.516.exe
    const versionMatch = downloadUrl.match(/(\d+\.\d+\.\d+\.\d+)/)
    const version = versionMatch ? versionMatch[1] : null

    if (version && downloadUrl.startsWith("http")) {
      // Get release notes from the same repo
      let highlights: string[] = []
      try {
        const readmeContent = await new Promise<string>((resolve, reject) => {
          const request = net.request("https://raw.githubusercontent.com/notFoxils/AMD-Chipset-Drivers/main/README.md")
          request.setHeader("User-Agent", "ChibangaRx")
          let data = ""
          request.on("response", (response) => {
            response.on("data", (chunk) => { data += chunk.toString() })
            response.on("end", () => resolve(data))
          })
          request.on("error", reject)
          request.end()
        })

        // Extract highlights from README
        const highlightRegex = /\*\*([^*]+)\*\*/g
        let match
        while ((match = highlightRegex.exec(readmeContent)) !== null && highlights.length < 8) {
          const text = match[1].trim()
          if (text && text.length > 10 && !text.includes("http") && !text.includes("SHA")) {
            highlights.push(text)
          }
        }
      } catch {}

      if (highlights.length === 0) {
        highlights = [
          "Latest AMD chipset performance improvements",
          "Bug fixes and stability improvements",
          "Windows 11 compatibility enhancements",
        ]
      }

      console.log(`[ChibangaRx] Latest AMD chipset version: ${version}`)
      return {
        success: true,
        version,
        downloadUrl,
        releaseNotes: `AMD Ryzen Chipset Driver ${version}`,
        highlights,
      }
    }
  } catch (error: any) {
    console.error("[ChibangaRx] Failed to fetch from tracking repo:", error.message)
  }

  // Fallback: try AMD release notes page
  try {
    const pageContent = await new Promise<string>((resolve, reject) => {
      const request = net.request("https://www.amd.com/en/resources/support-articles/release-notes/RN-RYZEN-CHIPSET.html")
      request.setHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
      let data = ""
      request.on("response", (response) => {
        response.on("data", (chunk) => { data += chunk.toString() })
        response.on("end", () => resolve(data))
      })
      request.on("error", reject)
      request.end()
    })

    const versionMatch = pageContent.match(/(\d+\.\d+\.\d+\.\d+)/)
    const version = versionMatch ? versionMatch[1] : null

    if (version) {
      return {
        success: true,
        version,
        downloadUrl: `https://drivers.amd.com/drivers/amd_chipset_software_${version}.exe`,
        releaseNotes: `AMD Ryzen Chipset Driver ${version}`,
        highlights: ["Performance improvements", "Bug fixes", "Windows compatibility"],
      }
    }
  } catch {}

  // Last resort: known working version
  const fallbackVersion = "8.05.04.516"
  console.log(`[ChibangaRx] Using fallback AMD version: ${fallbackVersion}`)
  return {
    success: true,
    version: fallbackVersion,
    downloadUrl: `https://drivers.amd.com/drivers/amd_chipset_software_${fallbackVersion}.exe`,
    releaseNotes: `AMD Ryzen Chipset Driver ${fallbackVersion}`,
    highlights: ["Latest AMD chipset performance improvements", "Bug fixes and stability improvements", "Windows 11 compatibility enhancements"],
  }
}

let amdDownloadAbort: (() => void) | null = null

function downloadFile(
  url: string,
  filePath: string,
  onProgress: (percent: number, transferred: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const client = parsedUrl.protocol === "https:" ? https : http

    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      "Referer": "https://www.amd.com/",
      "Accept": "*/*",
    }

    function follow(redirectUrl: string) {
      const parsed = new URL(redirectUrl)
      const cli = parsed.protocol === "https:" ? https : http
      const req = cli.get(redirectUrl, { headers }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          follow(res.headers.location)
          return
        }
        handleResponse(res)
      })
      req.on("error", reject)
      amdDownloadAbort = () => req.destroy()
    }

    function handleResponse(res: http.IncomingMessage) {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        follow(res.headers.location)
        return
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`))
        return
      }

      const totalBytes = parseInt(res.headers["content-length"] || "0", 10)
      let receivedBytes = 0
      const chunks: Buffer[] = []

      res.on("data", (chunk: Buffer) => {
        chunks.push(chunk)
        receivedBytes += chunk.length
        const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
        onProgress(percent, receivedBytes, totalBytes)
      })

      res.on("end", async () => {
        try {
          const buffer = Buffer.concat(chunks)
          await fs.writeFile(filePath, buffer)
          resolve()
        } catch (err) {
          reject(err)
        }
      })

      res.on("error", reject)
      amdDownloadAbort = () => res.destroy()
    }

    const req = client.get(url, { headers }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        follow(res.headers.location)
        return
      }
      handleResponse(res)
    })

    req.on("error", reject)
    amdDownloadAbort = () => req.destroy()
  })
}

async function downloadAMDChipset(
  _event: any,
  payload: { downloadUrl: string; version: string },
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const { downloadUrl, version } = payload
  const win = mainWindow

  // Validate URL - use fallback if empty/invalid
  let finalUrl = downloadUrl
  if (!finalUrl || !finalUrl.startsWith("http")) {
    const fallbackVersion = version && version !== "latest" ? version : "8.05.04.516"
    finalUrl = `https://drivers.amd.com/drivers/amd_chipset_software_${fallbackVersion}.exe`
    console.log("[ChibangaRx] AMD download URL was invalid, using fallback:", finalUrl)
  }

  try {
    const installDir = app.getPath("userData")
    const filePath = path.join(installDir, `AMDChipsetSoftware-${version}.exe`)

    win?.webContents.send("amd:download-progress", { percent: 0, status: "starting" })

    await downloadFile(finalUrl, filePath, (percent, transferred, total) => {
      win?.webContents.send("amd:download-progress", { percent, transferred, total })
    })

    amdDownloadAbort = null
    console.log("[ChibangaRx] AMD chipset downloaded:", filePath)
    win?.webContents.send("amd:download-complete", { filePath })
    return { success: true, filePath }
  } catch (error: any) {
    amdDownloadAbort = null
    console.error("Failed to download AMD chipset:", error)
    win?.webContents.send("amd:download-error", { error: error.message })
    return { success: false, error: error.message }
  }
}

async function installAMDChipset(
  _event: any,
  filePath: string,
): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    // Run the AMD installer silently
    const script = `Start-Process -FilePath "${filePath}" -ArgumentList "/S" -Wait -NoNewWindow`
    const result = await executePowerShell(null, {
      script,
      name: "Install-AMD-Chipset",
    })

    if (!result.success) {
      return { success: false, error: result.error || "Failed to install AMD chipset" }
    }

    return { success: true, output: "AMD chipset drivers installed successfully" }
  } catch (error: any) {
    console.error("Failed to install AMD chipset:", error)
    return { success: false, error: error.message }
  }
}

function cancelAMDDownload(): void {
  if (amdDownloadAbort) {
    amdDownloadAbort()
    amdDownloadAbort = null
  }
}

  ipcMain.handle("drivers:get-installed", getInstalledDrivers)
  ipcMain.handle("drivers:get-motherboard", getMotherboardInfo)
  ipcMain.handle("drivers:check-updates", checkWindowsUpdateDrivers)
  ipcMain.handle("drivers:install-update", installDriverUpdate)
  ipcMain.handle("drivers:open-windows-update", openWindowsUpdate)
  ipcMain.handle("drivers:search-online", searchDriverOnline)
  ipcMain.handle("drivers:check-amd", checkAMDChipset)
  ipcMain.handle("drivers:fetch-amd-version", fetchAMDLatestVersion)
  ipcMain.handle("drivers:download-amd", downloadAMDChipset)
  ipcMain.handle("drivers:install-amd", installAMDChipset)
  ipcMain.handle("drivers:cancel-amd-download", cancelAMDDownload)
  ipcMain.handle("drivers:download-and-install-amd", downloadAndInstallAMDChipset)
  console.log("[ChibangaRx main/drivers.ts]: Driver handlers setup complete")

export const cleanupDriverHandlers = (): void => {
  ipcMain.removeHandler("drivers:get-installed")
  ipcMain.removeHandler("drivers:get-motherboard")
  ipcMain.removeHandler("drivers:check-updates")
  ipcMain.removeHandler("drivers:install-update")
  ipcMain.removeHandler("drivers:open-windows-update")
  ipcMain.removeHandler("drivers:search-online")
  ipcMain.removeHandler("drivers:check-amd")
  ipcMain.removeHandler("drivers:fetch-amd-version")
  ipcMain.removeHandler("drivers:download-amd")
  ipcMain.removeHandler("drivers:install-amd")
  ipcMain.removeHandler("drivers:cancel-amd-download")
}
