import { useState, useEffect } from "react"
import Modal from "@/components/ui/modal"
import Button from "@/components/ui/button"
import { Lock } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

interface AdminLoginModalProps {
  open: boolean
  onClose: (isAdmin: boolean) => void
}

export default function AdminLoginModal({ open, onClose }: AdminLoginModalProps): React.ReactElement {
  const { t } = useTranslation()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setPassword("")
    }
  }, [open])

  const handleLogin = async () => {
    if (!password) return
    setLoading(true)
    try {
      const result = await window.electron.ipcRenderer.invoke("admin:login", password)
      if (result?.success) {
        toast.success(t("admin.loginSuccess"))
        onClose(true)
      } else {
        toast.error(result?.message || t("admin.loginError"))
      }
    } catch {
      toast.error(t("admin.loginError"))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleLogin()
    }
  }

  return (
    <Modal open={open} onClose={() => onClose(false)}>
      <div
        className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-6 shadow-xl max-w-md w-full mx-4"
        style={{ WebkitAppRegion: "no-drag" } as any}
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-chibangarx-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-chibangarx-primary" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-chibangarx-text text-center mb-2">
          {t("admin.title")}
        </h2>
        <p className="text-sm text-chibangarx-text-secondary text-center mb-4">
          {t("admin.subtitle")}
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("admin.passwordPlaceholder")}
          className="w-full bg-chibangarx-bg border border-chibangarx-border rounded-lg px-3 py-2 text-chibangarx-text focus:ring-0 focus:outline-hidden mb-4"
          autoFocus
        />

        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            {t("admin.cancel")}
          </Button>
          <Button onClick={handleLogin} disabled={loading || !password}>
            {loading ? t("admin.authenticating") : t("admin.login")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
