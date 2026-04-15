import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serializeTipo } from "@/lib/serializers";
import { tipoCotizacionCreateSchema } from "@/lib/validations/configuracion";

// GET /api/configuracion/tipos-cotizacion
// Devuelve todos los tipos (activos e inactivos) para la pantalla de config
export async function GET() {
  try {
    const tipos = await prisma.tipoCotizacion.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    });
    return NextResponse.json(tipos.map(serializeTipo));
  } catch {
    return NextResponse.json(
      { error: "Error al obtener tipos de cotización" },
      { status: 500 }
    );
  }
}

// POST /api/configuracion/tipos-cotizacion
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = tipoCotizacionCreateSchema.safeParse(body);

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

    // Verificar que no exista un tipo con el mismo nombre (activo)
    const existente = await prisma.tipoCotizacion.findFirst({
      where: {
        nombre: { equals: validation.data.nombre, mode: "insensitive" },
        activo: true,
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: "Ya existe un tipo de cotización con ese nombre" },
        { status: 409 }
      );
    }

    const nuevo = await prisma.tipoCotizacion.create({
      data: validation.data,
    });

    return NextResponse.json(serializeTipo(nuevo), { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Error al crear tipo de cotización" },
      { status: 500 }
    );
  }
}
