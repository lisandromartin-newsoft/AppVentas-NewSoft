"use client";

import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Clock, TrendingUp, ShoppingBag, Tag, type LucideIcon } from "lucide-react";
import FiltrosReportes from "./FiltrosReportes";
import GraficoVentasMensuales from "./GraficoVentasMensuales";
import GraficoPipelineDonut from "./GraficoPipelineDonut";
import TablaTopClientes from "./TablaTopClientes";
import TablaConversionTipo from "./TablaConversionTipo";
import type {
  FiltroReportes,
  ReportesInitialData,
  VentasMensualesData,
  PipelineData,
  TopClienteItem,
  ConversionTipoItem,
  ReporteStats,
} from "@/types/reportes";

interface Props {
  initialData: ReportesInitialData;
  initialFiltros: FiltroReportes;
}

function formatMXN(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v);
}

function KpiStatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-navy">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function buildQS(f: FiltroReportes) {
  const p = new URLSearchParams();
  if (f.ano) p.set("ano", String(f.ano));
  if (f.q) p.set("q", String(f.q));
  if (f.mes) p.set("mes", String(f.mes));
  return p.toString();
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export default function ReportesClient({ initialData, initialFiltros }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [filtros, setFiltros] = useState<FiltroReportes>(initialFiltros);
  const [ventasMensuales, setVentasMensuales] = useState<VentasMensualesData>(initialData.ventasMensuales);
  const [pipeline, setPipeline] = useState<PipelineData>(initialData.pipeline);
  const [topClientes, setTopClientes] = useState<TopClienteItem[]>(initialData.topClientes);
  const [conversion, setConversion] = useState<ConversionTipoItem[]>(initialData.conversion);
  const [stats, setStats] = useState<ReporteStats>(initialData.stats);
  const [loading, setLoading] = useState(false);

  // ── URL sync ──────────────────────────────────────────────────
  useEffect(() => {
    const qs = buildQS(filtros);
    const url = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.replace(url));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  // ── Re-fetch on filter change ─────────────────────────────────
  const refetch = useCallback(async (f: FiltroReportes) => {
    const qs = buildQS(f);
    const base = (path: string) => `${path}${qs ? `?${qs}` : ""}`;

    setLoading(true);
    try {
      const [vm, pl, tc, cv] = await Promise.all([
        fetchJSON<VentasMensualesData>(base("/api/reportes/ventas-mensuales")),
        fetchJSON<PipelineData>(base("/api/reportes/pipeline")),
        fetchJSON<TopClienteItem[]>(base("/api/reportes/top-clientes")),
        fetchJSON<{ conversion: ConversionTipoItem[]; stats: ReporteStats }>(base("/api/reportes/conversion")),
      ]);
      setVentasMensuales(vm);
      setPipeline(pl);
      setTopClientes(tc);
      setConversion(cv.conversion);
      setStats(cv.stats);
    } catch {
      // silently keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger fetch when filtros change (skip on initial render — initial data already loaded)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    refetch(filtros);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros]);

  return (
    <div className={`space-y-6 transition-opacity duration-150 ${loading || isPending ? "opacity-60 pointer-events-none" : ""}`}>

      {/* ── Header + Filtros ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Análisis de ventas y rendimiento comercial</p>
        </div>
        <FiltrosReportes filtros={filtros} onChange={setFiltros} />
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiStatCard
          icon={ShoppingBag}
          label="Ticket promedio"
          value={formatMXN(stats.ticket_promedio_mxn)}
          sub={`${stats.total_ventas} venta${stats.total_ventas !== 1 ? "s" : ""} cerrada${stats.total_ventas !== 1 ? "s" : ""}`}
          color="bg-navy/10 text-navy"
        />
        <KpiStatCard
          icon={Clock}
          label="Tiempo promedio de cierre"
          value={stats.tiempo_promedio_cierre_dias !== null ? `${stats.tiempo_promedio_cierre_dias} días` : "—"}
          sub="desde cotización hasta venta"
          color="bg-orange-100 text-[#E8751A]"
        />
        <KpiStatCard
          icon={TrendingUp}
          label="Ventas cerradas"
          value={String(stats.total_ventas)}
          sub={`${stats.total_cotizadas} en cotización`}
          color="bg-green-100 text-green-700"
        />
        <KpiStatCard
          icon={Tag}
          label="Tasa de conversión"
          value={
            stats.total_ventas + stats.total_cotizadas > 0
              ? `${Math.round((stats.total_ventas / (stats.total_ventas + stats.total_cotizadas + pipeline.borradores_count)) * 100)}%`
              : "—"
          }
          sub="ventas / total órdenes"
          color="bg-purple-100 text-purple-700"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <GraficoVentasMensuales
            data={ventasMensuales.data}
            anoActual={ventasMensuales.ano_actual}
            anoAnterior={ventasMensuales.ano_anterior}
          />
        </div>
        <GraficoPipelineDonut data={pipeline} />
      </div>

      {/* ── Tables row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TablaTopClientes data={topClientes} />
        <TablaConversionTipo data={conversion} />
      </div>
    </div>
  );
}

