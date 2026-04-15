import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeEmpresa } from "@/lib/serializers";
import { empresaUpdateSchema } from "@/lib/validations/configuracion";

export async function GET() {
  try {
    const empresa = await prisma.empresa.findFirst();
    if (!empresa) {
      return NextResponse.json(
        { error: "No hay empresa configurada" },
        { status: 404 }
      );
    }
    return NextResponse.json(serializeEmpresa(empresa));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener configuración de empresa" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = empresaUpdateSchema.safeParse(body);

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

    const empresa = await prisma.empresa.findFirst();
    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    const updated = await prisma.empresa.update({
      where: { id: empresa.id },
      data: validation.data,
    });

    return NextResponse.json(serializeEmpresa(updated));
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar empresa" },
      { status: 500 }
    );
  }
}
