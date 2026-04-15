import { prisma } from "@/lib/prisma";
import VentasClient from "@/components/ordenes/VentasClient";
import { serializeOrden } from "@/lib/serializers";
import type { Metadata } from "next";
import type { KpisData, OrdenResumen } from "@/types/ordenes";

export const metadata: Metadata = { title: "Ventas" };
export const dynamic = "force-dynamic";

export default async function VentasPage() {
  const ordenes = await prisma.ordenVenta.findMany({
    include: {
      cliente: { select: { id: true, nombre: true, rfc: true, contacto: true, email: true, ciudad: true } },
      tipo_cotizacion: { select: { id: true, nombre: true } },
      condicion_pago: { select: { id: true, nombre: true } },
    },
    orderBy: { created_at: "desc" },
  });

  const serialized = ordenes.map((o) =>
    serializeOrden({ ...o, partidas: [] })
  ) as OrdenResumen[];

  // Calcular KPIs iniciales en el servidor
  const borradores = serialized.filter((o) => o.estatus === "BORRADOR").length;
  const cotizadas = serialized.filter((o) => o.estatus === "COTIZADO").length;
  const ventas = serialized.filter((o) => o.estatus === "VENTA").length;

  const ventas_mxn = serialized
    .filter((o) => o.estatus === "VENTA")
    .reduce((s, o) => s + o.total_mxn, 0);

  const pipeline_mxn = serialized
    .filter((o) => o.estatus === "COTIZADO")
    .reduce((s, o) => s + o.total_mxn, 0);

  const tasa_conversion =
    cotizadas + ventas > 0
      ? Math.round((ventas / (cotizadas + ventas)) * 100)
      : 0;

  const suma_total_mxn = serialized
    .filter((o) => o.moneda === "MXN")
    .reduce((s, o) => s + o.total, 0);

  const suma_total_usd = serialized
    .filter((o) => o.moneda === "USD")
    .reduce((s, o) => s + o.total, 0);

  const kpis: KpisData = {
    total_ordenes: serialized.length,
    borradores,
    cotizadas,
    ventas,
    ventas_mxn,
    pipeline_mxn,
    tasa_conversion,
    suma_total_mxn,
    suma_total_usd,
  };

  return <VentasClient initialOrdenes={serialized} initialKpis={kpis} />;
}
