import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canWrite, requireAuth } from "@/lib/session";

export const dynamic = "force-dynamic";

const TIPOS = ["NOTA", "LLAMADA", "EMAIL", "WHATSAPP"] as const;

// ── POST /api/crm/deals/:id/actividades ─────────────────────────
// Registra una entrada en la bitácora del deal (nota/llamada/email/whatsapp),
// opcionalmente como tarea con fecha.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (!canWrite(session)) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { tipo, contenido, es_tarea, fecha_tarea } = (body ?? {}) as {
    tipo?: string;
    contenido?: string;
    es_tarea?: boolean;
    fecha_tarea?: string;
  };

  if (!tipo || !TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    return NextResponse.json({ error: "Tipo inválido", campo: "tipo" }, { status: 422 });
  }
  if (!contenido || !contenido.trim()) {
    return NextResponse.json({ error: "El contenido es obligatorio", campo: "contenido" }, { status: 422 });
  }

  try {
    const deal = await prisma.deal.findUnique({ where: { id }, select: { id: true } });
    if (!deal) return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 });

    const actividad = await prisma.dealActividad.create({
      data: {
        deal_id: id,
        tipo: tipo as (typeof TIPOS)[number],
        contenido: contenido.trim(),
        autor: session.email,
        es_tarea: Boolean(es_tarea),
        fecha_tarea: es_tarea && fecha_tarea ? new Date(fecha_tarea) : null,
      },
    });

    return NextResponse.json(
      {
        id: actividad.id,
        tipo: actividad.tipo,
        contenido: actividad.contenido,
        autor: actividad.autor,
        es_tarea: actividad.es_tarea,
        completada: actividad.completada,
        fecha_tarea: actividad.fecha_tarea ? actividad.fecha_tarea.toISOString().slice(0, 10) : null,
        created_at: actividad.created_at.toISOString(),
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Error al registrar la actividad" }, { status: 500 });
  }
}
