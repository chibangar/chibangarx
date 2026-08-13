import { FormEvent, useState } from "react"
import { motion } from "framer-motion"
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"
import chibangarxLogo from "../../../../resources/chibangarxlogo.png"

interface LoginScreenProps {
  onContinue: () => void
}

export default function LoginScreen({ onContinue }: LoginScreenProps): React.ReactElement {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password) {
      setError(t("login.required"))
      return
    }
    setError("")
    onContinue()
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 pt-[50px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,color-mix(in_srgb,var(--color-chibangarx-primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_82%_75%,color-mix(in_srgb,var(--color-chibangarx-secondary)_12%,transparent),transparent_30%)]" />
      <motion.div
        aria-hidden="true"
        className="absolute left-[12%] top-[20%] h-40 w-40 rounded-full border border-chibangarx-primary/15"
        initial={{ opacity: 0, scale: 0.65 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
      <motion.main
        className="relative z-10 grid w-full max-w-4xl overflow-hidden rounded-3xl border border-chibangarx-border bg-chibangarx-card/90 shadow-2xl backdrop-blur-xl md:grid-cols-[1.05fr_1fr]"
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden border-r border-chibangarx-border bg-chibangarx-primary/8 p-10 md:flex">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-chibangarx-primary/10 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <img src={chibangarxLogo} alt="" className="h-10 w-10" />
            <span className="text-lg font-semibold">ChibangaRx</span>
          </div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.55 }}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-chibangarx-primary">
              {t("login.eyebrow")}
            </p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight text-chibangarx-text">
              {t("login.hero")}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-chibangarx-text-secondary">
              {t("login.heroDescription")}
            </p>
          </motion.div>
          <div className="relative flex items-center gap-2 text-xs text-chibangarx-text-secondary">
            <ShieldCheck className="h-4 w-4 text-chibangarx-secondary" />
            {t("login.localOnly")}
          </div>
        </section>

        <section className="flex min-h-[520px] flex-col justify-center p-8 sm:p-10">
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.55 }}
          >
            <div className="mb-8 flex items-center gap-3 md:hidden">
              <img src={chibangarxLogo} alt="" className="h-9 w-9" />
              <span className="font-semibold">ChibangaRx</span>
            </div>
            <h2 className="text-2xl font-semibold text-chibangarx-text">{t("login.title")}</h2>
            <p className="mt-2 text-sm text-chibangarx-text-secondary">{t("login.subtitle")}</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block text-sm font-medium text-chibangarx-text">
                {t("login.email")}
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-chibangarx-border bg-chibangarx-bg/60 px-4 transition-colors focus-within:border-chibangarx-primary">
                  <Mail className="h-4 w-4 shrink-0 text-chibangarx-text-secondary" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("login.emailPlaceholder")}
                    autoComplete="email"
                    autoFocus
                    className="h-12 w-full bg-transparent text-sm text-chibangarx-text outline-none placeholder:text-chibangarx-text-muted"
                  />
                </span>
              </label>
              <label className="block text-sm font-medium text-chibangarx-text">
                {t("login.password")}
                <span className="mt-2 flex items-center gap-3 rounded-xl border border-chibangarx-border bg-chibangarx-bg/60 px-4 transition-colors focus-within:border-chibangarx-primary">
                  <LockKeyhole className="h-4 w-4 shrink-0 text-chibangarx-text-secondary" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("login.passwordPlaceholder")}
                    autoComplete="current-password"
                    className="h-12 w-full bg-transparent text-sm text-chibangarx-text outline-none placeholder:text-chibangarx-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="text-chibangarx-text-secondary transition-colors hover:text-chibangarx-text"
                    aria-label={t(showPassword ? "login.hidePassword" : "login.showPassword")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </span>
              </label>
              {error && (
                <p role="alert" className="text-xs text-red-400">
                  {error}
                </p>
              )}
              <button
                type="submit"
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-chibangarx-primary px-4 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.99]"
              >
                {t("login.submit")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-chibangarx-text-muted before:h-px before:flex-1 before:bg-chibangarx-border after:h-px after:flex-1 after:bg-chibangarx-border">
              {t("login.or")}
            </div>
            <button
              type="button"
              onClick={onContinue}
              className="h-11 w-full rounded-xl border border-chibangarx-border text-sm font-medium text-chibangarx-text-secondary transition-colors hover:border-chibangarx-primary/60 hover:bg-chibangarx-accent hover:text-chibangarx-text"
            >
              {t("login.continueLocal")}
            </button>
          </motion.div>
        </section>
      </motion.main>
    </div>
  )
}
