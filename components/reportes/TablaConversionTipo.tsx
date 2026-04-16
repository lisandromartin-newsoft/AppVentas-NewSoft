"use client";

import type { ConversionTipoItem } from "@/types/reportes";

interface Props {
  data: ConversionTipoItem[];
}

function TasaBadge({ tasa }: { tasa: number }) {
  const color =
    tasa >= 70
      ? "bg-green-100 text-green-700"
      : tasa >= 40
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {tasa}%
    </span>
  );
}

export default function TablaConversionTipo({ data }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-base font-semibold text-navy mb-4">Conversión por tipo de cotización</h2>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[120px] text-gray-400 text-sm">
          Sin datos en el período
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">Tipo</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Total</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Cotizadas</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Ventas</th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500">Tasa</th>
                <th className="py-2 px-3 text-xs font-medium text-gray-500 w-32">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr
                  key={row.tipo_id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-medium text-gray-900">{row.tipo}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.total}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.cotizadas}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{row.ventas}</td>
                  <td className="py-2.5 px-3 text-right">
                    <TasaBadge tasa={row.tasa} />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-navy h-1.5 rounded-full transition-all"
                        style={{ width: `${row.tasa}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
