export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ConversionTipoItem, ReporteStats } from "@/types/reportes";

// ── GET /api/reportes/conversion ──────────────────────────────
// Devuelve conversión por tipo + stats adicionales (ticket promedio, tiempo cierre)

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ano = sp.get("ano") ? Number(sp.get("ano")) : null;
  const q = sp.get("q") ? Number(sp.get("q")) : null;
  const mes = sp.get("mes") ? Number(sp.get("mes")) : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (ano || q || mes) {
    const year = ano ?? new Date().getFullYear();
    if (mes) {
      where.created_at = { gte: new Date(year, mes - 1, 1), lt: new Date(year, mes, 1) };
    } else if (q) {
      const m0 = (q - 1) * 3;
      where.created_at = { gte: new Date(year, m0, 1), lt: new Date(year, m0 + 3, 1) };
    } else {
      where.created_at = { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) };
    }
  }

  try {
    const ordenes = await prisma.ordenVenta.findMany({
      where,
      select: {
        estatus: true,
        total_mxn: true,
        created_at: true,
        fecha_venta: true,
        tipo_cotizacion: { select: { id: true, nombre: true } },
      },
    });

    // ── Conversión por tipo de cotización ──
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

    // ── KPIs adicionales ──
    const ventas = ordenes.filter((o) => o.estatus === "VENTA");
    const cotizadas = ordenes.filter((o) => o.estatus === "COTIZADO");

    const ticket_promedio_mxn =
      ventas.length > 0
        ? ventas.reduce((s, o) => s + o.total_mxn.toNumber(), 0) / ventas.length
        : 0;

    // Tiempo promedio de cierre: días entre created_at y fecha_venta
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

    const stats: ReporteStats = {
      ticket_promedio_mxn,
      tiempo_promedio_cierre_dias,
      total_ventas: ventas.length,
      total_cotizadas: cotizadas.length,
    };

    return NextResponse.json({ conversion, stats });
  } catch {
    return NextResponse.json({ error: "Error al obtener conversión" }, { status: 500 });
  }
}
