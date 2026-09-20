function moneda(
  valor
) {

  return Number(
    valor ||
    0
  ).toLocaleString(
    "es-CO",
    {
      style:
        "currency",

      currency:
        "COP",

      maximumFractionDigits:
        0,
    }
  );

}


function fechaHora(
  fecha
) {

  if (!fecha) {
    return "-";
  }


  return new Date(
    fecha
  ).toLocaleString(
    "es-CO"
  );

}


function escaparHTML(
  valor
) {

  return String(
    valor ??
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function nombreUsuario(
  usuario
) {

  if (!usuario) {
    return "-";
  }


  return (
    [
      usuario.nombres,
      usuario.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    usuario.usuario ||
    "-"
  );

}


function pedidoMovimiento(
  movimiento
) {

  return (
    movimiento.pedidoCodigo ||
    movimiento.pedido?.codigo ||
    movimiento.factura
      ?.pedidoCodigo ||
    "—"
  );

}


function clienteMovimiento(
  movimiento
) {

  return (
    movimiento.clienteNombre ||
    movimiento.cliente?.nombre ||
    movimiento.cliente
      ?.razonSocial ||
    "—"
  );

}


function facturaMovimiento(
  movimiento
) {

  return (
    movimiento.facturaCodigo ||
    movimiento.factura?.codigo ||
    "—"
  );

}


function observacionMovimiento(
  movimiento
) {

  if (
    movimiento.observacion
  ) {
    return movimiento.observacion;
  }


  if (
    facturaMovimiento(
      movimiento
    ) ===
    "—"
  ) {
    return "Pedido sin factura generada";
  }


  return "Factura generada";

}


const ESTILOS_IMPRESION = `
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  html,
  body {
    margin: 0;
    padding: 0;

    background: #ffffff;
    color: #1f2937;

    font-family:
      Arial,
      Helvetica,
      sans-serif;
  }

  body {
    padding: 20px;
  }

  .caja-print {
    width: 100%;
    max-width: 1160px;

    margin: 0 auto;
  }

  .print-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;

    gap: 24px;

    padding-bottom: 14px;

    border-bottom:
      3px solid
      #0f766e;
  }

  .print-header h1 {
    margin: 0;

    color: #0f766e;

    font-size: 24px;
    font-weight: 900;
  }

  .print-header p {
    margin:
      5px
      0
      0;

    color: #667085;

    font-size: 11px;
    font-weight: 700;
  }

  .print-code {
    display: grid;
    gap: 5px;

    text-align: right;
  }

  .print-code strong {
    color: #172033;

    font-size: 19px;
    font-weight: 900;
  }

  .print-code span {
    display: inline-flex;
    justify-self: end;

    padding:
      5px
      10px;

    border:
      1px solid
      #b8ddd1;

    border-radius: 999px;

    background: #ecfdf3;
    color: #067647;

    font-size: 9px;
    font-weight: 900;
  }

  .print-info {
    display: grid;

    grid-template-columns:
      repeat(
        4,
        minmax(0, 1fr)
      );

    gap: 8px;

    margin-top: 12px;
  }

  .print-info > div {
    min-width: 0;

    padding:
      9px
      10px;

    border:
      1px solid
      #dbe5e1;

    border-radius: 8px;

    background: #f8fbfa;
  }

  .print-info span,
  .print-summary span {
    display: block;

    margin-bottom: 4px;

    color: #667085;

    font-size: 8px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .print-info strong {
    display: block;

    color: #25333d;

    font-size: 10px;
    font-weight: 800;

    line-height: 1.35;

    overflow-wrap: anywhere;
  }

  .print-section-title {
    margin:
      16px
      0
      7px;

    color: #172033;

    font-size: 13px;
    font-weight: 900;

    text-transform: uppercase;
    letter-spacing: 0.035em;
  }

  .print-summary {
    display: grid;

    grid-template-columns:
      repeat(
        6,
        minmax(0, 1fr)
      );

    gap: 7px;
  }

  .print-summary > div {
    min-width: 0;

    padding:
      9px
      8px;

    border:
      1px solid
      #dbe5e1;

    border-radius: 8px;

    background: #ffffff;

    text-align: center;
  }

  .print-summary strong {
    display: block;

    color: #172033;

    font-size: 11px;
    font-weight: 900;

    line-height: 1.2;

    overflow-wrap: anywhere;
  }

  .print-summary.sales > div:nth-child(1) {
    border-color: #abd8cf;
    background: #eef8f6;
  }

  .print-summary.sales > div:nth-child(2) {
    border-color: #b8dfca;
    background: #effaf4;
  }

  .print-summary.sales > div:nth-child(3) {
    border-color: #c5dbef;
    background: #eff8ff;
  }

  .print-summary.sales > div:nth-child(4) {
    border-color: #eed7a8;
    background: #fff8e7;
  }

  .print-summary.cash > div:nth-child(6) {
    border-color: #abd8cf;
    background: #eef8f6;
  }

  .print-reconciliation {
    margin-top: 8px;

    padding:
      8px
      10px;

    border:
      1px solid
      #bfe4d0;

    border-radius: 8px;

    background: #ecfdf3;

    color: #067647;

    font-size: 9px;
    font-weight: 900;

    text-align: center;
  }

  .print-reconciliation.warning {
    border-color: #eed7a8;

    background: #fff8e7;
    color: #9a6700;
  }

  table {
    width: 100%;

    border-collapse: collapse;

    table-layout: fixed;
  }

  thead {
    display: table-header-group;
  }

  tr {
    page-break-inside: avoid;
  }

  th {
    padding:
      7px
      6px;

    border:
      1px solid
      #1d776c;

    background: #218476;
    color: #ffffff;

    font-size: 7.5px;
    font-weight: 900;

    text-align: left;

    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  td {
    padding:
      7px
      6px;

    border:
      1px solid
      #dfe7e4;

    color: #344054;

    font-size: 8px;

    line-height: 1.35;

    vertical-align: top;

    overflow-wrap: anywhere;
  }

  tbody tr:nth-child(even) td {
    background: #f8fbfa;
  }

  .orders th:nth-child(1),
  .orders td:nth-child(1) {
    width: 12%;
  }

  .orders th:nth-child(2),
  .orders td:nth-child(2) {
    width: 21%;
  }

  .orders th:nth-child(3),
  .orders td:nth-child(3) {
    width: 13%;
  }

  .orders th:nth-child(4),
  .orders td:nth-child(4) {
    width: 13%;
  }

  .orders th:nth-child(5),
  .orders td:nth-child(5) {
    width: 27%;
  }

  .orders th:nth-child(6),
  .orders td:nth-child(6) {
    width: 14%;
  }

  .manual th:nth-child(1),
  .manual td:nth-child(1) {
    width: 18%;
  }

  .manual th:nth-child(2),
  .manual td:nth-child(2) {
    width: 11%;
  }

  .manual th:nth-child(3),
  .manual td:nth-child(3) {
    width: 13%;
  }

  .manual th:nth-child(4),
  .manual td:nth-child(4) {
    width: 28%;
  }

  .manual th:nth-child(5),
  .manual td:nth-child(5) {
    width: 17%;
  }

  .manual th:nth-child(6),
  .manual td:nth-child(6) {
    width: 13%;
  }

  .money {
    text-align: right;
    font-weight: 900;
  }

  .pedido-code,
  .factura-code {
    color: #087443;

    font-weight: 900;
  }

  .no-invoice {
    color: #9a6700;

    font-weight: 800;
  }

  .vacio {
    padding: 20px;

    color: #98a2b3;

    text-align: center;
  }

  .print-note {
    margin-top: 13px;

    padding:
      9px
      11px;

    border:
      1px solid
      #dbe5e1;

    border-radius: 8px;

    background: #f8fbfa;
  }

  .print-note strong {
    color: #172033;

    font-size: 9px;
    font-weight: 900;
  }

  .print-note p {
    margin:
      4px
      0
      0;

    color: #475467;

    font-size: 8px;

    line-height: 1.45;
  }

  footer {
    margin-top: 13px;

    padding-top: 8px;

    border-top:
      1px solid
      #dbe5e1;

    color: #667085;

    font-size: 8px;

    text-align: right;
  }

  @media print {

    @page {
      size: A4 landscape;
      margin: 8mm;
    }

    html,
    body {
      width: auto;
      min-width: 0;
    }

    body {
      padding: 0;
    }

    .caja-print {
      max-width: none;
    }
  }
`;


export function imprimirCierreCaja(
  detalle
) {

  if (
    !detalle?.caja
  ) {
    return;
  }


  const {
    caja,
    resumen = {},
    movimientos = [],
  } = detalle;


  const pedidos =
    movimientos.filter(
      (
        movimiento
      ) =>
        movimiento.estado !==
          "Anulado" &&
        (
          movimiento.origen ===
            "Pedido" ||
          (
            movimiento.origen ===
              "Factura" &&
            movimiento.tipo ===
              "Ingreso"
          )
        )
    );


  const manuales =
    movimientos.filter(
      (
        movimiento
      ) =>
        movimiento.estado !==
          "Anulado" &&
        !(
          movimiento.origen ===
            "Pedido" ||
          (
            movimiento.origen ===
              "Factura" &&
            movimiento.tipo ===
              "Ingreso"
          )
        )
    );


  const filasPedidos =
    pedidos
      .map(
        (
          movimiento
        ) => {

          const factura =
            facturaMovimiento(
              movimiento
            );


          return `
            <tr>
              <td class="pedido-code">
                ${escaparHTML(
                  pedidoMovimiento(
                    movimiento
                  )
                )}
              </td>

              <td>
                ${escaparHTML(
                  clienteMovimiento(
                    movimiento
                  )
                )}
              </td>

              <td>
                ${escaparHTML(
                  movimiento.metodoPago ||
                  "Efectivo"
                )}
              </td>

              <td class="${
                factura ===
                "—"
                  ? "no-invoice"
                  : "factura-code"
              }">
                ${escaparHTML(
                  factura
                )}
              </td>

              <td>
                ${escaparHTML(
                  observacionMovimiento(
                    movimiento
                  )
                )}
              </td>

              <td class="money">
                ${moneda(
                  movimiento.valor
                )}
              </td>
            </tr>
          `;

        }
      )
      .join("");


  const filasManuales =
    manuales
      .map(
        (
          movimiento
        ) => `
          <tr>
            <td>
              ${escaparHTML(
                fechaHora(
                  movimiento.createdAt
                )
              )}
            </td>

            <td>
              ${escaparHTML(
                movimiento.tipo
              )}
            </td>

            <td>
              ${escaparHTML(
                movimiento.origen
              )}
            </td>

            <td>
              ${escaparHTML(
                movimiento.concepto
              )}
            </td>

            <td>
              ${escaparHTML(
                nombreUsuario(
                  movimiento.usuario
                )
              )}
            </td>

            <td class="money">
              ${
                movimiento.tipo ===
                "Ingreso"
                  ? "+"
                  : "−"
              }${moneda(
                movimiento.valor
              )}
            </td>
          </tr>
        `
      )
      .join("");


  const diferenciaConciliacion =
    Number(
      resumen
        .diferenciaConciliacion ||
      0
    );


  const conciliacionCorrecta =
    Math.abs(
      diferenciaConciliacion
    ) <
    0.01;


  const ventana =
    window.open(
      "",
      "_blank",
      "width=1200,height=820"
    );


  if (!ventana) {

    alert(
      "No se pudo abrir la ventana de impresión. Verifique que el navegador permita ventanas emergentes."
    );

    return;

  }


  const contenido = `
    <!DOCTYPE html>

    <html lang="es">

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>
          Cierre ${escaparHTML(
            caja.codigo
          )}
        </title>

        <style>
          ${ESTILOS_IMPRESION}
        </style>

      </head>


      <body>

        <main class="caja-print">

          <header class="print-header">

            <div>

              <h1>
                CIERRE DE CAJA
              </h1>

              <p>
                WebBuys · Conciliación de pedidos entregados
              </p>

            </div>


            <div class="print-code">

              <strong>
                ${escaparHTML(
                  caja.codigo
                )}
              </strong>

              <span>
                ${
                  caja.estado ===
                  "Cerrada"
                    ? "Cerrada"
                    : "Abierta"
                }
              </span>

            </div>

          </header>


          <section class="print-info">

            <div>
              <span>
                Apertura
              </span>
              <strong>
                ${escaparHTML(
                  fechaHora(
                    caja.fechaApertura
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Cierre
              </span>
              <strong>
                ${escaparHTML(
                  fechaHora(
                    caja.fechaCierre
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Abierta por
              </span>
              <strong>
                ${escaparHTML(
                  nombreUsuario(
                    caja.abiertoPor
                  )
                )}
              </strong>
            </div>

            <div>
              <span>
                Cerrada por
              </span>
              <strong>
                ${escaparHTML(
                  nombreUsuario(
                    caja.cerradoPor
                  )
                )}
              </strong>
            </div>

          </section>


          <div class="print-section-title">
            Ventas entregadas y medios de pago
          </div>

          <section class="print-summary sales">

            <div>
              <span>
                Total entregado
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalVentasEntregadas
                )}
              </strong>
            </div>

            <div>
              <span>
                Efectivo
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalEfectivoPedidos
                )}
              </strong>
            </div>

            <div>
              <span>
                Transferencias
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalTransferencias
                )}
              </strong>
            </div>

            <div>
              <span>
                Crédito
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalCredito
                )}
              </strong>
            </div>

            <div>
              <span>
                Medios de pago
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalMediosPago
                )}
              </strong>
            </div>

            <div>
              <span>
                Pedidos
              </span>
              <strong>
                ${escaparHTML(
                  resumen
                    .cantidadPedidosEntregados ||
                  0
                )}
              </strong>
            </div>

          </section>


          <div
            class="print-reconciliation ${
              conciliacionCorrecta
                ? ""
                : "warning"
            }"
          >
            ${
              conciliacionCorrecta
                ? "Conciliación correcta: el total entregado coincide con la suma de los medios de pago."
                : `Diferencia de conciliación: ${moneda(
                    diferenciaConciliacion
                  )}`
            }
          </div>


          <div class="print-section-title">
            Efectivo físico
          </div>

          <section class="print-summary cash">

            <div>
              <span>
                Saldo inicial
              </span>
              <strong>
                ${moneda(
                  resumen.saldoInicial
                )}
              </strong>
            </div>

            <div>
              <span>
                Pedidos efectivo
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalEfectivoPedidos
                )}
              </strong>
            </div>

            <div>
              <span>
                Ingresos manuales
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalIngresosManuales
                )}
              </strong>
            </div>

            <div>
              <span>
                Egresos
              </span>
              <strong>
                ${moneda(
                  resumen
                    .totalEgresos
                )}
              </strong>
            </div>

            <div>
              <span>
                Contado
              </span>
              <strong>
                ${
                  resumen.efectivoContado ===
                    null ||
                  resumen.efectivoContado ===
                    undefined
                    ? "—"
                    : moneda(
                        resumen.efectivoContado
                      )
                }
              </strong>
            </div>

            <div>
              <span>
                Esperado
              </span>
              <strong>
                ${moneda(
                  resumen.saldoEsperado
                )}
              </strong>
            </div>

          </section>


          <div class="print-section-title">
            Pedidos entregados
          </div>

          <table class="orders">

            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Tipo de pago</th>
                <th>Factura</th>
                <th>Observación</th>
                <th class="money">Total</th>
              </tr>
            </thead>

            <tbody>

              ${
                filasPedidos ||
                `
                  <tr>
                    <td
                      colspan="6"
                      class="vacio"
                    >
                      Sin pedidos entregados
                    </td>
                  </tr>
                `
              }

            </tbody>

          </table>


          <div class="print-section-title">
            Movimientos manuales
          </div>

          <table class="manual">

            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Origen</th>
                <th>Concepto</th>
                <th>Usuario</th>
                <th class="money">Valor</th>
              </tr>
            </thead>

            <tbody>

              ${
                filasManuales ||
                `
                  <tr>
                    <td
                      colspan="6"
                      class="vacio"
                    >
                      Sin movimientos manuales
                    </td>
                  </tr>
                `
              }

            </tbody>

          </table>


          ${
            caja.observacionesCierre
              ? `
                <section class="print-note">

                  <strong>
                    Observaciones de cierre
                  </strong>

                  <p>
                    ${escaparHTML(
                      caja.observacionesCierre
                    )}
                  </p>

                </section>
              `
              : ""
          }


          <footer>

            <span>
              Impreso:
              ${escaparHTML(
                fechaHora(
                  new Date()
                )
              )}
            </span>

          </footer>

        </main>


        <script>

          window.addEventListener(
            "load",
            function () {

              setTimeout(
                function () {
                  window.print();
                },
                450
              );

            }
          );

        </script>

      </body>

    </html>
  `;


  ventana.document.open();

  ventana.document.write(
    contenido
  );

  ventana.document.close();

}
