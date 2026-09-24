/* =========================================
   IMPRESIÓN DE FACTURA
========================================= */

function moneda(valor) {
  return Number(valor || 0).toLocaleString(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  );
}


/* =========================================
   FORMATEAR FECHA
========================================= */

function fechaColombia(fecha) {
  if (!fecha) return "";

  return new Date(fecha).toLocaleString(
    "es-CO",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}


/* =========================================
   ESCAPAR TEXTO HTML
========================================= */

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================
   IMPRIMIR FACTURA
========================================= */

export function imprimirFactura(
  factura,
  ventanaExistente = null
) {
  if (!factura) return;

  const ventanaImpresion =
    ventanaExistente ||
    window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

  if (!ventanaImpresion) {
    alert(
      "No se pudo abrir la ventana de impresión. Verifique que el navegador permita ventanas emergentes."
    );

    return;
  }


  const clienteNombre =
    factura.clienteNombre ||
    factura.cliente?.nombre ||
    "Sin cliente";


  const clienteDocumento =
    factura.clienteDocumento ||
    factura.cliente?.documento ||
    "";


  const clienteTelefono =
    factura.clienteTelefono ||
    factura.cliente?.telefono ||
    "";


  const empleadoNombre =
    factura.empleadoNombre ||
    [
      factura.empleado?.nombres,
      factura.empleado?.apellidos,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Sin asignar";


  const repartidorNombre =
    factura.repartidorNombre ||
    [
      factura.repartidor?.nombres,
      factura.repartidor?.apellidos,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Sin asignar";


  const empacadorNombre =
    factura.empacadorNombre ||
    [
      factura.empacador?.nombres,
      factura.empacador?.apellidos,
    ]
      .filter(Boolean)
      .join(" ") ||
    "—";


  const filasProductos = (
    factura.items || []
  )
    .map(
      (item) => `
        <tr>
          <td>
            ${escaparHTML(
              item.nombre || "Producto"
            )}
          </td>

          <td>
            ${escaparHTML(
              item.presentacionNombre || ""
            )}
          </td>

          <td class="centrado">
            ${Number(item.cantidad || 0)}
          </td>

          <td class="derecha">
            ${moneda(
              item.precioAplicado
            )}
          </td>

          <td class="derecha">
            ${moneda(item.subtotal)}
          </td>
        </tr>
      `
    )
    .join("");


  const marcaAnulada =
    factura.estado === "Anulada"
      ? `
        <div class="factura-anulada">
          FACTURA ANULADA
        </div>
      `
      : "";


  const informacionAnulacion =
    factura.estado === "Anulada"
      ? `
        <div class="bloque-anulacion">

          <strong>
            Motivo de anulación:
          </strong>

          <span>
            ${escaparHTML(
              factura.motivoAnulacion ||
                "Sin motivo registrado"
            )}
          </span>

          ${
            factura.fechaAnulacion
              ? `
                <br>

                <strong>
                  Fecha de anulación:
                </strong>

                <span>
                  ${escaparHTML(
                    fechaColombia(
                      factura.fechaAnulacion
                    )
                  )}
                </span>
              `
              : ""
          }

        </div>
      `
      : "";


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
          ${escaparHTML(
            factura.codigo || "Factura"
          )}
        </title>

        <link
          rel="stylesheet"
          href="/src/styles/factura-print.css"
        >

      </head>


      <body>

        <main class="factura-print">

          ${marcaAnulada}


          <header class="factura-header">

            <div>

              <h1>
                FACTURA
              </h1>

              <p>
                Lácteos del Tolima
              </p>

            </div>


            <div class="factura-numero">

              <strong>
                ${escaparHTML(
                  factura.codigo || ""
                )}
              </strong>

              <span>
                ${escaparHTML(
                  fechaColombia(
                    factura.createdAt
                  )
                )}
              </span>

            </div>

          </header>


          <section class="factura-datos">

            <div>

              <span class="etiqueta">
                Cliente
              </span>

              <strong>
                ${escaparHTML(
                  clienteNombre
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Documento
              </span>

              <strong>
                ${escaparHTML(
                  clienteDocumento ||
                    "No registrado"
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Teléfono
              </span>

              <strong>
                ${escaparHTML(
                  clienteTelefono ||
                    "No registrado"
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Pedido
              </span>

              <strong>
                ${escaparHTML(
                  factura.pedidoCodigo ||
                    factura.pedido?.codigo ||
                    ""
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Atendido por
              </span>

              <strong>
                ${escaparHTML(
                  empleadoNombre
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Repartidor
              </span>

              <strong>
                ${escaparHTML(
                  repartidorNombre
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Empacador
              </span>

              <strong>
                ${escaparHTML(
                  empacadorNombre
                )}
              </strong>

            </div>


            <div>

              <span class="etiqueta">
                Método de pago
              </span>

              <strong>
                ${escaparHTML(
                  factura.metodoPago ||
                    "No especificado"
                )}
              </strong>

            </div>

          </section>


          <section class="factura-productos">

            <table>

              <thead>

                <tr>

                  <th>
                    Producto
                  </th>

                  <th>
                    Presentación
                  </th>

                  <th class="centrado">
                    Cant.
                  </th>

                  <th class="derecha">
                    Precio
                  </th>

                  <th class="derecha">
                    Subtotal
                  </th>

                </tr>

              </thead>


              <tbody>

                ${
                  filasProductos ||
                  `
                    <tr>
                      <td
                        colspan="5"
                        class="centrado"
                      >
                        Sin productos
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

          </section>


          <section class="factura-totales">

            <div>

              <span>
                Subtotal
              </span>

              <strong>
                ${moneda(
                  factura.subtotal
                )}
              </strong>

            </div>


            <div>

              <span>
                Descuento
              </span>

              <strong>
                ${moneda(
                  factura.descuento
                )}
              </strong>

            </div>


            <div>

              <span>
                IVA
              </span>

              <strong>
                ${moneda(
                  factura.iva
                )}
              </strong>

            </div>


            <div class="total-final">

              <span>
                TOTAL
              </span>

              <strong>
                ${moneda(
                  factura.total
                )}
              </strong>

            </div>

          </section>


          ${informacionAnulacion}


          ${
            factura.observaciones
              ? `
                <section class="factura-observaciones">

                  <strong>
                    Observaciones
                  </strong>

                  <p>
                    ${escaparHTML(
                      factura.observaciones
                    )}
                  </p>

                </section>
              `
              : ""
          }


          <footer class="factura-footer">

            <p>
              Gracias por su compra.
            </p>

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
                300
              );

            }
          );

        </script>

      </body>

    </html>
  `;


  ventanaImpresion.document.open();

  ventanaImpresion.document.write(
    contenido
  );

  ventanaImpresion.document.close();
}