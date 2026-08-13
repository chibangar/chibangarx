import { describe, expect, it } from "vitest"
import { isValidUserName, normalizeUserName } from "./profile"

describe("local user profile", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeUserName("  Ana   Maria  ")).toBe("Ana Maria")
  })

  it("requires a reasonable name length", () => {
    expect(isValidUserName("A")).toBe(false)
    expect(isValidUserName("Ana")).toBe(true)
    expect(isValidUserName("A".repeat(41))).toBe(false)
  })

  it("rejects markup and control characters", () => {
    expect(isValidUserName("<Ana>")).toBe(false)
    expect(isValidUserName("Ana\nMaria")).toBe(false)
  })
})
