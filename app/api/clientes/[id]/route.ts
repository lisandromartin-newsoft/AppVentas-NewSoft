export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clienteUpdateSchema } from "@/lib/validations/clientes";

// GET /api/clientes/:id
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: {
        condicion_pago: {
          select: { id: true, nombre: true, dias_credito: true },
        },
        ordenes: {
          select: { moneda: true, total: true, total_mxn: true },
        },
      },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    const { ordenes, ...c } = cliente;
    const mxnOrdenes = ordenes.filter((o) => o.moneda === "MXN");
    const usdOrdenes = ordenes.filter((o) => o.moneda === "USD");

    return NextResponse.json({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      stats: {
        num_ordenes: ordenes.length,
        total_mxn: mxnOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        total_usd: usdOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        grand_total_mxn: ordenes.reduce((s, o) => s + o.total_mxn.toNumber(), 0),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );
  }
}

// PUT /api/clientes/:id
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = clienteUpdateSchema.safeParse(body);

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

    const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    // Verificar RFC único excluyendo este registro
    const rfcExistente = await prisma.cliente.findFirst({
      where: {
        rfc: validation.data.rfc.toUpperCase(),
        NOT: { id: params.id },
      },
    });

    if (rfcExistente) {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese RFC", campo: "rfc" },
        { status: 409 }
      );
    }

    // Verificar condición de pago válida
    const condicion = await prisma.condicionComercial.findFirst({
      where: { id: validation.data.condicion_pago_id, activo: true },
    });

    if (!condicion) {
      return NextResponse.json(
        { error: "Condición de pago no válida", campo: "condicion_pago_id" },
        { status: 400 }
      );
    }

    const updated = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...validation.data,
        rfc: validation.data.rfc.toUpperCase(),
      },
      include: {
        condicion_pago: {
          select: { id: true, nombre: true, dias_credito: true },
        },
        ordenes: {
          select: { moneda: true, total: true, total_mxn: true },
        },
      },
    });

    const { ordenes, ...c } = updated;
    const mxnOrdenes = ordenes.filter((o) => o.moneda === "MXN");
    const usdOrdenes = ordenes.filter((o) => o.moneda === "USD");

    return NextResponse.json({
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      stats: {
        num_ordenes: ordenes.length,
        total_mxn: mxnOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        total_usd: usdOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        grand_total_mxn: ordenes.reduce((s, o) => s + o.total_mxn.toNumber(), 0),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}
