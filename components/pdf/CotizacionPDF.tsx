/**
 * CotizacionPDF — Template de PDF para cotizaciones y ventas.
 * Usa @react-pdf/renderer v3 (primitivos: Document, Page, View, Text).
 * Paleta: Navy #1B2A4A + Orange #E8751A sobre fondo blanco.
 *
 * NOTA: Este componente solo puede usarse en el servidor (API Route).
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ── Colores ──────────────────────────────────────────────────
const C = {
  navy: "#1B2A4A",
  navyLight: "#2D4070",
  orange: "#E8751A",
  orangeLight: "#FDF0E6",
  white: "#FFFFFF",
  surface: "#F5F7FA",
  border: "#D0D5DD",
  text: "#1A1A2E",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  green: "#059669",
  tableHeader: "#EEF2FF",
  rowAlt: "#F9FAFB",
};

// ── Estilos ──────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: C.navy,
  },
  headerLeft: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 4,
  },
  companyDetail: {
    fontSize: 8,
    color: C.textMuted,
    marginBottom: 2,
  },
  headerRight: {
    alignItems: "flex-end",
    minWidth: 140,
  },
  estatusBadge: {
    backgroundColor: C.orange,
    color: C.white,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 8,
    letterSpacing: 1,
  },
  folioLabel: {
    fontSize: 8,
    color: C.textMuted,
    marginBottom: 2,
  },
  folioValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // ── Sección info (2 columnas) ──
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  infoBox: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoBoxTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  infoField: {
    flexDirection: "row",
    marginBottom: 3,
  },
  infoFieldLabel: {
    fontSize: 7.5,
    color: C.textMuted,
    width: 72,
    flexShrink: 0,
  },
  infoFieldValue: {
    fontSize: 7.5,
    color: C.text,
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },
  infoFieldValueNormal: {
    fontSize: 7.5,
    color: C.text,
    flex: 1,
  },

  // ── Descripción orden ──
  descSection: {
    marginBottom: 14,
    padding: 10,
    backgroundColor: C.orangeLight,
    borderLeftWidth: 3,
    borderLeftColor: C.orange,
    borderRadius: 2,
  },
  descLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.orange,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  descText: {
    fontSize: 9,
    color: C.navy,
    fontFamily: "Helvetica-Bold",
  },

  // ── Tabla de partidas ──
  tableTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  table: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.navy,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.rowAlt,
  },
  colNum: { width: 20 },
  colDesc: { flex: 1 },
  colQty: { width: 44, textAlign: "right" },
  colPrice: { width: 68, textAlign: "right" },
  colTotal: { width: 68, textAlign: "right" },
  thText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  tdText: {
    fontSize: 8,
    color: C.text,
  },
  tdMuted: {
    fontSize: 8,
    color: C.textMuted,
  },

  // ── Resumen financiero ──
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  summaryBox: {
    width: 220,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  summaryRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: C.navy,
  },
  summaryRowMXN: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  summaryLabel: {
    fontSize: 8,
    color: C.textMuted,
  },
  summaryValue: {
    fontSize: 8,
    color: C.text,
    fontFamily: "Helvetica-Bold",
  },
  summaryLabelTotal: {
    fontSize: 9,
    color: C.white,
    fontFamily: "Helvetica-Bold",
  },
  summaryValueTotal: {
    fontSize: 11,
    color: C.white,
    fontFamily: "Helvetica-Bold",
  },
  summaryLabelMXN: {
    fontSize: 7.5,
    color: C.textMuted,
  },
  summaryValueMXN: {
    fontSize: 7.5,
    color: C.textMuted,
  },
  discountLabel: {
    fontSize: 8,
    color: "#DC2626",
  },
  discountValue: {
    fontSize: 8,
    color: "#DC2626",
    fontFamily: "Helvetica-Bold",
  },

  // ── Footer / Notas ──
  footer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  footerText: {
    fontSize: 7.5,
    color: C.textMuted,
    lineHeight: 1.5,
  },
  pageNumber: {
    position: "absolute",
    bottom: 24,
    right: 40,
    fontSize: 7,
    color: C.textLight,
  },
});

// ── Helpers de formato ───────────────────────────────────────

function fmtMXN(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtMoneda(n: number, moneda: string): string {
  return moneda === "USD" ? fmtUSD(n) : fmtMXN(n);
}

function fmtNum(n: number): string {
  return n % 1 === 0
    ? n.toLocaleString("es-MX")
    : n.toLocaleString("es-MX", { minimumFractionDigits: 2 });
}

function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Tipos de datos del PDF ───────────────────────────────────

export interface EmpresaPDF {
  nombre: string;
  rfc: string;
  direccion: string;
  email: string;
  telefono: string;
  notas_documentos: string | null;
}

export interface ClientePDF {
  nombre: string;
  rfc: string;
  contacto: string;
  email: string;
  ciudad: string;
}

export interface PartidaPDF {
  orden_display: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  total_partida: number;
}

export interface OrdenPDF {
  folio: string;
  descripcion: string;
  estatus: string;
  moneda: string;
  tipo_cambio: number | null;
  tipo_cotizacion: string;
  condicion_pago: string;
  created_at: string;
  vigencia: string | null;
  aplica_iva: boolean;
  tasa_iva: number | null;
  descuento_porcentaje: number | null;
  descuento_descripcion: string | null;
  subtotal: number;
  monto_descuento: number;
  subtotal_con_descuento: number;
  monto_iva: number;
  total: number;
  total_mxn: number;
}

export interface CotizacionPDFProps {
  empresa: EmpresaPDF;
  cliente: ClientePDF;
  orden: OrdenPDF;
  partidas: PartidaPDF[];
}

// ── Componente PDF ───────────────────────────────────────────

export function CotizacionPDF({
  empresa,
  cliente,
  orden,
  partidas,
}: CotizacionPDFProps) {
  const isUSD = orden.moneda === "USD";
  const hasDescuento =
    orden.descuento_porcentaje != null && orden.descuento_porcentaje > 0;

  // Resolver variable {vigencia} en notas
  const vigenciaTexto = fmtFecha(orden.vigencia);
  const notasResueltas = empresa.notas_documentos
    ? empresa.notas_documentos.replace("{vigencia}", vigenciaTexto)
    : null;

  const estatusLabel =
    orden.estatus === "VENTA"
      ? "VENTA"
      : orden.estatus === "COTIZADO"
      ? "COTIZACIÓN"
      : "BORRADOR";

  return (
    <Document
      title={`${empresa.nombre} — ${orden.folio}`}
      author={empresa.nombre}
      subject={`Cotización ${orden.folio}`}
    >
      <Page size="A4" style={s.page}>

        {/* ── HEADER: Empresa + Folio ── */}
        <View style={s.header}>
          {/* Datos empresa */}
          <View style={s.headerLeft}>
            <Text style={s.companyName}>{empresa.nombre}</Text>
            <Text style={s.companyDetail}>RFC: {empresa.rfc}</Text>
            <Text style={s.companyDetail}>{empresa.direccion}</Text>
            <Text style={s.companyDetail}>{empresa.email}</Text>
            <Text style={s.companyDetail}>Tel: {empresa.telefono}</Text>
          </View>

          {/* Folio + estatus */}
          <View style={s.headerRight}>
            <Text style={s.estatusBadge}>{estatusLabel}</Text>
            <Text style={s.folioLabel}>Folio</Text>
            <Text style={s.folioValue}>{orden.folio}</Text>
          </View>
        </View>

        {/* ── INFO: Orden + Cliente (2 columnas) ── */}
        <View style={s.infoRow}>
          {/* Datos de la orden */}
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Datos de la cotización</Text>

            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Fecha</Text>
              <Text style={s.infoFieldValueNormal}>{fmtFecha(orden.created_at)}</Text>
            </View>
            {orden.vigencia && (
              <View style={s.infoField}>
                <Text style={s.infoFieldLabel}>Vigencia</Text>
                <Text style={s.infoFieldValueNormal}>{fmtFecha(orden.vigencia)}</Text>
              </View>
            )}
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Tipo</Text>
              <Text style={s.infoFieldValueNormal}>{orden.tipo_cotizacion}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Condición pago</Text>
              <Text style={s.infoFieldValueNormal}>{orden.condicion_pago}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Moneda</Text>
              <Text style={s.infoFieldValueNormal}>
                {orden.moneda}
                {isUSD && orden.tipo_cambio
                  ? `  (TC: ${fmtMXN(orden.tipo_cambio)})`
                  : ""}
              </Text>
            </View>
            {orden.estatus === "VENTA" && (
              <View style={s.infoField}>
                <Text style={s.infoFieldLabel}>Estatus</Text>
                <Text style={{ ...s.infoFieldValueNormal, color: C.green }}>
                  Venta confirmada
                </Text>
              </View>
            )}
          </View>

          {/* Datos del cliente */}
          <View style={s.infoBox}>
            <Text style={s.infoBoxTitle}>Cliente</Text>

            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Empresa</Text>
              <Text style={s.infoFieldValue}>{cliente.nombre}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>RFC</Text>
              <Text style={s.infoFieldValueNormal}>{cliente.rfc}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Contacto</Text>
              <Text style={s.infoFieldValueNormal}>{cliente.contacto}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Email</Text>
              <Text style={s.infoFieldValueNormal}>{cliente.email}</Text>
            </View>
            <View style={s.infoField}>
              <Text style={s.infoFieldLabel}>Ciudad</Text>
              <Text style={s.infoFieldValueNormal}>{cliente.ciudad}</Text>
            </View>
          </View>
        </View>

        {/* ── DESCRIPCIÓN ── */}
        <View style={s.descSection}>
          <Text style={s.descLabel}>Descripción</Text>
          <Text style={s.descText}>{orden.descripcion}</Text>
        </View>

        {/* ── TABLA DE PARTIDAS ── */}
        <Text style={s.tableTitle}>Partidas</Text>
        <View style={s.table}>
          {/* Encabezado */}
          <View style={s.tableHeader}>
            <Text style={{ ...s.thText, ...s.colNum }}>#</Text>
            <Text style={{ ...s.thText, ...s.colDesc }}>Descripción</Text>
            <Text style={{ ...s.thText, ...s.colQty }}>Cant.</Text>
            <Text style={{ ...s.thText, ...s.colPrice }}>Precio unit.</Text>
            <Text style={{ ...s.thText, ...s.colTotal }}>Total</Text>
          </View>

          {/* Filas */}
          {partidas.map((p, i) => (
            <View
              key={p.orden_display}
              style={[s.tableRow, i % 2 === 1 ? s.tableRowAlt : {}]}
            >
              <Text style={{ ...s.tdMuted, ...s.colNum }}>{i + 1}</Text>
              <Text style={{ ...s.tdText, ...s.colDesc }}>{p.descripcion}</Text>
              <Text style={{ ...s.tdMuted, ...s.colQty }}>{fmtNum(p.cantidad)}</Text>
              <Text style={{ ...s.tdText, ...s.colPrice }}>
                {fmtMoneda(p.precio_unitario, orden.moneda)}
              </Text>
              <Text style={{ ...s.tdText, ...s.colTotal, fontFamily: "Helvetica-Bold" }}>
                {fmtMoneda(p.total_partida, orden.moneda)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── RESUMEN FINANCIERO ── */}
        <View style={s.summaryContainer}>
          <View style={s.summaryBox}>
            {/* Subtotal */}
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>
                {fmtMoneda(orden.subtotal, orden.moneda)} {orden.moneda}
              </Text>
            </View>

            {/* Descuento (si aplica) */}
            {hasDescuento && (
              <>
                <View style={s.summaryRow}>
                  <Text style={s.discountLabel}>
                    Descuento ({orden.descuento_porcentaje}%)
                    {orden.descuento_descripcion
                      ? `\n${orden.descuento_descripcion}`
                      : ""}
                  </Text>
                  <Text style={s.discountValue}>
                    −{fmtMoneda(orden.monto_descuento, orden.moneda)}
                  </Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Subtotal c/descuento</Text>
                  <Text style={s.summaryValue}>
                    {fmtMoneda(orden.subtotal_con_descuento, orden.moneda)} {orden.moneda}
                  </Text>
                </View>
              </>
            )}

            {/* IVA (si aplica) */}
            {orden.aplica_iva && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>IVA ({orden.tasa_iva}%)</Text>
                <Text style={s.summaryValue}>
                  {fmtMoneda(orden.monto_iva, orden.moneda)} {orden.moneda}
                </Text>
              </View>
            )}

            {/* TOTAL */}
            <View style={s.summaryRowTotal}>
              <Text style={s.summaryLabelTotal}>TOTAL</Text>
              <Text style={s.summaryValueTotal}>
                {fmtMoneda(orden.total, orden.moneda)} {orden.moneda}
              </Text>
            </View>

            {/* Equivalente MXN (si USD) */}
            {isUSD && (
              <View style={s.summaryRowMXN}>
                <Text style={s.summaryLabelMXN}>
                  Equivalente MXN (TC: {orden.tipo_cambio?.toFixed(4)})
                </Text>
                <Text style={s.summaryValueMXN}>≈ {fmtMXN(orden.total_mxn)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── FOOTER: Notas del documento ── */}
        {notasResueltas && (
          <View style={s.footer}>
            <Text style={s.footerTitle}>Notas y condiciones</Text>
            <Text style={s.footerText}>{notasResueltas}</Text>
          </View>
        )}

        {/* Número de página */}
        <Text
          style={s.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
}
