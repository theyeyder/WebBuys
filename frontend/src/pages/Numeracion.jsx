import {
  useEffect,
  useState,
} from "react";

import { Printer } from "lucide-react";

import useAutoRefresh
  from "../hooks/useAutoRefresh.js";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarNumeraciones,
} from "../services/numeracion.service.js";

import "../styles/numeracion.css";


// Escapa los textos provenientes de la API antes de crear el documento imprimible.
function escaparHtml(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, (caracter) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[caracter]));
}

function obtenerUltimoCodigo(item) {
  return item.ultimoCodigo ||
    (item.ultimoNumero > 0
      ? `${item.prefijo}-${item.ultimoFormateado}`
      : "Sin registros");
}


export default function Numeracion() {

  const [
    numeraciones,
    setNumeraciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     CARGAR NUMERACIÓN
  ========================================= */

  useEffect(() => {
    cargarNumeraciones();
  }, []);


  useAutoRefresh(
    () => cargarNumeraciones(),
    {
      intervalMs: 0,
    }
  );


  async function cargarNumeraciones() {

    try {

      setCargando(true);
      setError("");

      const data =
        await listarNumeraciones();

      setNumeraciones(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Error cargando numeración:",
        err
      );

      setError(
        err.response?.data?.mensaje ||
        "No fue posible cargar la numeración."
      );

    } finally {

      setCargando(false);

    }

  }


  // Vista previa independiente y estable: el usuario decide cuándo abrir
  // la impresión nativa del navegador. No modifica los consecutivos.
  function imprimirNumeraciones() {
    if (cargando || error || numeraciones.length === 0) return;

    const ventana = window.open("", "_blank");
    if (!ventana) {
      window.alert("El navegador bloqueó la vista previa. Permite ventanas emergentes para WebBuys e inténtalo nuevamente.");
      return;
    }
    ventana.opener = null;

    const fechaImpresion = new Intl.DateTimeFormat("es-CO", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date());
    const totalPropios = numeraciones.filter((item) => item.tipo !== "vinculado").length;
    const totalVinculados = numeraciones.length - totalPropios;

    const filas = numeraciones.map((item) => {
      const vinculado = item.tipo === "vinculado";
      const ultimoNumero = item.ultimoNumero === null || item.ultimoNumero === undefined
        ? "—"
        : item.ultimoNumero;
      return `
        <tr>
          <td class="modulo">
            <strong>${escaparHtml(item.modulo)}</strong>
            ${vinculado ? '<span class="etiqueta">Vinculado</span>' : ""}
            ${item.descripcion ? `<span class="descripcion">${escaparHtml(item.descripcion)}</span>` : ""}
          </td>
          <td class="centro">${escaparHtml(item.prefijo)}</td>
          <td class="centro">${escaparHtml(ultimoNumero)}</td>
          <td class="centro"><span class="codigo">${escaparHtml(obtenerUltimoCodigo(item))}</span></td>
          <td class="centro"><span class="codigo siguiente${vinculado ? " vinculado" : ""}">${escaparHtml(item.siguienteCodigo ?? "—")}</span></td>
        </tr>`;
    }).join("");

    const documento = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WebBuys | Impresión de numeración</title>
  <style>
    /* Diseño adaptable: la orientación, el papel y los márgenes se eligen
       en la impresión NATIVA de Chrome/Edge. No fijar @page size. */
    :root { color-scheme: light; }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; color: #162a34; background: #eaf0ed; font-size: 13px; line-height: 1.42; }
    .barra { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 14px 22px; background: #fff; border-bottom: 1px solid #d9e5df; box-shadow: 0 2px 12px #142d2212; }
    .barra strong { display: block; font-size: 16px; color: #18382e; }
    .barra p { margin: 3px 0 0; font-size: 12px; color: #53675f; }
    .acciones { display: flex; gap: 10px; flex-wrap: wrap; }
    .acciones button { padding: 11px 16px; border: 1px solid #b9cec5; border-radius: 9px; background: #fff; color: #26483c; font: 700 13px Arial, sans-serif; cursor: pointer; }
    .acciones button.principal { background: #0d806c; color: #fff; border-color: #0d806c; }
    .acciones button:hover { filter: brightness(.96); }
    .marco { padding: 28px 18px 48px; overflow-x: auto; }
    .hoja { width: 100%; max-width: 216mm; min-width: 0; margin: 0 auto; padding: 14mm 13mm 15mm; background: #fff; box-shadow: 0 15px 45px #15392d1c; border-top: 5px solid #0d806c; }
    .cabecera { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding-bottom: 16px; border-bottom: 2px solid #0d806c; margin-bottom: 18px; }
    .cabecera > div:first-child { flex: 1 1 auto; min-width: 0; }
    .identificador { margin: 0 0 7px; font-size: 11px; font-weight: 800; letter-spacing: .095em; color: #0c7966; }
    h1 { margin: 0; font-size: 27px; line-height: 1.15; letter-spacing: -.035em; color: #112d25; }
    .subtitulo { margin: 7px 0 0; color: #586b63; font-size: 12px; }
    .fecha { flex: 0 0 190px; max-width: 190px; text-align: right; color: #465b52; font-size: 11px; line-height: 1.5; }
    .fecha strong { display: block; font-size: 11px; color: #173c2f; margin-bottom: 3px; }
    .resumen { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-bottom: 21px; }
    .resumen .metrica { display: flex; align-items: center; gap: 11px; min-width: 0; padding: 12px 13px; background: #f2faf6; border: 1px solid #d2e9dc; border-radius: 9px; }
    .resumen .valor { flex: 0 0 auto; color: #08755c; font-size: 26px; font-weight: 800; line-height: 1; }
    .resumen .texto { color: #36574a; font-size: 11px; font-weight: 700; line-height: 1.3; }
    .tabla-titulo { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 10px; }
    .tabla-titulo h2 { margin: 0; font-size: 14px; color: #1c4033; }
    .tabla-titulo span { font-size: 11px; color: #66786f; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #d4e2db; }
    col.modulo-col { width: 29%; }
    col.prefijo-col { width: 11%; }
    col.numero-col { width: 14%; }
    col.ultimo-col { width: 23%; }
    col.proximo-col { width: 23%; }
    thead { display: table-header-group; }
    th { background: #137b68; color: #fff; padding: 12px 8px; text-align: center; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .015em; border-bottom: 2px solid #0a6756; }
    th:first-child { text-align: left; padding-left: 14px; }
    td { padding: 11px 8px; border-bottom: 1px solid #dbe7e0; vertical-align: middle; font-size: 12.5px; overflow-wrap: anywhere; }
    td.modulo { padding-left: 14px; }
    td.modulo strong { font-size: 12.5px; color: #1d3028; }
    td.centro { text-align: center; }
    tbody tr:nth-child(even) { background: #f5faf7; }
    tr { break-inside: avoid; page-break-inside: avoid; }
    .descripcion { display: block; margin-top: 5px; color: #52695d; font-size: 10.5px; line-height: 1.35; }
    .etiqueta { display: inline-block; margin-left: 6px; padding: 3px 6px; border: 1px solid #d3e0da; border-radius: 4px; background: #edf3f0; color: #416255; font-size: 9px; font-weight: 800; vertical-align: middle; }
    .codigo { display: inline-block; max-width: 100%; padding: 5px 7px; border: 1px solid #cddbd4; border-radius: 5px; background: #fff; color: #263d33; font-weight: 800; white-space: normal; overflow-wrap: anywhere; }
    .codigo.siguiente { background: #e6f8ec; border-color: #a8ddbd; color: #07653d; }
    .codigo.siguiente.vinculado { background: #f1f4f2; border-color: #cdd8d1; color: #455e50; }
    .pie { display: flex; gap: 11px; margin-top: 18px; padding: 13px 14px; border: 1px solid #d6e5dd; border-left: 4px solid #0d806c; border-radius: 5px; background: #f6faf8; color: #455f52; font-size: 11px; line-height: 1.5; }
    .pie strong { color: #15533d; }
    .pie .nota-icono { font-size: 17px; line-height: 1; color: #0d806c; font-weight: 800; }
    .pie .nota-contenido { flex: 1; }
    .documento-final { display: flex; justify-content: space-between; gap: 14px; margin-top: 16px; padding-top: 11px; border-top: 1px solid #dbe6df; font-size: 10px; color: #607469; }
    @media screen and (max-width: 760px) {
      .hoja { min-width: 710px; }
      .barra { align-items: flex-start; flex-direction: column; padding: 12px; }
      .marco { padding: 14px 0 28px; }
    }
    @media print {
      /* Base compacta: también evita cortes en navegadores que no detectan
         correctamente la orientación seleccionada. No usar @page size. */
      html, body { width: auto; height: auto; margin: 0; padding: 0; background: #fff !important; }
      .barra { display: none !important; }
      .marco { margin: 0; padding: 0; overflow: visible; }
      .hoja { width: 100%; max-width: none; min-width: 0; margin: 0; padding: 0; box-shadow: none; border-top: 0; }
      .cabecera { break-inside: avoid; padding-bottom: 7px; margin-bottom: 9px; }
      h1 { font-size: 20px; }
      .identificador { font-size: 9px; margin-bottom: 3px; }
      .subtitulo { font-size: 10px; margin-top: 4px; }
      .fecha { font-size: 9.5px; white-space: normal; }
      .resumen { break-inside: avoid; gap: 9px; margin-bottom: 9px; }
      .resumen .metrica { padding: 6px 10px; border-radius: 5px; background: #fff; border-color: #b8d1c3; }
      .resumen .valor { font-size: 20px; }
      .resumen .texto { font-size: 10px; }
      .tabla-titulo { break-inside: avoid; margin-bottom: 5px; }
      .tabla-titulo h2 { font-size: 12px; }
      table { width: 100%; border: 1px solid #c8d9ce; }
      th { background: #eaf3ee !important; color: #124e3d !important; border-bottom: 2px solid #137b68; padding: 6px 5px; font-size: 10px; }
      th:first-child { padding-left: 9px; }
      td { padding: 5px 6px; font-size: 10.5px; }
      td.modulo { padding-left: 9px; }
      td.modulo strong { font-size: 10.5px; }
      tbody tr:nth-child(even) { background: #f7faf8; }
      .descripcion { margin-top: 2px; font-size: 9px; }
      .codigo { padding: 2px 5px; }
      .etiqueta { padding: 1px 4px; font-size: 8px; }
      .pie { break-inside: avoid; margin-top: 8px; padding: 7px 9px; background: #fff; font-size: 9.5px; }
      .documento-final { break-inside: avoid; margin-top: 7px; padding-top: 6px; font-size: 9px; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    /* En vertical hay más altura: aumenta la tipografía y el espaciado. */
    @media print and (orientation: portrait) {
      .cabecera { padding-bottom: 12px; margin-bottom: 14px; }
      h1 { font-size: 23px; }
      .identificador { font-size: 11px; margin-bottom: 7px; }
      .subtitulo { font-size: 12px; margin-top: 7px; }
      .fecha { font-size: 11px; }
      .resumen { gap: 8px; margin-bottom: 15px; }
      .resumen .metrica { padding: 9px 10px; }
      .resumen .valor { font-size: 23px; }
      .resumen .texto { font-size: 10.5px; }
      .tabla-titulo { margin-bottom: 7px; }
      .tabla-titulo h2 { font-size: 13px; }
      th { padding: 10px 5px; font-size: 10.5px; }
      td { padding: 9px 5px; font-size: 12px; }
      td.modulo strong { font-size: 12px; }
      .descripcion { margin-top: 5px; font-size: 10px; }
      .codigo { padding: 4px 5px; }
      .pie { margin-top: 13px; padding: 10px 11px; font-size: 10.5px; }
      .documento-final { margin-top: 12px; padding-top: 11px; font-size: 10px; }
    }
    /* Adaptación adicional si el usuario selecciona horizontal en el navegador.
       No fija la orientación, solo compacta la composición para esa hoja. */
    @media print and (orientation: landscape) {
      .cabecera { padding-bottom: 7px; margin-bottom: 9px; }
      h1 { font-size: 20px; }
      .identificador { font-size: 9px; margin-bottom: 3px; }
      .subtitulo { font-size: 10px; margin-top: 4px; }
      .fecha { font-size: 9.5px; }
      .resumen { gap: 9px; margin-bottom: 9px; }
      .resumen .metrica { padding: 6px 10px; }
      .resumen .valor { font-size: 20px; }
      .resumen .texto { font-size: 10px; }
      .tabla-titulo { margin-bottom: 5px; }
      th { padding: 6px 5px; font-size: 10px; }
      td { padding: 5px 6px; font-size: 10.5px; }
      td.modulo strong { font-size: 10.5px; }
      .descripcion { margin-top: 2px; font-size: 9px; }
      .codigo { padding: 2px 5px; }
      .etiqueta { padding: 1px 4px; font-size: 8px; }
      .pie { margin-top: 8px; padding: 7px 9px; font-size: 9.5px; }
      .documento-final { margin-top: 7px; padding-top: 6px; font-size: 9px; }
    }
  </style>
</head>
<body>
  <div class="barra">
    <div>
      <strong>Vista previa · Numeración</strong>
      <p>Elige orientación (vertical u horizontal), papel y márgenes en el cuadro de impresión de tu navegador.</p>
    </div>
    <div class="acciones">
      <button type="button" id="numeracion-cerrar">Cerrar</button>
      <button type="button" class="principal" id="numeracion-imprimir">Imprimir / Guardar PDF</button>
    </div>
  </div>
  <div class="marco">
    <article class="hoja">
      <div class="cabecera">
        <div>
          <p class="identificador">WEBBUYS · CONFIGURACIÓN</p>
          <h1>Consecutivos del sistema</h1>
          <p class="subtitulo">Reporte de numeración · Solo consulta</p>
        </div>
        <div class="fecha"><strong>Fecha de generación</strong>${escaparHtml(fechaImpresion)}</div>
      </div>
      <div class="resumen">
        <div class="metrica"><span class="valor">${numeraciones.length}</span><span class="texto">Módulos en el informe</span></div>
        <div class="metrica"><span class="valor">${totalPropios}</span><span class="texto">Consecutivos propios</span></div>
        <div class="metrica"><span class="valor">${totalVinculados}</span><span class="texto">Módulos vinculados</span></div>
      </div>
      <div class="tabla-titulo"><h2>Detalle de consecutivos</h2><span>Consulta de solo lectura</span></div>
      <table aria-label="Consecutivos del sistema">
        <colgroup>
          <col class="modulo-col" /><col class="prefijo-col" /><col class="numero-col" /><col class="ultimo-col" /><col class="proximo-col" />
        </colgroup>
        <thead><tr><th>Módulo</th><th>Prefijo</th><th>Último número</th><th>Último código</th><th>Próximo código</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="pie">
        <span class="nota-icono" aria-hidden="true">i</span>
        <div class="nota-contenido"><strong>Información importante.</strong> Cartera y Entregas utilizan referencias vinculadas a Pedidos; no generan un consecutivo independiente. Este reporte no modifica la numeración.</div>
      </div>
      <div class="documento-final"><span>WebBuys V13 · Configuración / Numeración</span><span>Documento informativo</span></div>
    </article>
  </div>
</body>
</html>`;

    // No invocamos print() durante load: algunos navegadores imprimen
    // el documento incompleto o muestran una vista previa en blanco.
    ventana.document.open();
    ventana.document.write(documento);
    ventana.document.close();
    ventana.document.getElementById("numeracion-imprimir")?.addEventListener("click", () => {
      ventana.focus();
      ventana.print();
    });
    ventana.document.getElementById("numeracion-cerrar")?.addEventListener("click", () => {
      ventana.close();
    });
    ventana.focus();
  }


  return (

    <section className="numeracion-page">

      {/* =====================================
          CABECERA
      ===================================== */}

      <header className="numeracion-header">

        <div className="numeracion-header-left">

          <ModulosMenu />

          <h1>
            Numeración
          </h1>

        </div>

      </header>


      {/* =====================================
          CONTENIDO
      ===================================== */}

      <main className="numeracion-content">

        <div className="numeracion-panel">

          <div className="numeracion-panel-header">

            <div>
              <h2>
                Consecutivos del sistema
              </h2>
            </div>

            <button
              type="button"
              className="numeracion-print-button"
              onClick={imprimirNumeraciones}
              disabled={cargando || Boolean(error) || numeraciones.length === 0}
              title="Imprimir todos los consecutivos"
            >
              <Printer size={17} aria-hidden="true" />
              <span>Imprimir</span>
            </button>

          </div>


          {error && (

            <div className="numeracion-error">
              {error}
            </div>

          )}


          <div className="numeracion-table-wrapper">

            <table className="numeracion-table">

              <thead>

                <tr>
                  <th>Módulo</th>
                  <th>Prefijo</th>
                  <th>Último número</th>
                  <th>Último código</th>
                  <th>Próximo código</th>
                </tr>

              </thead>


              <tbody>

                {cargando ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="numeracion-empty"
                    >
                      Cargando numeración...
                    </td>

                  </tr>

                ) : numeraciones.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="numeracion-empty"
                    >
                      No hay numeraciones
                      disponibles.
                    </td>

                  </tr>

                ) : (

                  numeraciones.map(
                    (item) => {

                      const ultimoCodigo =
                        item.ultimoCodigo ||
                        (item.ultimoNumero > 0
                          ? `${item.prefijo}-${item.ultimoFormateado}`
                          : "Sin registros");

                      return (

                        <tr key={item.clave}>

                          <td>
                            <strong>
                              {item.modulo}
                            </strong>
                            {item.descripcion && (
                              <small className="numeracion-origen" title={item.descripcion}>
                                {item.descripcion}
                              </small>
                            )}
                          </td>

                          <td>
                            {item.prefijo}
                          </td>

                          <td>
                            {item.ultimoNumero ?? "—"}
                          </td>

                          <td>
                            <span className="numeracion-code">
                              {ultimoCodigo}
                            </span>
                          </td>

                          <td>
                            <span className={`numeracion-next-code${item.tipo === "vinculado" ? " numeracion-next-derived" : ""}`}>
                              {item.siguienteCodigo}
                            </span>
                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          <p className="numeracion-panel-note">
            Los códigos de Cartera y Entregas dependen del pedido y no tienen
            consecutivo independiente. Esta pantalla es de solo lectura.
          </p>

        </div>

      </main>

    </section>

  );
}