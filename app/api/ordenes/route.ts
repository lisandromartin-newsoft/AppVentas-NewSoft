import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calcularOrden, generarFolio } from "@/lib/utils";
import { serializeOrden } from "@/lib/serializers";
import { OrdenCreateSchema, FiltroOrdenesSchema } from "@/lib/validations/ordenes";
import Decimal from "decimal.js";

// ── Helpers de filtro ─────────────────────────────────────────

function buildWhere(filtros: {
  ano?: number | null;
  q?: number | null;
  mes?: number | null;
  estatus?: string | null;
  cliente_id?: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filtros.estatus) where.estatus = filtros.estatus;
  if (filtros.cliente_id) where.cliente_id = filtros.cliente_id;

  if (filtros.ano || filtros.q || filtros.mes) {
    const year = filtros.ano ?? new Date().getFullYear();

    if (filtros.mes) {
      // Filtro exacto por mes
      const start = new Date(year, filtros.mes - 1, 1);
      const end = new Date(year, filtros.mes, 1);
      where.created_at = { gte: start, lt: end };
    } else if (filtros.q) {
      // Trimestre: Q1=meses 1-3, Q2=4-6, Q3=7-9, Q4=10-12
      const mesInicio = (filtros.q - 1) * 3;
      const start = new Date(year, mesInicio, 1);
      const end = new Date(year, mesInicio + 3, 1);
      where.created_at = { gte: start, lt: end };
    } else {
      // Solo año
      const start = new Date(year, 0, 1);
      const end = new Date(year + 1, 0, 1);
      where.created_at = { gte: start, lt: end };
    }
  }

  return where;
}

// ── GET /api/ordenes ──────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = FiltroOrdenesSchema.safeParse({
    ano: searchParams.get("ano") || undefined,
    q: searchParams.get("q") || undefined,
    mes: searchParams.get("mes") || undefined,
    estatus: searchParams.get("estatus") || undefined,
    cliente_id: searchParams.get("cliente_id") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    const ordenes = await prisma.ordenVenta.findMany({
      where: buildWhere(parsed.data),
      include: {
        cliente: { select: { id: true, nombre: true, rfc: true, contacto: true, email: true, ciudad: true } },
        tipo_cotizacion: { select: { id: true, nombre: true } },
        condicion_pago: { select: { id: true, nombre: true } },
      },
      orderBy: { created_at: "desc" },
    });

    const serialized = ordenes.map((o) => serializeOrden({ ...o, partidas: [] }));
    return NextResponse.json(serialized);
  } catch {
    return NextResponse.json({ error: "Error al obtener órdenes" }, { status: 500 });
  }
}

// ── POST /api/ordenes ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = OrdenCreateSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.errors.map((e) => ({
      campo: e.path.join("."),
      mensaje: e.message,
    }));
    return NextResponse.json({ error: "Datos inválidos", details }, { status: 422 });
  }

  const data = parsed.data;

  try {
    // Verificar que cliente, tipo y condición existan y estén activos
    const [cliente, tipo, condicion] = await Promise.all([
      prisma.cliente.findFirst({ where: { id: data.cliente_id, activo: true } }),
      prisma.tipoCotizacion.findFirst({ where: { id: data.tipo_cotizacion_id, activo: true } }),
      prisma.condicionComercial.findFirst({ where: { id: data.condicion_pago_id, activo: true } }),
    ]);

    if (!cliente) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
    if (!tipo) return NextResponse.json({ error: "Tipo de cotización no encontrado" }, { status: 404 });
    if (!condicion) return NextResponse.json({ error: "Condición de pago no encontrada" }, { status: 404 });

    // Calcular montos
    const calculo = calcularOrden({
      partidas: data.partidas,
      descuento_porcentaje: data.descuento_porcentaje,
      aplica_iva: data.aplica_iva,
      tasa_iva: data.tasa_iva,
      moneda: data.moneda,
      tipo_cambio: data.tipo_cambio,
    });

    // Transacción: folio + crear orden + crear partidas
    const orden = await prisma.$transaction(async (tx) => {
      // 1. Leer y bloquear empresa para consecutivo
      const empresa = await tx.empresa.findFirst();
      if (!empresa) throw new Error("Empresa no configurada");

      const folio = generarFolio(empresa.prefijo_folio, empresa.siguiente_folio);

      // 2. Incrementar consecutivo
      await tx.empresa.update({
        where: { id: empresa.id },
        data: { siguiente_folio: empresa.siguiente_folio + 1 },
      });

      // 3. Crear la orden
      const nuevaOrden = await tx.ordenVenta.create({
        data: {
          folio,
          cliente_id: data.cliente_id,
          tipo_cotizacion_id: data.tipo_cotizacion_id,
          condicion_pago_id: data.condicion_pago_id,
          descripcion: data.descripcion,
          estatus: data.estatus,
          moneda: data.moneda,
          tipo_cambio: data.tipo_cambio ? new Decimal(data.tipo_cambio) : null,
          fecha_venta: data.fecha_venta ? new Date(data.fecha_venta) : null,
          vigencia: data.vigencia ?? null,
          aplica_iva: data.aplica_iva,
          tasa_iva: data.tasa_iva ? new Decimal(data.tasa_iva) : null,
          descuento_porcentaje: data.descuento_porcentaje
            ? new Decimal(data.descuento_porcentaje)
            : null,
          descuento_descripcion: data.descuento_descripcion ?? null,
          notas: data.notas ?? null,
          subtotal: calculo.subtotal,
          monto_descuento: calculo.monto_descuento,
          subtotal_con_descuento: calculo.subtotal_con_descuento,
          monto_iva: calculo.monto_iva,
          total: calculo.total,
          total_mxn: calculo.total_mxn,
        },
        include: {
          cliente: { select: { id: true, nombre: true, rfc: true, contacto: true, email: true, ciudad: true } },
          tipo_cotizacion: { select: { id: true, nombre: true } },
          condicion_pago: { select: { id: true, nombre: true } },
        },
      });

      // 4. Crear partidas
      await tx.partida.createMany({
        data: data.partidas.map((p) => ({
          orden_id: nuevaOrden.id,
          descripcion: p.descripcion,
          cantidad: new Decimal(p.cantidad),
          precio_unitario: new Decimal(p.precio_unitario),
          total_partida: new Decimal(p.cantidad).times(new Decimal(p.precio_unitario)).toDecimalPlaces(2),
          orden_display: p.orden_display,
        })),
      });

      // Recuperar con partidas para devolver completo
      const partidas = await tx.partida.findMany({
        where: { orden_id: nuevaOrden.id },
        orderBy: { orden_display: "asc" },
      });

      return { ...nuevaOrden, partidas };
    });

    return NextResponse.json(serializeOrden(orden), { status: 201 });
  } catch (err) {
    console.error("POST /api/ordenes", err);
    return NextResponse.json({ error: "Error al crear la orden" }, { status: 500 });
  }
}
