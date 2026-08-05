import { useTranslation } from "react-i18next"

function Notfound() {
  const { t } = useTranslation()
  return <div>{t("common.pageNotFound")}</div>
}

export default Notfound
