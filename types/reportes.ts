/**
 * Tipos de datos para el módulo de Reportes.
 */

/** Un mes en el gráfico de ventas mensuales */
export interface MesVenta {
  mes: number;           // 1-12
  nombre: string;        // "Ene", "Feb", ...
  actual: number;        // total_mxn ventas cerradas año actual
  anterior: number;      // total_mxn ventas cerradas año anterior (0 si no hay)
}

export interface VentasMensualesData {
  data: MesVenta[];
  ano_actual: number;
  ano_anterior: number;
  total_actual: number;
  total_anterior: number;
}

/** Pipeline: distribución de órdenes por estatus */
export interface PipelineData {
  borradores_count: number;
  cotizaciones_count: number;
  ventas_count: number;
  cotizaciones_mxn: number;
  ventas_mxn: number;
  total_ordenes: number;
}

/** Un cliente en el ranking de top clientes */
export interface TopClienteItem {
  cliente_id: string;
  nombre: string;
  ordenes_totales: number;
  ordenes_venta: number;
  total_mxn: number;
}

/** Un tipo de cotización con su tasa de conversión */
export interface ConversionTipoItem {
  tipo_id: string;
  tipo: string;
  total: number;
  ventas: number;
  cotizadas: number;
  tasa: number; // porcentaje 0-100
}

/** KPIs adicionales del módulo de reportes */
export interface ReporteStats {
  ticket_promedio_mxn: number;
  tiempo_promedio_cierre_dias: number | null;
  total_ventas: number;
  total_cotizadas: number;
}

/** Payload completo pasado al client component en el render inicial */
export interface ReportesInitialData {
  ventasMensuales: VentasMensualesData;
  pipeline: PipelineData;
  topClientes: TopClienteItem[];
  conversion: ConversionTipoItem[];
  stats: ReporteStats;
}

/** Filtros del módulo de reportes */
export interface FiltroReportes {
  ano: number | null;
  q: number | null;
  mes: number | null;
}
