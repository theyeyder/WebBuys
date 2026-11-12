import ExcelJS from "exceljs";

/* =========================================================
   INFORMES EXCEL - WEBBUYS
========================================================= */

const COLORES = {
  primary: "0F766E",
  primary2: "159A75",
  accent: "20AFB2",
  ink: "172B25",
  muted: "667085",
  line: "DCE7E2",
  soft: "F5F9F7",
  soft2: "EDF6F2",
  white: "FFFFFF",
  dangerSoft: "FFF0EE",
  danger: "B42318",
  warningSoft: "FFF7E6",
  warning: "9A6700",
  successSoft: "EAF8F0",
  success: "087443",
};

function normalizar(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function esCampoMoneda(campo = "", titulo = "", fila = null) {
  const texto = normalizar(`${campo} ${titulo}`);

  if (
    normalizar(campo) === "factura" ||
    normalizar(titulo) === "factura"
  ) {
    return false;
  }

  if (campo === "valor" && fila?.indicador) {
    return /valor|venta|ingreso|egreso|cartera|pago|saldo|factur/.test(
      normalizar(fila.indicador)
    );
  }

  return /precio|valor|subtotal|descuento|total|saldo|abono|abonad|costo|ingreso|egreso|iva|factur|efectivo|transferencia|credito|sinclasificar|contado|vencido|diferencia/.test(
    texto
  );
}

function esCampoNumerico(campo = "", titulo = "") {
  return /cantidad|movimientos|registros|stock|unidades|numero|pedidos|entregas/.test(
    normalizar(`${campo} ${titulo}`)
  );
}

function anchoColumna(columna) {
  const campo = normalizar(columna.campo);
  const titulo = normalizar(columna.titulo);
  const texto = `${campo} ${titulo}`;

  if (/cliente|nombre|descripcion|concepto|observacion|indicador/.test(texto)) {
    return 30;
  }

  if (/direccion|razon/.test(texto)) {
    return 26;
  }

  if (/fecha/.test(texto)) {
    return 20;
  }

  if (/estado|metodo|forma de pago|ruta|zona/.test(texto)) {
    return 18;
  }

  if (/codigo|pedido|documento|telefono/.test(texto)) {
    return 17;
  }

  if (esCampoMoneda(columna.campo, columna.titulo)) {
    return 17;
  }

  return 16;
}

function fechaCorta(valor) {
  const fecha = String(valor || "");
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  return coincidencia ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}` : fecha;
}

function fechaExcelCartera(campo, valor, tipo) {
  if (tipo !== "cartera" || !["fechaEntrega", "vencimiento"].includes(campo)) return null;
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor ? fecha : null;
}

function fechaGeneracion() {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function estilizarEstado(celda, valor) {
  const estado = normalizar(valor);

  if (/entregado|activo|pagado|confirmado|cerrado|completado/.test(estado)) {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.successSoft },
    };
    celda.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: COLORES.success },
    };
    return;
  }

  if (/anulad|cancelad|inactivo|vencido|rechazad/.test(estado)) {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.dangerSoft },
    };
    celda.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: COLORES.danger },
    };
    return;
  }

  if (/pendiente|preparar|ruta|abierto|parcial/.test(estado)) {
    celda.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.warningSoft },
    };
    celda.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: COLORES.warning },
    };
  }
}

export async function generarInformeExcel({
  tipo = "",
  titulo = "Informe",
  nota = "",
  desde = "",
  hasta = "",
  usuario = "",
  columnas = [],
  filas = [],
  indicadores = null,
  secciones = [],
  empresa = {},
}) {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "WebBuys";
  workbook.lastModifiedBy = usuario || "WebBuys";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet("Informe", {
    properties: {
      defaultRowHeight: 19,
    },
    pageSetup: {
      paperSize: 9,
      orientation: columnas.length > 6 ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: {
        left: 0.25,
        right: 0.25,
        top: 0.45,
        bottom: 0.45,
        header: 0.2,
        footer: 0.2,
      },
    },
  });

  const nombreEmpresa =
    empresa?.nombreComercial ||
    empresa?.razonSocial ||
    "WEBBUYS";

  const cantidadColumnas = Math.max(columnas.length, 2);
  const ultimaColumna = worksheet.getColumn(cantidadColumnas).letter;

  /* =======================================================
     CABECERA CORPORATIVA
  ======================================================= */

  worksheet.mergeCells(`A1:${ultimaColumna}1`);
  const marca = worksheet.getCell("A1");
  marca.value = nombreEmpresa;
  marca.font = {
    name: "Aptos Display",
    size: 20,
    bold: true,
    color: { argb: COLORES.white },
  };
  marca.alignment = {
    vertical: "middle",
    horizontal: "left",
  };
  marca.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORES.primary },
  };
  worksheet.getRow(1).height = 34;

  worksheet.mergeCells(`A2:${ultimaColumna}2`);
  const tituloCell = worksheet.getCell("A2");
  tituloCell.value = titulo;
  tituloCell.font = {
    name: "Aptos Display",
    size: 16,
    bold: true,
    color: { argb: COLORES.ink },
  };
  tituloCell.alignment = {
    vertical: "middle",
    horizontal: "left",
  };
  tituloCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORES.soft2 },
  };
  worksheet.getRow(2).height = 28;

  const meta = [
    ["Período", `${tipo === "caja" || tipo === "cartera" ? fechaCorta(desde) : (desde || "No definido")}  →  ${tipo === "caja" || tipo === "cartera" ? fechaCorta(hasta) : (hasta || "No definido")}`],
    ["Usuario", usuario || "No definido"],
    ["Generado", fechaGeneracion()],
  ];

  meta.forEach(([etiqueta, valor], indice) => {
    const fila = 3 + indice;

    worksheet.getCell(`A${fila}`).value = etiqueta;
    worksheet.getCell(`A${fila}`).font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: COLORES.primary },
    };

    if (cantidadColumnas > 2) {
      worksheet.mergeCells(`B${fila}:${ultimaColumna}${fila}`);
    }

    const valorCell = worksheet.getCell(`B${fila}`);
    valorCell.value = valor;
    valorCell.font = {
      name: "Aptos",
      size: 10,
      color: { argb: COLORES.muted },
    };
  });

  if (nota) {
    if (cantidadColumnas > 1) worksheet.mergeCells(`A6:${ultimaColumna}6`);
    const notaCell = worksheet.getCell("A6");
    notaCell.value = nota;
    notaCell.font = { name: "Aptos", size: 9, italic: true, color: { argb: COLORES.muted } };
    notaCell.alignment = { wrapText: true, vertical: "middle" };
    worksheet.getRow(6).height = 32;
  } else {
    worksheet.getRow(6).height = 8;
  }

  /* =======================================================
     TABLA
  ======================================================= */

  const headerRowNumber = 7;
  const encabezados = columnas.map((columna) => columna.titulo);
  const filaEncabezado = worksheet.getRow(headerRowNumber);

  encabezados.forEach((encabezado, index) => {
    const cell = filaEncabezado.getCell(index + 1);
    cell.value = encabezado;
    cell.font = {
      name: "Aptos",
      size: 10,
      bold: true,
      color: { argb: COLORES.white },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "left",
      wrapText: true,
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: COLORES.primary },
    };
    cell.border = {
      right: {
        style: "thin",
        color: { argb: "3A8F88" },
      },
    };
  });

  filaEncabezado.height = 30;

  const firstDataRow = headerRowNumber + 1;

  filas.forEach((fila, filaIndex) => {
    const row = worksheet.getRow(firstDataRow + filaIndex);

    columnas.forEach((columna, columnIndex) => {
      const cell = row.getCell(columnIndex + 1);
      const valor = fila[columna.campo] ?? "";
      const moneda = esCampoMoneda(
        columna.campo,
        columna.titulo,
        fila
      );
      const numerico = esCampoNumerico(
        columna.campo,
        columna.titulo
      );

      const fechaExcel = fechaExcelCartera(columna.campo, valor, tipo);
      if (fechaExcel) {
        cell.value = fechaExcel;
        cell.numFmt = "dd/mm/yyyy";
      } else if ((moneda || numerico) && valor !== "" && Number.isFinite(Number(valor))) {
        cell.value = Number(valor);
      } else {
        cell.value = valor;
      }

      cell.font = {
        name: "Aptos",
        size: 10,
        color: { argb: "33443E" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: moneda || numerico ? "right" : "left",
        wrapText: true,
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: {
          argb: filaIndex % 2 === 0 ? COLORES.white : COLORES.soft,
        },
      };

      cell.border = {
        bottom: {
          style: "hair",
          color: { argb: COLORES.line },
        },
      };

      if (moneda && typeof cell.value === "number") {
        cell.numFmt = '$ #,##0;[Red]-$ #,##0';
      }

      const esEstado =
        normalizar(columna.campo).includes("estado") ||
        normalizar(columna.titulo).includes("estado");

      if (esEstado && valor !== "") {
        estilizarEstado(cell, valor);
      }
    });

    row.height = 24;
  });

  /* =======================================================
     TOTAL / PIE DE TABLA
  ======================================================= */

  const lastDataRow = firstDataRow + filas.length - 1;
  const totalRowNumber = Math.max(firstDataRow, lastDataRow + 2);
  const totalRow = worksheet.getRow(totalRowNumber);

  const filasVigentes =
    tipo === "facturas"
      ? filas.filter((fila) => !fila.anulada)
      : filas;

  const facturasAnuladas =
    tipo === "facturas"
      ? filas.length - filasVigentes.length
      : 0;

  totalRow.getCell(1).value =
    tipo === "facturas"
      ? `Total registros: ${filas.length} | Vigentes: ${filasVigentes.length} | Anuladas: ${facturasAnuladas}`
      : `Total registros: ${filas.length}`;

  totalRow.getCell(1).font = {
    name: "Aptos",
    size: 10,
    bold: true,
    color: { argb: COLORES.primary },
  };

  if (filas.length > 0 && tipo !== "resumen") {
    columnas.forEach((columna, index) => {
      const esMoneda = esCampoMoneda(
        columna.campo,
        columna.titulo
      );

      // En Caja los ingresos y egresos tienen signos contables diferentes;
      // sumar el valor absoluto de todos los movimientos sería engañoso.
      if (!esMoneda || (tipo === "caja" && columna.campo === "valor")) {
        return;
      }

      const letter = worksheet.getColumn(index + 1).letter;
      const cell = totalRow.getCell(index + 1);

      if (tipo === "facturas") {
        const totalVigente = filasVigentes.reduce(
          (acumulado, fila) => {
            const valor = Number(fila[columna.campo]);
            return acumulado + (Number.isFinite(valor) ? valor : 0);
          },
          0
        );

        cell.value = totalVigente;
      } else {
        cell.value = {
          formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`,
        };
      }

      cell.numFmt = '$ #,##0;[Red]-$ #,##0';
      cell.font = {
        name: "Aptos",
        size: 10,
        bold: true,
        color: { argb: COLORES.ink },
      };
      cell.alignment = {
        horizontal: "right",
      };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: COLORES.soft2 },
      };
    });
  }

  totalRow.height = 24;

  /* =======================================================
     CONFIGURACIÓN FINAL
  ======================================================= */

  columnas.forEach((columna, index) => {
    worksheet.getColumn(index + 1).width = anchoColumna(columna);
  });

  if (columnas.length > 0) {
    worksheet.autoFilter = {
      from: {
        row: headerRowNumber,
        column: 1,
      },
      to: {
        row: Math.max(headerRowNumber, lastDataRow),
        column: columnas.length,
      },
    };
  }

  worksheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
      activeCell: `A${firstDataRow}`,
    },
  ];

  worksheet.headerFooter.oddFooter =
    `&L${nombreEmpresa}&CGenerado por WebBuys&R&P de &N`;

  worksheet.pageSetup.printTitlesRow = `${headerRowNumber}:${headerRowNumber}`;

  if ((tipo === "caja" || tipo === "cartera") && indicadores) {
    const nombres = {
      cajas: "Cajas registradas", movimientos: "Movimientos", ingresos: "Ingresos",
      egresos: "Egresos", neto: "Movimiento neto", efectivoIngresado: "Ingresos en efectivo",
      transferencias: "Transferencias", recaudosCartera: "Recaudos de cartera",
      cierres: "Cierres del período", diferenciaCierres: "Diferencia de cierres",
      cuentas: "Cuentas", valorOriginal: "Valor original", abonadoHistorico: "Total abonado actual",
      saldoPendiente: "Saldo pendiente actual", saldoVencido: "Saldo vencido actual",
      pagosPeriodo: "Abonos del período", efectivoPeriodo: "Abonos en efectivo",
      transferenciaPeriodo: "Abonos por transferencia",
    };
    const contadores = new Set(["cajas", "movimientos", "cierres", "cuentas"]);
    const hoja = workbook.addWorksheet("Resumen financiero");
    hoja.columns = [{ width: 36 }, { width: 24 }];
    hoja.mergeCells("A1:B1");
    hoja.getCell("A1").value = `${titulo} · Indicadores`;
    hoja.getCell("A1").font = { bold: true, size: 16, color: { argb: COLORES.primary } };
    hoja.getRow(1).height = 30;
    hoja.addRow(["Período", `${fechaCorta(desde)} a ${fechaCorta(hasta)}`]);
    hoja.addRow(["Alcance", nota]);
    hoja.getRow(3).height = 48;
    hoja.getCell("B3").alignment = { wrapText: true, vertical: "top" };
    const cabecera = hoja.addRow(["Indicador", "Valor"]);
    cabecera.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.primary } };
      cell.font = { bold: true, color: { argb: COLORES.white } };
    });
    for (const [clave, valor] of Object.entries(indicadores)) {
      const fila = hoja.addRow([nombres[clave] || clave, Number(valor) || 0]);
      fila.getCell(2).numFmt = contadores.has(clave) ? '#,##0' : '$ #,##0;[Red]-$ #,##0';
      fila.getCell(2).alignment = { horizontal: "right" };
    }
    hoja.views = [{ state: "frozen", ySplit: 4 }];
  }

  secciones.forEach((seccion, indice) => {
    const columnasSeccion = Array.isArray(seccion.columnas) ? seccion.columnas : [];
    const filasSeccion = Array.isArray(seccion.filas) ? seccion.filas : [];
    if (!columnasSeccion.length) return;
    const hoja = workbook.addWorksheet(`Detalle ${indice + 1}`);
    const ultima = hoja.getColumn(columnasSeccion.length).letter;
    hoja.mergeCells(`A1:${ultima}1`);
    hoja.getCell("A1").value = seccion.titulo || "Detalle adicional";
    hoja.getCell("A1").font = { bold: true, size: 16, color: { argb: COLORES.primary } };
    hoja.getRow(1).height = 32;
    const encabezado = hoja.getRow(3);
    columnasSeccion.forEach((columna, indiceColumna) => {
      const celda = encabezado.getCell(indiceColumna + 1);
      celda.value = columna.titulo;
      celda.font = { bold: true, color: { argb: COLORES.white } };
      celda.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLORES.primary } };
      celda.alignment = { wrapText: true, vertical: "middle" };
      hoja.getColumn(indiceColumna + 1).width = anchoColumna(columna);
    });
    encabezado.height = 28;
    filasSeccion.forEach((fila, indiceFila) => {
      const r = hoja.getRow(4 + indiceFila);
      columnasSeccion.forEach((columna, indiceColumna) => {
        const celda = r.getCell(indiceColumna + 1);
        const valor = fila[columna.campo] ?? "";
        const esMoneda = esCampoMoneda(columna.campo, columna.titulo, fila);
        const esNumero = esCampoNumerico(columna.campo, columna.titulo);
        const fechaExcel = fechaExcelCartera(columna.campo, valor, tipo);
        celda.value = fechaExcel || ((esMoneda || esNumero) && Number.isFinite(Number(valor)) && valor !== ""
          ? Number(valor) : valor);
        if (fechaExcel) celda.numFmt = "dd/mm/yyyy";
        if (esMoneda && typeof celda.value === "number") celda.numFmt = '$ #,##0;[Red]-$ #,##0';
        celda.alignment = { wrapText: true, horizontal: esMoneda || esNumero ? "right" : "left" };
        celda.fill = { type: "pattern", pattern: "solid",
          fgColor: { argb: indiceFila % 2 === 0 ? COLORES.white : COLORES.soft } };
      });
    });
    hoja.autoFilter = { from: { row: 3, column: 1 },
      to: { row: Math.max(3, 3 + filasSeccion.length), column: columnasSeccion.length } };
    hoja.views = [{ state: "frozen", ySplit: 3 }];
  });

  return workbook.xlsx.writeBuffer();
}
