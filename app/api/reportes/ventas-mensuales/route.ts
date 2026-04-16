export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { VentasMensualesData, MesVenta } from "@/types/reportes";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Construye el rango de fechas para un filtro dado
function buildDateRange(ano: number, q?: number | null, mes?: number | null) {
  if (mes) {
    return { gte: new Date(ano, mes - 1, 1), lt: new Date(ano, mes, 1) };
  }
  if (q) {
    const m0 = (q - 1) * 3;
    return { gte: new Date(ano, m0, 1), lt: new Date(ano, m0 + 3, 1) };
  }
  return { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) };
}

async function getVentasPorMes(ano: number, q?: number | null, mes?: number | null) {
  const ordenes = await prisma.ordenVenta.findMany({
    where: {
      estatus: "VENTA",
      created_at: buildDateRange(ano, q, mes),
    },
    select: { created_at: true, total_mxn: true },
  });

  // Inicializar los 12 meses en 0
  const porMes = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0 }));
  for (const o of ordenes) {
    const m = new Date(o.created_at).getMonth(); // 0-indexed
    porMes[m].total += o.total_mxn.toNumber();
  }
  return porMes;
}

// ── GET /api/reportes/ventas-mensuales ────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ano = sp.get("ano") ? Number(sp.get("ano")) : new Date().getFullYear();
  const q = sp.get("q") ? Number(sp.get("q")) : null;
  const mes = sp.get("mes") ? Number(sp.get("mes")) : null;

  try {
    const [porMesActual, porMesAnterior] = await Promise.all([
      getVentasPorMes(ano, q, mes),
      getVentasPorMes(ano - 1, q, mes),
    ]);

    const data: MesVenta[] = porMesActual.map((m, i) => ({
      mes: m.mes,
      nombre: MESES[i],
      actual: m.total,
      anterior: porMesAnterior[i].total,
    }));

    const result: VentasMensualesData = {
      data,
      ano_actual: ano,
      ano_anterior: ano - 1,
      total_actual: data.reduce((s, d) => s + d.actual, 0),
      total_anterior: data.reduce((s, d) => s + d.anterior, 0),
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Error al obtener ventas mensuales" }, { status: 500 });
  }
}
