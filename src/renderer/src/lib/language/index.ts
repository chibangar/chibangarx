export type Language = "en" | "pt"

export const LANGUAGES: Record<Language, string> = {
  en: "English",
  pt: "Português (Portugal)",
}

export const getSavedLanguage = (): Language => {
  const saved = localStorage.getItem("chibangarx:lang") as Language
  return saved && Object.keys(LANGUAGES).includes(saved) ? saved : "en"
}

export const saveLanguage = (lang: Language) => {
  localStorage.setItem("chibangarx:lang", lang)
}

export const getSystemLanguage = (): Language => {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith("pt")) return "pt"
  return "en"
}