"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  FileSearch,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  Shield,

  Users,
  Star,
  Phone,
  FileText,
  CalendarCheck,
  Scale,
  BadgeCheck,
  TrendingUp,
  Lock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Sparkles,
  Award,
} from "lucide-react";

// ─── Countdown ────────────────────────────────────────────────────────────────

const DEADLINE = new Date("2026-06-30T23:59:59");

function useCountdown() {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    function tick() {
      const diff = DEADLINE.getTime() - Date.now();
      if (diff <= 0) { setT({ days: 0, hours: 0, minutes: 0, seconds: 0 }); return; }
      setT({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

// ─── Mini Evaluador ───────────────────────────────────────────────────────────

type MiniStep = "data" | "in_spain" | "permit" | "pi" | "ukrainian" | "supuesto" | "criminal" | "passport" | "result";

interface LeadData {
  nombre: string;
  whatsapp: string;
  email: string;
  nacionalidad: string;
}

interface MiniAnswers {
  inSpain: boolean | null;
  permit: "has_permit" | "pending" | "none" | null;
  hasPi: boolean | null;
  isUkrainian: boolean | null;
  supuesto: "work" | "job_offer" | "self_employed" | "family" | "vulnerability" | null;
  criminal: "clean" | "maybe_origin" | "has_spain" | "unknown" | null;
  passport: "valid" | "expired" | "missing" | null;
}

function evalMini(a: MiniAnswers): {
  eligible: boolean;
  via: "DA20" | "DA21" | null;
  msg: string;
  detail: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  if (!a.inSpain)
    return { eligible: false, via: null, warnings, msg: "No cumples el requisito base", detail: "Este proceso requiere haber estado en España de forma continuada antes del 1 de enero de 2026. Existen otras vías según tu situación." };
  if (a.permit === "has_permit")
    return { eligible: false, via: null, warnings, msg: "Ya tienes documentación vigente", detail: "Este proceso está diseñado para personas en situación irregular. Con permiso vigente, el trámite aplicable es la renovación u otros procedimientos." };
  if (a.permit === "pending")
    return { eligible: false, via: null, warnings, msg: "Procedimiento activo", detail: "Mientras tengas un trámite en curso, la regularización extraordinaria queda en suspenso. Espera la resolución antes de valorar esta vía." };
  if (a.isUkrainian)
    return { eligible: false, via: null, warnings, msg: "Protección temporal ucraniana — excluida", detail: "La DA 22ª del RD 316/2026 excluye expresamente a los beneficiarios de la Protección Temporal por el conflicto en Ucrania. Existen otras vías específicas para tu situación — consulta con un asesor." };
  if (a.criminal === "has_spain")
    return { eligible: false, via: null, warnings, msg: "Antecedentes penales en España", detail: "Los antecedentes en España son un obstáculo significativo. Existen mecanismos de cancelación que un abogado puede valorar contigo antes de presentar. Te recomendamos asesoramiento profesional." };
  if (a.criminal === "maybe_origin" || a.criminal === "unknown")
    warnings.push("Si el certificado de antecedentes del país de origen tarda, los Anexos I-1 e I-2 del formulario justifican la situación — alternativa prevista por la normativa.");
  if (a.passport === "expired")
    warnings.push("Pasaporte caducado: debes renovarlo en tu consulado antes de presentar la solicitud.");
  if (a.passport === "missing")
    warnings.push("Sin pasaporte vigente no se puede presentar la solicitud. Inicia los trámites en tu consulado cuanto antes.");
  if (a.hasPi)
    return { eligible: true, via: "DA20", warnings, msg: "Sí calificas — Vía DA20", detail: "Tu historial como solicitante de protección internacional te da acceso directo a la DA20, sin necesidad de acreditar trabajo ni vulnerabilidad. Es la vía más sólida." };
  if (a.supuesto)
    return { eligible: true, via: "DA21", warnings, msg: "Sí calificas — Vía DA21", detail: "Tienes un supuesto válido para presentar bajo la DA21. Según tu situación laboral o familiar, el expediente tiene buenas posibilidades de ser aprobado." };
  return { eligible: false, via: null, warnings, msg: "Necesitamos más información", detail: "No hemos podido determinar tu vía con las respuestas dadas. Te recomendamos hablar con un asesor para revisar tu caso en detalle." };
}

function MiniOption({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 px-5 py-4 text-sm font-medium transition-all duration-200 flex items-start gap-3 ${
        selected
          ? "border-amber-500 bg-amber-50 text-stone-900"
          : "border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50/40 text-stone-700"
      }`}
    >
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
        selected ? "border-amber-500 bg-amber-500" : "border-stone-300"
      }`}>
        {selected && <CheckCircle className="size-3 text-white fill-white" />}
      </div>
      <span className="leading-snug">{children}</span>
    </button>
  );
}

function MiniEvaluador() {
  const [step, setStep] = useState<MiniStep>("data");
  const [lead, setLead] = useState<LeadData>({ nombre: "", whatsapp: "", email: "", nacionalidad: "" });
  const [answers, setAnswers] = useState<MiniAnswers>({ inSpain: null, permit: null, hasPi: null, isUkrainian: null, supuesto: null, criminal: null, passport: null });
  const [dataErr, setDataErr] = useState("");

  const result = step === "result" ? evalMini(answers) : null;

  function waMsg() {
    const eligibleLine = result
      ? result.eligible
        ? `\n✅ Resultado: CALIFICA${result.via ? ` (vía ${result.via})` : ""}`
        : "\n❌ Resultado: no califica directamente"
      : "";
    const warningsLine = result?.warnings?.length
      ? `\n⚠️ Advertencias: ${result.warnings.join(" / ")}`
      : "";
    return `https://wa.me/34672297468?text=${encodeURIComponent(
      `Hola, soy ${lead.nombre} (${lead.nacionalidad}).${eligibleLine}${warningsLine}\n\nQuiero hablar con un asesor sobre mi caso para la regularización extraordinaria RD 316/2026.`
    )}`;
  }

  function handleDataNext() {
    if (!lead.nombre.trim() || !lead.whatsapp.trim() || !lead.email.trim() || !lead.nacionalidad.trim()) {
      setDataErr("Completa todos los campos para continuar.");
      return;
    }
    setDataErr("");
    setStep("in_spain");
  }

  function goResult() { setStep("result"); }

  const _STEPS_LABEL: Record<MiniStep, string> = {
    data: "Tus datos", in_spain: "Requisito base", permit: "Situación actual",
    pi: "Historial de asilo", ukrainian: "Protección temporal", supuesto: "Tu supuesto",
    criminal: "Antecedentes", passport: "Documentación", result: "Tu resultado",
  };
  const ORDERED: MiniStep[] = ["data", "in_spain", "permit", "pi", "ukrainian", "supuesto", "criminal", "passport", "result"];
  const stepIdx = ORDERED.indexOf(step);
  const QUESTION_STEPS = ORDERED.slice(1, -1);

  return (
    <div className="bg-white border border-stone-200 rounded-3xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-amber-200 text-xs font-bold uppercase tracking-widest mb-0.5">Evaluación gratuita · 2 minutos</p>
            <h3 className="text-white font-heading text-xl font-black">¿Calificas para regularizarte?</h3>
          </div>
          {step !== "data" && step !== "result" && (
            <div className="flex items-center gap-1">
              {QUESTION_STEPS.map((s, i) => (
                <div key={s} className={`rounded-full transition-all ${s === step ? "w-5 h-2 bg-white" : stepIdx > i + 1 ? "w-2 h-2 bg-amber-300" : "w-2 h-2 bg-amber-500/40"}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-8">

        {/* ── Paso 1: Datos ── */}
        {step === "data" && (
          <div className="space-y-5">
            <p className="text-stone-600 text-sm leading-relaxed">
              Dinos quién eres para personalizar tu evaluación. En menos de 2 minutos sabrás si calificas.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { key: "nombre",      label: "Nombre completo",  placeholder: "Ana García López",   type: "text" },
                { key: "nacionalidad",label: "Nacionalidad",     placeholder: "Venezuela",           type: "text" },
                { key: "whatsapp",    label: "WhatsApp",        placeholder: "+34 600 000 000",     type: "tel" },
                { key: "email",       label: "Correo electrónico", placeholder: "ana@ejemplo.com",  type: "email" },
              ].map(({ key, label, placeholder, type }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={lead[key as keyof LeadData]}
                    onChange={(e) => setLead(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all"
                  />
                </div>
              ))}
            </div>
            {dataErr && <p className="text-red-600 text-xs font-medium">{dataErr}</p>}
            <p className="text-stone-400 text-xs">Tus datos son privados y solo se usarán para personalizar tu evaluación.</p>
            <button
              onClick={handleDataNext}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-xl text-base flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              Comenzar evaluación <ChevronRight className="size-5" />
            </button>
          </div>
        )}

        {/* ── Paso 2: ¿En España antes del 1/1/2026? ── */}
        {step === "in_spain" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Requisito base</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold mb-1">¿Llevas en España de forma continuada desde antes del 1 de enero de 2026?</h4>
              <p className="text-stone-500 text-xs">Un empadronamiento, factura o contrato anterior al 1/1/2026 puede confirmarlo.</p>
            </div>
            <div className="space-y-2.5">
              <MiniOption selected={answers.inSpain === true} onClick={() => setAnswers(a => ({ ...a, inSpain: true }))}>
                <span><strong>Sí</strong>, llevo en España de forma continuada desde antes del 1 de enero de 2026</span>
              </MiniOption>
              <MiniOption selected={answers.inSpain === false} onClick={() => setAnswers(a => ({ ...a, inSpain: false }))}>
                <span><strong>No</strong>, llegué después de esa fecha o no puedo demostrarlo</span>
              </MiniOption>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("data")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => { if (answers.inSpain === false) goResult(); else if (answers.inSpain === true) setStep("permit"); }}
                disabled={answers.inSpain === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3: Situación actual ── */}
        {step === "permit" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Situación actual</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Cuál es tu situación administrativa en España?</h4>
            </div>
            <div className="space-y-2.5">
              <MiniOption selected={answers.permit === "has_permit"} onClick={() => setAnswers(a => ({ ...a, permit: "has_permit" }))}>
                <span>Tengo un <strong>permiso de residencia vigente</strong> (TIE, visado de larga duración…)</span>
              </MiniOption>
              <MiniOption selected={answers.permit === "pending"} onClick={() => setAnswers(a => ({ ...a, permit: "pending" }))}>
                <span>Tengo un <strong>trámite de residencia pendiente</strong> de resolución</span>
              </MiniOption>
              <MiniOption selected={answers.permit === "none"} onClick={() => setAnswers(a => ({ ...a, permit: "none" }))}>
                <span>Estoy en <strong>situación irregular</strong> — sin permiso ni procedimiento activo</span>
              </MiniOption>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("in_spain")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => { if (answers.permit === "none") setStep("pi"); else goResult(); }}
                disabled={answers.permit === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 4: Protección internacional ── */}
        {step === "pi" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Historial de asilo</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Presentaste alguna solicitud de protección internacional (asilo) en España antes del 1/1/2026?</h4>
              <p className="text-stone-500 text-xs mt-1">Cuenta cualquier solicitud: pendiente, denegada, retirada o con recurso.</p>
            </div>
            <div className="space-y-2.5">
              <MiniOption selected={answers.hasPi === true} onClick={() => setAnswers(a => ({ ...a, hasPi: true }))}>
                <span><strong>Sí</strong>, pedí o tengo solicitud de asilo / PI en España antes del 1/1/2026</span>
              </MiniOption>
              <MiniOption selected={answers.hasPi === false} onClick={() => setAnswers(a => ({ ...a, hasPi: false }))}>
                <span><strong>No</strong>, nunca he solicitado asilo en España</span>
              </MiniOption>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("permit")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => setStep("ukrainian")}
                disabled={answers.hasPi === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 5: Protección temporal ucraniana ── */}
        {step === "ukrainian" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Protección temporal</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Eres beneficiario de la Protección Temporal concedida por el conflicto en Ucrania?</h4>
              <p className="text-stone-500 text-xs mt-1">Este régimen específico está excluido de la regularización extraordinaria del RD 316/2026 (DA 22ª).</p>
            </div>
            <div className="space-y-2.5">
              <MiniOption selected={answers.isUkrainian === true} onClick={() => setAnswers(a => ({ ...a, isUkrainian: true }))}>
                <span><strong>Sí</strong>, soy beneficiario de la Protección Temporal ucraniana</span>
              </MiniOption>
              <MiniOption selected={answers.isUkrainian === false} onClick={() => setAnswers(a => ({ ...a, isUkrainian: false }))}>
                <span><strong>No</strong>, no soy beneficiario de esa protección</span>
              </MiniOption>
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("pi")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => { if (answers.isUkrainian === true) goResult(); else setStep("supuesto"); }}
                disabled={answers.isUkrainian === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 6: Supuesto DA21 ── */}
        {step === "supuesto" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Tu supuesto</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Qué puedes acreditar?</h4>
              <p className="text-stone-500 text-xs mt-1">Solo necesitas cumplir uno. Elige el que mejor describe tu situación.</p>
            </div>
            <div className="space-y-2">
              {[
                { key: "work",         label: "Historial laboral",          desc: "Nóminas, contratos o vida laboral con más de 90 días/año" },
                { key: "job_offer",    label: "Oferta de trabajo",          desc: "Contrato firmado de al menos 90 días/año" },
                { key: "self_employed",label: "Actividad por cuenta propia", desc: "Declaración de intención de alta como autónomo" },
                { key: "family",       label: "Familia a cargo",            desc: "Hijos menores, familiar con discapacidad o ascendiente dependiente" },
                { key: "vulnerability",label: "Situación de vulnerabilidad", desc: "Certificado de Cruz Roja, Cáritas, ACNUR, Médicos del Mundo o SS.SS." },
              ].map((opt) => (
                <MiniOption
                  key={opt.key}
                  selected={answers.supuesto === opt.key as MiniAnswers["supuesto"]}
                  onClick={() => setAnswers(a => ({ ...a, supuesto: opt.key as MiniAnswers["supuesto"] }))}
                >
                  <div>
                    <span className="font-semibold block">{opt.label}</span>
                    <span className="text-xs text-stone-500 font-normal">{opt.desc}</span>
                  </div>
                </MiniOption>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("ukrainian")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => setStep("criminal")}
                disabled={answers.supuesto === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 7: Antecedentes penales ── */}
        {step === "criminal" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Antecedentes penales</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Tienes antecedentes penales?</h4>
              <p className="text-stone-500 text-xs mt-1">Esta pregunta genera inquietud, pero en la mayoría de casos tiene solución.</p>
            </div>
            <div className="space-y-2.5">
              {[
                { key: "clean",        label: "No tengo antecedentes en ningún país" },
                { key: "maybe_origin", label: "No en España, pero podría haber algo en mi país de origen (no estoy seguro/a)" },
                { key: "has_spain",    label: "Tengo antecedentes penales o policiales en España" },
                { key: "unknown",      label: "No lo sé con certeza — necesito averiguarlo" },
              ].map((opt) => (
                <MiniOption
                  key={opt.key}
                  selected={answers.criminal === opt.key as MiniAnswers["criminal"]}
                  onClick={() => setAnswers(a => ({ ...a, criminal: opt.key as MiniAnswers["criminal"] }))}
                >
                  {opt.label}
                </MiniOption>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("supuesto")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={() => setStep("passport")}
                disabled={answers.criminal === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Continuar <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 8: Pasaporte ── */}
        {step === "passport" && (
          <div className="space-y-4">
            <div>
              <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-1">Documentación de identidad</p>
              <h4 className="text-stone-900 font-heading text-lg font-bold">¿Dispones de pasaporte o documento de viaje vigente?</h4>
              <p className="text-stone-500 text-xs mt-1">Si tu pasaporte ha caducado, hay tiempo para renovarlo antes del 30 de junio de 2026.</p>
            </div>
            <div className="space-y-2.5">
              {[
                { key: "valid",   label: "Sí, tengo pasaporte o documento de viaje vigente" },
                { key: "expired", label: "Mi pasaporte está caducado" },
                { key: "missing", label: "No tengo pasaporte o estoy en trámite de renovación" },
              ].map((opt) => (
                <MiniOption
                  key={opt.key}
                  selected={answers.passport === opt.key as MiniAnswers["passport"]}
                  onClick={() => setAnswers(a => ({ ...a, passport: opt.key as MiniAnswers["passport"] }))}
                >
                  {opt.label}
                </MiniOption>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3 pt-2">
              <button onClick={() => setStep("criminal")} className="text-stone-400 text-sm hover:text-stone-600 transition-colors">← Volver</button>
              <button
                onClick={goResult}
                disabled={answers.passport === null}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-bold py-3 px-7 rounded-xl text-sm flex items-center gap-2 transition-all"
              >
                Ver mi resultado <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Resultado ── */}
        {step === "result" && result && (
          <div className="space-y-5">
            {/* Veredicto */}
            <div className={`rounded-2xl p-5 border-2 ${result.eligible ? "border-green-200 bg-green-50" : "border-red-100 bg-red-50"}`}>
              <div className="flex items-start gap-3">
                {result.eligible
                  ? <CheckCircle2 className="size-7 text-green-600 shrink-0 mt-0.5" />
                  : <XCircle className="size-7 text-red-500 shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`font-heading text-xl font-black mb-1 ${result.eligible ? "text-green-800" : "text-red-700"}`}>
                    {result.msg}
                  </p>
                  <p className={`text-sm leading-relaxed ${result.eligible ? "text-green-700" : "text-red-600"}`}>
                    {result.detail}
                  </p>
                </div>
              </div>
            </div>

            {/* Info de vía */}
            {result.eligible && result.via && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="bg-amber-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shrink-0">{result.via}</div>
                <p className="text-amber-800 text-sm font-medium">
                  {result.via === "DA20"
                    ? "Disposición Adicional 20ª — solicitantes de protección internacional"
                    : "Disposición Adicional 21ª — vía ordinaria de regularización"}
                </p>
              </div>
            )}

            {/* Advertencias no bloqueantes */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                {result.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-amber-800 text-sm leading-relaxed">{w}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Hola usuario */}
            <p className="text-stone-500 text-sm">
              {lead.nombre.split(" ")[0]}, esto es una evaluación orientativa basada en el RD 316/2026.
              {result.eligible
                ? " El siguiente paso es preparar tu expediente completo."
                : " Te recomendamos hablar con un asesor para explorar todas las opciones."}
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              {result.eligible ? (
                <>
                  <a
                    href={waMsg()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-2.5 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold py-4 px-6 rounded-xl text-sm transition-colors"
                  >
                    <Phone className="size-4" />
                    Hablar con un asesor — que me ayude con mi caso
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                  <Link
                    href="/herramientas/evaluador-regularizacion"
                    className="flex items-center justify-center gap-2 border border-stone-300 bg-white hover:bg-stone-50 text-stone-600 font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors"
                  >
                    <Sparkles className="size-4 text-amber-500" />
                    Prefiero gestionarlo yo · ExpedienteIA 59,90 €
                  </Link>
                </>
              ) : (
                <>
                  <a
                    href={waMsg()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold py-4 px-6 rounded-xl text-sm transition-colors"
                  >
                    <Phone className="size-4" />
                    Hablar con un asesor — explorar opciones
                  </a>
                  <button
                    onClick={() => { setStep("data"); setAnswers({ inSpain: null, permit: null, hasPi: null, isUkrainian: null, supuesto: null, criminal: null, passport: null }); }}
                    className="text-stone-400 text-sm hover:text-stone-600 text-center transition-colors underline underline-offset-4"
                  >
                    Revisar mis respuestas
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const faqs = [
  {
    q: "¿Qué es la regularización extraordinaria del RD 316/2026?",
    a: "Es un proceso excepcional aprobado por el Gobierno de España que permite obtener un permiso de residencia y trabajo a personas en situación irregular con arraigo demostrable. Es la oportunidad de regularización más amplia en más de 20 años.",
  },
  {
    q: "¿Cuándo cierra el plazo de presentación?",
    a: "El plazo oficial de presentación de solicitudes vence el 30 de junio de 2026. No están previstas extensiones. Una solicitud fuera de plazo no será admitida a trámite.",
  },
  {
    q: "¿Qué diferencia hay entre la DA20 y la DA21?",
    a: "La Disposición Adicional 20ª (DA20) está dirigida a personas con historial como solicitantes de protección internacional. La DA21 recoge el resto de supuestos: trabajo, oferta de empleo, actividad por cuenta propia, vínculos familiares o situación de vulnerabilidad.",
  },
  {
    q: "¿Qué incluye ExpedienteIA y cuánto cuesta?",
    a: "ExpedienteIA (59,90 €) es una herramienta automatizada que te guía paso a paso: evaluación completa de elegibilidad, checklist personalizado, verificación de documentos con IA, autorelleno de formularios EX31/EX32 y expediente en PDF listo para presentar. Incluye acceso completo a PermanencIA. Sin abogado, sin esperas, totalmente online.",
  },
  {
    q: "¿En qué se diferencia ExpedienteIA de la asesoría con abogado?",
    a: "ExpedienteIA (59,90 €) es para quienes prefieren hacerlo ellos mismos con una guía profesional automatizada: ideal si puedes presentar presencialmente o con tu certificado electrónico. La asesoría completa con abogado incluye representación, revisión jurídica y presentación en tu nombre — es más cara pero delega todo el proceso.",
  },
  {
    q: "¿Cuánto tiempo de permanencia necesito acreditar?",
    a: "Varía según la vía y el supuesto concreto. Con carácter general se requiere acreditar permanencia continuada en España desde una fecha anterior al 1 de enero de 2021. PermanencIA analiza exactamente qué período tienes cubierto.",
  },
];

const testimonios = [
  { nombre: "María C.", pais: "Venezuela", texto: "Llevaba 4 años sin papeles. Usé el Evaluador y en 10 minutos supe exactamente qué necesitaba. El proceso fue mucho más sencillo de lo que pensaba.", estrellas: 5 },
  { nombre: "Jorge A.", pais: "Colombia", texto: "PermanencIA organizó todos mis documentos y me confirmó que ya tenía cobertura suficiente. Me ahorró semanas de incertidumbre.", estrellas: 5 },
  { nombre: "Fatima E.", pais: "Marruecos", texto: "Pensé que no calificaba. La evaluación me mostró que sí tenía una vía válida. Ahora mi familia entera tiene permiso de residencia.", estrellas: 5 },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50 transition-colors">
        <span className="font-semibold text-slate-800 text-[15px] leading-snug">{q}</span>
        <ChevronDown className={`shrink-0 size-5 text-amber-500 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">{a}</div>}
    </div>
  );
}

// ─── Countdown Unit ───────────────────────────────────────────────────────────

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 min-w-[68px] text-center">
        <span className="text-3xl md:text-4xl font-black text-amber-400 tabular-nums">{String(value).padStart(2, "0")}</span>
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-widest text-stone-400 font-semibold">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────


export default function RegularizacionExtraordinariaPage() {
  const { days, hours, minutes, seconds } = useCountdown();

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased overflow-x-hidden">

      {/* ── NAVBAR FLOTANTE ─────────────────────────────────────────────── */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-5 h-14 shadow-lg shadow-slate-900/10">
            <Link href="/" className="shrink-0">
              <Image src="/imagotipo_ligth.svg" alt="LEGASSI" width={100} height={24} className="h-6 w-auto" />
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <a href="#evaluacion" className="text-slate-500 hover:text-stone-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all">Evalúate</a>
              <a href="#precios" className="text-slate-500 hover:text-stone-900 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all">Servicios</a>
            </nav>
            <a
              href="https://wa.me/34672297468?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor%20sobre%20la%20regularizaci%C3%B3n%20extraordinaria%20RD%20316%2F2026"
              target="_blank" rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Phone className="size-3.5" />
              <span>Asesor</span>
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background image */}
        <Image
          src="/hero-bg-reg.png"
          alt=""
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-stone-950/65" />
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(251,191,36,0.08) 0%, transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-6 w-full pt-28 pb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 border border-amber-400/40 bg-amber-500/15 text-amber-300 px-3 py-1.5 rounded-full text-xs font-semibold mb-8">
              <AlertTriangle className="size-3.5" />
              Plazo: 30 de junio de 2026 · Quedan <strong>{days} días</strong>
            </div>

            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6 text-white">
              Tu regularización,<br />en manos{" "}
              <span className="text-amber-400">expertas.</span>
            </h1>

            <p className="text-stone-300 text-lg leading-relaxed mb-10 max-w-lg">
              Abogados especializados en extranjería te acompañan en el proceso del RD 316/2026.
              Sin burocracia, sin colas, con garantía jurídica.
            </p>

            <div className="mb-10">
              <p className="text-stone-400 text-[10px] uppercase tracking-widest mb-4 font-semibold">Tiempo restante para presentar</p>
              <div className="flex items-center gap-3">
                <CountdownUnit value={days} label="días" />
                <span className="text-white/30 text-2xl font-light pb-5">:</span>
                <CountdownUnit value={hours} label="horas" />
                <span className="text-white/30 text-2xl font-light pb-5">:</span>
                <CountdownUnit value={minutes} label="min" />
                <span className="text-white/30 text-2xl font-light pb-5">:</span>
                <CountdownUnit value={seconds} label="seg" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/34672297468?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor%20sobre%20la%20regularizaci%C3%B3n%20extraordinaria%20RD%20316%2F2026"
                target="_blank" rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-base px-7 py-4 rounded-xl shadow-lg shadow-amber-900/30 hover:shadow-xl transition-all duration-200"
              >
                <Phone className="size-4" />
                Hablar con un asesor
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </a>
              <a href="#evaluacion" className="inline-flex items-center justify-center gap-2 border border-white/30 hover:border-white text-white font-semibold text-base px-7 py-4 rounded-xl transition-all duration-200">
                <ClipboardCheck className="size-4" />
                Evaluar mi caso — Gratis
              </a>
            </div>
            <p className="mt-4 text-stone-400 text-sm">Sin compromiso · Respuesta en horas</p>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <ChevronDown className="size-5 text-white/30 animate-bounce" />
        </div>
      </section>

      {/* ── SELLOS DE CONFIANZA ──────────────────────────────────────────── */}
      <section className="border-y border-amber-100 bg-[#FFFAF4] py-5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Scale,      label: "Basado en RD 316/2026",   sub: "Legislación oficial BOE" },
              { icon: BadgeCheck, label: "Abogados especializados",  sub: "Extranjería e inmigración" },
              { icon: Lock,       label: "Datos protegidos",         sub: "RGPD y LOPDGDD" },
              { icon: TrendingUp, label: "+500.000 beneficiarios",   sub: "Estimación Gobierno de España" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="shrink-0 bg-amber-500/10 rounded-lg p-2"><Icon className="size-5 text-amber-600" /></div>
                <div>
                  <p className="text-slate-800 text-sm font-semibold leading-tight">{label}</p>
                  <p className="text-slate-500 text-xs">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CIFRAS DE IMPACTO ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#F5E6D0]">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
            {[
              { num: "+500K",   label: "personas pueden regularizarse",              src: "Estimación Gobierno de España" },
              { num: "30 jun",  label: "fecha límite de presentación",               src: "RD 316/2026 · BOE" },
              { num: "5 meses", label: "permanencia mínima ininterrumpida",          src: "Requisito base DA20/DA21" },
              { num: "48 h",    label: "para tener tu expediente listo y presentado", src: "Con LEGASSI" },
            ].map(({ num, label, src }) => (
              <div key={num} className="flex flex-col items-center gap-2">
                <p className="font-heading text-4xl md:text-5xl font-black text-amber-700">{num}</p>
                <p className="text-stone-700 text-sm leading-snug">{label}</p>
                <p className="text-stone-500 text-[10px] uppercase tracking-wider">{src}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUIÉN PUEDE REGULARIZARSE ────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Requisitos del RD 316/2026</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-stone-900">¿Quién puede regularizarse?</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">Dos vías según tu historial en España. Descubre cuál aplica a tu caso.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {/* Requisito común — full width */}
            <div className="md:col-span-3 bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center gap-5">
              <div className="shrink-0 bg-amber-500 rounded-xl p-3">
                <CheckCircle2 className="size-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-stone-900 mb-0.5">Requisito común a todas las vías</p>
                <p className="text-stone-600 text-sm">Haber permanecido en España de forma continuada durante al menos <strong>2 años antes del 1 de enero de 2026</strong>, en situación irregular y sin permiso de residencia vigente.</p>
              </div>
            </div>

            {/* DA20 */}
            <div className="bg-[#EDD9BF] border border-amber-200 rounded-2xl p-7 flex flex-col">
              <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-5 self-start">DA 20ª · Arraigo social</span>
              <h3 className="font-heading text-xl font-black text-stone-900 mb-4">Arraigo social / laboral</h3>
              <ul className="space-y-2.5 flex-1">
                {[
                  "2+ años de permanencia acreditada",
                  "Oferta de empleo o contrato de trabajo",
                  "Sin antecedentes penales en España",
                  "Vínculos laborales o familiares",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-stone-700 text-sm">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">→</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* DA21 */}
            <div className="bg-[#EDD9BF] border border-amber-200 rounded-2xl p-7 flex flex-col">
              <span className="bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-block mb-5 self-start">DA 21ª · Situación especial</span>
              <h3 className="font-heading text-xl font-black text-stone-900 mb-4">Situación especial</h3>
              <ul className="space-y-2.5 flex-1">
                {[
                  "2+ años de permanencia acreditada",
                  "Situación de especial vulnerabilidad",
                  "Víctima de trata, violencia u otras situaciones",
                  "Sin antecedentes penales en España",
                ].map(f => (
                  <li key={f} className="flex items-start gap-2 text-stone-700 text-sm">
                    <span className="text-amber-600 font-bold shrink-0 mt-0.5">→</span>{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA card */}
            <div className="bg-[#FFFAF4] border border-stone-200 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <Shield className="size-8 text-amber-600 mb-4" />
                <h3 className="font-heading text-xl font-black text-stone-900 mb-3">¿No estás seguro?</h3>
                <p className="text-stone-600 text-sm leading-relaxed">Haz la evaluación gratuita en 2 minutos y te decimos exactamente qué vía aplica a tu caso, con los documentos que necesitas.</p>
              </div>
              <a href="#evaluacion" className="mt-6 inline-flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-bold py-3 px-5 rounded-xl text-sm transition-colors">
                <ClipboardCheck className="size-4" />
                Hacer mi evaluación
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── MINI EVALUADOR ───────────────────────────────────────────────── */}
      <section id="evaluacion" className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Evaluación gratuita</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-stone-900 mb-3">
              ¿Calificas para regularizarte?
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Responde las preguntas y descubre si calificas, qué vía aplica a tu caso (DA20/DA21) y cuál es el siguiente paso recomendado.
            </p>
          </div>
          <MiniEvaluador />
        </div>
      </section>

      {/* ── OPCIONES DE SERVICIO ─────────────────────────────────────────── */}
      <section id="precios" className="py-24 px-6 bg-[#FFFAF4]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Cómo podemos ayudarte</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-stone-900">
              Elige según tu situación
            </h2>
            <p className="text-slate-500 mt-3 max-w-lg mx-auto text-sm">Asesoría jurídica completa o herramienta de autogestión — tú decides según tu caso.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {/* Asesoría completa — DESTACADA */}
            <div className="relative bg-[#EDD9BF] border-2 border-amber-400 rounded-2xl p-7 shadow-lg shadow-amber-200/60 flex flex-col ring-0">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-500 text-stone-950 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Recomendado</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="size-4 text-amber-700" />
                <span className="text-amber-700 text-[10px] font-bold uppercase tracking-widest">Abogado · Garantía jurídica</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-stone-900 mb-1">Asesoría completa</h3>
              <p className="text-3xl font-black text-stone-900 mb-0.5">249 €</p>
              <p className="text-stone-600 text-xs mb-3">Cita de huellas dactilares + recogida incluidas</p>
              <div className="bg-white/60 border border-amber-200 rounded-xl px-3 py-3 mb-5">
                <p className="text-stone-700 text-xs font-semibold mb-2">La opción ideal si…</p>
                <ul className="space-y-1.5">
                  {[
                    "Tienes antecedentes penales o policiales",
                    "Estás en un proceso judicial activo",
                    "Tu caso es complejo o excepcional",
                    "No quieres hacer colas ni pedir cita",
                    "Quieres garantía y respaldo profesional",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs text-stone-700">
                      <span className="text-amber-600 font-bold shrink-0 mt-0.5">→</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="space-y-2 mb-7 flex-1">
                {[
                  "Revisión jurídica personalizada por abogado",
                  "Preparación y presentación del expediente",
                  "Cita de huellas dactilares incluida",
                  "Recogida del permiso de residencia",
                  "Seguimiento completo del trámite",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-stone-700">
                    <CheckCircle2 className="size-3.5 text-amber-600 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a
                href="https://wa.me/34672297468?text=Hola%2C%20quiero%20solicitar%20una%20precalificaci%C3%B3n%20gratuita%20para%20la%20regularizaci%C3%B3n%20extraordinaria%20RD%20316%2F2026"
                target="_blank" rel="noopener noreferrer"
                className="mt-auto bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 font-bold py-4 px-5 rounded-xl text-sm text-center transition-colors"
              >
                Realizar mi precalificación
              </a>
            </div>

            {/* ExpedienteIA */}
            <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-4 text-amber-500" />
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Herramienta self-service</span>
              </div>
              <h3 className="font-heading text-xl font-bold text-stone-900 mb-1">
                Expediente<span className="italic text-amber-500">IA</span>
              </h3>
              <p className="text-3xl font-black text-stone-900 mb-0.5">59,90 €</p>
              <p className="text-slate-400 text-xs mb-5">Pago único · Incluye PermanencIA</p>
              <p className="text-slate-600 text-sm leading-relaxed mb-5 flex-1">
                Prepara y presenta tu expediente tú mismo con guía experta automatizada. Ideal si tu caso es sencillo y quieres gestionarlo por tu cuenta.
              </p>
              <ul className="space-y-2 mb-7">
                {[
                  "Evaluación completa de elegibilidad",
                  "Checklist personalizado por persona",
                  "Verificación de documentos con IA",
                  "Autorelleno de formularios EX31/EX32",
                  "Expediente PDF listo para presentar",
                  "Incluye PermanencIA completo",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="size-3.5 text-amber-500 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/herramientas/evaluador-regularizacion" className="mt-auto border border-stone-300 hover:border-stone-500 hover:bg-stone-50 text-stone-700 font-bold py-4 px-5 rounded-xl text-sm text-center transition-all duration-200">
                Empezar con ExpedienteIA
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARATIVA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">¿Cuál es la diferencia?</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-stone-900">¿Cuándo usar cada opción?</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm">Cada situación es distinta. Aquí tienes las claves para elegir lo que mejor se adapta a tu caso.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-5 py-4 text-slate-400 font-semibold text-xs uppercase tracking-wide w-1/2">Característica</th>
                  <th className="px-4 py-4 text-center text-slate-600 font-bold text-sm w-1/4">
                    Expediente<em className="text-amber-500">IA</em>
                    <span className="block text-[11px] font-normal text-slate-400 mt-0.5">59,90 €</span>
                  </th>
                  <th className="px-4 py-4 text-center bg-amber-100 border-x border-amber-300 rounded-t-lg w-1/4">
                    <span className="text-stone-900 font-black text-sm">Asesoría completa</span>
                    <span className="block text-[11px] font-bold text-amber-700 uppercase tracking-wide mt-0.5">249 €</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {[
                  { label: "Precio",                                exp: "59,90 € único",  asesoria: "249 € único" },
                  { label: "Para quién",                            exp: "Casos sencillos", asesoria: "Cualquier caso" },
                  { label: "Evaluación de elegibilidad",            exp: true,             asesoria: true },
                  { label: "Checklist personalizado",               exp: true,             asesoria: true },
                  { label: "Verifica pruebas de permanencia (IA)",  exp: true,             asesoria: true },
                  { label: "Formularios EX31/EX32 autorrellenados", exp: true,             asesoria: true },
                  { label: "Modelo de tasa 790/052",                exp: true,             asesoria: true },
                  { label: "Revisión jurídica por abogado",         exp: false,            asesoria: true },
                  { label: "Cita huellas + recogida del permiso",   exp: false,            asesoria: true },
                  { label: "Presentación en tu nombre",             exp: false,            asesoria: true },
                  { label: "Antecedentes penales / caso complejo",  exp: false,            asesoria: true },
                  { label: "Tiempo estimado",                       exp: "1-2 horas",      asesoria: "3-7 días" },
                ].map((row) => (
                  <tr key={row.label} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-700 font-medium text-xs">{row.label}</td>
                    <td className="px-4 py-3.5 text-center">
                      {typeof row.exp === "boolean"
                        ? (row.exp ? <CheckCircle2 className="size-4 text-green-500 mx-auto" /> : <XCircle className="size-4 text-slate-200 mx-auto" />)
                        : <span className="text-xs text-slate-600">{row.exp}</span>}
                    </td>
                    <td className="px-4 py-3.5 text-center bg-amber-50 border-x border-amber-200">
                      {typeof row.asesoria === "boolean"
                        ? (row.asesoria ? <CheckCircle2 className="size-4 text-amber-500 mx-auto" /> : <XCircle className="size-4 text-slate-200 mx-auto" />)
                        : <span className="text-xs font-semibold text-stone-900">{row.asesoria}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-[#FFFAF4] border border-amber-100 rounded-xl p-5">
              <p className="font-bold text-stone-900 text-sm mb-1.5">Elige ExpedienteIA si…</p>
              <p className="text-slate-600 text-xs leading-relaxed">Tu situación es sencilla, no tienes antecedentes ni procesos judiciales abiertos, y quieres gestionar el trámite por tu cuenta a menor coste.</p>
            </div>
            <div className="bg-[#EDD9BF] border border-amber-300 rounded-xl p-5">
              <p className="font-bold text-amber-800 text-sm mb-2">Contrata la asesoría si…</p>
              <ul className="space-y-1.5">
                {[
                  "Tienes antecedentes penales o policiales",
                  "Hay un proceso judicial activo",
                  "Tu caso es complejo o excepcional",
                  "No quieres hacer colas ni pedir cita",
                  "Quieres que un abogado lo presente por ti",
                ].map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-stone-700">
                    <span className="text-amber-600 font-bold shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESO ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#FFFAF4]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Con ExpedienteIA</p>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-stone-900">Cómo funciona</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {[
              { n: "01", icon: ClipboardCheck, t: "Evalúate", d: "Responde el cuestionario. Obtén vía, puntuación y checklist personalizado." },
              { n: "02", icon: FileSearch,     t: "Sube docs", d: "PermanencIA analiza tus pruebas de permanencia y verifica la cobertura." },
              { n: "03", icon: FileText,       t: "Rellena formularios", d: "ExpedienteIA completa automáticamente los anexos EX31/EX32 con tus datos." },
              { n: "04", icon: CalendarCheck,  t: "Presenta", d: "Descarga el expediente en PDF y preséntalo presencialmente o con tu certificado electrónico." },
            ].map((paso, i) => (
              <div key={paso.n} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center flex flex-col items-center hover:shadow-md transition-shadow">
                <div className="relative mb-5">
                  <div className="bg-amber-500/10 rounded-xl p-3.5"><paso.icon className="size-6 text-amber-600" /></div>
                  <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{i + 1}</div>
                </div>
                <h3 className="font-bold text-stone-900 text-sm mb-2">{paso.t}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{paso.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PERMANENCIA PARA PROFESIONALES ───────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-3xl bg-[#F5E6D0] overflow-hidden border border-amber-200">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left */}
              <div className="p-8 md:p-10">
                <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  <Users className="size-3.5" />
                  Para asesores, gestores y abogados
                </div>
                <h2 className="font-heading text-3xl font-black text-stone-900 mb-4 leading-tight">
                  Permanen<span className="text-amber-600">c</span><em className="text-amber-600">IA</em>: la herramienta que usan los profesionales
                </h2>
                <p className="text-stone-700 leading-relaxed text-sm mb-6">
                  Gestores, asesores de extranjería y abogados están usando PermanencIA para revisar las pruebas de permanencia de sus clientes en minutos, no en horas. El informe estructurado elimina errores de cobertura, ahorra tiempo de revisión y mejora la calidad del expediente presentado.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Analiza documentos y extrae datos automáticamente",
                    "Detecta huecos de cobertura y inconsistencias antes de presentar",
                    "Genera informe PDF con mapa mensual listo para adjuntar",
                    "Reduce el tiempo de revisión hasta un 80%",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-stone-700 text-sm">
                      <CheckCircle2 className="size-4 text-amber-600 shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/herramientas/permanencia"
                  className="inline-flex items-center gap-2 bg-amber-100 hover:bg-amber-200 border border-amber-400 text-amber-900 font-bold py-3 px-6 rounded-xl text-sm transition-colors">
                  <FileSearch className="size-4" />
                  Probar PermanencIA gratis
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              {/* Right */}
              <div className="p-8 md:p-10 border-t md:border-t-0 md:border-l border-amber-200 flex flex-col justify-center gap-6">
                <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Por qué los profesionales confían en PermanencIA</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { stat: "< 5 min", label: "Por cliente analizado" },
                    { stat: "5 meses", label: "Cobertura verificada" },
                    { stat: "100%",    label: "Digital, sin papel" },
                    { stat: "PDF",     label: "Informe listo para anexar" },
                  ].map(({ stat, label }) => (
                    <div key={label} className="bg-white/70 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-2xl font-black text-stone-900 mb-1">{stat}</p>
                      <p className="text-stone-500 text-xs">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white/70 border border-amber-200 rounded-xl p-5">
                  <p className="text-stone-700 text-sm italic leading-relaxed mb-3">
                    &ldquo;Antes tardaba 2 horas en revisar los documentos de permanencia de cada cliente. Con PermanencIA lo hago en 10 minutos y con mucha más seguridad.&rdquo;
                  </p>
                  <p className="text-stone-500 text-xs font-semibold">— Gestora de extranjería, Madrid</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Experiencias reales</p>
            <h2 className="font-heading text-3xl font-black text-stone-900">Personas que ya lo lograron</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonios.map((t) => (
              <div key={t.nombre} className="bg-[#FFFAF4] border border-amber-100 rounded-2xl p-7 hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.estrellas }).map((_, i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">&ldquo;{t.texto}&rdquo;</p>
                <div className="flex items-center gap-3 pt-5 border-t border-slate-200">
                  <div className="bg-amber-200 text-amber-900 font-black text-sm w-9 h-9 rounded-full flex items-center justify-center shrink-0">{t.nombre[0]}</div>
                  <div>
                    <p className="text-stone-900 text-sm font-bold">{t.nombre}</p>
                    <p className="text-slate-400 text-xs">{t.pais}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#FFFAF4]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-[0.2em] mb-4">Preguntas frecuentes</p>
            <h2 className="font-heading text-3xl font-black text-stone-900">Información clave</h2>
          </div>
          <div className="space-y-2">
            {faqs.map((faq) => <FAQItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F5E6D0]" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Clock className="size-3.5" />
            Quedan {days} días para el cierre del plazo
          </div>
          <h2 className="font-heading text-4xl md:text-5xl font-black text-stone-900 mb-5 leading-tight">
            El plazo no se amplía.<br />Actúa con tiempo.
          </h2>
          <p className="text-stone-700 text-lg mb-8 leading-relaxed max-w-xl mx-auto">
            En 2 minutos sabes si calificas. En menos de una hora, tu expediente puede estar listo para presentar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="https://wa.me/34672297468?text=Hola%2C%20quiero%20hablar%20con%20un%20asesor%20sobre%20la%20regularizaci%C3%B3n%20extraordinaria%20RD%20316%2F2026"
              target="_blank" rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 bg-amber-200 hover:bg-amber-300 border border-amber-400 text-amber-950 font-bold text-base px-8 py-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <Phone className="size-5" />
              Hablar con un asesor ahora
              <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <a href="#evaluacion" className="inline-flex items-center gap-2 border border-stone-400 hover:border-stone-600 text-stone-700 hover:text-stone-900 font-semibold text-base px-8 py-4 rounded-xl transition-all duration-200">
              <ClipboardCheck className="size-4" />
              Hacer mi evaluación gratuita
            </a>
          </div>
          <p className="mt-5 text-stone-500 text-sm">Sin compromiso · Respuesta en horas · Evaluación orientativa gratis</p>
        </div>
      </section>

      {/* ── WHATSAPP FLOTANTE ────────────────────────────────────────────── */}
      <a
        href="https://wa.me/34672297468?text=Hola%2C%20quiero%20solicitar%20una%20precalificaci%C3%B3n%20gratuita%20para%20la%20regularizaci%C3%B3n%20extraordinaria%20RD%20316%2F2026"
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-3.5 px-5 rounded-full shadow-2xl shadow-green-900/30 transition-all duration-200 hover:scale-105"
        aria-label="Hablar con un asesor por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        <span className="hidden sm:inline">Hablar con un asesor</span>
      </a>

      {/* ── FOOTER MÍNIMO ────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/"><Image src="/imagotipo_ligth.svg" alt="LEGASSI" width={90} height={22} className="h-5 w-auto opacity-70 hover:opacity-100 transition-opacity" /></Link>
          <p className="text-slate-400 text-xs text-center max-w-sm">La información proporcionada no constituye asesoramiento jurídico individualizado.</p>
          <div className="flex items-center gap-5 text-slate-400 text-xs">
            <Link href="/privacidad" className="hover:text-slate-700 transition-colors">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:text-slate-700 transition-colors">Aviso legal</Link>
            <Link href="/terminos" className="hover:text-slate-700 transition-colors">Términos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
