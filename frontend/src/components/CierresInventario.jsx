import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  cerrarPeriodoInventario,
  listarCierresInventario,
  obtenerPeriodoInventario,
} from "../services/inventario.service.js";

import cerrarIcono
  from "../assets/icons/cerrar.webp";

import imprimirIcono
  from "../assets/icons/imprimir.webp";

import cierrePrintCss
  from "../styles/impresiones/cierre-inventario-print.css?inline";

import "../styles/cierre-inventario.css";


const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];


function fechaNegocioActual() {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bogota",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    )
      .formatToParts(
        new Date()
      )
      .reduce(
        (acc, parte) => {
          if (
            [
              "year",
              "month",
              "day",
            ].includes(
              parte.type
            )
          ) {
            acc[parte.type] =
              parte.value;
          }

          return acc;
        },
        {}
      );

  return {
    anio:
      Number(partes.year),
    mes:
      Number(partes.month),
    dia:
      Number(partes.day),
  };
}


function numero(
  valor,
  decimales = 2
) {
  const n =
    Number(valor);

  if (
    !Number.isFinite(n)
  ) {
    return "0";
  }

  return n.toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        decimales,
    }
  );
}


function moneda(
  valor
) {
  const n =
    Number(valor);

  return Number.isFinite(n)
    ? n.toLocaleString(
        "es-CO",
        {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }
      )
    : "$ 0";
}


function fechaHora(
  valor
) {
  if (!valor) {
    return "-";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "-";
  }

  return fecha.toLocaleString(
    "es-CO"
  );
}


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


