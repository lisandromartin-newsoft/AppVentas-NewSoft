"use client";

import { X } from "lucide-react";
import type { FiltroReportes } from "@/types/reportes";

interface Props {
  filtros: FiltroReportes;
  onChange: (f: FiltroReportes) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const TRIMESTRES = [
  { value: 1, label: "Q1 (Ene–Mar)" },
  { value: 2, label: "Q2 (Abr–Jun)" },
  { value: 3, label: "Q3 (Jul–Sep)" },
  { value: 4, label: "Q4 (Oct–Dic)" },
];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function FiltrosReportes({ filtros, onChange }: Props) {
  const hasFilters = filtros.ano !== null || filtros.q !== null || filtros.mes !== null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="input text-sm py-1.5 pr-8 w-auto min-w-[90px]"
        value={filtros.ano ?? ""}
        onChange={(e) =>
          onChange({ ...filtros, ano: e.target.value ? Number(e.target.value) : null })
        }
      >
        <option value="">Todos los años</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <select
        className="input text-sm py-1.5 pr-8 w-auto min-w-[130px]"
        value={filtros.q ?? ""}
        onChange={(e) => {
          const q = e.target.value ? Number(e.target.value) : null;
          onChange({ ...filtros, q, mes: null });
        }}
      >
        <option value="">Todos los trimestres</option>
        {TRIMESTRES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        className="input text-sm py-1.5 pr-8 w-auto min-w-[120px]"
        value={filtros.mes ?? ""}
        onChange={(e) => {
          const mes = e.target.value ? Number(e.target.value) : null;
          onChange({ ...filtros, mes, q: null });
        }}
      >
        <option value="">Todos los meses</option>
        {MESES.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => onChange({ ano: null, q: null, mes: null })}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
        >
          <X size={13} />
          Limpiar
        </button>
      )}
    </div>
  );
}
