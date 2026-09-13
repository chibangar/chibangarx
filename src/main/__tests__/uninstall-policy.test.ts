import { describe, expect, it } from "vitest"
import { resolveInstalledApps } from "@main/uninstall-policy"

const catalog = [
  { id: "safe-app", name: "Safe App", isStoreApp: false, uninstallString: "C:\\Safe\\uninstall.exe", quietUninstallString: "", packageName: "" },
]

describe("uninstall request boundary", () => {
  it("uses only application IDs from the main-process catalog", () => {
    expect(resolveInstalledApps(catalog, [{ id: "safe-app" }])).toEqual(catalog)
  })

  it("rejects renderer-provided uninstall commands", () => {
    expect(() => resolveInstalledApps(catalog, [{ id: "safe-app", uninstallString: "powershell evil" }])).toThrow(
      "Invalid uninstall request",
    )
  })
})
