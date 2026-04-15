import { prisma } from "@/lib/prisma";
import ClientesClient from "@/components/clientes/ClientesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };
export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  // Fetch en paralelo: clientes con stats + condiciones activas para el formulario
  const [clientes, condiciones] = await Promise.all([
    prisma.cliente.findMany({
      where: { activo: true },
      include: {
        condicion_pago: {
          select: { id: true, nombre: true, dias_credito: true },
        },
        ordenes: {
          select: { moneda: true, total: true, total_mxn: true },
        },
      },
      orderBy: { nombre: "asc" },
    }),
    prisma.condicionComercial.findMany({
      where: { activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, dias_credito: true },
    }),
  ]);

  // Serializar y agregar stats en el servidor
  const clientesSerializados = clientes.map(({ ordenes, ...c }) => {
    const mxnOrdenes = ordenes.filter((o) => o.moneda === "MXN");
    const usdOrdenes = ordenes.filter((o) => o.moneda === "USD");
    return {
      ...c,
      created_at: c.created_at.toISOString(),
      updated_at: c.updated_at.toISOString(),
      stats: {
        num_ordenes: ordenes.length,
        total_mxn: mxnOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        total_usd: usdOrdenes.reduce((s, o) => s + o.total.toNumber(), 0),
        grand_total_mxn: ordenes.reduce((s, o) => s + o.total_mxn.toNumber(), 0),
      },
    };
  });

  return (
    <ClientesClient
      initialClientes={clientesSerializados}
      condiciones={condiciones}
    />
  );
}
