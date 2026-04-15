import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeCondicion } from "@/lib/serializers";
import { condicionComercialCreateSchema } from "@/lib/validations/configuracion";

// GET /api/configuracion/condiciones
// Devuelve todas las condiciones (activas e inactivas)
export async function GET() {
  try {
    const condiciones = await prisma.condicionComercial.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    });
    return NextResponse.json(condiciones.map(serializeCondicion));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener condiciones comerciales" },
      { status: 500 }
    );
  }
}

// POST /api/configuracion/condiciones
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = condicionComercialCreateSchema.safeParse(body);

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

    // Verificar nombre duplicado
    const existente = await prisma.condicionComercial.findFirst({
      where: {
        nombre: { equals: validation.data.nombre, mode: "insensitive" },
        activo: true,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe una condición comercial con ese nombre" },
        { status: 409 }
      );
    }

    const nueva = await prisma.condicionComercial.create({
      data: validation.data,
    });

    return NextResponse.json(serializeCondicion(nueva), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear condición comercial" },
      { status: 500 }
    );
  }
}
