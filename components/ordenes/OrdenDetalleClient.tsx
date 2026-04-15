"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, ArrowLeft, Copy } from "lucide-react";
import OrdenForm from "./OrdenForm";
import StatusBadge from "./StatusBadge";
import Toast, { ToastData } from "@/components/ui/Toast";
import { formatMoneda, formatMXN, formatFecha, ESTATUS_COLORS, ESTATUS_LABELS } from "@/lib/utils";
import type { OrdenDetalle, EstatusOrden } from "@/types/ordenes";
import Link from "next/link";

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

interface OrdenDetalleClientProps {
  orden: OrdenDetalle;
  clientes: ClienteOpcion[];
  tipos: CatalogItem[];
  condiciones: CatalogItem[];
  tasaIvaDefault: number;
}

export default function OrdenDetalleClient({
  orden: initialOrden,
  clientes,
  tipos,
  condiciones,
  tasaIvaDefault,
}: OrdenDetalleClientProps) {
  const router = useRouter();
  const [orden, setOrden] = useState<OrdenDetalle>(initialOrden);
  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const closeToast = useCallback(() => setToast(null), []);

  const handleEditSuccess = (updated: OrdenDetalle) => {
    setOrden(updated);
    setIsEditing(false);
    setToast({ type: "success", message: "Orden actualizada correctamente" });
  };

  const handleEstatusChanged = (nuevoEstatus: EstatusOrden, fechaVenta?: string) => {
    setOrden((prev) => ({
      ...prev,
      estatus: nuevoEstatus,
      fecha_venta: nuevoEstatus === "VENTA" ? (fechaVenta ?? prev.fecha_venta) : null,
    }));
    setToast({ type: "success", message: `Estatus cambiado a ${ESTATUS_LABELS[nuevoEstatus]}` });
  };

  return (
    <>
      {toast && <Toast {...toast} onClose={closeToast} />}

      {/* ── Encabezado ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/ventas" className="hover:text-navy transition-colors flex items-center gap-1">
              <ArrowLeft size={13} />
              Ventas
            </Link>
            <span>/</span>
            <span className="font-mono font-semibold text-navy">{orden.folio}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-navy">{orden.descripcion}</h1>
            <StatusBadge
              ordenId={orden.id}
              estatus={orden.estatus}
              onChanged={handleEstatusChanged}
            />
          </div>

          <p className="text-sm text-gray-500 mt-1">
            {orden.cliente.nombre} ·{" "}
            <span className="font-mono text-xs">{orden.cliente.rfc}</span>
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => {
                router.push(`/ventas/nueva?duplicar=${orden.id}`);
              }}
              className="btn-secondary text-sm flex items-center gap-1.5"
              title="Duplicar orden"
            >
              <Copy size={14} />
              Duplicar
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <Pencil size={14} />
              Editar
            </button>
          </div>
        )}

        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="btn-secondary text-sm flex items-center gap-1.5 self-start"
          >
            <X size={14} />
            Cancelar edición
          </button>
        )}
      </div>

      {isEditing ? (
        /* ── Formulario de edición ── */
        <div className="max-w-3xl bg-white rounded-xl border border-surface-border shadow-sm p-6">
          <OrdenForm
            orden={orden}
            clientes={clientes}
            tipos={tipos}
            condiciones={condiciones}
            tasaIvaDefault={tasaIvaDefault}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        /* ── Vista de detalle ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Columna izquierda: info + partidas ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Info de la orden */}
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Información general
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <InfoItem label="Tipo" value={orden.tipo_cotizacion.nombre} />
                <InfoItem label="Condición de pago" value={orden.condicion_pago.nombre} />
                <InfoItem
                  label="Moneda"
                  value={`${orden.moneda}${orden.tipo_cambio ? ` (TC: $${orden.tipo_cambio})` : ""}`}
                />
                <InfoItem
                  label="Fecha de venta"
                  value={orden.fecha_venta ? formatFecha(orden.fecha_venta) : "—"}
                />
                {orden.vigencia && (
                  <InfoItem label="Vigencia" value={orden.vigencia} />
                )}
                <InfoItem label="Creada" value={formatFecha(orden.created_at)} />
              </dl>
              {orden.notas && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-xs text-amber-700 font-medium mb-1">Notas internas</p>
                  <p className="text-sm text-gray-700">{orden.notas}</p>
                </div>
              )}
            </div>

            {/* Partidas */}
            <div className="bg-white rounded-xl border border-surface-border shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-border bg-gray-50">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Partidas ({orden.partidas.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-surface-border">
                      <th className="text-left px-5 py-2.5 font-medium">#</th>
                      <th className="text-left px-3 py-2.5 font-medium">Descripción</th>
                      <th className="text-right px-3 py-2.5 font-medium">Cant.</th>
                      <th className="text-right px-3 py-2.5 font-medium">Precio unit.</th>
                      <th className="text-right px-5 py-2.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border">
                    {orden.partidas.map((p, i) => (
                      <tr key={p.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3 text-xs text-gray-400">{i + 1}</td>
                        <td className="px-3 py-3 text-gray-700">{p.descripcion}</td>
                        <td className="px-3 py-3 text-right text-gray-600">
                          {p.cantidad.toLocaleString("es-MX")}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-600">
                          {formatMoneda(p.precio_unitario, orden.moneda)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-gray-800">
                          {formatMoneda(p.total_partida, orden.moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── Columna derecha: totales ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Resumen financiero
              </h2>

              <div className="space-y-2 text-sm">
                <TotalRow label="Subtotal" value={formatMoneda(orden.subtotal, orden.moneda)} />

                {orden.descuento_porcentaje && orden.descuento_porcentaje > 0 && (
                  <>
                    <TotalRow
                      label={`Descuento (${orden.descuento_porcentaje}%)`}
                      value={`−${formatMoneda(orden.monto_descuento, orden.moneda)}`}
                      variant="discount"
                    />
                    {orden.descuento_descripcion && (
                      <p className="text-xs text-gray-400 pl-2">{orden.descuento_descripcion}</p>
                    )}
                    <TotalRow
                      label="Subtotal con descuento"
                      value={formatMoneda(orden.subtotal_con_descuento, orden.moneda)}
                    />
                  </>
                )}

                {orden.aplica_iva && (
                  <TotalRow
                    label={`IVA (${orden.tasa_iva}%)`}
                    value={formatMoneda(orden.monto_iva, orden.moneda)}
                  />
                )}

                <div className="border-t border-surface-border pt-2 mt-1">
                  <TotalRow
                    label={`Total ${orden.moneda}`}
                    value={formatMoneda(orden.total, orden.moneda)}
                    variant="total"
                  />
                  {orden.moneda === "USD" && (
                    <TotalRow
                      label="Equivalente MXN"
                      value={`≈ ${formatMXN(orden.total_mxn)}`}
                      variant="mxn"
                    />
                  )}
                </div>
              </div>

              {/* Estatus visual */}
              <div className="mt-5 pt-4 border-t border-surface-border">
                <p className="text-xs text-gray-400 mb-1.5">Estatus actual</p>
                <span className={`badge text-xs font-medium ${ESTATUS_COLORS[orden.estatus]}`}>
                  {ESTATUS_LABELS[orden.estatus]}
                </span>
                {orden.estatus === "VENTA" && orden.fecha_venta && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    Cerrada el {formatFecha(orden.fecha_venta)}
                  </p>
                )}
              </div>
            </div>

            {/* Info de cliente */}
            <div className="bg-white rounded-xl border border-surface-border shadow-sm p-5">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Cliente
              </h2>
              <p className="font-semibold text-navy text-sm">{orden.cliente.nombre}</p>
              <p className="text-xs font-mono text-gray-400 mt-0.5">{orden.cliente.rfc}</p>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>{orden.cliente.contacto}</p>
                <p>{orden.cliente.email}</p>
                <p>{orden.cliente.ciudad}</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 font-medium">{label}</dt>
      <dd className="text-gray-700 mt-0.5">{value}</dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  variant = "normal",
}: {
  label: string;
  value: string;
  variant?: "normal" | "discount" | "total" | "mxn";
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`${
          variant === "total"
            ? "font-semibold text-gray-800"
            : variant === "discount"
            ? "text-gray-500"
            : variant === "mxn"
            ? "text-xs text-gray-400"
            : "text-gray-600"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-medium ${
          variant === "total"
            ? "text-navy font-bold text-base"
            : variant === "discount"
            ? "text-red-500"
            : variant === "mxn"
            ? "text-xs text-gray-400"
            : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
