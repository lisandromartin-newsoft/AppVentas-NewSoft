import { prisma } from "@/lib/prisma";
import NuevaOrdenClient from "@/components/ordenes/NuevaOrdenClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Nueva orden" };
export const dynamic = "force-dynamic";

export default async function NuevaOrdenPage() {
  const [clientes, tipos, condiciones, empresa] = await Promise.all([
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

  const tasaIvaDefault = empresa?.tasa_iva.toNumber() ?? 16;

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Encabezado ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <a href="/ventas" className="hover:text-navy transition-colors">
            Ventas
          </a>
          <span>/</span>
          <span className="text-gray-700">Nueva orden</span>
        </div>
        <h1 className="text-2xl font-bold text-navy">Nueva orden de venta</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          El folio se asignará automáticamente al guardar.
        </p>
      </div>

      {/* ── Formulario ── */}
      <div className="bg-white rounded-xl border border-surface-border shadow-sm p-6">
        <NuevaOrdenClient
          clientes={clientes}
          tipos={tipos}
          condiciones={condiciones}
          tasaIvaDefault={tasaIvaDefault}
        />
      </div>
    </div>
  );
}
