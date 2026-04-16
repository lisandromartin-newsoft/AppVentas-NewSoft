import { prisma } from "@/lib/prisma";
import VentasClient from "@/components/ordenes/VentasClient";
import { serializeOrden } from "@/lib/serializers";
import type { Metadata } from "next";
import type { KpisData, OrdenResumen, FiltroOrdenes, EstatusOrden } from "@/types/ordenes";

export const metadata: Metadata = { title: "Ventas" };
export const dynamic = "force-dynamic";

// Construye el objeto `where` de Prisma a partir de los filtros
function buildWhere(filtros: FiltroOrdenes) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (filtros.estatus) where.estatus = filtros.estatus;

  if (filtros.ano || filtros.q || filtros.mes) {
    const year = filtros.ano ?? new Date().getFullYear();
    if (filtros.mes) {
      where.created_at = {
        gte: new Date(year, filtros.mes - 1, 1),
        lt: new Date(year, filtros.mes, 1),
      };
    } else if (filtros.q) {
      const mesInicio = (filtros.q - 1) * 3;
      where.created_at = {
        gte: new Date(year, mesInicio, 1),
        lt: new Date(year, mesInicio + 3, 1),
      };
    } else {
      where.created_at = {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      };
    }
  }

  return where;
}

/** Calcula los KPIs sobre un array de órdenes ya serializadas */
function calcularKpis(ordenes: OrdenResumen[]): KpisData {
  const total_ordenes = ordenes.length;
  const borradores = ordenes.filter((o) => o.estatus === "BORRADOR").length;
  const cotizadas = ordenes.filter((o) => o.estatus === "COTIZADO").length;
  const ventas = ordenes.filter((o) => o.estatus === "VENTA").length;

  const ventas_mxn = ordenes
    .filter((o) => o.estatus === "VENTA")
    .reduce((s, o) => s + o.total_mxn, 0);

  const pipeline_mxn = ordenes
    .filter((o) => o.estatus === "COTIZADO")
    .reduce((s, o) => s + o.total_mxn, 0);

  // Fórmula correcta según doc: ventas / total_ordenes * 100
  const tasa_conversion =
    total_ordenes > 0 ? Math.round((ventas / total_ordenes) * 100) : 0;

  const suma_total_mxn = ordenes
    .filter((o) => o.moneda === "MXN")
    .reduce((s, o) => s + o.total, 0);

  const suma_total_usd = ordenes
    .filter((o) => o.moneda === "USD")
    .reduce((s, o) => s + o.total, 0);

  return {
    total_ordenes,
    borradores,
    cotizadas,
    ventas,
    ventas_mxn,
    pipeline_mxn,
    tasa_conversion,
    suma_total_mxn,
    suma_total_usd,
  };
}

interface SearchParams {
  ano?: string;
  q?: string;
  mes?: string;
  estatus?: string;
}

export default async function VentasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Leer filtros iniciales de la URL
  const ESTATUS_VALIDOS = ["BORRADOR", "COTIZADO", "VENTA"];
  const initialFiltros: FiltroOrdenes = {
    ano: searchParams.ano ? Number(searchParams.ano) : null,
    q: searchParams.q ? Number(searchParams.q) : null,
    mes: searchParams.mes ? Number(searchParams.mes) : null,
    estatus: ESTATUS_VALIDOS.includes(searchParams.estatus ?? "")
      ? (searchParams.estatus as EstatusOrden)
      : null,
  };

  // Cargar TODAS las órdenes (filtrado fine-grained se hace client-side)
  // Pero si hay filtros de fecha/estatus en URL los aplicamos en el servidor
  // para reducir carga inicial — el cliente re-filtra sin API call adicional
  const where = buildWhere(initialFiltros);

  const ordenes = await prisma.ordenVenta.findMany({
    where,
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
    },
    orderBy: { created_at: "desc" },
  });

  const serialized = ordenes.map((o) =>
    serializeOrden({ ...o, partidas: [] })
  ) as OrdenResumen[];

  const kpis = calcularKpis(serialized);

  return (
    <VentasClient
      initialOrdenes={serialized}
      initialKpis={kpis}
      initialFiltros={initialFiltros}
    />
  );
}
