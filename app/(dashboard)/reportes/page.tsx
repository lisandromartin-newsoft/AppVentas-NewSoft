import { prisma } from "@/lib/prisma";
import ReportesClient from "@/components/reportes/ReportesClient";
import type {
  FiltroReportes,
  ReportesInitialData,
  VentasMensualesData,
  MesVenta,
  PipelineData,
  TopClienteItem,
  ConversionTipoItem,
  ReporteStats,
} from "@/types/reportes";

export const metadata = { title: "Reportes" };
export const dynamic = "force-dynamic";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

function buildDateRange(ano: number, q?: number | null, mes?: number | null) {
  if (mes) return { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) };
  if (q) {
    const m0 = (q - 1) * 3;
    return { gte: new Date(ano, m0, 1), lt: new Date(ano, m0 + 3, 1) };
  }
  return { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhere(filtros: FiltroReportes): any {
  if (!filtros.ano && !filtros.q && !filtros.mes) return {};
  const year = filtros.ano ?? new Date().getFullYear();
  return { created_at: buildDateRange(year, filtros.q, filtros.mes) };
}

async function fetchVentasMensuales(filtros: FiltroReportes): Promise<VentasMensualesData> {
  const ano = filtros.ano ?? new Date().getFullYear();
  const [actual, anterior] = await Promise.all([
    prisma.ordenVenta.findMany({
      where: { estatus: "VENTA", created_at: buildDateRange(ano, filtros.q, filtros.mes) },
      select: { created_at: true, total_mxn: true },
    }),
    prisma.ordenVenta.findMany({
      where: { estatus: "VENTA", created_at: buildDateRange(ano - 1, filtros.q, filtros.mes) },
      select: { created_at: true, total_mxn: true },
    }),
  ]);

  const porMesActual = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
  const porMesAnterior = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));

  for (const o of actual) porMesActual[new Date(o.created_at).getMonth()].total += o.total_mxn.toNumber();
  for (const o of anterior) porMesAnterior[new Date(o.created_at).getMonth()].total += o.total_mxn.toNumber();

  const data: MesVenta[] = porMesActual.map((m, i) => ({
    mes: m.mes,
    nombre: MESES[i],
    actual: m.total,
    anterior: porMesAnterior[i].total,
  }));

  return {
    data,
    ano_actual: ano,
    ano_anterior: ano - 1,
    total_actual: data.reduce((s, d) => s + d.actual, 0),
    total_anterior: data.reduce((s, d) => s + d.anterior, 0),
  };
}

async function fetchPipeline(filtros: FiltroReportes): Promise<PipelineData> {
  const ordenes = await prisma.ordenVenta.findMany({
    where: buildWhere(filtros),
    select: { estatus: true, total_mxn: true },
  });

  return {
    borradores_count: ordenes.filter((o) => o.estatus === "BORRADOR").length,
    cotizaciones_count: ordenes.filter((o) => o.estatus === "COTIZADO").length,
    ventas_count: ordenes.filter((o) => o.estatus === "VENTA").length,
    cotizaciones_mxn: ordenes.filter((o) => o.estatus === "COTIZADO").reduce((s, o) => s + o.total_mxn.toNumber(), 0),
    ventas_mxn: ordenes.filter((o) => o.estatus === "VENTA").reduce((s, o) => s + o.total_mxn.toNumber(), 0),
    total_ordenes: ordenes.length,
  };
}

async function fetchTopClientes(filtros: FiltroReportes): Promise<TopClienteItem[]> {
  const ordenes = await prisma.ordenVenta.findMany({
    where: buildWhere(filtros),
    select: {
      estatus: true,
      total_mxn: true,
      cliente: { select: { id: true, nombre: true } },
    },
  });

  const map = new Map<string, TopClienteItem>();
  for (const o of ordenes) {
    const key = o.cliente.id;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        cliente_id: key,
        nombre: o.cliente.nombre,
        ordenes_totales: 1,
        ordenes_venta: o.estatus === "VENTA" ? 1 : 0,
        total_mxn: o.estatus === "VENTA" ? o.total_mxn.toNumber() : 0,
      });
    } else {
      existing.ordenes_totales += 1;
      if (o.estatus === "VENTA") {
        existing.ordenes_venta += 1;
        existing.total_mxn += o.total_mxn.toNumber();
      }
    }
  }

  return Array.from(map.values())
    .filter((c) => c.ordenes_venta > 0)
    .sort((a, b) => b.total_mxn - a.total_mxn)
    .slice(0, 10);
}

