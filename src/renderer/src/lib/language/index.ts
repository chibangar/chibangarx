export type Language = "en" | "pt"

export const LANGUAGES: Record<Language, string> = {
  en: "English",
  pt: "Português (Portugal)",
}

export const getSavedLanguage = (): Language | null => {
  const saved = localStorage.getItem("chibangarx:lang") as Language
  if (saved && Object.keys(LANGUAGES).includes(saved)) return saved
  return null
}

export const saveLanguage = (lang: Language) => {
  localStorage.setItem("chibangarx:lang", lang)
}

export const getSystemLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith("pt")) return "pt"
  return "en"
}