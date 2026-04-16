export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PipelineData } from "@/types/reportes";

// ── GET /api/reportes/pipeline ────────────────────────────────

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
      select: { estatus: true, total_mxn: true },
    });

    const borradores_count = ordenes.filter((o) => o.estatus === "BORRADOR").length;
    const cotizaciones_count = ordenes.filter((o) => o.estatus === "COTIZADO").length;
    const ventas_count = ordenes.filter((o) => o.estatus === "VENTA").length;

    const cotizaciones_mxn = ordenes
      .filter((o) => o.estatus === "COTIZADO")
      .reduce((s, o) => s + o.total_mxn.toNumber(), 0);

    const ventas_mxn = ordenes
      .filter((o) => o.estatus === "VENTA")
      .reduce((s, o) => s + o.total_mxn.toNumber(), 0);

    const result: PipelineData = {
      borradores_count,
      cotizaciones_count,
      ventas_count,
      cotizaciones_mxn,
      ventas_mxn,
      total_ordenes: ordenes.length,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al obtener pipeline" }, { status: 500 });
  }
}
