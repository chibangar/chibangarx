import Modal from "./ui/modal"
import Button from "./ui/button"
import { useTranslation } from "react-i18next"

function NoAdmin({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  return (
    <Modal open={open} onClose={onClose}>
      <div className="bg-chibangarx-card p-4 rounded-2xl border border-chibangarx-border text-chibangarx-text w-[90vw] max-w-md">
        <h1 className="text-lg font-semibold mb-2">ChibangaRx não está a executar como administrador</h1>
        <p className="text-sm mb-4">
          O ChibangaRx não está a executar com privilégios de administrador. Algumas funcionalidades
          poderão não funcionar corretamente.
        </p>
        <div className="flex justify-end">
          <Button onClick={onClose}>{t("common.close")}</Button>
        </div>
      </div>
    </Modal>
  )
}

export default NoAdmin
