import estilosTirilla from "../styles/impresiones/entrega.tirilla.css?raw";

function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function moneda(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function fechaVista(valor, incluirHora = false) {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return incluirHora
    ? fecha.toLocaleString("es-CO")
    : fecha.toLocaleDateString("es-CO");
}

function empleadoVista(empleado) {
  if (!empleado) return "Sin asignar";
  if (typeof empleado === "string") return empleado;
  return [empleado.nombres, empleado.apellidos].filter(Boolean).join(" ").trim()
    || empleado.nombre
    || empleado.codigo
    || "Sin asignar";
}

function numeroVista(valor) {
  if (valor === null || valor === undefined || valor === "") return "0";
  const numero = Number(valor);
  return Number.isFinite(numero)
    ? new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 }).format(numero)
    : String(valor);
}

function fila(etiqueta, valor, larga = false) {
  return `<div class="ticket-fila${larga ? " ticket-fila-larga" : ""}">
    <span class="ticket-fila-etiqueta">${escaparHtml(etiqueta)}</span>
    <strong class="ticket-fila-valor">${escaparHtml(valor)}</strong>
  </div>`;
}

function productoVista(item, indice, mostrarValores) {
  const esPeso = item.tipoVenta === "Peso";
  const peso = Number(item.pesoReal);
  const tienePeso = esPeso && Number.isFinite(peso) && peso > 0;
  const cantidad = esPeso
    ? (item.cantidadSolicitada ?? 0)
    : (item.cantidadReal ?? item.cantidadSolicitada ?? item.cantidad ?? 0);
  const precio = Number(item.precioUnitario ?? item.precioAplicado ?? item.precioNormal ?? 0);
  const unidades = esPeso
    ? (tienePeso ? `${numeroVista(peso)} kg` : "Peso pendiente")
    : `${numeroVista(cantidad)} und.`;
  const subtotal = esPeso && !tienePeso
    ? "Pendiente"
    : moneda(item.subtotal || 0);
  const codigo = item.codigoProducto || item.producto?.codigo;
  const presentacion = item.presentacionNombre;
  const metadatos = [presentacion, codigo ? `Cód. ${codigo}` : null]
    .filter(Boolean).map(escaparHtml).join(" · ");

  return `<article class="ticket-producto">
    <div class="ticket-producto-nombre">
      <span class="ticket-producto-indice">${indice + 1}.</span>
      <strong>${escaparHtml(item.nombre || item.producto?.nombre || "Producto")}</strong>
    </div>
    ${metadatos ? `<div class="ticket-producto-meta">${metadatos}</div>` : ""}
    <div class="ticket-producto-linea">
      <span class="ticket-producto-cantidad">${escaparHtml(unidades)}${mostrarValores
        ? `<small> x ${escaparHtml(moneda(precio))}${esPeso ? "/kg" : "/und."}</small>`
        : ""}</span>
      ${mostrarValores ? `<strong class="ticket-producto-subtotal">${escaparHtml(subtotal)}</strong>` : ""}
    </div>
  </article>`;
}

