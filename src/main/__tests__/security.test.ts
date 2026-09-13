import { describe, expect, it } from "vitest"
import { isTrustedAmdDriverUrl, isTrustedDownloadUrl, safeDownloadFilename } from "@main/security"

describe("download trust boundary", () => {
  it("accepts only HTTPS release assets from the official repository", () => {
    expect(
      isTrustedDownloadUrl(
        "https://github.com/chibangar/chibangarx/releases/download/v2.45.23/ChibangaRx-Setup.exe",
      ),
    ).toBe(true)
  })

  it("rejects lookalike, non-HTTPS, and non-release download URLs", () => {
    expect(isTrustedDownloadUrl("http://github.com/chibangar/chibangarx/releases/download/v2/a.exe")).toBe(false)
    expect(isTrustedDownloadUrl("https://github.com.evil.example/chibangar/chibangarx/releases/download/v2/a.exe")).toBe(false)
    expect(isTrustedDownloadUrl("https://github.com/chibangar/other/releases/download/v2/a.exe")).toBe(false)
    expect(isTrustedDownloadUrl("https://github.com/chibangar/chibangarx/blob/main/a.exe")).toBe(false)
  })

  it("keeps downloaded asset names inside the destination directory", () => {
    expect(safeDownloadFilename("ChibangaRx-Setup.exe")).toBe("ChibangaRx-Setup.exe")
    expect(() => safeDownloadFilename("../escape.exe")).toThrow("Invalid download filename")
    expect(() => safeDownloadFilename("C:\\temp\\escape.exe")).toThrow("Invalid download filename")
  })
})

describe("AMD driver trust boundary", () => {
  it("accepts only HTTPS executable downloads from AMD's driver host", () => {
    expect(isTrustedAmdDriverUrl("https://drivers.amd.com/drivers/amd_chipset_software_8.05.04.516.exe")).toBe(true)
    expect(isTrustedAmdDriverUrl("https://drivers.amd.com/drivers/installer.msi")).toBe(false)
  })

  it("rejects user-controlled hosts and redirect downgrades", () => {
    expect(isTrustedAmdDriverUrl("https://drivers.amd.com.evil.example/driver.exe")).toBe(false)
    expect(isTrustedAmdDriverUrl("http://drivers.amd.com/driver.exe")).toBe(false)
  })
})
