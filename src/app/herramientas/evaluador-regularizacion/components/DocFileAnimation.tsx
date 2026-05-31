"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, useAnimation, AnimatePresence } from "framer-motion"
import { CheckCircle2, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Folder visual (CSS-only, no assets needed) ────────────────────────────────

function FolderVisual({ count, pulse }: { count: number; pulse: boolean }) {
  return (
    <motion.div
      animate={{ scale: pulse ? 1.13 : 1, y: pulse ? -5 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className="relative"
    >
      {/* Folder back */}
      <div
        className="w-28 h-20 rounded-b-2xl rounded-tr-2xl relative"
        style={{ background: "linear-gradient(160deg, #f59e0b, #b45309)" }}
      >
        {/* Tab */}
        <div
          className="absolute -top-3 left-0 w-12 h-4 rounded-t-lg"
          style={{ background: "#f59e0b" }}
        />
        {/* Papers sticking out */}
        <div className="absolute inset-x-3 top-2 flex items-end justify-center gap-1 overflow-hidden" style={{ height: "1.8rem" }}>
          {[...Array(Math.min(count, 5))].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-sm bg-white/80 shadow-sm flex-shrink-0"
              style={{
                width: 18,
                height: 26,
                rotate: `${-6 + i * 3}deg`,
                transformOrigin: "bottom center",
              }}
            />
          ))}
        </div>
        {/* Folder front face */}
        <div
          className="absolute bottom-0 inset-x-0 h-12 rounded-b-2xl"
          style={{ background: "linear-gradient(160deg, #fbbf24, #f59e0b)" }}
        />
      </div>

      {/* Count badge */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={count}
          initial={{ scale: 1.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="absolute -top-3 -right-3 bg-primary text-primary-foreground text-[11px] font-bold rounded-full w-7 h-7 flex items-center justify-center shadow-lg border-2 border-background"
        >
          {count}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Progress dots ─────────────────────────────────────────────────────────────

function ProgressDots({ total, filed }: { total: number; filed: number }) {
  const dots = Math.min(total, 12)
  return (
    <div className="flex gap-1.5 flex-wrap justify-center max-w-xs">
      {[...Array(dots)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i < filed ? 1 : 0.65,
            opacity: i < filed ? 1 : 0.25,
            backgroundColor: i < filed ? "#10b981" : "rgba(255,255,255,0.4)",
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
        />
      ))}
    </div>
  )
}

// ─── Main animation component ──────────────────────────────────────────────────

export interface DocEntry {
  id: string
  label: string
}

interface DocFileAnimationProps {
  docs: DocEntry[]
  onComplete: () => void
  onSkip: () => void
}

export function DocFileAnimation({ docs, onComplete, onSkip }: DocFileAnimationProps) {
  const [currentIdx, setCurrentIdx] = useState(-1)
  const [filedCount, setFiledCount] = useState(0)
  const [folderPulse, setFolderPulse] = useState(false)
  const [done, setDone] = useState(false)
  const [shimmer, setShimmer] = useState(false)

  const controls = useAnimation()

  const triggerFolderReceive = useCallback(() => {
    setFiledCount(c => c + 1)
    setFolderPulse(true)
    setTimeout(() => setFolderPulse(false), 350)
  }, [])

  // Animate through each doc sequentially
  const runSequence = useCallback(async (startIdx: number) => {
    for (let i = startIdx; i < docs.length; i++) {
      setCurrentIdx(i)
      // Reset card to start position
      controls.set({ y: 220, opacity: 0, rotateX: 28, scale: 0.82 })
      // Enter: rise from below
      await controls.start({
        y: 0, opacity: 1, rotateX: 0, scale: 1,
        transition: { type: "spring", stiffness: 230, damping: 22, mass: 1 },
      })
      // Pause + shimmer
      setShimmer(true)
      await new Promise<void>(r => setTimeout(r, 420))
      setShimmer(false)
      await new Promise<void>(r => setTimeout(r, 80))
      // Exit: fly up toward folder
      await controls.start({
        y: -260, opacity: 0, scale: 0.12, rotateX: -18,
        transition: { duration: 0.42, ease: [0.55, 0, 0.95, 0.45] },
      })
      // File it
      triggerFolderReceive()
      // Brief gap before next
      await new Promise<void>(r => setTimeout(r, 180))
    }
    setDone(true)
  }, [docs.length, controls, triggerFolderReceive])

  useEffect(() => {
    const t = setTimeout(() => runSequence(0), 500)
    return () => clearTimeout(t)
  }, [runSequence])

  const currentDoc = docs[currentIdx]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden select-none"
      style={{
        background: "radial-gradient(ellipse at 50% 35%, #0f172a 0%, #020617 70%)",
        backgroundImage: [
          "radial-gradient(ellipse at 50% 35%, #0f172a 0%, #020617 70%)",
          "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)",
          "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
        ].join(", "),
        backgroundSize: "100% 100%, 48px 48px, 48px 48px",
      }}
    >
      {/* Skip */}
      <button
        onClick={onSkip}
        className="absolute top-5 right-5 p-2 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white/80 transition-all"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Title */}
      <motion.p
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-white/40 text-[11px] font-semibold tracking-widest uppercase mb-6"
      >
        {done ? "Expediente listo" : "Organizando tu expediente"}
      </motion.p>

      {/* Folder */}
      <FolderVisual count={filedCount} pulse={folderPulse} />

      {/* Progress dots */}
      <div className="mt-5 mb-7">
        <ProgressDots total={docs.length} filed={filedCount} />
      </div>

      {/* Card stage — 3D perspective */}
      <div
        className="relative w-full max-w-xs px-6"
        style={{ height: "5.5rem", perspective: "900px", perspectiveOrigin: "50% 50%" }}
      >
        <motion.div
          animate={controls}
          style={{ transformStyle: "preserve-3d", position: "absolute", inset: "0 1.5rem" }}
          className={cn(
            "rounded-2xl overflow-hidden shadow-2xl",
            "border",
            currentDoc ? "border-white/18" : "border-transparent",
          )}
          aria-hidden={!currentDoc}
        >
          {/* Glass card */}
          <div
            className="w-full h-full p-4 flex items-start gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.11) 0%, rgba(255,255,255,0.05) 100%)",
              backdropFilter: "blur(24px)",
            }}
          >
            {/* Shimmer sweep line */}
            {shimmer && (
              <motion.div
                initial={{ x: "-120%" }}
                animate={{ x: "220%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
              />
            )}
            <div className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-white/90 text-[13px] font-semibold leading-snug line-clamp-2">
                {currentDoc?.label ?? ""}
              </p>
              {currentDoc && (
                <p className="text-white/35 text-[11px] mt-0.5">
                  {currentIdx + 1} de {docs.length}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Done CTA */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mt-5 flex flex-col items-center gap-3"
          >
            <p className="text-emerald-400 text-sm font-semibold">
              {filedCount} documento{filedCount !== 1 ? "s" : ""} organizados
            </p>
            <button
              onClick={onComplete}
              className="px-7 py-2.5 bg-white text-slate-900 rounded-full text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-[0_0_24px_rgba(255,255,255,0.15)]"
            >
              Abrir mi expediente →
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
