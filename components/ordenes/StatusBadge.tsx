"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { ESTATUS_LABELS, ESTATUS_COLORS, TRANSICIONES_PERMITIDAS } from "@/lib/utils";
import type { EstatusOrden } from "@/types/ordenes";

interface StatusBadgeProps {
  ordenId: string;
  estatus: EstatusOrden;
  onChanged: (nuevoEstatus: EstatusOrden, fechaVenta?: string) => void;
}

export default function StatusBadge({ ordenId, estatus, onChanged }: StatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFechaVenta, setShowFechaVenta] = useState(false);
  const [fechaVenta, setFechaVenta] = useState(
    new Date().toISOString().split("T")[0]
  );
  const containerRef = useRef<HTMLDivElement>(null);

  const transiciones = TRANSICIONES_PERMITIDAS[estatus] ?? [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowFechaVenta(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleTransition = async (nuevoEstatus: EstatusOrden, fecha?: string) => {
    setIsLoading(true);
    setIsOpen(false);
    setShowFechaVenta(false);

    try {
      const res = await fetch(`/api/ordenes/${ordenId}/estatus`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estatus: nuevoEstatus, fecha_venta: fecha ?? null }),
      });

      if (res.ok) {
        onChanged(nuevoEstatus, fecha);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (siguiente: EstatusOrden) => {
    if (siguiente === "VENTA") {
      setShowFechaVenta(true);
      setIsOpen(false);
    } else {
      handleTransition(siguiente);
    }
  };

  if (isLoading) {
    return (
      <span className={`badge text-xs font-medium flex items-center gap-1 ${ESTATUS_COLORS[estatus]}`}>
        <Loader2 size={11} className="animate-spin" />
        {ESTATUS_LABELS[estatus]}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* ── Badge con dropdown ── */}
      <button
        type="button"
        onClick={() => transiciones.length > 0 && setIsOpen((o) => !o)}
        className={`badge text-xs font-medium flex items-center gap-1 transition-opacity
          ${ESTATUS_COLORS[estatus]}
          ${transiciones.length > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      >
        {ESTATUS_LABELS[estatus]}
        {transiciones.length > 0 && (
          <ChevronDown size={11} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* ── Opciones de transición ── */}
      {isOpen && transiciones.length > 0 && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-surface-border rounded-xl shadow-lg min-w-[140px] py-1 overflow-hidden">
          {transiciones.map((sig) => (
            <button
              key={sig}
              type="button"
              onClick={() => handleOptionClick(sig as EstatusOrden)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
            >
              <span className={`badge text-xs font-medium ${ESTATUS_COLORS[sig]}`}>
                {ESTATUS_LABELS[sig]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── Mini-form para fecha de venta ── */}
      {showFechaVenta && (
        <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-surface-border rounded-xl shadow-lg w-64 p-3">
          <p className="text-xs font-medium text-gray-700 mb-2">Fecha de venta</p>
          <input
            type="date"
            className="input text-sm py-1.5 w-full"
            value={fechaVenta}
            onChange={(e) => setFechaVenta(e.target.value)}
          />
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => setShowFechaVenta(false)}
              className="btn-secondary text-xs py-1 px-3 flex-1"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleTransition("VENTA", fechaVenta)}
              className="btn-primary text-xs py-1 px-3 flex-1"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
