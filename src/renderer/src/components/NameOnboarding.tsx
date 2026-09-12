import { FormEvent, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useTranslation } from "react-i18next"
import Button from "@/components/ui/button"
import {
  isValidUserName,
  normalizeUserName,
  saveUserName,
  USER_NAME_MAX_LENGTH,
} from "@/lib/profile"
import chibangarxLogo from "../../../../resources/chibangarxlogo.png"

interface NameOnboardingProps {
  onComplete: (name: string) => void
}

export default function NameOnboarding({ onComplete }: NameOnboardingProps): React.ReactElement {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const [name, setName] = useState("")
  const [showError, setShowError] = useState(false)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const normalized = normalizeUserName(name)
    if (!isValidUserName(normalized)) {
      setShowError(true)
      return
    }
    onComplete(saveUserName(normalized))
  }

  return (
    <main className="ph-no-capture relative z-10 flex h-screen w-full items-center justify-center p-6">
      <motion.form
        onSubmit={submit}
        initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-3xl border border-white/15 bg-black/45 p-8 shadow-2xl backdrop-blur-xl"
        aria-labelledby="onboarding-title"
      >
        <img src={chibangarxLogo} alt="" className="mx-auto h-14 w-14" />
        <h1 id="onboarding-title" className="mt-5 text-center text-2xl font-semibold text-white">
          {t("onboarding.title")}
        </h1>
        <p className="mt-2 text-center text-sm leading-6 text-white/70">
          {t("onboarding.subtitle")}
        </p>

        <label htmlFor="onboarding-name" className="mt-7 block text-sm font-medium text-white/90">
          {t("settings.userName")}
        </label>
        <input
          id="onboarding-name"
          autoFocus
          autoComplete="name"
          maxLength={USER_NAME_MAX_LENGTH}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            if (showError) setShowError(false)
          }}
          aria-invalid={showError}
          aria-describedby={showError ? "onboarding-error" : "onboarding-privacy"}
          className="mt-2 w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-chibangarx-primary focus:ring-2 focus:ring-chibangarx-primary/30"
          placeholder={t("settings.enterYourName")}
        />
        {showError && (
          <p id="onboarding-error" role="alert" className="mt-2 text-sm text-red-300">
            {t("settings.nameInvalid")}
          </p>
        )}
        <p id="onboarding-privacy" className="mt-3 text-xs leading-5 text-white/55">
          {t("settings.namePrivacy")}
        </p>
        <Button type="submit" size="lg" className="mt-6 w-full justify-center">
          {t("onboarding.continue")}
        </Button>
      </motion.form>
    </main>
  )
}
