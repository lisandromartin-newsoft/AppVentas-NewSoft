export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteCreateSchema } from "@/lib/validations/clientes";

// ── Helper: agrega stats de órdenes por cliente ──────────────
function buildStats(
  ordenes: Array<{ moneda: string; total: { toNumber(): number }; total_mxn: { toNumber(): number } }>
) {
  const mxnOrdenes = ordenes.filter((o) => o.moneda === "MXN");
  const usdOrdenes = ordenes.filter((o) => o.moneda === "USD");
  return {
    num_ordenes: ordenes.length,
    total_mxn: mxnOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
    total_usd: usdOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
    grand_total_mxn: ordenes.reduce((s, o) => s + o.total_mxn.toNumber(), 0),
  };
}

// GET /api/clientes
// Devuelve clientes activos con conteo y montos por moneda
export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: { activo: true },
      include: {
        condicion_pago: {
          select: { id: true, nombre: true, dias_credito: true },
        },
        ordenes: {
          select: { moneda: true, total: true, total_mxn: true },
        },
      },
      orderBy: { nombre: "asc" },
    });

    const result = clientes.map(({ ordenes, ...c }) => ({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      stats: buildStats(ordenes),
    }));

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clientes
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = clienteCreateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: validation.error.issues.map((i) => ({
            campo: i.path.join("."),
            mensaje: i.message,
          })),
        },
        { status: 400 }
      );
    }

    // Verificar RFC único (en todos los clientes, activos e inactivos)
    const rfcExistente = await prisma.cliente.findUnique({
      where: { rfc: validation.data.rfc.toUpperCase() },
    });

    if (rfcExistente) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese RFC", campo: "rfc" },
        { status: 409 }
      );
    }

    // Verificar que la condición de pago exista y esté activa
    const condicion = await prisma.condicionComercial.findFirst({
      where: { id: validation.data.condicion_pago_id, activo: true },
    });

    if (!condicion) {
      return NextResponse.json(
        { error: "Condición de pago no válida", campo: "condicion_pago_id" },
        { status: 400 }
      );
    }

    const nuevo = await prisma.cliente.create({
      data: {
        ...validation.data,
        rfc: validation.data.rfc.toUpperCase(),
      },
      include: {
        condicion_pago: {
          select: { id: true, nombre: true, dias_credito: true },
        },
      },
    });

    return NextResponse.json(
      {
        ...nuevo,
        created_at: nuevo.created_at.toISOString(),
        updated_at: nuevo.updated_at.toISOString(),
        stats: { num_ordenes: 0, total_mxn: 0, total_usd: 0, grand_total_mxn: 0 },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}
