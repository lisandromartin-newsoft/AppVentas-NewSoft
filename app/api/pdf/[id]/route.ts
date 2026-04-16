export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { CotizacionPDF } from "@/components/pdf/CotizacionPDF";
import type {
  EmpresaPDF,
  ClientePDF,
  OrdenPDF,
  PartidaPDF,
} from "@/components/pdf/CotizacionPDF";

// ── GET /api/pdf/:id ──────────────────────────────────────────
// Genera y devuelve el PDF de una orden de venta.

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener la orden completa con relaciones
    const orden = await prisma.ordenVenta.findUnique({
      where: { id: params.id },
      include: {
        cliente: true,
        tipo_cotizacion: true,
        condicion_pago: true,
        partidas: { orderBy: { orden_display: "asc" } },
      },
    });

    if (!orden) {
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    // Obtener datos de la empresa
    const empresa = await prisma.empresa.findFirst();
    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no configurada" },
        { status: 500 }
      );
    }

    // ── Preparar datos para el PDF ──
    const empresaPDF: EmpresaPDF = {
      nombre: empresa.nombre,
      rfc: empresa.rfc,
      direccion: empresa.direccion,
      email: empresa.email,
      telefono: empresa.telefono,
      notas_documentos: empresa.notas_documentos ?? null,
    };

    const clientePDF: ClientePDF = {
      nombre: orden.cliente.nombre,
      rfc: orden.cliente.rfc,
      contacto: orden.cliente.contacto,
      email: orden.cliente.email,
      ciudad: orden.cliente.ciudad,
    };

    const ordenPDF: OrdenPDF = {
      folio: orden.folio,
      descripcion: orden.descripcion,
      estatus: orden.estatus,
      moneda: orden.moneda,
      tipo_cambio: orden.tipo_cambio ? orden.tipo_cambio.toNumber() : null,
      tipo_cotizacion: orden.tipo_cotizacion.nombre,
      condicion_pago: orden.condicion_pago.nombre,
      created_at: orden.created_at.toISOString(),
      vigencia: orden.vigencia ? orden.vigencia.toISOString() : null,
      aplica_iva: orden.aplica_iva,
      tasa_iva: orden.tasa_iva ? orden.tasa_iva.toNumber() : null,
      descuento_porcentaje: orden.descuento_porcentaje
        ? orden.descuento_porcentaje.toNumber()
        : null,
      descuento_descripcion: orden.descuento_descripcion ?? null,
      subtotal: orden.subtotal.toNumber(),
      monto_descuento: orden.monto_descuento.toNumber(),
      subtotal_con_descuento: orden.subtotal_con_descuento.toNumber(),
      monto_iva: orden.monto_iva.toNumber(),
      total: orden.total.toNumber(),
      total_mxn: orden.total_mxn.toNumber(),
    };

    const partidasPDF: PartidaPDF[] = orden.partidas.map((p) => ({
      orden_display: p.orden_display,
      descripcion: p.descripcion,
      cantidad: p.cantidad.toNumber(),
      precio_unitario: p.precio_unitario.toNumber(),
      total_partida: p.total_partida.toNumber(),
    }));

    // ── Generar el PDF ──
    // Cast necesario: createElement infiere FunctionComponentElement pero
    // renderToBuffer espera ReactElement<DocumentProps>
    const element = createElement(CotizacionPDF, {
      empresa: empresaPDF,
      cliente: clientePDF,
      orden: ordenPDF,
      partidas: partidasPDF,
    }) as unknown as ReactElement<DocumentProps>;

    const pdfBuffer = await renderToBuffer(element);

    // Nombre de archivo: folio_cliente.pdf
    const nombreArchivo = `${orden.folio}_${orden.cliente.nombre
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "")
      .substring(0, 30)}.pdf`;

    // Convertir Buffer a Uint8Array para compatibilidad con BodyInit de Next.js
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Content-Length": String(pdfBuffer.length),
        // Evitar caché en el navegador para PDFs generados dinámicamente
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/pdf/:id", err);
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
