import { ReactNode, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { en } from "@/i18n/locales/en"
import { pt } from "@/i18n/locales/pt"
import { getSavedLanguage, saveLanguage, LANGUAGES } from "@/lib/language"
import i18n from "@/i18n/i18n"

i18n.addResourceBundle("en", "translation", en as unknown as Record<string, unknown>, true, true)
i18n.addResourceBundle("pt", "translation", pt as unknown as Record<string, unknown>, true, true)

export const InitLanguage = () => {
  const { i18n: instance } = useTranslation()

  useEffect(() => {
    instance.changeLanguage("pt")
    saveLanguage("pt")
  }, [instance])

  return null
}

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  return (
    <>
      <InitLanguage />
      {children}
    </>
  )
}

export const useLanguage = () => {
  const { t, i18n } = useTranslation()

  return {
    t,
    language: i18n.language as "en" | "pt",
    setLanguage: (lang: "en" | "pt") => {
      i18n.changeLanguage(lang)
      saveLanguage(lang)
    },
    getSavedLanguage,
    LANGUAGES,
  }
}
