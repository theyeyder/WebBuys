import estilosEmpleado
  from "../styles/impresiones/empleado.impresion.css?inline";


function escaparHtml(
  valor
) {

  return String(
    valor ?? ""
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


function fechaVista(
  valor
) {

  if (!valor) {
    return "-";
  }


  const fecha =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "-";
  }


  return fecha.toLocaleDateString(
    "es-CO",
    {
      day:
        "2-digit",
      month:
        "2-digit",
      year:
        "numeric",
    }
  );

}


function nombreCompleto(
  empleado
) {

  return [
    empleado?.nombres,
    empleado?.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() ||
    "-";

}


function nombreRuta(
  empleado
) {

  if (
    typeof empleado
      ?.rutaAsignada ===
    "object"
  ) {

    return (
      empleado
        .rutaAsignada
        ?.nombre ||
      empleado
        .rutaAsignada
        ?.codigo ||
      "Sin ruta"
    );

  }


  return "Sin ruta";

}


export function imprimirEmpleados({
  empleados = [],
  filtros = {},
} = {}) {

  if (
    !Array.isArray(
      empleados
    ) ||
    empleados.length ===
      0
  ) {

    return {
      ok:
        false,
      tipo:
        "warning",
      mensaje:
        "No hay empleados para imprimir.",
    };

  }


  const filas =
    empleados
      .map(
        (
          empleado
        ) => {

          const documento =
            [
              empleado
                ?.tipoDocumento,
              empleado
                ?.documento,
            ]
              .filter(Boolean)
              .join(" ");


          return `
            <tr>

              <td class="empleados-listado-codigo">
                ${escaparHtml(
                  empleado?.codigo ||
                  "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  documento ||
                  "-"
                )}
              </td>

              <td class="empleados-listado-nombre">
                ${escaparHtml(
                  nombreCompleto(
                    empleado
                  )
                )}
              </td>

              <td>
                ${escaparHtml(
                  empleado?.cargo ||
                  "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  empleado?.telefono ||
                  "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  empleado?.ciudad ||
                  "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  nombreRuta(
                    empleado
                  )
                )}
              </td>

              <td>
                ${escaparHtml(
                  fechaVista(
                    empleado?.fechaIngreso
                  )
                )}
              </td>

              <td>
                <span class="${
                  empleado?.estado ===
                  "Activo"
                    ? "empleados-listado-estado activo"
                    : "empleados-listado-estado inactivo"
                }">
                  ${escaparHtml(
                    empleado?.estado ||
                    "-"
                  )}
                </span>
              </td>

            </tr>
          `;

        }
      )
      .join("");


  const filtrosAplicados = [];


  if (
    filtros?.busqueda
      ?.trim()
  ) {

    filtrosAplicados.push(
      `Búsqueda: ${filtros.busqueda.trim()}`
    );

  }


  if (
    filtros?.estado &&
    filtros.estado !==
      "Todos"
  ) {

    filtrosAplicados.push(
      `Estado: ${filtros.estado}`
    );

  }


  const textoFiltros =
    filtrosAplicados.length >
    0
      ? escaparHtml(
          filtrosAplicados.join(
            " · "
          )
        )
      : "Sin filtros: se muestran todos los empleados";


  /*
    MISMO COMPORTAMIENTO DE PEDIDOS:
    abre una ventana emergente del navegador.
  */
  const ventana =
    window.open(
      "",
      "_blank",
      "width=1200,height=800"
    );


  if (!ventana) {

    return {
      ok:
        false,
      tipo:
        "error",
      mensaje:
        "El navegador bloqueó la ventana emergente. Permita las ventanas emergentes e inténtelo nuevamente.",
    };

  }


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
          Empleados filtrados - WebBuys
        </title>

        <style>
          ${estilosEmpleado}
        </style>

      </head>


      <body class="empleados-listado-body">

        <header class="empleados-listado-header">

          <div>

            <span class="empleados-listado-label">
              Reporte de empleados
            </span>

            <h1 class="empleados-listado-title">
              Empleados
            </h1>

            <p class="empleados-listado-subtitle">
              Listado según los filtros aplicados
            </p>

          </div>


          <div class="empleados-listado-resumen">

            <strong>
              ${empleados.length}
            </strong>

            <span>
              empleado(s)
            </span>

          </div>

        </header>


        <section class="empleados-listado-filtros">

          <strong>
            Filtros:
          </strong>

          <span>
            ${textoFiltros}
          </span>

        </section>


        <div class="empleados-listado-table-wrap">

          <table class="empleados-listado-table">

            <colgroup>
              <col class="col-codigo">
              <col class="col-documento">
              <col class="col-empleado">
              <col class="col-cargo">
              <col class="col-telefono">
              <col class="col-ciudad">
              <col class="col-ruta">
              <col class="col-ingreso">
              <col class="col-estado">
            </colgroup>

            <thead>

              <tr>
                <th>Código</th>
                <th>Documento</th>
                <th>Empleado</th>
                <th>Cargo</th>
                <th>Teléfono</th>
                <th>Ciudad</th>
                <th>Ruta</th>
                <th>Ingreso</th>
                <th>Estado</th>
              </tr>

            </thead>

            <tbody>
              ${filas}
            </tbody>

          </table>

        </div>


        <footer class="empleados-listado-footer">

          <span>
            Total de empleados:
          </span>

          <strong>
            ${empleados.length}
          </strong>

        </footer>

      </body>

    </html>
  `);


  ventana.document.close();

  ventana.focus();


  /*
    Igual que Pedidos:
    después de mostrar el reporte en la ventana emergente,
    abre el cuadro de impresión.
  */
  window.setTimeout(
    () => {

      ventana.print();

    },
    300
  );


  return {
    ok:
      true,
  };

}
