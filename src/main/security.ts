const OFFICIAL_RELEASE_HOST = "github.com"
const OFFICIAL_RELEASE_PATH = "/chibangar/chibangarx/releases/download/"

/** True only for immutable release assets published by this application. */
export function isTrustedDownloadUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === OFFICIAL_RELEASE_HOST &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith(OFFICIAL_RELEASE_PATH)
    )
  } catch {
    return false
  }
}

/** AMD chipset installers may only be fetched from AMD's HTTPS driver CDN. */
export function isTrustedAmdDriverUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (
      url.protocol === "https:" &&
      url.hostname === "drivers.amd.com" &&
      url.port === "" &&
      url.username === "" &&
      url.password === "" &&
      url.pathname.startsWith("/drivers/") &&
      url.pathname.toLowerCase().endsWith(".exe")
    )
  } catch {
    return false
  }
}

/** Reject path separators, control characters, and Windows-reserved names. */
export function safeDownloadFilename(value: string): string {
  if (
    !value ||
    value.length > 180 ||
    value !== value.trim() ||
    /[\\/:*?"<>|\u0000-\u001f]/.test(value) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i.test(value)
  ) {
    throw new Error("Invalid download filename")
  }
  return value
}
