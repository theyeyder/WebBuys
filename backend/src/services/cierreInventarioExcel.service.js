import ExcelJS from "exceljs";

/*
 * Exporta exclusivamente los datos historicos del cierre ya registrado.
 * Los detalles provienen del snapshot guardado al cerrar el periodo.
 * No recalcula ni modifica existencias.
 */

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const COLORES = {
  oscuro: "123A34",
  principal: "0F766E",
  verde: "168A76",
  claro: "EAF5F1",
  gris: "F4F8F6",
  blanco: "FFFFFF",
  texto: "1D3530",
  borde: "D7E5E0",
};

const FORMATO_CANTIDAD = '#,##0.####;[Red](#,##0.####);0';
const FORMATO_MONEDA = '"$" #,##0.00;[Red]("$" #,##0.00);"$" 0.00';

function cantidad(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function fechaBogota(valor) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fecha);
}

function encabezado(hoja, titulo, subtitulo, columnas) {
  hoja.mergeCells(1, 1, 2, columnas);
  const celda = hoja.getCell(1, 1);
  celda.value = titulo;
  celda.font = { name: "Aptos Display", size: 19, bold: true, color: { argb: COLORES.blanco } };
  celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.principal } };
  celda.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  hoja.getRow(1).height = 26;
  hoja.getRow(2).height = 21;

  hoja.mergeCells(3, 1, 3, columnas);
  const segunda = hoja.getCell(3, 1);
  segunda.value = subtitulo;
  segunda.font = { name: "Aptos", size: 11, bold: true, color: { argb: COLORES.oscuro } };
  segunda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.claro } };
  segunda.alignment = { vertical: "middle", indent: 1 };
  hoja.getRow(3).height = 24;
}

function tituloSeccion(hoja, fila, texto, columnas = 4) {
  hoja.mergeCells(fila, 1, fila, columnas);
  const celda = hoja.getCell(fila, 1);
  celda.value = texto;
  celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.principal } };
  celda.font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORES.blanco } };
  celda.alignment = { vertical: "middle", indent: 1 };
  hoja.getRow(fila).height = 23;
}

function datoResumen(hoja, fila, etiqueta, valor, tipo = "texto") {
  const label = hoja.getCell(fila, 1);
  const celda = hoja.getCell(fila, 2);
  label.value = etiqueta;
  label.font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORES.texto } };
  celda.value = tipo === "texto" ? String(valor ?? "—") : cantidad(valor);
  celda.font = { name: "Aptos", size: 10, color: { argb: COLORES.texto }, bold: tipo === "moneda" };
  if (tipo === "moneda") celda.numFmt = FORMATO_MONEDA;
  if (tipo === "cantidad") celda.numFmt = FORMATO_CANTIDAD;
  for (const c of [label, celda]) {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fila % 2 ? COLORES.blanco : COLORES.gris } };
    c.alignment = { vertical: "middle" };
  }
  hoja.getRow(fila).height = 21;
}

const COLUMNAS = [
  { key: "codigo", header: "Código", width: 17 },
  { key: "producto", header: "Producto", width: 35 },
  { key: "presentacion", header: "Presentación", width: 23 },
  { key: "marca", header: "Marca", width: 20 },
  { key: "categoria", header: "Categoría", width: 21 },
  { key: "unidad", header: "Unidad", width: 13 },
  { key: "stockInicial", header: "Stock inicial", width: 17, tipo: "cantidad" },
  { key: "entradas", header: "Entradas", width: 17, tipo: "cantidad" },
  { key: "entregas", header: "Entregas", width: 17, tipo: "cantidad" },
  { key: "reversiones", header: "Reversiones técnicas", width: 22, tipo: "cantidad" },
  { key: "vendidoNeto", header: "Vendido neto", width: 18, tipo: "cantidad" },
  { key: "otrasSalidas", header: "Otras salidas", width: 18, tipo: "cantidad" },
  { key: "ajustesPositivos", header: "Ajustes +", width: 17, tipo: "cantidad" },
  { key: "ajustesNegativos", header: "Ajustes -", width: 17, tipo: "cantidad" },
  { key: "stockFinal", header: "Stock final", width: 17, tipo: "cantidad" },
  { key: "reservadoFinal", header: "Reservado final", width: 19, tipo: "cantidad" },
  { key: "costoPromedioFinal", header: "Costo promedio final", width: 23, tipo: "moneda" },
  { key: "valorInventarioInicial", header: "Valor inicial", width: 21, tipo: "moneda" },
  { key: "valorInventarioFinal", header: "Valor final", width: 21, tipo: "moneda" },
];

