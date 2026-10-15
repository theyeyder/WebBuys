/* =========================================================
   INFORMES HTML - WEBBUYS
   Documento autónomo para ventana emergente / impresión
========================================================= */

function escaparHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

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
    campo === "valor" &&
    fila?.indicador
  ) {
    const indicador = normalizar(fila.indicador);

    return /valor|venta|ingreso|egreso|cartera|pago|saldo|factur/.test(
      indicador
    );
  }

  return /precio|valor|subtotal|descuento|total|saldo|abono|costo|ingreso|egreso|factur/.test(
    texto
  );
}

function esCampoNumerico(campo = "", titulo = "") {
  const texto = normalizar(`${campo} ${titulo}`);

  return /cantidad|movimientos|registros|stock|unidades|numero/.test(
    texto
  );
}

function moneda(valor) {
  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return valor ?? "";
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
    return valor ?? "";
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

function claseEstado(valor) {
  const estado = normalizar(valor);

  if (/entregado|activo|pagado|confirmado|cerrado|completado/.test(estado)) {
    return "reporte-estado reporte-estado--ok";
  }

  if (/anulad|cancelad|inactivo|vencido|rechazad/.test(estado)) {
    return "reporte-estado reporte-estado--danger";
  }

  if (/pendiente|preparar|ruta|abierto|parcial/.test(estado)) {
    return "reporte-estado reporte-estado--warning";
  }

  return "reporte-estado";
}

function formatearCelda({ columna, fila }) {
  const valor = fila[columna.campo] ?? "";

  if (esCampoMoneda(columna.campo, columna.titulo, fila)) {
    return moneda(valor);
  }

  if (
    esCampoNumerico(columna.campo, columna.titulo) &&
    Number.isFinite(Number(valor))
  ) {
    return numero(valor);
  }

  return valor;
}

function construirMetricas({ columnas, filas, tipo }) {
  const metricas = [
    {
      etiqueta: "Registros",
      valor: new Intl.NumberFormat("es-CO").format(filas.length),
      clase: "",
    },
  ];

  if (tipo === "resumen") {
    return metricas;
  }

  const candidatas = [
    ["total", "Total general"],
    ["subtotal", "Subtotal"],
    ["descuento", "Descuentos"],
    ["saldo", "Saldo"],
    ["saldoPendiente", "Saldo pendiente"],
    ["valorOriginal", "Valor original"],
    ["valor", "Valor"],
  ];

  for (const [campo, etiqueta] of candidatas) {
    const columna = columnas.find(
      (item) => item.campo === campo
    );

    if (!columna) {
      continue;
    }

    const total = filas.reduce(
      (acumulado, fila) => {
        const valor = Number(fila[campo]);
        return acumulado + (Number.isFinite(valor) ? valor : 0);
      },
      0
    );

    metricas.push({
      etiqueta,
      valor: moneda(total),
      clase: "reporte-kpi--money",
    });

    if (metricas.length >= 4) {
      break;
    }
  }

  return metricas;
}

export function generarInformeHtml({
  tipo = "",
  titulo = "Informe",
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

  const identificacion = [
    empresa?.nit ? `NIT ${empresa.nit}` : "",
    empresa?.ciudad || "",
  ]
    .filter(Boolean)
    .join(" · ");

  const encabezados = columnas
    .map(
      (columna) =>
        `<th>${escaparHtml(columna.titulo)}</th>`
    )
    .join("");

  const contenido = filas
    .map((fila, indice) => {
      const celdas = columnas
        .map((columna) => {
          const valor = formatearCelda({
            columna,
            fila,
          });

          const esEstado =
            normalizar(columna.campo).includes("estado") ||
            normalizar(columna.titulo).includes("estado");

          const contenidoCelda = esEstado
            ? `<span class="${claseEstado(valor)}">${escaparHtml(valor)}</span>`
            : escaparHtml(valor);

          const alineacion =
            esCampoMoneda(columna.campo, columna.titulo, fila) ||
            esCampoNumerico(columna.campo, columna.titulo)
              ? " reporte-td--numero"
              : "";

          return `<td class="${alineacion.trim()}">${contenidoCelda}</td>`;
        })
        .join("");

      return `<tr data-row="${indice + 1}">${celdas}</tr>`;
    })
    .join("");

  const metricas = construirMetricas({
    columnas,
    filas,
    tipo,
  });

  const tarjetas = metricas
    .map(
      (item) => `
        <article class="reporte-kpi ${item.clase}">
          <span>${escaparHtml(item.etiqueta)}</span>
          <strong>${escaparHtml(item.valor)}</strong>
        </article>
      `
    )
    .join("");

  const generado = fechaGeneracion();

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escaparHtml(titulo)} - ${escaparHtml(nombreEmpresa)}</title>
<style>
  :root {
    --primary: #0f766e;
    --primary-2: #159a75;
    --accent: #20afb2;
    --ink: #172b25;
    --muted: #667085;
    --line: #dce7e2;
    --line-soft: #edf2f0;
    --surface: #ffffff;
    --surface-soft: #f6faf8;
  }

  * { box-sizing: border-box; }

  html, body { min-height: 100%; }

  body {
    margin: 0;
    background:
      radial-gradient(circle at 10% 0%, rgba(32,175,178,.09), transparent 24%),
      #eef4f2;
    color: var(--ink);
    font-family: Arial, Helvetica, sans-serif;
  }

  .reporte-shell {
    width: min(1480px, calc(100% - 36px));
    margin: 24px auto 42px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
    box-shadow: 0 18px 46px rgba(15,23,42,.10);
  }

  .reporte-header {
    position: relative;
    padding: 26px 30px 24px;
    color: #fff;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-2) 55%, var(--accent) 100%);
  }

  .reporte-header::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 3px;
    background: rgba(255,255,255,.22);
  }

  .reporte-brand {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
  }

  .reporte-brand-copy { min-width: 0; }

  .reporte-brand-name {
    margin: 0;
    font-size: 25px;
    line-height: 1.1;
    font-weight: 900;
    letter-spacing: -.03em;
  }

  .reporte-brand-meta {
    margin-top: 6px;
    color: rgba(255,255,255,.78);
    font-size: 12px;
    font-weight: 700;
  }

  .reporte-documento {
    padding: 7px 11px;
    border: 1px solid rgba(255,255,255,.28);
    border-radius: 999px;
    background: rgba(255,255,255,.12);
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .reporte-title {
    margin: 24px 0 0;
    font-size: 30px;
    line-height: 1.15;
    font-weight: 900;
    letter-spacing: -.03em;
  }

  .reporte-subtitle {
    margin: 7px 0 0;
    color: rgba(255,255,255,.84);
    font-size: 13px;
    font-weight: 700;
  }

  .reporte-meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 24px;
    border-bottom: 1px solid var(--line);
    background: #fff;
  }

  .reporte-meta-item {
    min-width: 0;
    padding: 11px 13px;
    border: 1px solid var(--line-soft);
    border-radius: 11px;
    background: var(--surface-soft);
  }

  .reporte-meta-item span {
    display: block;
    margin-bottom: 4px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .07em;
    text-transform: uppercase;
  }

  .reporte-meta-item strong {
    display: block;
    overflow: hidden;
    color: #23342e;
    font-size: 13px;
    font-weight: 900;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reporte-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 12px;
    padding: 20px 24px 4px;
  }

  .reporte-kpi {
    position: relative;
    min-height: 76px;
    padding: 14px 16px 14px 19px;
    overflow: hidden;
    border: 1px solid var(--line);
    border-radius: 13px;
    background: linear-gradient(145deg, #fff, #f8fbfa);
  }

  .reporte-kpi::before {
    content: "";
    position: absolute;
    left: 0;
    top: 13px;
    bottom: 13px;
    width: 4px;
    border-radius: 0 8px 8px 0;
    background: linear-gradient(180deg, var(--primary-2), var(--accent));
  }

  .reporte-kpi span {
    display: block;
    margin-bottom: 7px;
    color: var(--muted);
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .05em;
    text-transform: uppercase;
  }

  .reporte-kpi strong {
    display: block;
    color: #172b25;
    font-size: 20px;
    font-weight: 900;
  }

  .reporte-table-section { padding: 20px 24px 26px; }

  .reporte-table-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 10px;
  }

  .reporte-table-heading h2 {
    margin: 0;
    color: #24372f;
    font-size: 15px;
    font-weight: 900;
  }

  .reporte-table-heading span {
    color: var(--muted);
    font-size: 11px;
    font-weight: 700;
  }

  .reporte-table-wrap {
    width: 100%;
    overflow-x: auto;
    border: 1px solid var(--line);
    border-radius: 12px;
  }

  table {
    width: 100%;
    min-width: 880px;
    border-collapse: separate;
    border-spacing: 0;
    background: #fff;
  }

  th {
    padding: 11px 12px;
    border-right: 1px solid rgba(255,255,255,.14);
    background: var(--primary);
    color: #fff;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .035em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }

  th:last-child { border-right: 0; }

  td {
    padding: 10px 12px;
    border-right: 1px solid var(--line-soft);
    border-bottom: 1px solid var(--line-soft);
    color: #33443e;
    font-size: 11px;
    font-weight: 600;
    vertical-align: middle;
  }

  td:last-child { border-right: 0; }
  tbody tr:last-child td { border-bottom: 0; }
  tbody tr:nth-child(even) td { background: #f8fbfa; }
  tbody tr:hover td { background: #eff8f4; }

  .reporte-td--numero {
    text-align: right;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .reporte-estado {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 4px 8px;
    border: 1px solid #d7e1de;
    border-radius: 999px;
    background: #f5f7f6;
    color: #475467;
    font-size: 9px;
    font-weight: 900;
    white-space: nowrap;
  }

  .reporte-estado--ok {
    border-color: #b7e7cd;
    background: #eaf8f0;
    color: #087443;
  }

  .reporte-estado--warning {
    border-color: #f4d9a0;
    background: #fff7e6;
    color: #9a6700;
  }

  .reporte-estado--danger {
    border-color: #f2b8b4;
    background: #fff0ee;
    color: #b42318;
  }

  .reporte-vacio {
    padding: 42px 20px;
    color: var(--muted);
    text-align: center;
    font-size: 13px;
    font-weight: 700;
  }

  .reporte-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 24px;
    border-top: 1px solid var(--line);
    background: #f8fbfa;
    color: #81908a;
    font-size: 10px;
    font-weight: 700;
  }

  @media (max-width: 900px) {
    .reporte-shell { width: min(100% - 18px, 1480px); margin-top: 9px; }
    .reporte-meta { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 560px) {
    .reporte-header { padding: 22px 18px; }
    .reporte-brand { flex-direction: column; }
    .reporte-title { font-size: 24px; }
    .reporte-meta { grid-template-columns: 1fr; padding: 14px; }
    .reporte-kpis, .reporte-table-section { padding-left: 14px; padding-right: 14px; }
  }

  @media print {
    @page { margin: 12mm; }
    body { background: #fff; }
    .reporte-shell {
      width: 100%;
      margin: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .reporte-header {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .reporte-meta-item,
    .reporte-kpi,
    th,
    tbody tr:nth-child(even) td,
    .reporte-estado {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .reporte-table-wrap { overflow: visible; }
    table { min-width: 0; }
    th, td { font-size: 8px; }
    .reporte-footer { margin-top: 14px; }
  }
</style>
</head>
<body>
  <main class="reporte-shell">
    <header class="reporte-header">
      <div class="reporte-brand">
        <div class="reporte-brand-copy">
          <h1 class="reporte-brand-name">${escaparHtml(nombreEmpresa)}</h1>
          <div class="reporte-brand-meta">${escaparHtml(identificacion || "Sistema de gestión WebBuys")}</div>
        </div>
        <div class="reporte-documento">Informe WebBuys</div>
      </div>

      <h2 class="reporte-title">${escaparHtml(titulo)}</h2>
      <p class="reporte-subtitle">Información consolidada para el período seleccionado.</p>
    </header>

    <section class="reporte-meta">
      <div class="reporte-meta-item">
        <span>Desde</span>
        <strong>${escaparHtml(desde || "No definido")}</strong>
      </div>
      <div class="reporte-meta-item">
        <span>Hasta</span>
        <strong>${escaparHtml(hasta || "No definido")}</strong>
      </div>
      <div class="reporte-meta-item">
        <span>Usuario</span>
        <strong>${escaparHtml(usuario || "No definido")}</strong>
      </div>
      <div class="reporte-meta-item">
        <span>Generado</span>
        <strong>${escaparHtml(generado)}</strong>
      </div>
    </section>

    <section class="reporte-kpis">
      ${tarjetas}
    </section>

    <section class="reporte-table-section">
      <div class="reporte-table-heading">
        <h2>Detalle del informe</h2>
        <span>${filas.length} registro${filas.length === 1 ? "" : "s"}</span>
      </div>

      <div class="reporte-table-wrap">
        ${
          filas.length
            ? `<table>
                <thead><tr>${encabezados}</tr></thead>
                <tbody>${contenido}</tbody>
              </table>`
            : `<div class="reporte-vacio">No hay registros para el período seleccionado.</div>`
        }
      </div>
    </section>

    <footer class="reporte-footer">
      <span>${escaparHtml(nombreEmpresa)}</span>
      <span>Generado por WebBuys · ${escaparHtml(generado)}</span>
    </footer>
  </main>
</body>
</html>`;
}
