const externalHosts = new Set([
  "github.com", "chibangar.github.io", "discord.gg", "discord.com", "prosettings.net", "getchibangarx.net",
  "www.youtube.com", "youtube.com", "www.amd.com", "www.nvidia.com",
  "www.intel.com", "support.microsoft.com", "www.microsoft.com",
])

export function isAllowedExternalUrl(value: unknown): boolean {
  if (typeof value !== "string") return false
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && externalHosts.has(url.hostname)
  } catch { return false }
}

export function isTrustedDocument(value: string, expected: string): boolean {
  try {
    const actualUrl = new URL(value)
    const expectedUrl = new URL(expected)
    actualUrl.hash = ""
    expectedUrl.hash = ""
    return actualUrl.href === expectedUrl.href
  } catch { return false }
}

type Frame = { url: string }
type Sender = { mainFrame: Frame }
export function isTrustedSender(
  event: { sender: Sender; senderFrame: Frame | null },
  expectedSender: Sender | undefined,
  documentUrl: string,
): boolean {
  return !!expectedSender && event.sender === expectedSender &&
    event.senderFrame === expectedSender.mainFrame &&
    !!event.senderFrame && isTrustedDocument(event.senderFrame.url, documentUrl)
}

export function secureWebPreferences(packaged: boolean) {
  return {
    sandbox: true, contextIsolation: true, nodeIntegration: false,
    nodeIntegrationInWorker: false, nodeIntegrationInSubFrames: false,
    webviewTag: false, webSecurity: true, allowRunningInsecureContent: false,
    devTools: !packaged,
  }
}
