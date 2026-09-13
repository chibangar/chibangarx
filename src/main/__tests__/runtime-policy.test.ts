import { describe, expect, it } from "vitest"
import { isAllowedExternalUrl, isTrustedDocument, isTrustedSender, secureWebPreferences } from "../runtime-policy"

describe("renderer trust boundary", () => {
  it("isolates the renderer and prevents production debugging", () => {
    expect(secureWebPreferences(true)).toMatchObject({ sandbox: true, contextIsolation: true, nodeIntegration: false, webviewTag: false, devTools: false })
  })
  it("accepts hash routes in the exact application document only", () => {
    expect(isTrustedDocument("file:///app/index.html#/settings", "file:///app/index.html")).toBe(true)
    for (const url of ["file:///app/evil.html", "file:///app/index.html?evil=1", "https://evil.test", "about:blank", "not a url"]) {
      expect(isTrustedDocument(url, "file:///app/index.html")).toBe(false)
    }
  })
  it("rejects other windows and child frames even on a trusted URL", () => {
    const frame = { url: "file:///app/index.html" }
    const sender = { mainFrame: frame }
    expect(isTrustedSender({ sender, senderFrame: frame }, sender, frame.url)).toBe(true)
    expect(isTrustedSender({ sender, senderFrame: { ...frame } }, sender, frame.url)).toBe(false)
    expect(isTrustedSender({ sender: { mainFrame: frame }, senderFrame: frame }, sender, frame.url)).toBe(false)
    expect(isTrustedSender({ sender, senderFrame: null }, sender, frame.url)).toBe(false)
  })
  it("allows official HTTPS destinations without accepting credentials or lookalikes", () => {
    expect(isAllowedExternalUrl("https://github.com/chibangar/chibangarx/releases")).toBe(true)
    for (const url of ["https://github.com.evil.test", "https://github.com@evil.test", "https://user:pass@github.com", "http://github.com", "file:///C:/Windows/System32/cmd.exe", "ms-settings:windowsupdate", "javascript:alert(1)", "https://github.com:8443", "https://evil.test"]) {
      expect(isAllowedExternalUrl(url)).toBe(false)
    }
  })
})
