import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeOrden } from "@/lib/serializers";
import { z } from "zod";

// Schema de validación — fecha YYYY-MM-DD o null para limpiarla
const FechaVentaSchema = z.object({
  fecha_venta: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido. Use YYYY-MM-DD")
    .nullable(),
});

// ── PATCH /api/ordenes/:id/fecha-venta ────────────────────────
// Actualiza SOLO la fecha de venta de una orden.
// Requisito explícito del doc funcional: editable en CUALQUIER estatus
// (incluyendo órdenes ya cerradas como VENTA).

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = FechaVentaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 422 }
    );
  }

  const { fecha_venta } = parsed.data;

  try {
    const orden = await prisma.ordenVenta.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    const actualizada = await prisma.ordenVenta.update({
      where: { id: params.id },
      data: {
        fecha_venta: fecha_venta ? new Date(fecha_venta) : null,
      },
      include: {
        cliente: {
          select: {
            id: true,
            nombre: true,
            rfc: true,
            contacto: true,
            email: true,
            ciudad: true,
          },
        },
        tipo_cotizacion: { select: { id: true, nombre: true } },
        condicion_pago: { select: { id: true, nombre: true } },
        partidas: { orderBy: { orden_display: "asc" } },
      },
    });

    return NextResponse.json(serializeOrden(actualizada));
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar la fecha de venta" },
      { status: 500 }
    );
  }
}
