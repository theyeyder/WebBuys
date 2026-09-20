  import estilosPedido
    from "../styles/impresiones/pedido.impresion.css?raw";


  /* =========================================
    FORMATEAR MONEDA
  ========================================= */

  function moneda(valor) {

    return new Intl.NumberFormat(
      "es-CO",
      {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(valor || 0)
    );

  }


  /* =========================================
    IMPRIMIR PEDIDO
  ========================================= */

  export function imprimirPedido(
    pedido
  ) {

    if (!pedido) {

      return {
        ok: false,
        tipo: "info",
        mensaje:
          "Seleccione primero un pedido.",
      };

    }


    /* =========================================
      PRODUCTOS
    ========================================= */

    const filas =
      (
        pedido.items ||
        []
      )
        .map(
          (item) => `
            <tr>

              <td>
                ${item.codigoProducto || ""}
              </td>

              <td>

                ${item.nombre || ""}

                ${
                  item.presentacionNombre
                    ? `
                      <br>
                      <small>
                        ${item.presentacionNombre}
                      </small>
                    `
                    : ""
                }

              </td>

              <td>
                ${
                  item.marca ||
                  item.producto?.marca ||
                  "Sin marca"
                }
              </td>

              <td>
                ${item.cantidad || 0}
              </td>

              <td>
                ${moneda(
                  item.precioAplicado
                )}
              </td>

              <td>
                ${moneda(
                  item.subtotal
                )}
              </td>

            </tr>
          `
        )
        .join("");


    /* =========================================
      EMPLEADO
    ========================================= */

    const empleado =
      pedido.empleado?.nombres
        ? `${pedido.empleado.nombres} ${
            pedido.empleado.apellidos ||
            ""
          }`.trim()
        : pedido.empleado?.nombre ||
          "Sin asignar";


    /* =========================================
      DÍAS DE RUTA
    ========================================= */

    const diasRuta =
      (
        pedido.rutaDiasAtencion ||
        pedido.ruta?.diasAtencion ||
        []
      ).join(" · ") ||
      "Sin días definidos";


    /* =========================================
      CLIENTE
    ========================================= */

    const cliente =
      pedido.clienteNombre ||
      pedido.cliente?.nombre ||
      "Sin cliente asignado";


    /* =========================================
      ABRIR VENTANA
    ========================================= */

    const ventana =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );


    if (!ventana) {

      return {
        ok: false,
        tipo: "error",
        mensaje:
          "El navegador bloqueó la ventana de impresión.",
      };

    }


    /* =========================================
      DOCUMENTO DE IMPRESIÓN
    ========================================= */

    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8">

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          >

          <title>
            ${pedido.codigo || "Pedido"} - WebBuys
          </title>

          <style>
            ${estilosPedido}
          </style>

        </head>


        <body>


          <!-- =================================
              CABECERA
          ================================== -->

          <header class="pedido-header">

            <div class="pedido-header-info">

              <span class="pedido-header-label">
                Comprobante de pedido
              </span>

              <h1>
                Pedido ${pedido.codigo || ""}
              </h1>

            </div>


            <div class="pedido-estado">
              ${pedido.estado || "Borrador"}
            </div>

          </header>


          <!-- =================================
              INFORMACIÓN DEL PEDIDO
          ================================== -->

          <section class="info">


            <!-- ===============================
                CLIENTE
            ================================ -->

            <div class="info-section info-cliente">

              <div class="info-section-title">
                Cliente
              </div>


              <div class="info-cliente-nombre">

                <span>
                  Cliente
                </span>

                <strong>
                  ${cliente}
                </strong>

              </div>


              <div class="info-grid">


                <div class="info-item">

                  <span>
                    Teléfono
                  </span>

                  <strong>
                    ${
                      pedido.clienteTelefono ||
                      pedido.cliente?.telefono ||
                      "Sin teléfono"
                    }
                  </strong>

                </div>


                <div class="info-item">

                  <span>
                    Tipo de pago
                  </span>

                  <strong>
                    ${
                      pedido.metodoPago ||
                      "Efectivo"
                    }
                  </strong>

                </div>


                <div class="info-item info-item-full">

                  <span>
                    Dirección
                  </span>

                  <strong>
                    ${
                      pedido.clienteDireccion ||
                      pedido.cliente?.direccion ||
                      "Sin dirección"
                    }
                  </strong>

                </div>


                <div class="info-item">

                  <span>
                    Ciudad
                  </span>

                  <strong>
                    ${
                      pedido.clienteCiudad ||
                      pedido.cliente?.ciudad ||
                      "Sin ciudad"
                    }
                  </strong>

                </div>

              </div>

            </div>


            <!-- ===============================
                DESPACHO
            ================================ -->

            <div class="info-section">

              <div class="info-section-title">
                Información de despacho
              </div>


              <div class="info-grid">


                <div class="info-item">

                  <span>
                    Zona
                  </span>

                  <strong>
                    ${
                      pedido.zonaDespachoNombre ||
                      pedido.zonaDespacho?.nombre ||
                      "Sin zona"
                    }
                  </strong>

                </div>


                <div class="info-item">

                  <span>
                    Ruta
                  </span>

                  <strong>
                    ${
                      pedido.rutaNombre ||
                      pedido.ruta?.nombre ||
                      "Sin ruta"
                    }
                  </strong>

                </div>


                <div class="info-item info-item-full">

                  <span>
                    Días de atención
                  </span>

                  <strong>
                    ${diasRuta}
                  </strong>

                </div>

              </div>

            </div>


            <!-- ===============================
                EMPLEADO
            ================================ -->

            <div class="info-section info-empleado">

              <div class="info-section-title">
                Atendido por
              </div>

              <strong class="info-empleado-nombre">
                ${empleado}
              </strong>

            </div>

          </section>


          <!-- =================================
              PRODUCTOS
          ================================== -->

          <table>

            <thead>

              <tr>

                <th>
                  Código
                </th>

                <th>
                  Producto
                </th>

                <th>
                  Marca
                </th>

                <th>
                  Cantidad
                </th>

                <th>
                  Precio
                </th>

                <th>
                  Subtotal
                </th>

              </tr>

            </thead>


            <tbody>
              ${filas}
            </tbody>

          </table>


          <!-- =================================
              TOTALES
          ================================== -->

          <div class="totales">

            <div>

              <span>
                Subtotal
              </span>

              <strong>
                ${moneda(
                  pedido.subtotal
                )}
              </strong>

            </div>


            <div>

              <span>
                Descuento
              </span>

              <strong>
                ${moneda(
                  pedido.descuento
                )}
              </strong>

            </div>


            <div class="total-final">

              <span>
                Total
              </span>

              <strong>
                ${moneda(
                  pedido.total
                )}
              </strong>

            </div>

          </div>

        </body>

      </html>
    `);


    ventana.document.close();

    ventana.focus();


    /* =========================================
      ABRIR DIÁLOGO DE IMPRESIÓN
    ========================================= */

    setTimeout(
      () => {

        ventana.print();

      },
      300
    );


    return {
      ok: true,
    };

  }

/* =========================================
   ESCAPAR HTML
========================================= */

function escaparHtml(valor) {

  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


/* =========================================
   FORMATEAR FECHA PARA LISTADOS
========================================= */

function fechaVista(valor) {

  if (!valor) {
    return "-";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "-";
  }

  return fecha.toLocaleDateString(
    "es-CO"
  );

}


/* =========================================
   IMPRIMIR PEDIDOS SEGÚN FILTROS
========================================= */

export function imprimirPedidosFiltrados({
  pedidos = [],
  filtros = {},
} = {}) {

  if (
    !Array.isArray(pedidos) ||
    pedidos.length === 0
  ) {

    return {
      ok: false,
      tipo: "info",
      mensaje:
        "No hay pedidos para imprimir con los filtros aplicados.",
    };

  }


  const {
    busqueda = "",
    estado = "Todos",
    pago = "Todos",
    cliente = "Todos",
    ruta = "Todas",
    fechaDesde = "",
    fechaHasta = "",
  } = filtros;


  const filtrosAplicados = [];

  if (String(busqueda).trim()) {
    filtrosAplicados.push(
      `Búsqueda: ${String(busqueda).trim()}`
    );
  }

  if (estado && estado !== "Todos") {
    filtrosAplicados.push(
      `Estado: ${estado}`
    );
  }

  if (pago && pago !== "Todos") {
    filtrosAplicados.push(
      `Pago: ${pago}`
    );
  }

  if (cliente && cliente !== "Todos") {
    filtrosAplicados.push(
      `Cliente: ${cliente}`
    );
  }

  if (ruta && ruta !== "Todas") {
    filtrosAplicados.push(
      `Ruta: ${ruta}`
    );
  }

  if (fechaDesde) {
    filtrosAplicados.push(
      `Desde: ${fechaDesde}`
    );
  }

  if (fechaHasta) {
    filtrosAplicados.push(
      `Hasta: ${fechaHasta}`
    );
  }


  const totalGeneral =
    pedidos.reduce(
      (acumulado, pedido) =>
        acumulado +
        Number(
          pedido.total || 0
        ),
      0
    );


  const filas =
    pedidos
      .map(
        (pedido) => {

          const clientePedido =
            pedido.cliente || {};

          const nombreCliente =
            pedido.clienteNombre ||
            clientePedido.nombre ||
            pedido.clienteRazonSocial ||
            clientePedido.razonSocial ||
            "Sin cliente asignado";

          const zona =
            pedido.zonaDespachoNombre ||
            pedido.zonaDespacho?.nombre ||
            "-";

          const rutaPedido =
            pedido.rutaNombre ||
            pedido.ruta?.nombre ||
            "-";

          return `
            <tr>
              <td>
                ${escaparHtml(
                  pedido.codigo || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  nombreCliente
                )}
              </td>

              <td>
                ${escaparHtml(zona)}
              </td>

              <td>
                ${escaparHtml(rutaPedido)}
              </td>

              <td>
                ${escaparHtml(
                  fechaVista(
                    pedido.createdAt
                  )
                )}
              </td>

              <td>
                ${escaparHtml(
                  fechaVista(
                    pedido.fechaEntrega
                  )
                )}
              </td>

              <td>
                ${escaparHtml(
                  pedido.metodoPago || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  pedido.estado || "-"
                )}
              </td>

              <td class="pedidos-listado-numero">
                ${escaparHtml(
                  moneda(
                    pedido.total
                  )
                )}
              </td>
            </tr>
          `;

        }
      )
      .join("");


  const ventana = window.open(
    "",
    "_blank",
    "width=1200,height=800"
  );


  if (!ventana) {

    return {
      ok: false,
      tipo: "error",
      mensaje:
        "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes e inténtelo nuevamente.",
    };

  }


  const textoFiltros =
    filtrosAplicados.length > 0
      ? escaparHtml(
          filtrosAplicados.join(" · ")
        )
      : "Sin filtros: se muestran todos los pedidos";


  ventana.document.open();

  ventana.document.write(`
    <!DOCTYPE html>

    <html lang="es">

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        >

        <title>
          Pedidos filtrados - WebBuys
        </title>

        <style>
          ${estilosPedido}
        </style>

      </head>


      <body class="pedidos-listado-body">

        <header class="pedidos-listado-header">

          <div>

            <span class="pedidos-listado-label">
              Reporte de pedidos
            </span>

            <h1 class="pedidos-listado-title">
              Pedidos
            </h1>

            <p class="pedidos-listado-subtitle">
              Listado según los filtros aplicados
            </p>

          </div>


          <div class="pedidos-listado-resumen">

            <strong>
              ${pedidos.length}
            </strong>

            <span>
              pedido(s)
            </span>

          </div>

        </header>


        <section class="pedidos-listado-filtros">

          <strong>
            Filtros:
          </strong>

          <span>
            ${textoFiltros}
          </span>

        </section>


        <div class="pedidos-listado-table-wrap">

          <table class="pedidos-listado-table">

            <thead>

              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Zona</th>
                <th>Ruta</th>
                <th>Fecha</th>
                <th>Entrega</th>
                <th>Pago</th>
                <th>Estado</th>
                <th>Total</th>
              </tr>

            </thead>

            <tbody>
              ${filas}
            </tbody>

          </table>

        </div>


        <footer class="pedidos-listado-total">

          <span>
            Total general:
          </span>

          <strong>
            ${escaparHtml(
              moneda(totalGeneral)
            )}
          </strong>

        </footer>

      </body>

    </html>
  `);


  ventana.document.close();
  ventana.focus();


  setTimeout(
    () => {

      ventana.print();

    },
    300
  );


  return {
    ok: true,
  };

}
