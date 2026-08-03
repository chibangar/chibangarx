import { useEffect, useState } from "react"
import Modal from "@/components/ui/modal"
import Button from "./ui/button"
import { toast } from "react-toastify"
import { invoke } from "@/lib/electron"
import { useTranslation } from "react-i18next"
import data from "../../../../package.json"

export default function FirstTime(): React.ReactElement {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const firstTime = localStorage.getItem("firstTime")
    if (!firstTime || firstTime === "true") {
      const timer = setTimeout(() => setOpen(true), 20)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [])

  const handleGetStarted = async () => {
    localStorage.setItem("firstTime", "false")
    setOpen(false)

    const toastId = toast.info(t("firstTime.creatingRestorePoint"), {
      autoClose: false,
      isLoading: true,
      closeOnClick: false,
      draggable: false,
    })

    try {
      await invoke({ channel: "create-chibangarx-restore-point" })

      toast.update(toastId, {
        render: t("firstTime.restorePointCreated"),
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })
    } catch (err) {
      toast.update(toastId, {
        render: t("firstTime.restorePointFailed"),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      console.error("Error creating restore point:", err)
    }
  }

  const handleSkipRestorePoint = () => {
    localStorage.setItem("firstTime", "false")
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={undefined}>
      <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-2xl max-w-2xl w-full mx-4 flex flex-col items-center text-center">
        <h1 className="text-3xl font-bold text-chibangarx-text mb-4">Bem-vindo ao ChibangaRx</h1>

        <p className="text-chibangarx-text-secondary mb-6">
          Parece ser a sua primeira utilização. <br />
          Deseja criar um ponto de restauro antes de começar?
        </p>

        <p className="text-chibangarx-text-secondary mb-4 text-sm">
          <span className="font-medium">
            Ao clicar em <strong>Sim</strong>, o ChibangaRx criará um ponto de restauro e desativará o
            intervalo entre futuros pontos de restauro.
          </span>
        </p>

        <p className="text-chibangarx-text-secondary mb-4 text-sm">
Descarregue apenas a partir do <strong>GitHub</strong> ou de <strong>getchibangarx.net</strong>.
        </p>

        <p className="text-red-500 mb-8 text-sm">
          Se descarregar de outra fonte, poderá tratar-se de malware. Desinstale e reinstale a partir de{" "}
          <a href="https://getchibangarx.net" target="_blank" className="text-blue-500">
            getchibangarx.net
          </a>
, or{" "}
           <a href="https://github.com/chibangar/chibangarx" target="_blank" className="text-blue-500">
             nosso GitHub
           </a>
           .
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button onClick={handleGetStarted}>Sim (Recomendado)</Button>
          <Button onClick={handleSkipRestorePoint} variant="danger">
            Não (Não recomendado)
          </Button>
        </div>

        <p className="text-chibangarx-text-secondary mt-4 text-sm">
          <span className="font-semibold">Versão do ChibangaRx:</span>{" "}
          {data?.version || "Erro ao obter a versão"}
        </p>
      </div>
    </Modal>
  )
}
