"use client";

import { useState, useMemo, useCallback } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import Link from "next/link";
import KpiCard from "./KpiCard";
import FiltrosBar from "./FiltrosBar";
import TablaOrdenes from "./TablaOrdenes";
import Toast, { ToastData } from "@/components/ui/Toast";
import type { OrdenResumen, KpisData, FiltroOrdenes, EstatusOrden } from "@/types/ordenes";

interface VentasClientProps {
  initialOrdenes: OrdenResumen[];
  initialKpis: KpisData;
}

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

  const tasa_conversion =
    cotizadas + ventas > 0
      ? Math.round((ventas / (cotizadas + ventas)) * 100)
      : 0;

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

function filtrarOrdenes(ordenes: OrdenResumen[], filtros: FiltroOrdenes): OrdenResumen[] {
  return ordenes.filter((o) => {
    if (filtros.estatus && o.estatus !== filtros.estatus) return false;

    if (filtros.ano || filtros.q || filtros.mes) {
      const fecha = new Date(o.created_at);
      const year = filtros.ano ?? new Date().getFullYear();

      if (fecha.getFullYear() !== year) return false;

      if (filtros.mes) {
        if (fecha.getMonth() + 1 !== filtros.mes) return false;
      } else if (filtros.q) {
        const mesInicio = (filtros.q - 1) * 3 + 1;
        const mesFin = mesInicio + 2;
        const mesActual = fecha.getMonth() + 1;
        if (mesActual < mesInicio || mesActual > mesFin) return false;
      }
    }

    return true;
  });
}

export default function VentasClient({
  initialOrdenes,
  initialKpis,
}: VentasClientProps) {
  const [ordenes, setOrdenes] = useState<OrdenResumen[]>(initialOrdenes);
  const [filtros, setFiltros] = useState<FiltroOrdenes>({
    ano: null,
    q: null,
    mes: null,
    estatus: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<OrdenResumen | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  // Filtrado client-side
  const ordenesFiltradas = useMemo(
    () => filtrarOrdenes(ordenes, filtros),
    [ordenes, filtros]
  );

  // KPIs calculados sobre órdenes filtradas
  const kpis = useMemo(
    () => (filtros.ano || filtros.q || filtros.mes || filtros.estatus
      ? calcularKpis(ordenesFiltradas)
      : initialKpis),
    [ordenesFiltradas, filtros, initialKpis]
  );

  // Cambio de estatus en tabla
  const handleEstatusChanged = useCallback(
    (id: string, nuevoEstatus: EstatusOrden, fechaVenta?: string) => {
      setOrdenes((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                estatus: nuevoEstatus,
                fecha_venta:
                  nuevoEstatus === "VENTA"
                    ? (fechaVenta ?? o.fecha_venta)
                    : null,
              }
            : o
        )
      );
    },
    []
  );

  // Eliminar orden BORRADOR
  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/ordenes/${confirmDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        setToast({ type: "error", message: data.error || "Error al eliminar" });
        return;
      }

      setOrdenes((prev) => prev.filter((o) => o.id !== confirmDelete.id));
      setToast({
        type: "success",
        message: `Orden ${confirmDelete.folio} eliminada`,
      });
    } catch {
      setToast({ type: "error", message: "Error de conexión" });
    } finally {
      setIsDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={closeToast} />}

      {/* ── Encabezado ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Ventas</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ordenes.length}{" "}
            {ordenes.length === 1 ? "orden registrada" : "órdenes registradas"}
          </p>
        </div>
        <Link href="/ventas/nueva" className="btn-primary self-start sm:self-auto">
          <Plus size={16} />
          Nueva orden
        </Link>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          variant="ventas"
          value={kpis.ventas_mxn}
          label="Ventas cerradas"
          sublabel={`${kpis.ventas} ${kpis.ventas === 1 ? "orden" : "órdenes"}`}
        />
        <KpiCard
          variant="pipeline"
          value={kpis.pipeline_mxn}
          label="Pipeline"
          sublabel={`${kpis.cotizadas} ${kpis.cotizadas === 1 ? "cotización" : "cotizaciones"}`}
        />
        <KpiCard
          variant="conversion"
          value={kpis.tasa_conversion}
          label="Tasa de conversión"
          sublabel="Cotizadas → Ventas"
        />
        <KpiCard
          variant="totales"
          value={kpis.total_ordenes}
          label="Total órdenes"
          sublabel={`${kpis.borradores} ${kpis.borradores === 1 ? "borrador" : "borradores"}`}
          extraMXN={kpis.suma_total_mxn}
          extraUSD={kpis.suma_total_usd}
        />
      </div>

      {/* ── Filtros ── */}
      <div className="mb-4">
        <FiltrosBar filtros={filtros} onChange={setFiltros} />
      </div>

      {/* ── Tabla agrupada ── */}
      <TablaOrdenes
        ordenes={ordenesFiltradas}
        onEstatusChanged={handleEstatusChanged}
        onDeleteRequest={setConfirmDelete}
      />

      {/* ── Modal: confirmar eliminar ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setConfirmDelete(null)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in z-10">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-navy text-base">Eliminar orden</h3>
                <p className="text-sm text-gray-600 mt-1">
                  ¿Eliminar la orden{" "}
                  <strong className="font-mono text-gray-900">
                    {confirmDelete.folio}
                  </strong>
                  ?
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {confirmDelete.descripcion}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setConfirmDelete(null)}
                disabled={isDeleting}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="btn-danger"
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
