import { promises as fsp } from "fs"
import path from "path"
import util from "util"
import { execFile, spawn } from "child_process"
import { app, } from "electron"
import { ipcMain } from "./secure-ipc"
import { mainWindow } from "@main/windowState"
import fs from "fs"
import log from "electron-log"
import { randomUUID } from "crypto"
import { resolveOperation } from "./operations"
import { confirmOperation } from "./secure-ipc"
const execFilePromise = util.promisify(execFile)

console.log = log.log
console.error = log.error
console.warn = log.warn

function isSafeId(id: string): boolean {
  return typeof id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(id)
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
  if (fs.lstatSync(dirPath).isSymbolicLink()) throw new Error("Script directory cannot be a symbolic link")
}

export async function executePowerShell(_, props) {
  const { script, name = "script" } = props

  try {
    const tempDir = path.join(app.getPath("userData"), "scripts")
    ensureDirectoryExists(tempDir)
    const tempFile = path.join(tempDir, `${randomUUID()}.ps1`)

    const fullScript = script + "\nexit $LASTEXITCODE"
    await fsp.writeFile(tempFile, fullScript, { flag: "wx", mode: 0o600 })

    const { stdout, stderr } = await execFilePromise(
      path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", tempFile],
      { windowsHide: true, timeout: 300_000, maxBuffer: 4 * 1024 * 1024 },
    ).finally(() => fsp.unlink(tempFile).catch(console.error))

    if (stderr) {
      console.warn(`PowerShell stderr [${name}]:`, stderr)
    }

    console.log(`PowerShell stdout [${name}]:`, stdout)

    return { success: true, output: stdout }
  } catch (error: any) {
    console.error(`PowerShell execution error [${name}]:`, error)
    return { success: false, error: error.message }
  }
}

function sendToRenderer(channel: string, ...args: any[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args)
  }
}

function sendOutput(appId: string, text: string) {
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    if (line.trim()) {
      sendToRenderer("install-output", { appId, line })
    }
  }
}

export function executePowerShellStreaming(
  _,
  { script, name = "script", appId }: { script: string; name: string; appId: string }
): Promise<{ success: boolean; output?: string; error?: string }> {
  return new Promise(async (resolve) => {
    const tempDir = path.join(app.getPath("userData"), "scripts")
    ensureDirectoryExists(tempDir)
    const tempFile = path.join(tempDir, `${randomUUID()}.ps1`)

    const fullScript = script + "\nexit $LASTEXITCODE"
    await fsp.writeFile(tempFile, fullScript, { flag: "wx", mode: 0o600 })

    let fullOutput = ""

    const child = spawn(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"), [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      tempFile,
    ], { windowsHide: true, timeout: 900_000 })

    child.stdout?.on("data", (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      sendOutput(appId, text)
    })

    child.stderr?.on("data", (data: Buffer) => {
      const text = data.toString()
      fullOutput += text
      sendOutput(appId, text)
    })

    child.on("close", async (code) => {
      await fsp.unlink(tempFile).catch(console.error)

      if (code === 0) {
        console.log(`PowerShell stdout [${name}]:`, fullOutput)
        resolve({ success: true, output: fullOutput })
      } else {
        console.error(`PowerShell execution error [${name}]: Exit code ${code}`)
        resolve({ success: false, error: `Process exited with code ${code}`, output: fullOutput })
      }
    })

    child.on("error", async (error) => {
      await fsp.unlink(tempFile).catch(console.error)
      console.error(`PowerShell spawn error [${name}]:`, error)
      resolve({ success: false, error: error.message })
    })
  })
}

export async function checkChocolatey(): Promise<{ success: boolean; installed: boolean }> {
  try {
    const chocoPath = path.join("C:\\ProgramData\\chocolatey\\bin\\choco.exe")
    const installed = fs.existsSync(chocoPath)
    if (installed) {
      console.log("Chocolatey is installed:", chocoPath)
    } else {
      console.log("Chocolatey is not installed")
    }
    return { success: true, installed }
  } catch (error) {
    console.error("Error checking Chocolatey installation:", error)
    return { success: false, installed: false }
  }
}