export async function generarExcelCierreInventario(cierre) {
  if (cierre?.estado !== "CERRADO" || !Array.isArray(cierre.detalles)) {
    throw new Error("El periodo no tiene un cierre historico descargable.");
  }

  const periodo = `${MESES[cierre.mes - 1] || "Mes"} ${cierre.anio}`;
  const libro = new ExcelJS.Workbook();
  libro.creator = "WebBuys";
  libro.created = new Date();
  libro.subject = `Cierre mensual de inventario ${cierre.periodo}`;

  const resumen = libro.addWorksheet("Resumen", {
    views: [{ state: "frozen", ySplit: 3 }],
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true, fitToWidth: 1, fitToHeight: 1 },
  });
  resumen.columns = [{ width: 34 }, { width: 28 }, { width: 18 }, { width: 18 }];
  encabezado(resumen, "CIERRE MENSUAL DE INVENTARIO", periodo, 4);

  tituloSeccion(resumen, 5, "DATOS DEL CIERRE");
  datoResumen(resumen, 6, "Periodo", cierre.periodo);
  datoResumen(resumen, 7, "Estado", cierre.estado);
  datoResumen(resumen, 8, "Fecha de cierre", fechaBogota(cierre.fechaCierre));
  datoResumen(resumen, 9, "Cerrado por", cierre.cerradoPorNombre || "—");
  datoResumen(resumen, 10, "Productos", cierre.totalProductos, "cantidad");
  datoResumen(resumen, 11, "Registros de inventario", cierre.totalRegistros, "cantidad");

  tituloSeccion(resumen, 13, "MOVIMIENTOS DEL MES");
  datoResumen(resumen, 14, "Entradas", cierre.totalEntradas, "cantidad");
  datoResumen(resumen, 15, "Entregas", cierre.totalEntregas, "cantidad");
  datoResumen(resumen, 16, "Reversiones técnicas", cierre.totalReversiones, "cantidad");
  datoResumen(resumen, 17, "Vendido neto", cierre.totalVendidoNeto, "cantidad");
  datoResumen(resumen, 18, "Otras salidas", cierre.totalOtrasSalidas, "cantidad");
  datoResumen(resumen, 19, "Ajustes positivos", cierre.totalAjustesPositivos, "cantidad");
  datoResumen(resumen, 20, "Ajustes negativos", cierre.totalAjustesNegativos, "cantidad");

  tituloSeccion(resumen, 22, "VALOR DEL INVENTARIO");
  datoResumen(resumen, 23, "Valor inventario inicial", cierre.valorInventarioInicial, "moneda");
  datoResumen(resumen, 24, "Valor inventario final", cierre.valorInventarioFinal, "moneda");

  tituloSeccion(resumen, 26, "OBSERVACIONES");
  resumen.mergeCells("A27:D29");
  const observaciones = resumen.getCell("A27");
  observaciones.value = cierre.observaciones || "Sin observaciones";
  observaciones.alignment = { wrapText: true, vertical: "top", indent: 1 };
  observaciones.font = { name: "Aptos", size: 10, color: { argb: COLORES.texto } };
  resumen.mergeCells("A31:D32");
  resumen.getRow(31).height = 25;
  resumen.getRow(32).height = 23;
  const nota = resumen.getCell("A31");
  nota.value = "Las cifras corresponden al cierre histórico guardado. Entregas y reversiones son el detalle técnico; no deben sumarse nuevamente al vendido neto.";
  nota.alignment = { wrapText: true, vertical: "middle", indent: 1 };
  nota.font = { name: "Aptos", size: 9, italic: true, color: { argb: COLORES.texto } };

  const productos = libro.addWorksheet("Detalle por producto", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 5 }],
    pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  productos.columns = COLUMNAS.map(({ key, width }) => ({ key, width }));
  encabezado(productos, "DETALLE DEL CIERRE DE INVENTARIO", periodo, COLUMNAS.length);

  const filaEncabezado = productos.getRow(5);
  COLUMNAS.forEach((columna, indice) => {
    const celda = filaEncabezado.getCell(indice + 1);
    celda.value = columna.header;
    celda.font = { name: "Aptos", size: 10, bold: true, color: { argb: COLORES.blanco } };
    celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.principal } };
    celda.alignment = { vertical: "middle", wrapText: true };
  });
  filaEncabezado.height = 32;

  for (const [indice, detalle] of cierre.detalles.entries()) {
    const fila = productos.getRow(6 + indice);
    COLUMNAS.forEach((columna, posicion) => {
      const celda = fila.getCell(posicion + 1);
      celda.value = columna.tipo
        ? cantidad(detalle[columna.key])
        : String(detalle[columna.key] ?? "");
      if (columna.tipo === "moneda") celda.numFmt = FORMATO_MONEDA;
      if (columna.tipo === "cantidad") celda.numFmt = FORMATO_CANTIDAD;
      celda.font = { name: "Aptos", size: 10, color: { argb: COLORES.texto } };
      celda.alignment = { vertical: "middle", horizontal: columna.tipo ? "right" : "left" };
      if (indice % 2 === 1) {
        celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.gris } };
      }
      celda.border = { bottom: { style: "hair", color: { argb: COLORES.borde } } };
    });
    fila.height = 20;
  }

  productos.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: Math.max(5, 5 + cierre.detalles.length), column: COLUMNAS.length },
  };
  productos.headerFooter.oddFooter = "WebBuys - Cierre de inventario | Página &P de &N";

  return libro.xlsx.writeBuffer();
}