// La visualización de importes sigue controlada por mostrarValores.
// El módulo Entregas solo lo habilita para el administrador.
export function construirContenidoEntregaTirilla(entrega, { mostrarValores = false } = {}) {
  const pedido = entrega?.pedido && typeof entrega.pedido === "object"
    ? entrega.pedido
    : {};

  const ruta = pedido.rutaNombre || pedido.ruta?.nombre || entrega.rutaNombre || entrega.ruta?.nombre || "Sin ruta";
  const zona = pedido.zonaDespachoNombre || pedido.zonaDespacho?.nombre || entrega.zonaDespachoNombre || entrega.zonaDespacho?.nombre || "Sin zona";
  const direccion = pedido.clienteDireccion || entrega.clienteDireccion || "Sin dirección";
  const ciudad = pedido.clienteCiudad || entrega.clienteCiudad || "Sin ciudad";
  const dias = (Array.isArray(pedido.rutaDiasAtencion)
    ? pedido.rutaDiasAtencion
    : Array.isArray(entrega.rutaDiasAtencion)
      ? entrega.rutaDiasAtencion
      : []).filter(Boolean).join(" · ");
  const items = Array.isArray(entrega.items) ? entrega.items : [];

  return `<main class="ticket">
    <header class="ticket-cabecera">
      <h1>COMPROBANTE DE ENTREGA</h1>
      <div class="ticket-codigo">${escaparHtml(entrega.pedidoCodigo || "—")}</div>
      <div class="ticket-estado">${escaparHtml(entrega.estado || "Por preparar")}</div>
    </header>

    <section class="ticket-seccion">
      <h2>DATOS DEL CLIENTE</h2>
      <p class="ticket-cliente">${escaparHtml(entrega.clienteNombre || "Sin cliente")}</p>
      ${fila("Teléfono", entrega.clienteTelefono || "Sin teléfono")}
      ${fila("Dirección", direccion, true)}
      ${fila("Ciudad", ciudad)}
      ${fila("Zona", zona)}
    </section>

    <section class="ticket-seccion">
      <h2>DATOS DE ENTREGA</h2>
      ${fila("Ruta", ruta, true)}
      ${dias ? fila("Atención", dias, true) : ""}
      ${fila("Programada", fechaVista(entrega.fechaProgramada))}
      ${fila("Repartidor", empleadoVista(entrega.repartidor), true)}
      ${fila("Empacador", empleadoVista(entrega.empacador), true)}
      ${mostrarValores ? fila("Forma de pago", entrega.metodoPago || "Pendiente") : ""}
    </section>

    <section class="ticket-seccion ticket-productos">
      <h2>DETALLE DE PRODUCTOS <span>(${items.length})</span></h2>
      ${items.length ? items.map((item, indice) => productoVista(item, indice, mostrarValores)).join("")
        : '<p class="ticket-vacio">Sin productos registrados.</p>'}
    </section>

    ${mostrarValores ? `<section class="ticket-seccion ticket-totales">
      <h2>RESUMEN DEL PEDIDO</h2>
      ${fila("Subtotal", moneda(entrega.subtotal))}
      ${fila("Descuento", moneda(entrega.descuento))}
      <div class="ticket-total">${fila("TOTAL", moneda(entrega.total))}</div>
    </section>` : ""}

    ${entrega.observaciones ? `<section class="ticket-seccion ticket-nota">
      <h2>OBSERVACIONES</h2>
      <p>${escaparHtml(entrega.observaciones)}</p>
    </section>` : ""}

    ${entrega.estado === "Cancelado" && entrega.motivoCancelacion ? `<section class="ticket-seccion ticket-nota">
      <h2>MOTIVO DE CANCELACIÓN</h2>
      <p>${escaparHtml(entrega.motivoCancelacion)}</p>
    </section>` : ""}

    ${(entrega.fechaConfirmacion || entrega.fechaEntregaReal) ? `<section class="ticket-seccion ticket-fechas">
      <h2>REGISTRO</h2>
      ${entrega.fechaConfirmacion ? fila("Confirmación", fechaVista(entrega.fechaConfirmacion, true), true) : ""}
      ${entrega.fechaEntregaReal ? fila("Entrega real", fechaVista(entrega.fechaEntregaReal, true), true) : ""}
    </section>` : ""}

    <footer class="ticket-pie">
      <strong>¡Gracias por preferirnos!</strong>
    </footer>
  </main>`;
}

export function imprimirEntregaTirilla(entrega, opciones = {}) {
  if (!entrega) {
    return { ok: false, tipo: "info", mensaje: "Seleccione primero una entrega." };
  }

  const anchoMm = opciones.anchoMm === 58 ? 58 : 80;
  const mostrarValores = opciones.mostrarValores === true;
  const clase = anchoMm === 58 ? "ticket-rollo-58" : "ticket-rollo-80";
  const ventana = window.open("", "_blank", "width=520,height=800");

  if (!ventana) {
    return {
      ok: false,
      tipo: "error",
      mensaje: "El navegador bloqueó la ventana de impresión. Permita las ventanas emergentes e inténtelo nuevamente.",
    };
  }

  ventana.document.open();
  ventana.document.write(`<!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Entrega ${escaparHtml(entrega.pedidoCodigo || "")} - Tirilla ${anchoMm} mm</title>
        <style>${estilosTirilla}</style>
      </head>
      <body class="${clase}">
        ${construirContenidoEntregaTirilla(entrega, { mostrarValores })}
      </body>
    </html>`);
  ventana.document.close();
  ventana.focus();
  setTimeout(() => ventana.print(), 350);
  return { ok: true };
}
