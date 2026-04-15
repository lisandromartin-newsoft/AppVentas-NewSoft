import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { FiltroOrdenesSchema } from "@/lib/validations/ordenes";
import type { KpisData } from "@/types/ordenes";

function buildWhere(filtros: {
  ano?: number | null;
  q?: number | null;
  mes?: number | null;
  estatus?: string | null;
  cliente_id?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filtros.estatus) where.estatus = filtros.estatus;
  if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;

  if (filtros.ano || filtros.q || filtros.mes) {
    const year = filtros.ano ?? new Date().getFullYear();
    if (filtros.mes) {
      const start = new Date(year, filtros.mes - 1, 1);
      const end = new Date(year, filtros.mes, 1);
      where.created_at = { gte: start, lt: end };
    } else if (filtros.q) {
      const mesInicio = (filtros.q - 1) * 3;
      const start = new Date(year, mesInicio, 1);
      const end = new Date(year, mesInicio + 3, 1);
      where.created_at = { gte: start, lt: end };
    } else {
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      where.created_at = { gte: start, lt: end };
    }
  }

  return where;
}

// ── GET /api/ordenes/kpis ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = FiltroOrdenesSchema.safeParse({
    ano: searchParams.get("ano") || undefined,
    q: searchParams.get("q") || undefined,
    mes: searchParams.get("mes") || undefined,
    estatus: searchParams.get("estatus") || undefined,
    cliente_id: searchParams.get("cliente_id") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    // Ignorar filtro de estatus para KPIs generales (todos los estatus)
    const { estatus: _ignored, ...filtrosSinEstatus } = parsed.data;
    const where = buildWhere(filtrosSinEstatus);

    const ordenes = await prisma.ordenVenta.findMany({
      where,
      select: {
        estatus: true,
        moneda: true,
        total: true,
        total_mxn: true,
      },
    });

    const total_ordenes = ordenes.length;
    const borradores = ordenes.filter((o) => o.estatus === "BORRADOR").length;
    const cotizadas = ordenes.filter((o) => o.estatus === "COTIZADO").length;
    const ventas = ordenes.filter((o) => o.estatus === "VENTA").length;

    const ventas_mxn = ordenes
      .filter((o) => o.estatus === "VENTA")
      .reduce((s, o) => s + o.total_mxn.toNumber(), 0);

    const pipeline_mxn = ordenes
      .filter((o) => o.estatus === "COTIZADO")
      .reduce((s, o) => s + o.total_mxn.toNumber(), 0);

    const tasa_conversion =
      cotizadas + ventas > 0
        ? Math.round((ventas / (cotizadas + ventas)) * 100)
        : 0;

    const suma_total_mxn = ordenes
      .filter((o) => o.moneda === "MXN")
      .reduce((s, o) => s + o.total.toNumber(), 0);

    const suma_total_usd = ordenes
      .filter((o) => o.moneda === "USD")
      .reduce((s, o) => s + o.total.toNumber(), 0);

    const kpis: KpisData = {
      total_ordenes,
      borradores,
      cotizadas,
      ventas,
      ventas_mxn,
      pipeline_mxn,
      tasa_conversion,
      suma_total_mxn,
      suma_total_usd,
    };

    return NextResponse.json(kpis);
  } catch {
    return NextResponse.json({ error: "Error al calcular KPIs" }, { status: 500 });
  }
}
