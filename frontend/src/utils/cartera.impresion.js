import estilosCartera from "../styles/impresiones/cartera.impresion.css?raw";

const texto = (valor) => String(valor ?? "");

function escapar(valor) {
  return texto(valor).replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[caracter]);
}

function dinero(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(Number(valor || 0));
}

function fecha(valor, conHora = false) {
  if (!valor) return "—";
  const valorTexto = texto(valor);
  const fechaValor = /^\d{4}-\d{2}-\d{2}$/.test(valorTexto)
    ? new Date(`${valorTexto}T12:00:00`)
    : new Date(valor);
  if (Number.isNaN(fechaValor.getTime())) return "—";
  return conHora
    ? fechaValor.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
    : fechaValor.toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Los vencimientos son fechas de calendario; no deben desplazarse por UTC.
function fechaVencimientoVisible(valor) {
  if (!valor) return "—";
  const partes = texto(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
  if (!partes) return fecha(valor);
  const fechaLocal = new Date(Number(partes[1]), Number(partes[2]) - 1, Number(partes[3]));
  if (Number.isNaN(fechaLocal.getTime())) return "—";
  return fechaLocal.toLocaleDateString("es-CO", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function encabezado(titulo, empresa) {
  const nombre = empresa?.razonSocial || empresa?.nombreComercial || "WebBuys";
  const nit = empresa?.nit ? `NIT ${escapar(empresa.nit)}` : "Sistema WebBuys";
  return `<header class="encabezado"><div><div class="empresa">${escapar(nombre)}</div>
    <div class="subempresa">${nit}</div><div class="etiqueta" style="margin-top:14px">Cartera</div>
    <h1>${escapar(titulo)}</h1></div><div class="fecha-emision"><b>Generado</b><br>${escapar(fecha(new Date(), true))}</div></header>`;
}

function indicador(etiqueta, valor) {
  return `<div class="indicador"><small>${escapar(etiqueta)}</small><strong>${escapar(valor)}</strong></div>`;
}

// El navegador controla papel, orientacion, escala, destino y PDF.
// No se fija el tamano ni la orientacion desde la aplicacion.
function estructura(titulo, contenido) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapar(titulo)} - WebBuys</title>
    <style>${estilosCartera}</style></head>
    <body><main class="documento">${contenido}</main></body></html>`;
}

function mostrar(ventana, titulo, contenido) {
  if (!ventana || ventana.closed) {
    return { ok: false, mensaje: "El navegador bloqueó la ventana de impresión." };
  }
  try {
    ventana.document.open();
    ventana.document.write(estructura(titulo, contenido));
    ventana.document.close();
    ventana.focus();
    // El documento es local: abrir directamente el dialogo nativo del navegador.
    ventana.setTimeout(() => {
      if (!ventana.closed) ventana.print();
    }, 350);
    return { ok: true };
  } catch (_error) {
    return { ok: false, mensaje: "No fue posible preparar la impresión." };
  }
}

export function abrirVentanaCartera() {
  return window.open("", "_blank", "width=1100,height=800");
}

export function imprimirListadoCartera({ cuentas = [], filtro = "", estado = "Todas", empresa = null, ventana = null }) {
  if (!cuentas.length) return { ok: false, mensaje: "No hay cuentas para imprimir con los filtros actuales." };
  const total = cuentas.reduce((acumulado, cuenta) => ({
    original: acumulado.original + Number(cuenta.valorOriginal || 0),
    abonado: acumulado.abonado + Number(cuenta.totalAbonado || 0),
    saldo: acumulado.saldo + Number(cuenta.saldoPendiente || 0),
  }), { original: 0, abonado: 0, saldo: 0 });
  const filas = cuentas.map((cuenta) => `<tr>
    <td>${escapar(cuenta.codigo)}</td><td>${escapar(cuenta.pedidoCodigo)}</td>
    <td>${escapar(cuenta.clienteNombre)}</td><td>${escapar(fecha(cuenta.fechaEntrega))}</td>
    <td>${escapar(fechaVencimientoVisible(cuenta.fechaVencimiento))}</td>
    <td class="dinero">${escapar(dinero(cuenta.valorOriginal))}</td>
    <td class="dinero">${escapar(dinero(cuenta.totalAbonado))}</td>
    <td class="dinero total">${escapar(dinero(cuenta.saldoPendiente))}</td>
    <td>${escapar(cuenta.estadoVisual || cuenta.estado)}</td>
  </tr>`).join("");
  // En vertical mostramos fichas compactas para que los nueve datos
  // permanezcan legibles, sin recortar columnas ni ocultar importes.
  const fichasVerticales = cuentas.map((cuenta) => `<article class="cuenta-ficha">
    <div class="ficha-cabecera"><strong>${escapar(cuenta.codigo)}</strong>
      <span>${escapar(cuenta.estadoVisual || cuenta.estado)}</span></div>
    <div class="ficha-cliente"><b>${escapar(cuenta.clienteNombre)}</b>
      <small>Pedido ${escapar(cuenta.pedidoCodigo)}</small></div>
    <div class="ficha-fechas"><span>Entrega: <b>${escapar(fecha(cuenta.fechaEntrega))}</b></span>
      <span>Vencimiento: <b>${escapar(fechaVencimientoVisible(cuenta.fechaVencimiento))}</b></span></div>
    <div class="ficha-valores"><span>Valor original <b>${escapar(dinero(cuenta.valorOriginal))}</b></span>
      <span>Abonado <b>${escapar(dinero(cuenta.totalAbonado))}</b></span>
      <span>Saldo <b class="saldo-ficha">${escapar(dinero(cuenta.saldoPendiente))}</b></span></div>
  </article>`).join("");
  const contenido = `${encabezado("Listado de cuentas", empresa)}
    <div class="meta"><span><b>Estado:</b> ${escapar(estado)}</span>
    <span><b>Búsqueda:</b> ${escapar(filtro || "Sin filtro")}</span>
    <span><b>Registros:</b> ${cuentas.length}</span></div>
    <div class="resumen">${indicador("Cuentas", String(cuentas.length))}
    ${indicador("Valor original", dinero(total.original))}
    ${indicador("Abonado", dinero(total.abonado))}
    ${indicador("Saldo pendiente", dinero(total.saldo))}</div>
    <h2>Detalle de cartera filtrada</h2>
    <div class="solo-horizontal"><table><thead><tr>
    <th>Cartera</th><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Vencimiento</th>
    <th>Valor</th><th>Abonado</th><th>Saldo</th><th>Estado</th></tr></thead>
    <tbody>${filas}</tbody></table></div>
    <div class="solo-vertical lista-fichas">${fichasVerticales}</div>
    <p class="nota">Valores actuales de las cuentas incluidas en esta consulta. No representa un corte histórico.</p>
    <footer class="pie"><span>WebBuys · Cartera</span><span>Documento informativo</span></footer>`;
  return mostrar(ventana || abrirVentanaCartera(), "Listado de cartera", contenido);
}

export function imprimirCuentaCartera({ cartera, pagos = [], empresa = null, ventana = null }) {
  if (!cartera) return { ok: false, mensaje: "Seleccione una cuenta para imprimir." };
  const filas = pagos.map((pago) => `<tr>
    <td>${escapar(fecha(pago.fechaPago, true))}</td>
    <td class="dinero">${escapar(dinero(pago.valor))}</td>
    <td>${escapar(pago.metodoPago)}</td><td>${escapar(pago.referencia || "—")}</td>
    <td>${escapar(pago.caja?.codigo || "—")}</td>
    <td>${escapar([pago.usuario?.nombres, pago.usuario?.apellidos].filter(Boolean).join(" ") || pago.usuario?.usuario || "—")}</td>
  </tr>`).join("");
  const fichasPagos = pagos.map((pago) => `<article class="pago-ficha">
    <div class="pago-ficha-cabecera"><b>${escapar(fecha(pago.fechaPago, true))}</b>
      <strong>${escapar(dinero(pago.valor))}</strong></div>
    <div class="pago-ficha-datos">
      <span><small>Medio</small>${escapar(pago.metodoPago)}</span>
      <span><small>Referencia</small>${escapar(pago.referencia || "—")}</span>
      <span><small>Caja</small>${escapar(pago.caja?.codigo || "—")}</span>
      <span><small>Registrado por</small>${escapar([pago.usuario?.nombres, pago.usuario?.apellidos].filter(Boolean).join(" ") || pago.usuario?.usuario || "—")}</span>
    </div>
  </article>`).join("");
  const contenido = `${encabezado(`Estado de cuenta ${cartera.codigo || ""}`, empresa)}
    <div class="datos"><div class="dato"><small>Pedido</small><strong>${escapar(cartera.pedidoCodigo || "—")}</strong></div>
    <div class="dato"><small>Cliente</small><strong>${escapar(cartera.clienteNombre || "—")}</strong></div>
    <div class="dato"><small>Documento</small><strong>${escapar(cartera.clienteDocumento || cartera.cliente?.documento || "—")}</strong></div>
    <div class="dato"><small>Entrega</small><strong>${escapar(fecha(cartera.fechaEntrega))}</strong></div>
    <div class="dato"><small>Vencimiento</small><strong>${escapar(fechaVencimientoVisible(cartera.fechaVencimiento))}</strong></div>
    <div class="dato"><small>Estado</small><strong>${escapar(cartera.estadoVisual || cartera.estado || "—")}</strong></div></div>
    <div class="resumen tres">${indicador("Valor original", dinero(cartera.valorOriginal))}
    ${indicador("Total abonado", dinero(cartera.totalAbonado))}
    ${indicador("Saldo pendiente", dinero(cartera.saldoPendiente))}</div>
    <h2>Historial de pagos y abonos (${pagos.length})</h2>
    <div class="solo-horizontal"><table><thead><tr>
    <th>Fecha</th><th>Valor</th><th>Medio</th><th>Referencia</th><th>Caja</th><th>Registrado por</th></tr></thead>
    <tbody>${filas || '<tr><td colspan="6">No hay abonos registrados.</td></tr>'}</tbody></table></div>
    <div class="solo-vertical lista-fichas">${fichasPagos || '<p class="sin-abonos">No hay abonos registrados.</p>'}</div>
    ${cartera.observaciones ? `<h2>Observaciones</h2><p>${escapar(cartera.observaciones)}</p>` : ""}
    <p class="nota">Saldo consultado al momento de generar el documento. Este estado de cuenta no reemplaza una factura ni un recibo de caja.</p>
    <footer class="pie"><span>WebBuys · Cartera</span><span>Documento informativo</span></footer>`;
  return mostrar(ventana || abrirVentanaCartera(), `Cartera ${cartera.codigo || ""}`, contenido);
}
