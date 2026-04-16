export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { TopClienteItem } from "@/types/reportes";

// ── GET /api/reportes/top-clientes ────────────────────────────

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ano = sp.get("ano") ? Number(sp.get("ano")) : null;
  const q = sp.get("q") ? Number(sp.get("q")) : null;
  const mes = sp.get("mes") ? Number(sp.get("mes")) : null;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 10;

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
        cliente: { select: { id: true, nombre: true } },
      },
    });

    // Agrupar por cliente
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

    // Ordenar por total_mxn DESC y tomar los top N
    const resultado: TopClienteItem[] = Array.from(map.values())
      .filter((c) => c.ordenes_venta > 0)
      .sort((a, b) => b.total_mxn - a.total_mxn)
      .slice(0, limit);

    return NextResponse.json(resultado);
  } catch {
    return NextResponse.json({ error: "Error al obtener top clientes" }, { status: 500 });
  }
}