export default function CierresInventario({
  abierto,
  onClose,
  esAdmin,
  onMensaje,
  onError,
}) {
  const hoy =
    useMemo(
      () =>
        fechaNegocioActual(),
      [abierto]
    );

  const [
    anio,
    setAnio,
  ] = useState(
    hoy.anio
  );

  const [
    mes,
    setMes,
  ] = useState(
    hoy.mes
  );

  const [
    cierre,
    setCierre,
  ] = useState(null);

  const [
    cierres,
    setCierres,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(false);

  const [
    cerrando,
    setCerrando,
  ] = useState(false);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    detalleTecnico,
    setDetalleTecnico,
  ] = useState("");


  const anios =
    useMemo(
      () =>
        Array.from(
          { length: 8 },
          (_, index) =>
            hoy.anio -
            index
        ),
      [hoy.anio]
    );


  const periodoSeleccionadoNumero =
    Number(anio) * 100 +
    Number(mes);

  const periodoActualNumero =
    hoy.anio * 100 +
    hoy.mes;

  const mesFinalizado =
    periodoSeleccionadoNumero <
    periodoActualNumero;

  const estaCerrado =
    cierre?.estado ===
    "CERRADO";


  async function cargarCierres() {
    try {
      const data =
        await listarCierresInventario();

      setCierres(
        Array.isArray(
          data?.cierres
        )
          ? data.cierres
          : []
      );
    } catch (err) {
      onError?.(
        err?.response?.data
          ?.mensaje ||
        "No fue posible cargar los cierres anteriores."
      );
    }
  }


  async function cargarPeriodo() {
    try {
      setCargando(true);

      const data =
        await obtenerPeriodoInventario(
          anio,
          mes
        );

      setCierre(
        data?.cierre ||
        null
      );

      setDetalleTecnico("");

      setObservaciones(
        data?.cierre
          ?.observaciones ||
        ""
      );
    } catch (err) {
      setCierre(null);

      onError?.(
        err?.response?.data
          ?.mensaje ||
        "No fue posible cargar el período de inventario."
      );
    } finally {
      setCargando(false);
    }
  }


  useEffect(() => {
    if (!abierto) {
      return;
    }

    cargarCierres();
  }, [abierto]);


  useEffect(() => {
    if (!abierto) {
      return;
    }

    cargarPeriodo();
  }, [
    abierto,
    anio,
    mes,
  ]);


  useEffect(() => {
    if (!abierto) {
      setBusqueda("");
      setDetalleTecnico("");
      return;
    }

    setAnio(
      hoy.anio
    );
    setMes(
      hoy.mes
    );
  }, [abierto]);


  const detallesFiltrados =
    useMemo(
      () => {
        const detalles =
          Array.isArray(
            cierre?.detalles
          )
            ? cierre.detalles
            : [];

        const texto =
          busqueda
            .trim()
            .toLowerCase();

        if (!texto) {
          return detalles;
        }

        return detalles.filter(
          (detalle) =>
            [
              detalle.codigo,
              detalle.producto,
              detalle.presentacion,
              detalle.marca,
              detalle.categoria,
              detalle.unidad,
            ].some(
              (valor) =>
                String(
                  valor || ""
                )
                  .toLowerCase()
                  .includes(texto)
            )
        );
      },
      [
        cierre,
        busqueda,
      ]
    );


  async function cerrarMes() {
    if (
      !esAdmin ||
      !mesFinalizado ||
      estaCerrado ||
      cerrando
    ) {
      return;
    }

    const confirmado =
      window.confirm(
        `¿Cerrar definitivamente ${MESES[mes - 1]} de ${anio}?\n\nDespués del cierre no se permitirán movimientos retroactivos con fecha de este período.`
      );

    if (!confirmado) {
      return;
    }

    try {
      setCerrando(true);

      const data =
        await cerrarPeriodoInventario(
          anio,
          mes,
          {
            observaciones,
          }
        );

      setCierre(
        data?.cierre ||
        null
      );

      onMensaje?.(
        data?.mensaje ||
        "Cierre mensual registrado correctamente."
      );

      await cargarCierres();
    } catch (err) {
      onError?.(
        err?.response?.data
          ?.mensaje ||
        "No fue posible cerrar el mes."
      );
    } finally {
      setCerrando(false);
    }
  }


  function seleccionarCierre(
    item
  ) {
    setAnio(
      Number(
        item.anio
      )
    );
    setMes(
      Number(
        item.mes
      )
    );
  }


  function imprimirCierre() {
    if (
      !cierre ||
      !Array.isArray(
        cierre.detalles
      )
    ) {
      onError?.(
        "No hay información del período para imprimir."
      );
      return;
    }

    const ventana =
      window.open(
        "",
        "_blank",
        "width=1400,height=900"
      );

    if (!ventana) {
      onError?.(
        "El navegador bloqueó la ventana de impresión."
      );
      return;
    }

    const nombrePeriodo =
      `${MESES[cierre.mes - 1]} ${cierre.anio}`;

    const filas =
      cierre.detalles
        .map(
          (detalle) => `
            <tr>
              <td>${escaparHtml(detalle.codigo)}</td>
              <td>
                <strong>${escaparHtml(detalle.producto)}</strong>
                ${detalle.presentacion
                  ? `<small>${escaparHtml(detalle.presentacion)}</small>`
                  : ""}
              </td>
              <td>${escaparHtml(detalle.unidad)}</td>
              <td class="numero">${numero(detalle.stockInicial, 4)}</td>
              <td class="numero">${numero(detalle.entradas, 4)}</td>
              <td class="numero fuerte">${numero(detalle.vendidoNeto, 4)}</td>
              <td class="numero">${numero(detalle.otrasSalidas, 4)}</td>
              <td class="numero">${numero(detalle.ajustesPositivos, 4)}</td>
              <td class="numero">${numero(detalle.ajustesNegativos, 4)}</td>
              <td class="numero fuerte">${numero(detalle.stockFinal, 4)}</td>
              <td class="numero">${moneda(detalle.valorInventarioFinal)}</td>
            </tr>
          `
        )
        .join("");

    ventana.document.write(`
      <!doctype html>
      <html lang="es">
        <head>
          <meta charset="UTF-8" />
          <title>Cierre inventario - ${escaparHtml(nombrePeriodo)}</title>
          <style>${cierrePrintCss}</style>
        </head>
        <body>
          <main class="cierre-print">
            <header>
              <div>
                <p>WEBBUYS · INVENTARIO</p>
                <h1>Cierre mensual de inventario</h1>
                <h2>${escaparHtml(nombrePeriodo)}</h2>
              </div>
              <span class="estado ${cierre.estado === "CERRADO" ? "cerrado" : "abierto"}">
                ${escaparHtml(cierre.estado)}
              </span>
            </header>

            <section class="resumen">
              <div><span>Productos</span><strong>${numero(cierre.totalProductos, 0)}</strong></div>
              <div><span>Entradas</span><strong>${numero(cierre.totalEntradas, 4)}</strong></div>
              <div><span>Vendido</span><strong>${numero(cierre.totalVendidoNeto, 4)}</strong></div>
              <div><span>Inventario final</span><strong>${moneda(cierre.valorInventarioFinal)}</strong></div>
            </section>

            <section class="meta">
              <span><strong>Período:</strong> ${escaparHtml(cierre.periodo)}</span>
              <span><strong>Fecha de cierre:</strong> ${escaparHtml(fechaHora(cierre.fechaCierre))}</span>
              <span><strong>Cerrado por:</strong> ${escaparHtml(cierre.cerradoPorNombre || "-")}</span>
            </section>

            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Unidad</th>
                  <th>Inicial</th>
                  <th>Entradas</th>
                  <th>Vendido</th>
                  <th>Otras salidas</th>
                  <th>Ajuste +</th>
                  <th>Ajuste -</th>
                  <th>Final</th>
                  <th>Valor final</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>

            ${cierre.observaciones
              ? `<p class="observaciones"><strong>Observaciones:</strong> ${escaparHtml(cierre.observaciones)}</p>`
              : ""}

            <footer>
              Generado desde WebBuys · ${escaparHtml(new Date().toLocaleString("es-CO"))}
            </footer>
          </main>
          <script>
            window.addEventListener("load", () => {
              window.print();
            });
          <\/script>
        </body>
      </html>
    `);

    ventana.document.close();
  }


  if (!abierto) {
    return null;
  }


  return (
    <div className="cierre-inventario-overlay">
      <section
        className="cierre-inventario-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Cierres mensuales de inventario"
      >
        <header className="cierre-inventario-header">
          <div>
            <span>
              Inventario
            </span>
            <h3>
              Cierres mensuales
            </h3>
            <p>
              Consulta cuánto entró, cuánto se vendió y con cuánto inventario terminó cada producto.
            </p>
          </div>

          <button
            type="button"
            className="cierre-inventario-close"
            onClick={onClose}
            disabled={cerrando}
            aria-label="Cerrar"
          >
            <img
              src={cerrarIcono}
              alt=""
              aria-hidden="true"
            />
          </button>
        </header>


        <div className="cierre-inventario-toolbar">
          <label>
            <span>Año</span>
            <select
              value={anio}
              onChange={
                (event) =>
                  setAnio(
                    Number(
                      event.target.value
                    )
                  )
              }
              disabled={cargando || cerrando}
            >
              {anios.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                )
              )}
            </select>
          </label>

          <label>
            <span>Mes</span>
            <select
              value={mes}
              onChange={
                (event) =>
                  setMes(
                    Number(
                      event.target.value
                    )
                  )
              }
              disabled={cargando || cerrando}
            >
              {MESES.map(
                (nombre, index) => (
                  <option
                    key={nombre}
                    value={index + 1}
                  >
                    {nombre}
                  </option>
                )
              )}
            </select>
          </label>

          <div className="cierre-inventario-status-wrap">
            <span>Estado</span>
            <strong
              className={
                estaCerrado
                  ? "cerrado"
                  : "abierto"
              }
            >
              {cierre?.estado || "ABIERTO"}
            </strong>
          </div>

          <button
            type="button"
            className="cierre-inventario-print"
            onClick={imprimirCierre}
            disabled={
              cargando ||
              !cierre
            }
            title="Imprimir"
          >
            <img
              src={imprimirIcono}
              alt=""
              aria-hidden="true"
            />
          </button>
        </div>


        <div className="cierre-inventario-body">
          <section className="cierre-inventario-main">
            {cargando ? (
              <div className="cierre-inventario-loading">
                Calculando período...
              </div>
            ) : cierre ? (
              <>
                <div className="cierre-inventario-period-note">
                  <div>
                    <strong>
                      {MESES[mes - 1]} {anio}
                    </strong>
                    <span>
                      {estaCerrado
                        ? "Cierre definitivo. Los movimientos posteriores no cambian estas cifras."
                        : "Vista en tiempo real. Las cifras pueden cambiar mientras el período siga abierto."}
                    </span>
                  </div>
                  {estaCerrado && (
                    <small>
                      Cerrado {fechaHora(cierre.fechaCierre)}
                      {cierre.cerradoPorNombre
                        ? ` · ${cierre.cerradoPorNombre}`
                        : ""}
                    </small>
                  )}
                </div>

                <div className="cierre-inventario-summary">
                  <article>
                    <span>Productos</span>
                    <strong>
                      {numero(
                        cierre.totalProductos,
                        0
                      )}
                    </strong>
                  </article>
                  <article>
                    <span>Entradas</span>
                    <strong>
                      {numero(
                        cierre.totalEntradas,
                        4
                      )}
                    </strong>
                  </article>
                  <article>
                    <span>Vendido</span>
                    <strong>
                      {numero(
                        cierre.totalVendidoNeto,
                        4
                      )}
                    </strong>
                  </article>
                  <article>
                    <span>Otras salidas</span>
                    <strong>
                      {numero(
                        cierre.totalOtrasSalidas,
                        4
                      )}
                    </strong>
                  </article>
                  <article className="value">
                    <span>VALOR INVENTARIO FINAL</span>
                    <strong>
                      {moneda(
                        cierre.valorInventarioFinal
                      )}
                    </strong>
                  </article>
                </div>

                <div className="cierre-inventario-table-toolbar">
                  <input
                    type="search"
                    value={busqueda}
                    onChange={
                      (event) =>
                        setBusqueda(
                          event.target.value
                        )
                    }
                    placeholder="Buscar producto, código, marca o categoría..."
                  />
                  <span>
                    {detallesFiltrados.length} registros
                  </span>
                </div>

                <div className="cierre-inventario-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Inicial</th>
                        <th>Entradas</th>
                        <th>Vendido</th>
                        <th>Otras salidas</th>
                        <th>Ajuste +</th>
                        <th>Ajuste -</th>
                        <th>Final</th>
                        <th>Valor final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesFiltrados.length === 0 ? (
                        <tr>
                          <td
                            colSpan="10"
                            className="cierre-inventario-empty"
                          >
                            No hay registros para mostrar.
                          </td>
                        </tr>
                      ) : (
                        detallesFiltrados.map(
                          (detalle) => (
                            <tr
                              key={
                                `${detalle.productoId}:${detalle.presentacionId || "base"}`
                              }
                            >
                              <td>
                                <strong>
                                  {detalle.codigo}
                                </strong>
                              </td>
                              <td>
                                <strong>
                                  {detalle.producto}
                                </strong>
                                {detalle.presentacion && (
                                  <small>
                                    {detalle.presentacion}
                                  </small>
                                )}
                                <small>
                                  {detalle.unidad}
                                </small>

                                <button
                                  type="button"
                                  className="cierre-inventario-detail-toggle"
                                  aria-expanded={
                                    detalleTecnico ===
                                    `${detalle.productoId}:${detalle.presentacionId || "base"}`
                                  }
                                  onClick={() =>
                                    setDetalleTecnico(
                                      (actual) => {
                                        const clave =
                                          `${detalle.productoId}:${detalle.presentacionId || "base"}`;

                                        return actual === clave
                                          ? ""
                                          : clave;
                                      }
                                    )
                                  }
                                >
                                  {detalleTecnico ===
                                  `${detalle.productoId}:${detalle.presentacionId || "base"}`
                                    ? "Ocultar detalle"
                                    : "Ver detalle"}
                                </button>

                                {detalleTecnico ===
                                  `${detalle.productoId}:${detalle.presentacionId || "base"}` && (
                                  <div className="cierre-inventario-technical-detail">
                                    <span>
                                      Salidas aplicadas por entregas:
                                      <strong>{numero(detalle.entregas, 4)}</strong>
                                    </span>
                                    <span>
                                      Reversiones técnicas:
                                      <strong>{numero(detalle.reversiones, 4)}</strong>
                                    </span>
                                    <span>
                                      Vendido:
                                      <strong>{numero(detalle.vendidoNeto, 4)}</strong>
                                    </span>
                                    <small>
                                      Las reversiones técnicas corresponden a correcciones de entregas y no se muestran como devoluciones reales.
                                    </small>
                                  </div>
                                )}
                              </td>
                              <td>{numero(detalle.stockInicial, 4)}</td>
                              <td>{numero(detalle.entradas, 4)}</td>
                              <td className="sold">{numero(detalle.vendidoNeto, 4)}</td>
                              <td>{numero(detalle.otrasSalidas, 4)}</td>
                              <td>{numero(detalle.ajustesPositivos, 4)}</td>
                              <td>{numero(detalle.ajustesNegativos, 4)}</td>
                              <td className="final">{numero(detalle.stockFinal, 4)}</td>
                              <td>{moneda(detalle.valorInventarioFinal)}</td>
                            </tr>
                          )
                        )
                      )}
                    </tbody>
                  </table>
                </div>

                <section className="cierre-inventario-action-panel">
                  {!estaCerrado && (
                    <>
                      <label>
                        <span>Observaciones del cierre</span>
                        <textarea
                          value={observaciones}
                          onChange={
                            (event) =>
                              setObservaciones(
                                event.target.value
                              )
                          }
                          placeholder="Opcional"
                          rows="2"
                          disabled={cerrando}
                        />
                      </label>

                      <div>
                        {!mesFinalizado ? (
                          <p>
                            Este mes sigue en curso. Se podrá cerrar desde el primer día del mes siguiente.
                          </p>
                        ) : !esAdmin ? (
                          <p>
                            Solo un administrador puede cerrar el período.
                          </p>
                        ) : (
                          <p>
                            Al cerrar, estas cifras quedan congeladas y el stock final pasa a ser la referencia histórica del mes.
                          </p>
                        )}

                        {esAdmin && (
                          <button
                            type="button"
                            onClick={cerrarMes}
                            disabled={
                              !mesFinalizado ||
                              cerrando
                            }
                          >
                            {cerrando
                              ? "Cerrando..."
                              : "Cerrar mes"}
                          </button>
                        )}
                      </div>
                    </>
                  )}

                  {estaCerrado && cierre.observaciones && (
                    <div className="cierre-inventario-observaciones-cerrado">
                      <span>Observaciones</span>
                      <p>
                        {cierre.observaciones}
                      </p>
                    </div>
                  )}
                </section>
              </>
            ) : (
              <div className="cierre-inventario-loading">
                No fue posible cargar el período.
              </div>
            )}
          </section>


          <aside className="cierre-inventario-history">
            <div>
              <span>
                Historial
              </span>
              <strong>
                Meses cerrados
              </strong>
            </div>

            {cierres.length === 0 ? (
              <p className="cierre-inventario-no-history">
                Aún no hay cierres registrados.
              </p>
            ) : (
              <div className="cierre-inventario-history-list">
                {cierres.map(
                  (item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={
                        item.anio === Number(anio) &&
                        item.mes === Number(mes)
                          ? "active"
                          : ""
                      }
                      onClick={
                        () =>
                          seleccionarCierre(
                            item
                          )
                      }
                    >
                      <span>
                        {MESES[item.mes - 1]}
                      </span>
                      <strong>
                        {item.anio}
                      </strong>
                      <small>
                        {numero(item.totalVendidoNeto, 4)} vendidos
                      </small>
                    </button>
                  )
                )}
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
