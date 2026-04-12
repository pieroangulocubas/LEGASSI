"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Piece {
  id: number
  x: number
  color: string
  size: number
  delay: number
  duration: number
  rotation: number
  shape: "square" | "circle" | "rect"
}

const COLORS = [
  "#FF6B6B", "#FFE66D", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#A29BFE", "#FD79A8",
  "#00B894", "#FDCB6E",
]

function generatePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 3,
    rotation: Math.random() * 360,
    shape: (["square", "circle", "rect"] as const)[Math.floor(Math.random() * 3)],
  }))
}

export function CelebrationModal({ dni, onClose }: { dni: string; onClose: () => void }) {
  const router = useRouter()
  const [pieces] = useState(() => generatePieces(80))
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  function handleGoToTracking() {
    router.push(`/herramientas/antecedentes-penales-peru/seguimiento?dni=${dni}`)
  }

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes modalAppear {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .confetti-piece {
          position: fixed;
          pointer-events: none;
          z-index: 50;
          animation: confettiFall linear forwards;
        }
        .celebration-modal {
          animation: modalAppear 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* Confetti */}
      {visible && pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.shape === "rect" ? p.size * 2 : p.size,
            height: p.shape === "rect" ? p.size / 2 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="celebration-modal bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <PartyPopper className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">¡Solicitud enviada!</h2>
            <PartyPopper className="w-6 h-6 text-primary" />
          </div>

          <p className="text-muted-foreground mb-2">
            Hemos registrado tu solicitud de{" "}
            <strong className="text-foreground">
              Certificado de Antecedentes Penales con Apostilla
            </strong>{" "}
            para Perú.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            El proceso es completamente automático. Iremos avanzando paso a paso: pago de tasas,
            emisión del certificado y apostillado. Te avisaremos por correo cuando esté listo.
          </p>

          {/* DNI badge */}
          <div className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 mb-6 text-sm">
            <span className="text-muted-foreground">Tu DNI de seguimiento:</span>
            <span className="font-mono font-bold text-foreground">{dni}</span>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToTracking}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              Ver el seguimiento de mi solicitud
            </Button>
            <p className="text-xs text-muted-foreground">
              Puedes acceder al seguimiento en cualquier momento con tu DNI
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
