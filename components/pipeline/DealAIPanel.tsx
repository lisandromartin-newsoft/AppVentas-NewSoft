"use client";

import { useState } from "react";
import { Sparkles, Zap, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";

interface Accion { texto: string; urgencia: "alta" | "media" | "baja" }
interface Objecion { tipo: string; cita: string; respuesta_sugerida: string }
interface Senal { tipo: "rojo" | "amarillo" | "verde"; texto: string }
interface AIResult {
  acciones: Accion[];
  objeciones: Objecion[];
  riesgo: { nivel: "bajo" | "medio" | "alto"; porcentaje: number; senales: Senal[] };
  modelo?: string;
}

const URG = {
  alta: { label: "Urgente", cls: "bg-red-50 text-red-700" },
  media: { label: "Esta semana", cls: "bg-amber-50 text-amber-700" },
  baja: { label: "Próximo mes", cls: "bg-emerald-50 text-emerald-700" },
};
const RIESGO = {
  bajo: { label: "Bajo", cls: "text-emerald-600", bar: "bg-emerald-500" },
  medio: { label: "Medio", cls: "text-amber-600", bar: "bg-amber-500" },
  alto: { label: "Alto", cls: "text-red-600", bar: "bg-red-500" },
};
const SENAL_DOT = { rojo: "bg-red-500", amarillo: "bg-amber-500", verde: "bg-emerald-500" };

export default function DealAIPanel({ dealId, canWrite }: { dealId: string; canWrite: boolean }) {
  const [transcript, setTranscript] = useState("");
  const [result, setResult] = useState<AIResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analizar() {
    if (!transcript.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/deals/${dealId}/analizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: transcript.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al analizar");
      setResult(data as AIResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al analizar");
    } finally {
      setLoading(false);
    }
  }

  const acciones = (result?.acciones ?? []).slice(0, 3);

  return (
    <aside className="flex flex-col overflow-y-auto border-l border-surface-border bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-surface-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy text-white">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="text-[13px] font-bold text-navy">Asistente de Ventas</div>
            <div className="text-[10px] text-gray-400">Análisis de conversaciones</div>
          </div>
        </div>
        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          Claude
        </span>
      </div>

      {/* Input transcript */}
      <div className="border-b border-surface-border px-4 py-3">
        <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Subir transcript</div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Pega aquí el transcript de la conversación con el cliente…"
          className="h-24 w-full resize-none rounded-lg border border-surface-border bg-surface px-3 py-2 text-[11px] leading-relaxed text-navy outline-none focus:border-orange focus:bg-white"
        />
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-gray-400">{transcript.length.toLocaleString("es-MX")} caracteres</span>
          <button
            onClick={analizar}
            disabled={!transcript.trim() || loading || !canWrite}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            {loading ? "Analizando…" : "Analizar"}
          </button>
        </div>
      </div>

      {/* Resultados */}
      <div className="flex-1 px-4 py-3">
        {error && (
          <div className="flex flex-col items-center gap-2 py-7 text-center">
            <AlertTriangle size={32} className="text-red-400" />
            <div className="text-[13px] font-semibold text-red-600">{error}</div>
            <div className="text-[11px] text-gray-400">
              Si la IA no está configurada, define <code>ANTHROPIC_API_KEY</code> en el entorno.
            </div>
          </div>
        )}

        {!error && !result && (
          <div className="flex flex-col items-center gap-2 py-7 text-center">
            <Sparkles size={32} className="text-gray-200" />
            <div className="text-[13px] font-semibold text-gray-400">Sin análisis aún</div>
            <div className="text-[11px] text-gray-400">Pega un transcript y presiona Analizar para obtener sugerencias.</div>
          </div>
        )}

        {!error && result && (
          <div className="space-y-3">
            {/* Siguiente acción */}
            <Card icon={Zap} iconColor="#F47920" iconBg="#FFF3EA" title="Siguiente acción recomendada">
              <div className="space-y-2">
                {acciones.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-orange text-[9px] font-bold text-white">{i + 1}</span>
                    <span className="text-xs leading-relaxed text-navy">
                      {a.texto}
                      <span className={`ml-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold ${URG[a.urgencia]?.cls ?? URG.media.cls}`}>
                        {URG[a.urgencia]?.label ?? "Esta semana"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Objeciones */}
            <Card icon={AlertTriangle} iconColor="#E8330A" iconBg="#FFF0ED" title="Objeciones detectadas">
              {result.objeciones.length === 0 ? (
                <p className="text-xs text-gray-400">No se detectaron objeciones claras.</p>
              ) : (
                <div className="space-y-2.5">
                  {result.objeciones.map((o, i) => (
                    <div key={i}>
                      <span className="mb-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-600">{o.tipo}</span>
                      <div className="border-l-2 border-surface-border pl-2 text-[11px] italic text-gray-500">&ldquo;{o.cita}&rdquo;</div>
                      <div className="mt-1 text-[11px] text-navy">→ {o.respuesta_sugerida}</div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Riesgo */}
            <Card icon={ShieldAlert} iconColor="#F5A623" iconBg="#FFF8EB" title="Señales de riesgo">
              <div className="mb-2.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div className={`h-full rounded-full ${RIESGO[result.riesgo.nivel]?.bar ?? "bg-amber-500"}`} style={{ width: `${result.riesgo.porcentaje}%` }} />
                </div>
                <span className={`text-[11px] font-bold ${RIESGO[result.riesgo.nivel]?.cls ?? "text-amber-600"}`}>
                  Riesgo {RIESGO[result.riesgo.nivel]?.label ?? "Medio"}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.riesgo.senales.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed text-navy">
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${SENAL_DOT[s.tipo] ?? "bg-amber-500"}`} />
                    {s.texto}
                  </div>
                ))}
              </div>
            </Card>

            {result.modelo && (
              <p className="text-center text-[10px] text-gray-300">Generado con {result.modelo}</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

function Card({ icon: Icon, iconColor, iconBg, title, children }: {
  icon: typeof Zap; iconColor: string; iconBg: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-surface-border">
      <div className="flex items-center gap-2 border-b border-surface-border px-3 py-2">
        <span className="flex h-5 w-5 items-center justify-center rounded" style={{ background: iconBg, color: iconColor }}>
          <Icon size={12} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-600">{title}</span>
      </div>
      <div className="bg-white px-3 py-2.5">{children}</div>
    </div>
  );
}
