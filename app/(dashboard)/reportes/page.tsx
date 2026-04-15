import { BarChart3 } from "lucide-react";

export const metadata = { title: "Reportes" };

export default function ReportesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-navy-50 rounded-2xl flex items-center justify-center mb-4">
        <BarChart3 size={32} className="text-navy" />
      </div>
      <h1 className="text-2xl font-bold text-navy mb-2">Reportes</h1>
      <p className="text-gray-500 text-sm max-w-xs">
        Módulo en construcción. Disponible en Fase 8 del desarrollo.
      </p>
    </div>
  );
}
