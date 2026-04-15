/**
 * Tipos de datos para el módulo de Clientes.
 */

export interface CondicionResumen {
  id: string;
  nombre: string;
  dias_credito: number | null;
}

/** Totales de ventas por cliente, separados por moneda */
export interface ClienteStats {
  num_ordenes: number;
  /** Suma de `total` de órdenes en MXN (en pesos) */
  total_mxn: number;
  /** Suma de `total` de órdenes en USD (en dólares) */
  total_usd: number;
  /** Suma de `total_mxn` de TODAS las órdenes (todo convertido a pesos) */
  grand_total_mxn: number;
}

/** Cliente serializado con estadísticas de ventas */
export interface ClienteConStats {
  id: string;
  nombre: string;
  rfc: string;
  contacto: string;
  ciudad: string;
  email: string;
  telefono: string | null;
  condicion_pago_id: string;
  condicion_pago: CondicionResumen;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  stats: ClienteStats;
}

/** Payload para crear o actualizar un cliente */
export interface ClienteInput {
  nombre: string;
  rfc: string;
  contacto: string;
  ciudad: string;
  email: string;
  telefono?: string | null;
  condicion_pago_id: string;
  notas?: string | null;
}
