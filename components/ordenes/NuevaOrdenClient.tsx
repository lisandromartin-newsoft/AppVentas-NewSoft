"use client";

import { useRouter } from "next/navigation";
import OrdenForm from "./OrdenForm";
import type { OrdenDetalle } from "@/types/ordenes";

interface ClienteOpcion {
  id: string;
  nombre: string;
  rfc: string;
  condicion_pago_id: string;
}

interface CatalogItem {
  id: string;
  nombre: string;
}

interface NuevaOrdenClientProps {
  clientes: ClienteOpcion[];
  tipos: CatalogItem[];
  condiciones: CatalogItem[];
  tasaIvaDefault: number;
}

export default function NuevaOrdenClient({
  clientes,
  tipos,
  condiciones,
  tasaIvaDefault,
}: NuevaOrdenClientProps) {
  const router = useRouter();

  const handleSuccess = (orden: OrdenDetalle) => {
    router.push(`/ventas/${orden.id}`);
  };

  const handleCancel = () => {
    router.push("/ventas");
  };

  return (
    <OrdenForm
      clientes={clientes}
      tipos={tipos}
      condiciones={condiciones}
      tasaIvaDefault={tasaIvaDefault}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  );
}
