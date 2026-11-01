import pdfmake from "pdfmake";

/* =========================================================
   FUENTES PDF
========================================================= */

pdfmake.addFonts({
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique",
  },
});

const COLORES = {
  primary: "#0F766E",
  primary2: "#159A75",
  accent: "#20AFB2",
  ink: "#172B25",
  muted: "#667085",
  line: "#DCE7E2",
  soft: "#F5F9F7",
  soft2: "#EDF6F2",
  white: "#FFFFFF",
  success: "#087443",
  warning: "#9A6700",
  danger: "#B42318",
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

  return /precio|valor|subtotal|descuento|total|saldo|abono|costo|ingreso|egreso|iva|factur|efectivo|transferencia|credito|sinclasificar/.test(
    texto
  );
}

function esCampoNumerico(campo = "", titulo = "") {
  return /cantidad|movimientos|registros|stock|unidades|numero|pedidos|entregas/.test(
    normalizar(`${campo} ${titulo}`)
  );
}

function moneda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return String(valor ?? "");
  }

  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(numero);
}

function numero(valor) {
  const dato = Number(valor);

  if (!Number.isFinite(dato)) {
    return String(valor ?? "");
  }

  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 2,
  }).format(dato);
}

function fechaGeneracion() {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
}

function colorEstado(valor) {
  const estado = normalizar(valor);

  if (/entregado|activo|pagado|confirmado|cerrado|completado/.test(estado)) {
    return COLORES.success;
  }

  if (/anulad|cancelad|inactivo|vencido|rechazad/.test(estado)) {
    return COLORES.danger;
  }

  if (/pendiente|preparar|ruta|abierto|parcial/.test(estado)) {
    return COLORES.warning;
  }

  return COLORES.ink;
}

function anchoPdf(columna) {
  const texto = normalizar(`${columna.campo} ${columna.titulo}`);

  if (/cliente|nombre|descripcion|concepto|observacion|indicador/.test(texto)) {
    return 105;
  }

  if (/fecha/.test(texto)) {
    return 66;
  }

  if (/metodo|forma de pago/.test(texto)) {
    return 66;
  }

  if (/ruta|zona/.test(texto)) {
    return 60;
  }

  if (/estado/.test(texto)) {
    return 58;
  }

  if (/codigo|pedido|documento/.test(texto)) {
    return 58;
  }

  if (esCampoMoneda(columna.campo, columna.titulo)) {
    return 60;
  }

  return 58;
}

function crearMetricas({ tipo, columnas, filas }) {
  const items = [
    {
      etiqueta: "REGISTROS",
      valor: new Intl.NumberFormat("es-CO").format(filas.length),
    },
  ];

  if (tipo === "resumen") {
    return items;
  }

  if (tipo === "facturas") {
    const vigentes = filas.filter((fila) => !fila.anulada);
    const anuladas = filas.filter((fila) => fila.anulada);

    const totalFacturado = vigentes.reduce((acumulado, fila) => {
      const valor = Number(fila.total);
      return acumulado + (Number.isFinite(valor) ? valor : 0);
    }, 0);

    return [
      items[0],
      {
        etiqueta: "VIGENTES",
        valor: new Intl.NumberFormat("es-CO").format(vigentes.length),
      },
      {
        etiqueta: "ANULADAS",
        valor: new Intl.NumberFormat("es-CO").format(anuladas.length),
      },
      {
        etiqueta: "TOTAL FACTURADO",
        valor: moneda(totalFacturado),
      },
    ];
  }

  if (tipo === "repartidores" || tipo === "rutas-zonas") {
    const sumar = (campo) => filas.reduce((acumulado, fila) => {
      const valor = Number(fila[campo]);
      return acumulado + (Number.isFinite(valor) ? valor : 0);
    }, 0);

    return [
      { etiqueta: "EFECTIVO REGISTRADO", valor: moneda(sumar("efectivo")) },
      { etiqueta: "TRANSFERENCIA REGISTRADA", valor: moneda(sumar("transferencia")) },
      { etiqueta: "VENTAS A CRÉDITO", valor: moneda(sumar("credito")) },
      { etiqueta: "TOTAL VENDIDO", valor: moneda(sumar("total")) },
    ];
  }

  const candidatas = [
    ["total", "TOTAL GENERAL"],
    ["subtotal", "SUBTOTAL"],
    ["descuento", "DESCUENTOS"],
    ["saldo", "SALDO"],
    ["saldoPendiente", "SALDO PENDIENTE"],
    ["valorOriginal", "VALOR ORIGINAL"],
  ];

  for (const [campo, etiqueta] of candidatas) {
    const existe = columnas.some((columna) => columna.campo === campo);

    if (!existe) {
      continue;
    }

    const total = filas.reduce((acumulado, fila) => {
      const valor = Number(fila[campo]);
      return acumulado + (Number.isFinite(valor) ? valor : 0);
    }, 0);

    items.push({
      etiqueta,
      valor: moneda(total),
    });

    if (items.length >= 4) {
      break;
    }
  }

  return items;
}

