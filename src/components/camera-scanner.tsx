"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { Camera, X, RotateCcw, Check, Aperture, RotateCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function CameraScanner({
  onCapture,
  onClose,
}: {
  onCapture: (file: File) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [status, setStatus] = useState<"loading" | "ready" | "captured" | "error">("loading")
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  // Portrait (3/4) by default — most documents are A4 vertical
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")

  useEffect(() => {
    let cancelled = false

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if (!cancelled) setStatus("ready")
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Error desconocido"
          setErrorMsg(msg)
          setStatus("error")
        }
      }
    }

    startCamera()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const viewport = viewportRef.current
    if (!video || !canvas || !viewport) return

    const vw = video.videoWidth || 1280
    const vh = video.videoHeight || 720
    const containerW = viewport.clientWidth
    const containerH = viewport.clientHeight
    const videoRatio = vw / vh
    const containerRatio = containerW / containerH

    // object-cover: scale the video to fill the container
    const scale = videoRatio > containerRatio
      ? containerH / vh   // landscape video: fit by height, crop sides
      : containerW / vw   // portrait video:  fit by width,  crop top/bottom

    // How many video pixels are hidden (cropped) on each side
    const cropX = (vw - containerW / scale) / 2
    const cropY = (vh - containerH / scale) / 2

    // Guide rectangle inset is 8% of the container on each side
    const INSET = 0.08
    const srcX = cropX + (containerW * INSET) / scale
    const srcY = cropY + (containerH * INSET) / scale
    const srcW = (containerW * (1 - 2 * INSET)) / scale
    const srcH = (containerH * (1 - 2 * INSET)) / scale

    canvas.width  = Math.round(srcW)
    canvas.height = Math.round(srcH)
    const ctx = canvas.getContext("2d")!
    ctx.drawImage(video, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height)
    setCapturedDataUrl(canvas.toDataURL("image/jpeg", 0.93))
    setStatus("captured")
  }, [])

  function retake() {
    setCapturedDataUrl(null)
    setStatus("ready")
  }

  function confirm() {
    if (!capturedDataUrl) return
    const parts = capturedDataUrl.split(",")
    const bytes = atob(parts[1])
    const ab = new ArrayBuffer(bytes.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < bytes.length; i++) ia[i] = bytes.charCodeAt(i)
    const file = new File([ab], `escaneo-${Date.now()}.jpg`, { type: "image/jpeg" })
    onCapture(file)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg sm:rounded-xl bg-background overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Escanear documento</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Camera viewport */}
        <div
          ref={viewportRef}
          className="relative bg-black w-full transition-all duration-300"
          style={{ aspectRatio: orientation === "portrait" ? "3/4" : "4/3" }}
        >

          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <div className="h-7 w-7 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
              <p className="text-xs text-white/60">Iniciando cámara…</p>
            </div>
          )}

          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center text-white">
              <Camera className="h-8 w-8 text-white/30 mb-1" />
              <p className="text-sm font-medium">Sin acceso a la cámara</p>
              <p className="text-xs text-white/50">{errorMsg}</p>
              <p className="text-xs text-white/40 mt-1">Comprueba los permisos del navegador.</p>
            </div>
          )}

          <video
            ref={videoRef}
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              status === "captured" && "hidden"
            )}
            playsInline
            muted
          />

          {/* Corner guide marks */}
          {status === "ready" && (
            <div className="absolute pointer-events-none" style={{ inset: "8%" }}>
              <span className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white/70 rounded-tl" />
              <span className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white/70 rounded-tr" />
              <span className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white/70 rounded-bl" />
              <span className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white/70 rounded-br" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {status === "captured" && capturedDataUrl && (
            <img
              src={capturedDataUrl}
              alt="Escaneo capturado"
              className="absolute inset-0 h-full w-full object-contain bg-black"
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 min-h-[76px]">

          {status === "ready" && (
            <>
              <p className="absolute left-8 text-xs text-muted-foreground max-w-[110px] leading-snug">
                Enmarca el documento y pulsa capturar
              </p>
              <button
                onClick={capture}
                className="h-14 w-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                aria-label="Capturar"
              >
                <Aperture className="h-6 w-6 text-primary-foreground" />
              </button>
              {/* Orientation toggle */}
              <button
                onClick={() => setOrientation(o => o === "portrait" ? "landscape" : "portrait")}
                className="absolute right-8 flex flex-col items-center gap-1"
                aria-label="Rotar encuadre"
              >
                <span className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  orientation === "portrait"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                )}>
                  <RotateCw className="h-4 w-4" />
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {orientation === "portrait" ? "Vertical" : "Horizontal"}
                </span>
              </button>
            </>
          )}

          {status === "captured" && (
            <div className="flex items-center gap-3 w-full">
              <button
                onClick={retake}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Repetir
              </button>
              <button
                onClick={confirm}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Check className="h-4 w-4" />
                Usar esta foto
              </button>
            </div>
          )}

          {status === "loading" && (
            <p className="text-xs text-muted-foreground">Solicitando permiso de cámara…</p>
          )}

          {status === "error" && (
            <button
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
