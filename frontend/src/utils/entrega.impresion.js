import estilosEntrega
  from "../styles/impresiones/entrega.impresion.css?raw";


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


function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function fechaVista(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleDateString(
    "es-CO"
  );
}


function fechaHoraVista(valor) {
  if (!valor) {
    return "—";
  }

  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return "—";
  }

  return fecha.toLocaleString(
    "es-CO"
  );
}


function nombreEmpleado(empleado) {
  if (!empleado) {
    return "Sin asignar";
  }

  if (typeof empleado === "string") {
    return empleado;
  }

  const nombre = [
    empleado.nombres,
    empleado.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return (
    nombre ||
    empleado.nombre ||
    empleado.codigo ||
    "Sin asignar"
  );
}


function abrirVentanaImpresion(
  titulo,
  contenido,
  claseBody = ""
) {

  const ventana = window.open(
    "",
    "_blank",
    "width=1100,height=820"
  );

  if (!ventana) {
    return {
      ok: false,
      tipo: "error",
      mensaje:
        "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes e inténtelo nuevamente.",
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
        <title>${escaparHtml(titulo)}</title>
        <style>
          ${estilosEntrega}
        </style>
      </head>
      <body class="${escaparHtml(claseBody)}">
        ${contenido}
      </body>
    </html>
  `);

  ventana.document.close();
  ventana.focus();

  setTimeout(
    () => ventana.print(),
    300
  );

  return {
    ok: true,
  };
}


export function imprimirEntrega(
  entrega
) {

  if (!entrega) {
    return {
      ok: false,
      tipo: "info",
      mensaje:
        "Seleccione primero una entrega.",
    };
  }

  const items =
    Array.isArray(entrega.items)
      ? entrega.items
      : [];

  const filas =
    items.map(
      (item) => {

        const esPeso =
          item.tipoVenta ===
          "Peso";

        const pesoReal =
          Number(
            item.pesoReal
          );

        const tienePeso =
          esPeso &&
          Number.isFinite(
            pesoReal
          ) &&
          pesoReal > 0;

        const precio =
          Number(
            item.precioUnitario ??
            item.precioAplicado ??
            item.precioNormal ??
            0
          );

        const subtotal =
          esPeso &&
          !tienePeso
            ? "Pendiente"
            : moneda(
                item.subtotal ||
                0
              );

        return `
          <tr>
            <td>
              ${escaparHtml(
                item.codigoProducto ||
                item.producto?.codigo ||
                ""
              )}
            </td>

            <td>
              <strong>
                ${escaparHtml(
                  item.nombre ||
                  item.producto?.nombre ||
                  "Producto"
                )}
              </strong>
              ${
                item.presentacionNombre
                  ? `<small>${escaparHtml(item.presentacionNombre)}</small>`
                  : ""
              }
            </td>

            <td class="numero">
              ${escaparHtml(
                item.cantidadSolicitada ??
                item.cantidad ??
                0
              )}
            </td>

            <td class="peso-real">
              ${
                esPeso
                  ? (
                      tienePeso
                        ? `${escaparHtml(pesoReal)} kg`
                        : '<span class="pendiente">Pendiente</span>'
                    )
                  : "No aplica"
              }
            </td>

            <td class="numero">
              ${escaparHtml(
                moneda(precio)
              )}
              ${
                esPeso
                  ? "<small>por KG</small>"
                  : ""
              }
            </td>

            <td class="numero">
              ${escaparHtml(subtotal)}
            </td>
          </tr>
        `;
      }
    ).join("");

  const pedidoOrigen =
    entrega.pedido &&
    typeof entrega.pedido === "object"
      ? entrega.pedido
      : {};


  const zonaEntrega =
    pedidoOrigen.zonaDespachoNombre ||
    entrega.zonaDespachoNombre ||
    "Sin zona";


  const rutaEntrega =
    pedidoOrigen.rutaNombre ||
    entrega.rutaNombre ||
    "Sin ruta";


  const direccionEntrega =
    pedidoOrigen.clienteDireccion ||
    entrega.clienteDireccion ||
    "Sin dirección";


  const ciudadEntrega =
    pedidoOrigen.clienteCiudad ||
    entrega.clienteCiudad ||
    "Sin ciudad";


  const diasRuta =
    (
      Array.isArray(
        pedidoOrigen.rutaDiasAtencion
      )
        ? pedidoOrigen.rutaDiasAtencion
        : Array.isArray(
            entrega.rutaDiasAtencion
          )
          ? entrega.rutaDiasAtencion
          : []
    )
      .filter(Boolean)
      .join(" · ") ||
    "Sin días definidos";


  const motivoCancelacion =
    entrega.estado === "Cancelado" &&
    entrega.motivoCancelacion
      ? `
        <section class="nota nota-cancelada">
          <span>Motivo de cancelación</span>
          <strong>${escaparHtml(entrega.motivoCancelacion)}</strong>
        </section>
      `
      : "";

  const contenido = `
    <header class="documento-header">
      <div>
        <span class="documento-label">
          Comprobante de entrega
        </span>
        <h1>
          Entrega ${escaparHtml(entrega.pedidoCodigo || "")}
        </h1>
      </div>

      <div class="estado">
        ${escaparHtml(entrega.estado || "Por preparar")}
      </div>
    </header>


    <section class="info-grid">

      <div class="info-box info-box-wide">
        <span>Cliente</span>
        <strong>${escaparHtml(entrega.clienteNombre || "Sin cliente")}</strong>
      </div>

      <div class="info-box">
        <span>Teléfono</span>
        <strong>${escaparHtml(entrega.clienteTelefono || "Sin teléfono")}</strong>
      </div>

      <div class="info-box">
        <span>Fecha programada</span>
        <strong>${escaparHtml(fechaVista(entrega.fechaProgramada))}</strong>
      </div>

      <div class="info-box">
        <span>Repartidor</span>
        <strong>${escaparHtml(nombreEmpleado(entrega.repartidor))}</strong>
      </div>

      <div class="info-box">
        <span>Empacador</span>
        <strong>${escaparHtml(nombreEmpleado(entrega.empacador))}</strong>
      </div>

      <div class="info-box">
        <span>Tipo de pago</span>
        <strong>${escaparHtml(entrega.metodoPago || "Pendiente")}</strong>
      </div>

    </section>


    <section class="info-entrega-section">

      <div class="info-entrega-title">
        Información de entrega
      </div>

      <div class="info-entrega-grid">

        <div class="info-entrega-item">
          <span>Zona</span>
          <strong>${escaparHtml(zonaEntrega)}</strong>
        </div>

        <div class="info-entrega-item">
          <span>Ruta</span>
          <strong>${escaparHtml(rutaEntrega)}</strong>
        </div>

        <div class="info-entrega-item info-entrega-full">
          <span>Días de atención</span>
          <strong>${escaparHtml(diasRuta)}</strong>
        </div>

        <div class="info-entrega-item info-entrega-full">
          <span>Dirección</span>
          <strong>${escaparHtml(direccionEntrega)}</strong>
        </div>

        <div class="info-entrega-item info-entrega-full">
          <span>Ciudad</span>
          <strong>${escaparHtml(ciudadEntrega)}</strong>
        </div>

      </div>

    </section>


    <section class="productos-section">
      <div class="section-title">
        Productos
      </div>

      <table class="productos-table">
        <colgroup>
          <col class="col-codigo">
          <col class="col-producto">
          <col class="col-cantidad">
          <col class="col-peso">
          <col class="col-precio">
          <col class="col-subtotal">
        </colgroup>

        <thead>
          <tr>
            <th class="col-texto">Código</th>
            <th class="col-texto">Producto</th>
            <th class="col-numero">Cant.</th>
            <th class="col-peso-real">Peso real</th>
            <th class="col-numero">Precio</th>
            <th class="col-numero">Subtotal</th>
          </tr>
        </thead>

        <tbody>
          ${
            filas ||
            '<tr><td colspan="6" class="sin-datos">Sin productos.</td></tr>'
          }
        </tbody>
      </table>
    </section>


    <section class="totales">
      <div>
        <span>Subtotal</span>
        <strong>${escaparHtml(moneda(entrega.subtotal))}</strong>
      </div>

      <div>
        <span>Descuento</span>
        <strong>${escaparHtml(moneda(entrega.descuento))}</strong>
      </div>

      <div class="total-final">
        <span>Total</span>
        <strong>${escaparHtml(moneda(entrega.total))}</strong>
      </div>
    </section>


    ${
      entrega.observaciones
        ? `
          <section class="nota">
            <span>Observaciones</span>
            <strong>${escaparHtml(entrega.observaciones)}</strong>
          </section>
        `
        : ""
    }

    ${motivoCancelacion}


    <footer class="documento-footer">
      <span>
        Confirmación: ${escaparHtml(fechaHoraVista(entrega.fechaConfirmacion))}
      </span>
      <span>
        Entrega real: ${escaparHtml(fechaHoraVista(entrega.fechaEntregaReal))}
      </span>
    </footer>
  `;

  return abrirVentanaImpresion(
    `${entrega.pedidoCodigo || "Entrega"} - Entrega`,
    contenido,
    "entrega-individual-body"
  );
}


export function imprimirEntregasFiltradas({
  entregas = [],
  filtros = {},
} = {}) {

  if (
    !Array.isArray(entregas) ||
    entregas.length === 0
  ) {
    return {
      ok: false,
      tipo: "info",
      mensaje:
        "No hay entregas para imprimir con los filtros aplicados.",
    };
  }

  const {
    busqueda = "",
    estado = "Todos",
  } = filtros;

  const filtrosAplicados = [];

  if (String(busqueda).trim()) {
    filtrosAplicados.push(
      `Búsqueda: ${String(busqueda).trim()}`
    );
  }

  if (
    estado &&
    estado !== "Todos"
  ) {
    filtrosAplicados.push(
      `Estado: ${estado}`
    );
  }

  const totalGeneral =
    entregas.reduce(
      (acumulado, entrega) =>
        acumulado +
        Number(
          entrega.total ||
          0
        ),
      0
    );

  const filas =
    entregas.map(
      (entrega) => `
        <tr>
          <td>
            ${escaparHtml(entrega.pedidoCodigo || "—")}
          </td>
          <td>
            ${escaparHtml(entrega.clienteNombre || "Sin cliente")}
          </td>
          <td>
            ${escaparHtml(fechaVista(entrega.fechaProgramada))}
          </td>
          <td>
            ${escaparHtml(entrega.rutaNombre || "—")}
          </td>
          <td>
            ${escaparHtml(nombreEmpleado(entrega.repartidor))}
          </td>
          <td>
            ${escaparHtml(entrega.metodoPago || "Pendiente")}
          </td>
          <td>
            ${escaparHtml(entrega.estado || "—")}
          </td>
          <td class="numero">
            ${escaparHtml(moneda(entrega.total))}
          </td>
        </tr>
      `
    ).join("");

  const textoFiltros =
    filtrosAplicados.length > 0
      ? escaparHtml(
          filtrosAplicados.join(" · ")
        )
      : "Sin filtros: se muestran todas las entregas";

  const contenido = `
    <header class="listado-header">
      <div>
        <span class="documento-label">
          Reporte de entregas
        </span>
        <h1>Entregas</h1>
        <p>Listado según los filtros aplicados</p>
      </div>

      <div class="listado-resumen">
        <strong>${entregas.length}</strong>
        <span>entrega(s)</span>
      </div>
    </header>


    <section class="listado-filtros">
      <strong>Filtros:</strong>
      <span>${textoFiltros}</span>
    </section>


    <div class="listado-table-wrap">
      <table class="listado-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th>Ruta</th>
            <th>Repartidor</th>
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


    <footer class="listado-total">
      <span>Total general:</span>
      <strong>${escaparHtml(moneda(totalGeneral))}</strong>
    </footer>
  `;

  return abrirVentanaImpresion(
    "Entregas - WebBuys",
    contenido,
    "entregas-listado-body"
  );
}