/* =========================================================
   GENERAR INFORME PDF
========================================================= */

export async function generarInformePdf({
  tipo = "",
  titulo = "Informe",
  nota = "",
  desde = "",
  hasta = "",
  usuario = "",
  columnas = [],
  filas = [],
  empresa = {},
}) {
  const nombreEmpresa =
    empresa?.nombreComercial ||
    empresa?.razonSocial ||
    "WEBBUYS";

  const detalleEmpresa = [
    empresa?.nit ? `NIT ${empresa.nit}` : "",
    empresa?.ciudad || "",
    empresa?.telefono || "",
  ]
    .filter(Boolean)
    .join("  ·  ");

  const esHorizontal = columnas.length > 6;
  const fontSize = columnas.length >= 10 ? 7 : columnas.length > 7 ? 7.7 : 8.5;

  const body = [];

  body.push(
    columnas.map((columna) => ({
      text: String(columna.titulo || "").toUpperCase(),
      bold: true,
      color: COLORES.white,
      fontSize: fontSize - 0.2,
      margin: [4, 5, 4, 5],
      alignment:
        esCampoMoneda(columna.campo, columna.titulo) ||
        esCampoNumerico(columna.campo, columna.titulo)
          ? "right"
          : "left",
    }))
  );

  filas.forEach((fila, filaIndex) => {
    body.push(
      columnas.map((columna) => {
        const valor = fila[columna.campo] ?? "";
        const esMoneda = esCampoMoneda(
          columna.campo,
          columna.titulo,
          fila
        );
        const esNumerico = esCampoNumerico(
          columna.campo,
          columna.titulo
        );
        const esEstado =
          normalizar(columna.campo).includes("estado") ||
          normalizar(columna.titulo).includes("estado");

        let texto = String(valor ?? "");

        if (esMoneda) {
          texto = moneda(valor);
        } else if (esNumerico && Number.isFinite(Number(valor))) {
          texto = numero(valor);
        }

        return {
          text: texto,
          color: esEstado ? colorEstado(valor) : "#33443E",
          bold: esEstado,
          fontSize,
          margin: [4, 4, 4, 4],
          alignment: esMoneda || esNumerico ? "right" : "left",
          fillColor: filaIndex % 2 === 0 ? COLORES.white : COLORES.soft,
        };
      })
    );
  });

  const metricas = crearMetricas({
    tipo,
    columnas,
    filas,
  });

  const metricasTable = {
    table: {
      widths: metricas.map(() => "*"),
      body: [
        metricas.map((item) => ({
          stack: [
            {
              text: item.etiqueta,
              fontSize: 7.5,
              bold: true,
              color: COLORES.muted,
              margin: [0, 0, 0, 4],
            },
            {
              text: item.valor,
              fontSize: 12,
              bold: true,
              color: COLORES.ink,
            },
          ],
          fillColor: COLORES.soft,
          margin: [9, 8, 9, 8],
        })),
      ],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => COLORES.line,
      vLineColor: () => COLORES.line,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
    },
    margin: [0, 0, 0, 14],
  };

  const widths = columnas.map(anchoPdf);
  const totalAnchos = widths.reduce((a, b) => a + b, 0);
  const maxDisponible = esHorizontal ? 760 : 515;

  const widthsFinales =
    totalAnchos > maxDisponible
      ? columnas.map(() => "*")
      : widths;

  const documentDefinition = {
    pageSize: "A4",
    pageOrientation: esHorizontal ? "landscape" : "portrait",
    pageMargins: [24, 28, 24, 34],

    defaultStyle: {
      font: "Helvetica",
      fontSize: 8.5,
      color: COLORES.ink,
    },

    content: [
      {
        table: {
          widths: ["*", "auto"],
          body: [
            [
              {
                stack: [
                  {
                    text: nombreEmpresa,
                    bold: true,
                    fontSize: 18,
                    color: COLORES.white,
                    margin: [0, 0, 0, 3],
                  },
                  {
                    text: detalleEmpresa || "Sistema de gestión WebBuys",
                    fontSize: 7.5,
                    color: "#DFF8F2",
                  },
                ],
                fillColor: COLORES.primary,
                margin: [12, 9, 10, 9],
              },
              {
                text: "INFORME\nWEBBUYS",
                bold: true,
                fontSize: 8,
                color: COLORES.white,
                alignment: "center",
                fillColor: COLORES.primary2,
                margin: [12, 9, 12, 9],
              },
            ],
          ],
        },
        layout: "noBorders",
        margin: [0, 0, 0, 12],
      },

      {
        text: titulo,
        bold: true,
        fontSize: 16,
        color: COLORES.ink,
        margin: [0, 0, 0, 4],
      },

      {
        text: "Información consolidada para el período seleccionado",
        fontSize: 8,
        color: COLORES.muted,
        margin: [0, 0, 0, 12],
      },

      ...(nota ? [{
        text: nota,
        fontSize: 8,
        color: COLORES.muted,
        margin: [0, 0, 0, 10],
      }] : []),

      {
        table: {
          widths: ["auto", "*", "auto", "*"],
          body: [
            [
              {
                text: "DESDE",
                bold: true,
                fontSize: 7,
                color: COLORES.primary,
                margin: [6, 5, 4, 5],
                fillColor: COLORES.soft2,
              },
              {
                text: desde || "No definido",
                fontSize: 8,
                margin: [4, 5, 8, 5],
                fillColor: COLORES.soft,
              },
              {
                text: "HASTA",
                bold: true,
                fontSize: 7,
                color: COLORES.primary,
                margin: [6, 5, 4, 5],
                fillColor: COLORES.soft2,
              },
              {
                text: hasta || "No definido",
                fontSize: 8,
                margin: [4, 5, 8, 5],
                fillColor: COLORES.soft,
              },
            ],
            [
              {
                text: "USUARIO",
                bold: true,
                fontSize: 7,
                color: COLORES.primary,
                margin: [6, 5, 4, 5],
                fillColor: COLORES.soft2,
              },
              {
                text: usuario || "No definido",
                fontSize: 8,
                margin: [4, 5, 8, 5],
                fillColor: COLORES.soft,
              },
              {
                text: "GENERADO",
                bold: true,
                fontSize: 7,
                color: COLORES.primary,
                margin: [6, 5, 4, 5],
                fillColor: COLORES.soft2,
              },
              {
                text: fechaGeneracion(),
                fontSize: 8,
                margin: [4, 5, 8, 5],
                fillColor: COLORES.soft,
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => COLORES.line,
          vLineColor: () => COLORES.line,
        },
        margin: [0, 0, 0, 12],
      },

      metricasTable,

      {
        text: "DETALLE DEL INFORME",
        bold: true,
        fontSize: 8,
        color: COLORES.primary,
        margin: [0, 0, 0, 6],
      },

      filas.length
        ? {
            table: {
              headerRows: 1,
              dontBreakRows: true,
              widths: widthsFinales,
              body,
            },
            layout: {
              fillColor: (rowIndex) =>
                rowIndex === 0 ? COLORES.primary : null,
              hLineWidth: (i) => (i <= 1 ? 0 : 0.45),
              vLineWidth: () => 0.35,
              hLineColor: () => COLORES.line,
              vLineColor: () => COLORES.line,
              paddingLeft: () => 0,
              paddingRight: () => 0,
              paddingTop: () => 0,
              paddingBottom: () => 0,
            },
          }
        : {
            text: "No hay registros para el período seleccionado.",
            alignment: "center",
            color: COLORES.muted,
            fillColor: COLORES.soft,
            margin: [0, 24, 0, 24],
          },
    ],

    footer(currentPage, pageCount) {
      return {
        columns: [
          {
            text: `${nombreEmpresa}  ·  Generado por WebBuys`,
            alignment: "left",
          },
          {
            text: `Página ${currentPage} de ${pageCount}`,
            alignment: "right",
          },
        ],
        color: "#7D8B86",
        fontSize: 7,
        margin: [24, 10, 24, 0],
      };
    },
  };

  const pdf = pdfmake.createPdf(documentDefinition);
  const buffer = await pdf.getBuffer();

  return Buffer.from(buffer);
}
