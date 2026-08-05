import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { saveLanguage, getSavedLanguage } from "@/lib/language"
import { en } from "./locales/en"
import { pt } from "./locales/pt"

export type Language = "en" | "pt"

const getLanguage = (): Language => {
  if (typeof window !== "undefined") {
    const saved = getSavedLanguage()
    if (saved) return saved
    return "pt"
  }
  return "pt"
}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en as unknown as Record<string, string>,
    },
    pt: {
      translation: pt as unknown as Record<string, string>,
    },
  },
  lng: getLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export const setLanguage = (lang: Language) => {
  i18n.changeLanguage(lang)
  saveLanguage(lang)
}

export const getCurrentLanguage = (): Language => {
  return i18n.language as Language
}

export default i18n
