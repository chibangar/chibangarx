import { describe, expect, it } from "vitest"
import { resolveOperation } from "../operations"

describe("fixed maintenance operations", () => {
  it("resolves the selected server-owned script", () => {
    expect(resolveOperation({ operation: "check-utilities.storageSense" }).script).toContain("Get-ItemProperty")
    expect(resolveOperation({ operation: "size-temp" }).requiresConfirmation).toBe(false)
    expect(resolveOperation({ operation: "cleanup-recyclebin" }).requiresConfirmation).toBe(true)
    expect(resolveOperation({ operation: "apply-utilities.powerPlan-High Performance" }).script).toBe("powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c")
  })
  it("rejects unknown IDs, arbitrary scripts, extra fields and malformed requests", () => {
    for (const request of [null, [], "cleanup-temp", {}, { operation: "__proto__" }, { operation: "../../evil" }, { operation: "run-utilities.systemInformation", script: "Remove-Item C:/ -Recurse" }, { operation: "size-temp", name: "../../evil" }]) {
      expect(() => resolveOperation(request)).toThrow()
    }
  })
})