async function fetchConversionAndStats(filtros: FiltroReportes): Promise<{ conversion: ConversionTipoItem[]; stats: ReporteStats }> {
  const ordenes = await prisma.ordenVenta.findMany({
    where: buildWhere(filtros),
    select: {
      estatus: true,
      total_mxn: true,
      created_at: true,
      fecha_venta: true,
      tipo_cotizacion: { select: { id: true, nombre: true } },
    },
  });

  const tipoMap = new Map<string, { nombre: string; total: number; ventas: number; cotizadas: number }>();
  for (const o of ordenes) {
    const id = o.tipo_cotizacion.id;
    const existing = tipoMap.get(id);
    if (!existing) {
      tipoMap.set(id, {
        nombre: o.tipo_cotizacion.nombre,
        total: 1,
        ventas: o.estatus === "VENTA" ? 1 : 0,
        cotizadas: o.estatus === "COTIZADO" ? 1 : 0,
      });
    } else {
      existing.total += 1;
      if (o.estatus === "VENTA") existing.ventas += 1;
      if (o.estatus === "COTIZADO") existing.cotizadas += 1;
    }
  }

  const conversion: ConversionTipoItem[] = Array.from(tipoMap.entries())
    .map(([tipo_id, d]) => ({
      tipo_id,
      tipo: d.nombre,
      total: d.total,
      ventas: d.ventas,
      cotizadas: d.cotizadas,
      tasa: d.total > 0 ? Math.round((d.ventas / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.tasa - a.tasa);

  const ventas = ordenes.filter((o) => o.estatus === "VENTA");
  const cotizadas = ordenes.filter((o) => o.estatus === "COTIZADO");

  const ticket_promedio_mxn =
    ventas.length > 0
      ? ventas.reduce((s, o) => s + o.total_mxn.toNumber(), 0) / ventas.length
      : 0;

  const ventasConFecha = ventas.filter((o) => o.fecha_venta != null);
  let tiempo_promedio_cierre_dias: number | null = null;
  if (ventasConFecha.length > 0) {
    const totalDias = ventasConFecha.reduce((s, o) => {
      const dias =
        (new Date(o.fecha_venta!).getTime() - new Date(o.created_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return s + Math.max(0, Math.round(dias));
    }, 0);
    tiempo_promedio_cierre_dias = Math.round(totalDias / ventasConFecha.length);
  }

  return {
    conversion,
    stats: {
      ticket_promedio_mxn,
      tiempo_promedio_cierre_dias,
      total_ventas: ventas.length,
      total_cotizadas: cotizadas.length,
    },
  };
}

interface PageProps {
  searchParams: Promise<{ ano?: string; q?: string; mes?: string }>;
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filtros: FiltroReportes = {
    ano: sp.ano ? Number(sp.ano) : null,
    q: sp.q ? Number(sp.q) : null,
    mes: sp.mes ? Number(sp.mes) : null,
  };

  const [ventasMensuales, pipeline, topClientes, { conversion, stats }] = await Promise.all([
    fetchVentasMensuales(filtros),
    fetchPipeline(filtros),
    fetchTopClientes(filtros),
    fetchConversionAndStats(filtros),
  ]);

  const initialData: ReportesInitialData = {
    ventasMensuales,
    pipeline,
    topClientes,
    conversion,
    stats,
  };

  return (
    <div className="p-6">
      <ReportesClient initialData={initialData} initialFiltros={filtros} />
    </div>
  );
}
