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

  return /precio|valor|subtotal|descuento|total|saldo|abono|costo|ingreso|egreso|iva|factur/.test(
    texto
  );
}

function esCampoNumerico(campo = "", titulo = "") {
  return /cantidad|movimientos|registros|stock|unidades|numero/.test(
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
  desde = "",
  hasta = "",
  usuario = "",
  columnas = [],
  filas = [],
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
    ["Período", `${desde || "No definido"}  →  ${hasta || "No definido"}`],
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

  worksheet.getRow(6).height = 8;

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

      if ((moneda || numerico) && Number.isFinite(Number(valor))) {
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

      if (!esMoneda) {
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

  return workbook.xlsx.writeBuffer();
}
