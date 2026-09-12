export const USER_NAME_STORAGE_KEY = "chibangarx:userName"
export const USER_NAME_MIN_LENGTH = 2
export const USER_NAME_MAX_LENGTH = 40

export function normalizeUserName(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

export function isValidUserName(value: string): boolean {
  const normalized = normalizeUserName(value)
  return (
    normalized.length >= USER_NAME_MIN_LENGTH &&
    normalized.length <= USER_NAME_MAX_LENGTH &&
    !/[\u0000-\u001f\u007f<>]/.test(value)
  )
}

export function loadUserName(): string {
  const stored = localStorage.getItem(USER_NAME_STORAGE_KEY) ?? ""
  return isValidUserName(stored) ? normalizeUserName(stored) : ""
}

export function saveUserName(value: string): string {
  const normalized = normalizeUserName(value)
  if (!isValidUserName(normalized)) throw new Error("Invalid user name")
  localStorage.setItem(USER_NAME_STORAGE_KEY, normalized)
  return normalized
}