export const setupPowerShellHandlers = (): void => {
  ipcMain.handle("maintenance:run", async (event, request: unknown) => {
    const operation = resolveOperation(request)
    if (operation.requiresConfirmation) await confirmOperation((request as { operation: string }).operation)
    return executePowerShell(event, { script: operation.script, name: "maintenance" })
  })
  ipcMain.handle("check-chocolatey", async () => checkChocolatey())
  ipcMain.handle("install-chocolatey", async (event) => {
    try {
      const result = await executePowerShell(event, {
        script: "winget install --id chocolatey.chocolatey --source winget",
        name: "install-chocolatey",
      })
      if (result.success) {
        return { installed: true, version: (result as any).output.trim() }
      } else {
        return { installed: false }
      }
    } catch (error) {
      console.error("Error installing Chocolatey:", error)
      return { installed: false }
    }
  })
  ipcMain.handle("handle-apps", async (event, { action, apps, source }) => {
    if (!["install", "uninstall", "check-installed"].includes(action) ||
        !["Chocolatey", "Winget"].includes(source) || !Array.isArray(apps) ||
        apps.length > 200 || !apps.every(isSafeId)) throw new Error("Invalid package request")
    if (action !== "check-installed") await confirmOperation(`${action}: ${apps.join(", ")}`)
    switch (action) {
      case "install":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`)
            sendToRenderer("install-app-error", { appId })
            continue
          }
          let command
          if (source === "Chocolatey") {
            command = `choco install ${appId} -y`
          } else {
            command = `winget install ${appId} --silent --accept-package-agreements --accept-source-agreements`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming(event, {
            script: command,
            name: `Install-${appId}`,
            appId,
          })
          const isChocoFailure =
            source === "Chocolatey" &&
            !result.success &&
            result.output &&
            !result.output.includes("already installed")

          if (result.success || (result.output && result.output.includes("already installed"))) {
            console.log(`Successfully installed ${appId}`)
            sendToRenderer("install-app-complete", { appId })
          } else if (isChocoFailure) {
            console.log(`Initial install failed for ${appId}, retrying with --pre flag`)
            sendToRenderer("install-output", { appId, line: "\nRetrying with --pre flag...\n" })
            const retryCommand = `choco install ${appId} -y --pre`
            const retryResult = await executePowerShellStreaming(event, {
              script: retryCommand,
              name: `Install-${appId}-pre`,
              appId,
            })

            if (
              retryResult.success ||
              (retryResult.output && retryResult.output.includes("already installed"))
            ) {
              console.log(`Successfully installed ${appId} with --pre flag`)
              sendToRenderer("install-app-complete", { appId })
            } else {
              console.error(`Failed to install ${appId} even with --pre flag:`, retryResult.error)
              sendToRenderer("install-app-error", { appId })
            }
          } else {
            console.error(`Failed to install ${appId}:`, result.error)
            sendToRenderer("install-app-error", { appId })
          }
        }
        sendToRenderer("install-complete")
        break

      case "uninstall":
        for (const appId of apps) {
          if (!isSafeId(appId)) {
            console.error(`Rejected unsafe app ID: ${appId}`)
            sendToRenderer("install-app-error", { appId })
            continue
          }
          let command
          if (source === "Chocolatey") {
            command = `choco uninstall ${appId} -y`
          } else {
            command = `winget uninstall ${appId} --silent`
          }

          sendToRenderer("install-start", { appId })
          const result = await executePowerShellStreaming(event, {
            script: command,
            name: `Uninstall-${appId}`,
            appId,
          })

          if (result.success) {
            console.log(`Successfully uninstalled ${appId}`)
            sendToRenderer("install-app-complete", { appId })
          } else {
            console.error(`Failed to uninstall ${appId}:`, result.error)
            sendToRenderer("install-app-error", { appId })
          }
        }
        sendToRenderer("install-complete")
        break

      case "check-installed":
        try {
          const result = await executePowerShell(event, {
            script: "winget list",
            name: "check-installed",
          })

          if (!result.success) {
            throw new Error(result.error)
          }

          const escapeRegExp = (string) => {
            return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          }

          const installedAppIds = apps.filter((appId) => {
            const regex = new RegExp(`\\b${escapeRegExp(appId)}\\b`, "i")
            return regex.test((result as any).output)
          })

          if (mainWindow) {
            mainWindow.webContents.send("installed-apps-checked", {
              success: true,
              installed: installedAppIds,
            })
          }
        } catch (error) {
          console.error("Failed to check installed apps:", error)
          if (mainWindow) {
            mainWindow.webContents.send("installed-apps-checked", {
              success: false,
              error: (error as any).message,
            })
          }
        }
        break

      default:
        console.error(`Unknown action: ${action}`)
    }
  })
  console.log("[ChibangaRx main/powershell.ts]: PowerShell handlers setup complete")
}

export const cleanupPowerShellHandlers = (): void => {
  ipcMain.removeHandler("maintenance:run")
  ipcMain.removeHandler("check-chocolatey")
  ipcMain.removeHandler("install-chocolatey")
  ipcMain.removeHandler("handle-apps")
}
