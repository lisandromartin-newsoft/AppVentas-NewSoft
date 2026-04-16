"use client";

import Link from "next/link";
import { Eye, Trash2, Copy, Loader2, FileDown } from "lucide-react";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import { formatMoneda, formatMXN, formatFecha } from "@/lib/utils";
import type { OrdenResumen, EstatusOrden } from "@/types/ordenes";

interface TablaOrdenesProps {
  ordenes: OrdenResumen[];
  onEstatusChanged: (id: string, estatus: EstatusOrden, fechaVenta?: string) => void;
  onDeleteRequest: (orden: OrdenResumen) => void;
  onDuplicated: (nuevaOrden: OrdenResumen) => void;
}

// Agrupar órdenes por cliente
function groupByCliente(ordenes: OrdenResumen[]) {
  const map = new Map<string, { nombre: string; ordenes: OrdenResumen[] }>();
  for (const o of ordenes) {
    const key = o.cliente.id;
    if (!map.has(key)) {
      map.set(key, { nombre: o.cliente.nombre, ordenes: [] });
    }
    map.get(key)!.ordenes.push(o);
  }
  return Array.from(map.entries()).map(([id, data]) => ({ clienteId: id, ...data }));
}

export default function TablaOrdenes({
  ordenes,
  onEstatusChanged,
  onDeleteRequest,
  onDuplicated,
}: TablaOrdenesProps) {
  // Mapa de IDs duplicando para mostrar spinner individual por fila
  const [duplicatingIds, setDuplicatingIds] = useState<Set<string>>(new Set());

  const handleDuplicar = async (orden: OrdenResumen) => {
    setDuplicatingIds((prev) => new Set(prev).add(orden.id));
    try {
      const res = await fetch(`/api/ordenes/${orden.id}/duplicar`, {
        method: "POST",
      });
      if (res.ok) {
        const nueva = await res.json();
        onDuplicated(nueva);
      }
    } finally {
      setDuplicatingIds((prev) => {
        const next = new Set(prev);
        next.delete(orden.id);
        return next;
      });
    }
  };

  if (ordenes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
        <p className="text-base font-medium text-gray-600">Sin órdenes</p>
        <p className="text-sm text-gray-400 mt-1">
          No hay órdenes que coincidan con los filtros seleccionados.
        </p>
      </div>
    );
  }

  const grupos = groupByCliente(ordenes);
  const grandTotal = ordenes.reduce((s, o) => s + o.total_mxn, 0);

  return (
    <div className="space-y-4">
      {grupos.map(({ clienteId, nombre, ordenes: ordenesCliente }) => {
        const subtotalCliente = ordenesCliente.reduce((s, o) => s + o.total_mxn, 0);
        return (
          <div
            key={clienteId}
            className="bg-white rounded-xl border border-surface-border overflow-hidden shadow-sm"
          >
            {/* Cabecera de grupo */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-surface-border">
              <h3 className="font-semibold text-sm text-navy">{nombre}</h3>
              <span className="text-xs text-gray-500">
                Subtotal:{" "}
                <span className="font-medium text-gray-700">{formatMXN(subtotalCliente)} MXN</span>
              </span>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b border-surface-border">
                    <th className="text-left px-5 py-2.5 font-medium">Folio</th>
                    <th className="text-left px-3 py-2.5 font-medium">Descripción</th>
                    <th className="text-left px-3 py-2.5 font-medium">Tipo</th>
                    <th className="text-left px-3 py-2.5 font-medium">Condición</th>
                    <th className="text-right px-3 py-2.5 font-medium">Total</th>
                    <th className="text-left px-3 py-2.5 font-medium">Estatus</th>
                    <th className="text-left px-3 py-2.5 font-medium">Fecha</th>
                    <th className="text-right px-5 py-2.5 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {ordenesCliente.map((o) => {
                    const isDuplicating = duplicatingIds.has(o.id);
                    return (
                      <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-mono text-xs font-semibold text-navy bg-navy/5 px-2 py-0.5 rounded">
                            {o.folio}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-700 max-w-[200px]">
                          <span className="line-clamp-2 text-xs">{o.descripcion}</span>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {o.tipo_cotizacion.nombre}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500">
                          {o.condicion_pago.nombre}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="font-medium text-gray-800 text-xs">
                            {formatMoneda(o.total, o.moneda)}{" "}
                            <span className="text-gray-400 font-normal">{o.moneda}</span>
                          </span>
                          {o.moneda === "USD" && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              ≈ {formatMXN(o.total_mxn)}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge
                            ordenId={o.id}
                            estatus={o.estatus}
                            onChanged={(nuevoEstatus, fechaVenta) =>
                              onEstatusChanged(o.id, nuevoEstatus, fechaVenta)
                            }
                          />
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {o.estatus === "VENTA" && o.fecha_venta
                            ? formatFecha(o.fecha_venta)
                            : formatFecha(o.created_at)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/ventas/${o.id}`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-navy hover:bg-navy/5 transition-colors"
                              title="Ver detalle"
                            >
                              <Eye size={14} />
                            </Link>
                            <a
                              href={`/api/pdf/${o.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                              title="Descargar PDF"
                            >
                              <FileDown size={14} />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDuplicar(o)}
                              disabled={isDuplicating}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-orange hover:bg-orange/5 transition-colors disabled:opacity-50"
                              title="Duplicar orden"
                            >
                              {isDuplicating ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                            {o.estatus === "BORRADOR" && (
                              <button
                                type="button"
                                onClick={() => onDeleteRequest(o)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Eliminar borrador"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* ── Grand total ── */}
      <div className="flex justify-end px-5 py-3 bg-navy/5 rounded-xl border border-navy/10">
        <p className="text-sm font-semibold text-navy">
          Total general (MXN):{" "}
          <span className="text-orange">{formatMXN(grandTotal)}</span>
        </p>
      </div>
    </div>
  );
}
