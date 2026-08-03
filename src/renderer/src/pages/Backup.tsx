import { useEffect, useState } from "react"
import {
  RotateCw,
  PlusCircle,
  Shield,
  RotateCcw,
  Loader2,
  Search,
  Wrench,
  Undo2,
  HelpCircle,
} from "lucide-react"
import RootDiv from "@/components/rootdiv"
import { invoke } from "@/lib/electron"
import Button from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { toast } from "react-toastify"
import { Trash } from "lucide-react"
import log from "electron-log/renderer"
import { Input, LargeInput } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Tweak } from "@/types/index"
import { useTranslation } from "react-i18next"

type RestorePoint = {
  SequenceNumber: number
  Description: string
  CreationTime: string
  EventType: number
  RestorePointType: number
}

type RestorePointList = RestorePoint[]

function RestorePointsTab() {
  const { t } = useTranslation()
  const [restorePoints, setRestorePoints] = useState<RestorePointList>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    type: string | null
    restorePoint: any | null
  }>({
    isOpen: false,
    type: null,
    restorePoint: null,
  })

  const [customModalOpen, setCustomModalOpen] = useState(false)
  const [customName, setCustomName] = useState("")
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const fetchRestorePoints = async () => {
    setLoading(true)
    try {
      const response = await invoke({ channel: "get-restore-points" })
      if (response.success && Array.isArray(response.points)) {
        const sorted = response.points.sort((a, b) => {
          const parse = (str: string) =>
            new Date(
              `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}T${str.slice(8, 10)}:${str.slice(10, 12)}:${str.slice(12, 14)}`,
            ).getTime()

          return parse(b.CreationTime) - parse(a.CreationTime)
        })
        setRestorePoints(sorted)
       } else {
        toast.error(t("backup.restoreFailed"))
        log.error("Failed to load restore points:", response)
      }
    } catch (error) {
      toast.error(t("backup.restoreFailed"))
      console.error(error)
      log.error("Failed to load restore points:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRestorePoints()
  }, [])

  const handleCreateRestorePoint = async () => {
    toast.dismiss()
    setProcessing(true)
    try {
      await invoke({ channel: "create-chibangarx-restore-point" })
      toast.success(t("backup.restorePointCreated"))
      await fetchRestorePoints()
    } catch (err) {
      toast.error(t("backup.createFailed"))
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }

  const handleRestore = (restorePoint) => {
    setModalState({ isOpen: true, type: "restore", restorePoint })
  }

  const executeRestore = async () => {
    setProcessing(true)
    try {
      await invoke({
        channel: "restore-restore-point",
        payload: modalState.restorePoint.SequenceNumber,
      })
      toast.success(t("backup.restoreSuccess"))
    } catch (err) {
      toast.error(t("backup.restoreFailedAction"))
      log.error("Failed to start system restore:", err)
    }
    setProcessing(false)
    setModalState({ isOpen: false, type: null, restorePoint: null })
  }

  const handleCustomRestorePoint = async () => {
    setProcessing(true)
    try {
      if (!customName.trim()) {
        toast.error(t("backup.emptyName"))
        setProcessing(false)
        return
      }
      await invoke({ channel: "create-restore-point", payload: customName })
      toast.success(t("backup.restorePointCreated"))
      setCustomModalOpen(false)
      setCustomName("")
      await fetchRestorePoints()
    } catch (err) {
      toast.error(t("backup.createFailed"))
      log.error("Failed to create restore point:", err)
    }
    setProcessing(false)
  }
  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false)
    setProcessing(true)
    await invoke({ channel: "delete-all-restore-points" })
    toast.success(t("backup.deleteAllSuccess"))
    setProcessing(false)
    await fetchRestorePoints()
  }
  const filteredRestorePoints = restorePoints.filter((rp: RestorePoint) =>
    (rp.Description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )
  return (
    <>
      <div className="h-full max-w-full space-y-6 ">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="relative w-full md:w-64 ml-1 mt-1">
            <LargeInput
              placeholder={t("backup.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="danger"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={loading || processing || restorePoints.length === 0}
              className="flex items-center gap-2"
            >
              <Trash size={16} /> {t("backup.deleteAll")}
            </Button>
            <Button
              variant="secondary"
              onClick={fetchRestorePoints}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              <RotateCw size={16} /> {t("backup.refresh")}
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateRestorePoint}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              {processing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <PlusCircle size={16} />
              )}
              {t("backup.quickRestorePoint")}
            </Button>
            <Button
              variant="primary"
              onClick={() => setCustomModalOpen(true)}
              disabled={loading || processing}
            >
              {t("backup.customRestorePoint")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-chibangarx-primary animate-spin" />
          </div>
        ) : filteredRestorePoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-chibangarx-card border border-chibangarx-border rounded-lg">
            <div className="p-4 bg-chibangarx-secondary rounded-full mb-4">
              <Shield size={28} className="text-chibangarx-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-chibangarx-text">{t("backup.noRestorePoints")}</h3>
            <p className="text-chibangarx-text-secondary max-w-sm mb-4">
              {searchQuery
                ? t("backup.noRestorePointsMatch")
                : t("backup.noRestorePointsDesc")}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                icon={<PlusCircle size={16} />}
                onClick={handleCreateRestorePoint}
                disabled={processing}
              >
                {t("backup.createQuickRestorePoint")}
              </Button>
            )}
          </div>
        ) : (
          <Table className="max-h-96">
            <TableHeader>
              <TableRow>
                <TableHead>{t("backup.table.description")}</TableHead>
                <TableHead className="w-32 text-center">{t("backup.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestorePoints.map((rp, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{rp.Description}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      className="p-2! gap-2"
                      onClick={() => handleRestore(rp)}
                      disabled={processing}
                      title={t("backup.restoreSystem")}
                    >
                      <RotateCcw size={16} />
                      {t("backup.restoreSystem")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <p className="text-center text-chibangarx-text-muted mt-4">
          {t("backup.betaFeature")}
        </p>
      </div>
      <Modal
        open={modalState.isOpen}
        onClose={() =>
          !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
        }
      >
        {modalState.type === "restore" && modalState.restorePoint && (
          <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
            <h3 className="text-lg font-medium text-chibangarx-text">{t("backup.restoreSystem")}</h3>

            <div className="p-4 pr-0">
              <p className="text-chibangarx-text-secondary mb-4">
                {t("backup.restoreConfirm", { description: modalState.restorePoint.Description })}{" "}
                {t("backup.restoreWarning")} <br /> <br />
                {t("backup.restoreWarning2")} <br /> <br />
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() =>
                    !processing && setModalState({ isOpen: false, type: null, restorePoint: null })
                  }
                  disabled={processing}
                >
                  {t("common.cancel")}
                </Button>
                <Button variant="primary" onClick={executeRestore} disabled={processing}>
                  {processing ? <Loader2 size={16} className="animate-spin" /> : t("backup.restoreSystem")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={customModalOpen} onClose={() => !processing && setCustomModalOpen(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-chibangarx-text">{t("backup.createRestorePoint")}</h3>

          <div className="p-4 space-y-4">
            <Input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t("backup.emptyName")}
              disabled={processing}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setCustomModalOpen(false)}
                disabled={processing}
              >
                {t("common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCustomRestorePoint}
                disabled={processing || !customName.trim()}
              >
                {processing ? <Loader2 size={16} className="animate-spin" /> : t("common.ok")}
              </Button>
            </div>
            <p className="text-xs text-center text-chibangarx-text-muted">
              {t("backup.createRestorePointTip2")}
            </p>
          </div>
        </div>
      </Modal>
      <Modal open={confirmDeleteAll} onClose={() => !processing && setConfirmDeleteAll(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-chibangarx-text">{t("backup.deleteAllConfirm")}</h3>
          <div className="p-4 pr-0">
            <p className="text-chibangarx-text-secondary mb-4">
              {t("backup.deleteAllConfirmDesc", { count: restorePoints.length })}
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmDeleteAll(false)}
                disabled={processing}
              >
                {t("common.cancel")}
              </Button>
              <Button variant="danger" onClick={handleDeleteAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  `${t("backup.deleteAll")} (${restorePoints.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}

function AppliedTweaksTab() {
  const { t } = useTranslation()
  const [tweaks, setTweaks] = useState<Tweak[]>([])
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [undoingTweak, setUndoingTweak] = useState<string | null>(null)
  const [confirmUndoAll, setConfirmUndoAll] = useState(false)
  const [showWhyNotReversible, setShowWhyNotReversible] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const [fetchedTweaks, savedStates] = await Promise.all([
        invoke({ channel: "tweaks:fetch" }),
        invoke({ channel: "tweak-states:load" }),
      ])
      setTweaks(fetchedTweaks)
      if (savedStates) {
        setToggleStates(JSON.parse(savedStates))
      }
    } catch (error) {
      toast.error(t("backup.failedToLoadAppliedTweaks"))
      log.error("Failed to load applied tweaks:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const appliedTweaks = tweaks.filter((t) => toggleStates[t.name])

  const appliedTweakFiltered = appliedTweaks.filter(
    (t) => t.reversible === true || t.reversible === undefined,
  )

  const saveToggleStates = async (newStates: Record<string, boolean>) => {
    await invoke({ channel: "tweak-states:save", payload: JSON.stringify(newStates) })
  }

  const handleUndo = async (tweak: Tweak) => {
    toast.dismiss()
    setUndoingTweak(tweak.name)
    setProcessing(true)
    const loadingToastId = toast.loading(t("backup.undoingTweak", { title: tweak.title || tweak.name }))
    try {
      const newStates = { ...toggleStates, [tweak.name]: false }
      setToggleStates(newStates)
      await saveToggleStates(newStates)

      const result = await invoke({ channel: "tweak:unapply", payload: tweak.name })
      if (result?.success) {
        toast.update(loadingToastId, {
          render: t("backup.undoSuccess", { title: tweak.title || tweak.name }),
          type: "success",
          isLoading: false,
          autoClose: 3000,
        })
      } else {
        toast.update(loadingToastId, {
          render: t("backup.undoFailed", { title: tweak.title || tweak.name }),
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
        const reverted = { ...toggleStates, [tweak.name]: true }
        setToggleStates(reverted)
        await saveToggleStates(reverted)
      }
    } catch (error) {
        log.error(`Error undoing tweak ${tweak.name}:`, error)
        toast.update(loadingToastId, {
          render: t("backup.undoFailed", { title: tweak.title || tweak.name }),
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
      const reverted = { ...toggleStates, [tweak.name]: true }
      setToggleStates(reverted)
      await saveToggleStates(reverted)
    }
    setProcessing(false)
    setUndoingTweak(null)
  }

  const handleUndoAll = async () => {
    toast.dismiss()
    setConfirmUndoAll(false)
    setProcessing(true)
    const newStates = { ...toggleStates }
    for (const tweak of appliedTweaks) {
      if (tweak.reversible === false) continue
      const loadingToastId = toast.loading(t("backup.undoingTweak", { title: tweak.title || tweak.name }))
      try {
        newStates[tweak.name] = false
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)

        const result = await invoke({ channel: "tweak:unapply", payload: tweak.name })
        if (result?.success) {
          toast.update(loadingToastId, {
            render: t("backup.undoSuccess", { title: tweak.title || tweak.name }),
            type: "success",
            isLoading: false,
            autoClose: 3000,
          })
        } else {
          toast.update(loadingToastId, {
            render: t("backup.undoFailed", { title: tweak.title || tweak.name }),
            type: "error",
            isLoading: false,
            autoClose: 3000,
          })
          newStates[tweak.name] = true
          setToggleStates({ ...newStates })
          await saveToggleStates(newStates)
        }
      } catch (error) {
        log.error(`Error undoing tweak ${tweak.name}:`, error)
        toast.update(loadingToastId, {
          render: t("backup.undoFailed", { title: tweak.title || tweak.name }),
          type: "error",
          isLoading: false,
          autoClose: 3000,
        })
        newStates[tweak.name] = true
        setToggleStates({ ...newStates })
        await saveToggleStates(newStates)
      } finally {
        toast.dismiss(loadingToastId)
      }
    }
    setProcessing(false)
  }

  return (
    <>
      <div className="h-full max-w-full space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-chibangarx-text-secondary text-sm">
              {t("backup.currentlyApplied", { count: appliedTweaks.length })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={loadData}
              className="flex items-center gap-2"
              disabled={loading || processing}
            >
              <RotateCw size={16} /> {t("backup.refresh")}
            </Button>
            <Button
              variant="danger"
              onClick={() => setConfirmUndoAll(true)}
              disabled={loading || processing || appliedTweakFiltered.length === 0}
              className="flex items-center gap-2"
            >
              <Undo2 size={16} /> {t("backup.undoAllTweaks")}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 size={32} className="text-chibangarx-primary animate-spin" />
          </div>
        ) : appliedTweaks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-chibangarx-card border border-chibangarx-border rounded-lg">
            <div className="p-4 bg-chibangarx-secondary rounded-full mb-4">
              <Wrench size={28} className="text-chibangarx-text" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-chibangarx-text">{t("backup.noAppliedTweaks")}</h3>
            <p className="text-chibangarx-text-secondary max-w-sm mb-4">
              {t("backup.noAppliedTweaksDesc")}
            </p>
          </div>
        ) : (
          <Table className="max-h-96">
            <TableHeader>
              <TableRow>
                <TableHead>{t("backup.tweak")}</TableHead>
                <TableHead className="w-32 text-center">{t("backup.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appliedTweaks.map((tweak) => (
                <TableRow key={tweak.name}>
                  <TableCell>
                    <p className="font-medium">{tweak.title || tweak.name}</p>
                    {tweak.description && (
                      <p className="text-xs text-chibangarx-text-secondary mt-0.5">
                        {tweak.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {tweak.reversible !== false ? (
                      <Button
                        variant="outline"
                        className="p-2! gap-2"
                        onClick={() => handleUndo(tweak)}
                        disabled={processing}
                        title={t("backup.undoTweak")}
                      >
                        {undoingTweak === tweak.name ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Undo2 size={16} />
                        )}
                        {t("backup.undo")}
                      </Button>
                    ) : (
                      <span className="text-chibangarx-text-secondary text-xs">{t("backup.notReversible")}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowWhyNotReversible(true)}
            className="flex items-center gap-2"
          >
            <HelpCircle size={16} /> Why are some tweaks not reversible?
          </Button>
        </div>
        {appliedTweaks.length > 0 && (
          <p className="text-center text-amber-600 text-sm">
            Note: Some undo scripts reinstall apps, so this process may take a while.
          </p>
        )}
      </div>
      <Modal open={confirmUndoAll} onClose={() => !processing && setConfirmUndoAll(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4 pb-0">
          <h3 className="text-lg font-medium text-chibangarx-text">Undo All Tweaks</h3>
          <div className="p-4 pr-0">
            <p className="text-chibangarx-text-secondary mb-4">
              Are you sure you want to undo all {appliedTweakFiltered.length} applied tweak
              {appliedTweakFiltered.length !== 1 ? "s" : ""}? This will run the unapply script for
              each tweak and may require a restart.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => !processing && setConfirmUndoAll(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleUndoAll} disabled={processing}>
                {processing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  `Undo All (${appliedTweakFiltered.length})`
                )}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      <Modal open={showWhyNotReversible} onClose={() => setShowWhyNotReversible(false)}>
        <div className="bg-chibangarx-card border border-chibangarx-border rounded-2xl p-4 shadow-xl max-w-lg w-full mx-4">
          <h3 className="text-lg font-medium text-chibangarx-text mb-4">
            Why are some tweaks not reversible?
          </h3>
          <div className="text-chibangarx-text-secondary text-sm leading-6 space-y-3">
            <p>
              Some tweaks make changes that can't be automatically reversed by ChibangaRx. However,
              most of these changes can still be undone manually:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>
                <strong className="text-chibangarx-text">Debloating Windows:</strong> Removed apps can
                be reinstalled from the Microsoft Store
              </li>
              <li>
                <strong className="text-chibangarx-text">Optimize NVIDIA Settings:</strong> Settings
                can be reset through the NVIDIA Control Panel
              </li>
              <li>
                <strong className="text-chibangarx-text">Service modifications:</strong> Services can
                be re-enabled through Windows Services Manager
              </li>
            </ul>
            <p>
              While these tweaks don't have an automatic undo button, you can always create a
              restore point before applying them.
            </p>
            <p className="text-orange-400 text-xs">
              Tip: Create a restore point before applying non-reversible tweaks so you have an easy
              fallback option.
            </p>
          </div>
          <div className="flex justify-end mt-6">
            <Button variant="primary" onClick={() => setShowWhyNotReversible(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default function RestorePointManager() {
  const [activeTab, setActiveTab] = useState<"restore" | "history">("restore")

  return (
    <RootDiv>
      <div className="h-full max-w-full space-y-4 overflow-hidden">
        <div className="flex gap-1 bg-chibangarx-card border border-chibangarx-border rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab("restore")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
              activeTab === "restore"
                ? "bg-chibangarx-primary text-white shadow"
                : "text-chibangarx-text-secondary hover:text-chibangarx-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Restore Points
            </span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all active:scale-95 ${
              activeTab === "history"
                ? "bg-chibangarx-primary text-white shadow"
                : "text-chibangarx-text-secondary hover:text-chibangarx-text"
            }`}
          >
            <span className="flex items-center gap-2">
              <Wrench size={16} />
              Revert Applied Tweaks (NEW)
            </span>
          </button>
        </div>

        {activeTab === "restore" ? <RestorePointsTab /> : <AppliedTweaksTab />}
      </div>
    </RootDiv>
  )
}
