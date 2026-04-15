import { prisma } from "@/lib/prisma";
import { serializeOrden } from "@/lib/serializers";
import OrdenDetalleClient from "@/components/ordenes/OrdenDetalleClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { OrdenDetalle } from "@/types/ordenes";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const orden = await prisma.ordenVenta.findUnique({
    where: { id: params.id },
    select: { folio: true, descripcion: true },
  });
  if (!orden) return { title: "Orden no encontrada" };
  return { title: `${orden.folio} — ${orden.descripcion}` };
}

export default async function OrdenDetallePage({
  params,
}: {
  params: { id: string };
}) {
  const [orden, clientes, tipos, condiciones, empresa] = await Promise.all([
    prisma.ordenVenta.findUnique({
      where: { id: params.id },
      include: {
        cliente: { select: { id: true, nombre: true, rfc: true, contacto: true, email: true, ciudad: true } },
        tipo_cotizacion: { select: { id: true, nombre: true } },
        condicion_pago: { select: { id: true, nombre: true } },
        partidas: { orderBy: { orden_display: "asc" } },
      },
    }),
    prisma.cliente.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, rfc: true, condicion_pago_id: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.tipoCotizacion.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.condicionComercial.findMany({
      where: { activo: true },
      select: { id: true, nombre: true },
      orderBy: { nombre: "asc" },
    }),
    prisma.empresa.findFirst({ select: { tasa_iva: true } }),
  ]);

  if (!orden) notFound();

  const tasaIvaDefault = empresa?.tasa_iva.toNumber() ?? 16;
  const serialized = serializeOrden(orden) as OrdenDetalle;

  return (
    <OrdenDetalleClient
      orden={serialized}
      clientes={clientes}
      tipos={tipos}
      condiciones={condiciones}
      tasaIvaDefault={tasaIvaDefault}
    />
  );
}
