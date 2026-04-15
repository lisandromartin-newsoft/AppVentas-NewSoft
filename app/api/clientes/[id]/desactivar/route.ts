import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/clientes/:id/desactivar
// Soft delete: marca activo = false.
// Los clientes con órdenes asociadas quedan con historial visible.
export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      include: { _count: { select: { ordenes: true } } },
    });

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    }

    if (!cliente.activo) {
      return NextResponse.json(
        { error: "El cliente ya está inactivo" },
        { status: 400 }
      );
    }

    const updated = await prisma.cliente.update({
      where: { id: params.id },
      data: { activo: false },
    });

    return NextResponse.json({
      mensaje: `Cliente "${updated.nombre}" desactivado`,
      num_ordenes: cliente._count.ordenes,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al desactivar cliente" },
      { status: 500 }
    );
  }
}
