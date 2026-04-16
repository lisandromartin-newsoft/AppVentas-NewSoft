"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PipelineData } from "@/types/reportes";

interface Props {
  data: PipelineData;
}

const COLORS = ["#6B7280", "#E8751A", "#1B2A4A"];
const LABELS = ["Borradores", "Cotizaciones", "Ventas"];

function formatMXN(v: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(v);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold" style={{ color: entry.payload.fill }}>
        {entry.name}
      </p>
      <p className="text-gray-700">
        {entry.value} orden{entry.value !== 1 ? "es" : ""}
      </p>
      {entry.payload.mxn !== undefined && entry.payload.mxn > 0 && (
        <p className="text-gray-500">{formatMXN(entry.payload.mxn)}</p>
      )}
    </div>
  );
}

export default function GraficoPipelineDonut({ data }: Props) {
  const slices = [
    { name: LABELS[0], value: data.borradores_count, mxn: 0 },
    { name: LABELS[1], value: data.cotizaciones_count, mxn: data.cotizaciones_mxn },
    { name: LABELS[2], value: data.ventas_count, mxn: data.ventas_mxn },
  ].filter((s) => s.value > 0);

  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-navy mb-4">Pipeline por estatus</h2>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
          Sin datos en el período
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={slices}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[LABELS.indexOf(slices[i].name)] ?? COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Pipeline cotizaciones</p>
              <p className="font-semibold text-sm text-[#E8751A]">{formatMXN(data.cotizaciones_mxn)}</p>
            </div>
            <div className="bg-navy/5 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-0.5">Ventas cerradas</p>
              <p className="font-semibold text-sm text-navy">{formatMXN(data.ventas_mxn)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
