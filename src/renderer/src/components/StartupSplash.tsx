import { motion, useReducedMotion } from "framer-motion"
import chibangarxLogo from "../../../../resources/chibangarxlogo.png"

export default function StartupSplash(): React.ReactElement {
  const reduceMotion = useReducedMotion()

  return (
    <main
      className="relative z-10 flex h-screen w-full items-center justify-center overflow-hidden"
      aria-label="ChibangaRx"
    >
      <motion.div
        className="flex flex-col items-center"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-black/25 shadow-2xl backdrop-blur-xl"
          animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="absolute inset-0 rounded-3xl bg-chibangarx-primary/15 blur-xl" />
          <img src={chibangarxLogo} alt="" className="relative h-14 w-14" />
        </motion.div>
        <motion.h1
          className="mt-6 text-2xl font-semibold tracking-tight text-white"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduceMotion ? 0 : 0.2, duration: 0.45 }}
        >
          ChibangaRx
        </motion.h1>
        <div className="mt-5 h-1 w-48 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-chibangarx-primary to-chibangarx-secondary"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: reduceMotion ? 0.2 : 1.35, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </main>
  )
}
