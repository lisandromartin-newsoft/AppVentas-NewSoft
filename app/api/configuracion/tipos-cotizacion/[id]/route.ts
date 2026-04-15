import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTipo } from "@/lib/serializers";
import { tipoCotizacionUpdateSchema } from "@/lib/validations/configuracion";

// PUT /api/configuracion/tipos-cotizacion/:id
// Actualiza nombre, descripcion y activo (soft delete via activo=false)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validation = tipoCotizacionUpdateSchema.safeParse(body);

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

    const tipo = await prisma.tipoCotizacion.findUnique({
      where: { id: params.id },
    });

    if (!tipo) {
      return NextResponse.json(
        { error: "Tipo de cotización no encontrado" },
        { status: 404 }
      );
    }

    // Verificar nombre duplicado (ignorando el registro actual)
    const duplicado = await prisma.tipoCotizacion.findFirst({
      where: {
        nombre: { equals: validation.data.nombre, mode: "insensitive" },
        activo: true,
        NOT: { id: params.id },
      },
    });

    if (duplicado) {
      return NextResponse.json(
        { error: "Ya existe un tipo de cotización activo con ese nombre" },
        { status: 409 }
      );
    }

    const updated = await prisma.tipoCotizacion.update({
      where: { id: params.id },
      data: validation.data,
    });

    return NextResponse.json(serializeTipo(updated));
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar tipo de cotización" },
      { status: 500 }
    );
  }
}
