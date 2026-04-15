import { prisma } from "@/lib/prisma";
import { serializeEmpresa, serializeTipo, serializeCondicion } from "@/lib/serializers";
import ConfiguracionClient from "@/components/configuracion/ConfiguracionClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configuración" };

// Revalidar cada vez que se accede (datos pueden cambiar)
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  // Fetch en paralelo desde el servidor — sin waterfall
  const [empresa, tipos, condiciones] = await Promise.all([
    prisma.empresa.findFirst(),
    prisma.tipoCotizacion.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    }),
    prisma.condicionComercial.findMany({
      orderBy: [{ activo: "desc" }, { nombre: "asc" }],
    }),
  ]);

  return (
    <ConfiguracionClient
      initialEmpresa={empresa ? serializeEmpresa(empresa) : null}
      initialTipos={tipos.map(serializeTipo)}
      initialCondiciones={condiciones.map(serializeCondicion)}
    />
  );
}
