import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCondicion } from "@/lib/serializers";
import { condicionComercialUpdateSchema } from "@/lib/validations/configuracion";

// PUT /api/configuracion/condiciones/:id
// Actualiza nombre, dias_credito, descripcion y activo (soft delete)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = condicionComercialUpdateSchema.safeParse(body);

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

    const condicion = await prisma.condicionComercial.findUnique({
      where: { id: params.id },
    });

    if (!condicion) {
      return NextResponse.json(
        { error: "Condición comercial no encontrada" },
        { status: 404 }
      );
    }

    // Verificar nombre duplicado (ignorando el registro actual)
    const duplicado = await prisma.condicionComercial.findFirst({
      where: {
        nombre: { equals: validation.data.nombre, mode: "insensitive" },
        activo: true,
        NOT: { id: params.id },
      },
    });

    if (duplicado) {
      return NextResponse.json(
        { error: "Ya existe una condición comercial activa con ese nombre" },
        { status: 409 }
      );
    }

    const updated = await prisma.condicionComercial.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(serializeCondicion(updated));
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar condición comercial" },
      { status: 500 }
    );
  }
}
