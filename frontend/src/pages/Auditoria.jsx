import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import Toast
  from "../components/Toast.jsx";

import buscarIcon
  from "../assets/icons/buscar.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";

import {
  listarAuditoria,
} from "../services/auditoria.service.js";

import "../styles/auditoria.css";


export default function Auditoria() {

  const [
    registros,
    setRegistros,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    mensaje,
    setMensaje,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");


  /* FILTROS */

  const [
    buscar,
    setBuscar,
  ] = useState("");

  const [
    modulo,
    setModulo,
  ] = useState("");

  const [
    accion,
    setAccion,
  ] = useState("");

  const [
    desde,
    setDesde,
  ] = useState("");

  const [
    hasta,
    setHasta,
  ] = useState("");


  /* PAGINACIÓN */

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(1);

  const [
    total,
    setTotal,
  ] = useState(0);


  /* DETALLE */

  const [
    registroDetalle,
    setRegistroDetalle,
  ] = useState(null);


  /* CALENDARIO */

  const [calendarioAbierto, setCalendarioAbierto] =
    useState(null);

  const [mesCalendario, setMesCalendario] =
    useState(new Date());

  const [fechaTemporalDesde, setFechaTemporalDesde] =
    useState("");

  const [fechaTemporalHasta, setFechaTemporalHasta] =
    useState("");


  /* =========================================
     CARGAR
  ========================================= */

  useEffect(() => {
    cargarRegistros();
  }, [
    pagina,
    modulo,
    accion,
    desde,
    hasta,
  ]);


  async function cargarRegistros() {

    try {

      setCargando(true);
      setError("");

      const data =
        await listarAuditoria({
          buscar:
            buscar.trim(),

          modulo,

          accion,

          desde,

          hasta,

          pagina,

          limite: 50,
        });


      setRegistros(
        Array.isArray(
          data?.registros
        )
          ? data.registros
          : []
      );


      setTotal(
        data?.paginacion
          ?.total ||
        0
      );


      setTotalPaginas(
        data?.paginacion
          ?.totalPaginas ||
        1
      );


    } catch (err) {

      console.error(
        "Error cargando auditoría:",
        err
      );

      setError(
        err.response?.data?.mensaje ||
        "No fue posible cargar la auditoría."
      );

    } finally {

      setCargando(false);

    }

  }


  /* =========================================
     BUSCAR
  ========================================= */

  function ejecutarBusqueda() {

    if (pagina !== 1) {
      setPagina(1);
      return;
    }

    cargarRegistros();

  }


  /* =========================================
     LIMPIAR
  ========================================= */

  function limpiarFiltros() {

    setBuscar("");
    setModulo("");
    setAccion("");
    setDesde("");
    setHasta("");
    setPagina(1);

  }


  /* =========================================
     FORMATEAR FECHA
  ========================================= */

  function formatearFecha(
    fecha
  ) {

    if (!fecha) {
      return "—";
    }

    return new Date(
      fecha
    ).toLocaleString(
      "es-CO",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );

  }


  /* =========================================
     CALENDARIO - FUNCIONES
  ========================================= */

  function abrirCalendario(tipo) {
    setCalendarioAbierto(tipo);

    setFechaTemporalDesde(desde);
    setFechaTemporalHasta(hasta);

    const fechaBase =
      tipo === "desde"
        ? desde
        : hasta;

    if (fechaBase) {
      setMesCalendario(
        new Date(`${fechaBase}T00:00:00`)
      );
    } else {
      setMesCalendario(new Date());
    }
  }


  function cerrarCalendario() {
    setCalendarioAbierto(null);
  }


  function confirmarCalendario() {
    setDesde(fechaTemporalDesde);
    setHasta(fechaTemporalHasta);

    setPagina(1);

    setCalendarioAbierto(null);
  }


  function fechaAString(fecha) {
    const year = fecha.getFullYear();

    const month = String(
      fecha.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      fecha.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function estaEnSemanaActual(fecha) {
    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const inicioSemana = new Date(hoy);

    inicioSemana.setDate(
      hoy.getDate() - hoy.getDay()
    );

    const finSemana = new Date(
      inicioSemana
    );

    finSemana.setDate(
      inicioSemana.getDate() + 6
    );

    const fechaComparar =
      new Date(fecha);

    fechaComparar.setHours(
      0,
      0,
      0,
      0
    );

    return (
      fechaComparar >= inicioSemana &&
      fechaComparar <= finSemana
    );
  }


  function seleccionarDia(fecha) {
    const valor =
      fechaAString(fecha);

    if (
      calendarioAbierto === "desde"
    ) {
      setFechaTemporalDesde(valor);

      if (
        fechaTemporalHasta &&
        valor > fechaTemporalHasta
      ) {
        setFechaTemporalHasta(valor);
      }
    } else {
      if (
        fechaTemporalDesde &&
        valor < fechaTemporalDesde
      ) {
        return;
      }

      setFechaTemporalHasta(valor);
    }
  }


  function cambiarMes(cambio) {
    setMesCalendario(
      (actual) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() + cambio,
          1
        )
    );
  }


  function obtenerDiasCalendario() {
    const year =
      mesCalendario.getFullYear();

    const month =
      mesCalendario.getMonth();

    const primerDia =
      new Date(
        year,
        month,
        1
      );

    const ultimoDia =
      new Date(
        year,
        month + 1,
        0
      );

    const inicio =
      new Date(primerDia);

    inicio.setDate(
      primerDia.getDate() -
        primerDia.getDay()
    );

    const dias = [];

    for (
      let i = 0;
      i < 42;
      i++
    ) {
      const fecha =
        new Date(inicio);

      fecha.setDate(
        inicio.getDate() + i
      );

      dias.push(fecha);
    }

    return dias;
  }


  /* =========================================
     MÓDULOS DISPONIBLES
  ========================================= */

  const modulosDisponibles =
    useMemo(() => {

      const modulos =
        registros
          .map(
            (registro) =>
              registro.modulo
          )
          .filter(Boolean);

      return [
        ...new Set(
          modulos
        ),
      ].sort();

    }, [
      registros,
    ]);


  return (

    <section className="auditoria-page">


      {/* =====================================
          CABECERA
      ====================================== */}

      <header className="auditoria-header">

        <div className="auditoria-header-left">

          <ModulosMenu />

          <h1>
            Auditoría
          </h1>

        </div>

      </header>


      {/* =====================================
          CONTENIDO
      ====================================== */}

      <main className="auditoria-content">

        <div className="auditoria-panel">


          {/* CABECERA INTERNA */}

          <div className="auditoria-panel-header">

            <div className="auditoria-panel-title">
              <h2>
                Registro de actividad
              </h2>
            </div>

            <div className="auditoria-panel-actions">

              <span className="auditoria-total">
                {total} registros
              </span>

            </div>

          </div>


          {/* =====================================
              FILTROS
          ====================================== */}

          <div className="auditoria-filters">

            <div className="auditoria-search">

              <input
                type="text"
                value={buscar}
                onChange={(event) =>
                  setBuscar(event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    ejecutarBusqueda();
                  }
                }}
                placeholder="Escriba para filtrar registros..."
              />

              {buscar && (
                <button
                  type="button"
                  className="auditoria-search-clear"
                  onClick={() => {
                    setBuscar("");
                    setPagina(1);

                    setTimeout(() => {
                      cargarRegistros();
                    }, 0);
                  }}
                  aria-label="Cerrar búsqueda"
                  title="Cerrar búsqueda"
                >
                  <img
                    src={cerrarIcon}
                    alt=""
                  />
                </button>
              )}

            </div>


            <select
              value={modulo}
              onChange={(event) => {
                setModulo(event.target.value);
                setPagina(1);
              }}
            >
              <option value="">
                Todos los módulos
              </option>

              <option value="Usuarios">
                Usuarios
              </option>

              <option value="Clientes">
                Clientes
              </option>

              <option value="Rutas">
                Rutas
              </option>

              <option value="Zonas de despacho">
                Zonas de despacho
              </option>

              {modulosDisponibles
                .filter(
                  (item) =>
                    ![
                      "Usuarios",
                      "Clientes",
                      "Rutas",
                      "Zonas de despacho",
                    ].includes(
                      item
                    )
                )
                .map(
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


            <select
              value={accion}
              onChange={(event) => {
                setAccion(event.target.value);
                setPagina(1);
              }}
            >
              <option value="">
                Todas las acciones
              </option>

              <option value="CREAR">
                Crear
              </option>

              <option value="ACTUALIZAR">
                Actualizar
              </option>

              <option value="ELIMINAR">
                Eliminar
              </option>

              <option value="ACTIVAR">
                Activar
              </option>

              <option value="DESACTIVAR">
                Desactivar
              </option>

              <option value="BLOQUEAR">
                Bloquear
              </option>

              <option value="DESBLOQUEAR">
                Desbloquear
              </option>
            </select>


            <div className="auditoria-date-picker-wrap">

              <button
                type="button"
                className="auditoria-date-trigger"
                onClick={() =>
                  abrirCalendario("desde")
                }
              >
                <span>DESDE</span>

                <strong>
                  {desde || "dd/mm/aaaa"}
                </strong>
              </button>

            </div>


            <div className="auditoria-date-picker-wrap">

              <button
                type="button"
                className="auditoria-date-trigger"
                onClick={() =>
                  abrirCalendario("hasta")
                }
              >
                <span>HASTA</span>

                <strong>
                  {hasta || "dd/mm/aaaa"}
                </strong>
              </button>

            </div>

          </div>


          {/* =====================================
              TABLA
          ====================================== */}

          <div className="auditoria-table-wrapper">

            <table className="auditoria-table">

              <thead>

                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Módulo</th>
                  <th>Acción</th>
                  <th>Registro</th>
                  <th>Descripción</th>
                </tr>

              </thead>


              <tbody>

                {cargando ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="auditoria-empty"
                    >
                      Cargando auditoría...
                    </td>

                  </tr>

                ) : registros.length === 0 ? (

                  <tr>

                    <td
                      colSpan="6"
                      className="auditoria-empty"
                    >
                      No se encontraron registros.
                    </td>

                  </tr>

                ) : (

                  registros.map(
                    (registro) => (

                      <tr
                        key={
                          registro._id
                        }
                        onDoubleClick={() =>
                          setRegistroDetalle(
                            registro
                          )
                        }
                      >

                        <td>
                          {formatearFecha(
                            registro.createdAt
                          )}
                        </td>


                        <td>

                          <div className="auditoria-user">

                            <strong>
                              {registro.codigoUsuario ||
                                "—"}
                            </strong>

                            <span>
                              {registro.nombreUsuario ||
                                "Sistema"}
                            </span>

                          </div>

                        </td>


                        <td>
                          {registro.modulo}
                        </td>


                        <td>

                          <span
                            className={
                              `auditoria-action auditoria-action-${String(
                                registro.accion
                              )
                                .toLowerCase()
                                .replaceAll(
                                  "_",
                                  "-"
                                )}`
                            }
                          >
                            {registro.accion}
                          </span>

                        </td>


                        <td>

                          <strong className="auditoria-record-code">
                            {registro.codigoRegistro ||
                              "—"}
                          </strong>

                        </td>


                        <td>
                          {registro.descripcion ||
                            "—"}
                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>


          {/* =====================================
              PAGINACIÓN
          ====================================== */}

          <div className="auditoria-pagination">

            <button
              type="button"
              disabled={
                pagina <= 1
              }
              onClick={() =>
                setPagina(
                  (actual) =>
                    Math.max(
                      1,
                      actual - 1
                    )
                )
              }
            >
              Anterior
            </button>


            <span>
              Página{" "}
              <strong>
                {pagina}
              </strong>{" "}
              de{" "}
              <strong>
                {totalPaginas}
              </strong>
            </span>


            <button
              type="button"
              disabled={
                pagina >=
                totalPaginas
              }
              onClick={() =>
                setPagina(
                  (actual) =>
                    actual + 1
                )
              }
            >
              Siguiente
            </button>

          </div>

        </div>

      </main>


      {/* =====================================
          DETALLE
      ====================================== */}

      {registroDetalle && (

        <div
          className="auditoria-detail-overlay"
          onMouseDown={
            (event) => {

              if (
                event.target ===
                event.currentTarget
              ) {
                setRegistroDetalle(
                  null
                );
              }

            }
          }
        >

          <div className="auditoria-detail-modal">

            <div className="auditoria-detail-header">

              <div>

                <span>
                  Detalle de auditoría
                </span>

                <h3>
                  {registroDetalle.modulo}
                  {" · "}
                  {registroDetalle.accion}
                </h3>

              </div>


              <button
                type="button"
                onClick={() =>
                  setRegistroDetalle(
                    null
                  )
                }
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>


            <div className="auditoria-detail-body">


              <div className="auditoria-detail-grid">

                <div>
                  <span>Fecha</span>

                  <strong>
                    {formatearFecha(
                      registroDetalle.createdAt
                    )}
                  </strong>
                </div>


                <div>
                  <span>Usuario</span>

                  <strong>
                    {registroDetalle.codigoUsuario ||
                      "—"}
                  </strong>
                </div>


                <div>
                  <span>Registro</span>

                  <strong>
                    {registroDetalle.codigoRegistro ||
                      "—"}
                  </strong>
                </div>


                <div>
                  <span>IP</span>

                  <strong>
                    {registroDetalle.ip ||
                      "—"}
                  </strong>
                </div>

              </div>


              <div className="auditoria-description">

                <span>
                  Descripción
                </span>

                <p>
                  {registroDetalle.descripcion ||
                    "Sin descripción"}
                </p>

              </div>


              {registroDetalle.datosAnteriores && (

                <div className="auditoria-json-block">

                  <h4>
                    Datos anteriores
                  </h4>

                  <pre>
                    {JSON.stringify(
                      registroDetalle.datosAnteriores,
                      null,
                      2
                    )}
                  </pre>

                </div>

              )}


              {registroDetalle.datosNuevos && (

                <div className="auditoria-json-block">

                  <h4>
                    Datos nuevos
                  </h4>

                  <pre>
                    {JSON.stringify(
                      registroDetalle.datosNuevos,
                      null,
                      2
                    )}
                  </pre>

                </div>

              )}

            </div>

          </div>

        </div>

      )}


      {/* =====================================
          CALENDARIO PERSONALIZADO
      ====================================== */}

      {calendarioAbierto && (

        <div
          className="auditoria-datepicker-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarCalendario();
            }
          }}
        >

          <div className="auditoria-datepicker">

            <div className="auditoria-datepicker-header">

              <button
                type="button"
                onClick={() =>
                  cambiarMes(-1)
                }
              >
                ‹
              </button>

              <strong>
                {mesCalendario.toLocaleDateString(
                  "es-CO",
                  {
                    month: "long",
                    year: "numeric",
                  }
                )}
              </strong>

              <button
                type="button"
                onClick={() =>
                  cambiarMes(1)
                }
              >
                ›
              </button>

            </div>


            <div className="auditoria-datepicker-weekdays">

              {[
                "D",
                "L",
                "M",
                "M",
                "J",
                "V",
                "S",
              ].map(
                (dia, index) => (
                  <span key={index}>
                    {dia}
                  </span>
                )
              )}

            </div>


            <div className="auditoria-datepicker-days">

              {obtenerDiasCalendario().map(
                (fecha) => {

                  const valor =
                    fechaAString(fecha);

                  const fueraMes =
                    fecha.getMonth() !==
                    mesCalendario.getMonth();

                  const seleccionadoDesde =
                    valor ===
                    fechaTemporalDesde;

                  const seleccionadoHasta =
                    valor ===
                    fechaTemporalHasta;

                  const enRango =
                    fechaTemporalDesde &&
                    fechaTemporalHasta &&
                    valor >=
                      fechaTemporalDesde &&
                    valor <=
                      fechaTemporalHasta;

                  const semanaActual =
                    estaEnSemanaActual(fecha);

                  const inicioSemanaActual =
                    semanaActual &&
                    fecha.getDay() === 0;

                  const finSemanaActual =
                    semanaActual &&
                    fecha.getDay() === 6;

                  return (

                    <button
                      type="button"
                      key={valor}
                      className={[
                        fueraMes
                          ? "outside"
                          : "",

                        semanaActual
                          ? "current-week"
                          : "",

                        inicioSemanaActual
                          ? "current-week-start"
                          : "",

                        finSemanaActual
                          ? "current-week-end"
                          : "",

                        enRango
                          ? "range"
                          : "",

                        seleccionadoDesde
                          ? "start"
                          : "",

                        seleccionadoHasta
                          ? "end"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() =>
                        seleccionarDia(fecha)
                      }
                    >
                      {fecha.getDate()}
                    </button>

                  );

                }
              )}

            </div>


            <div className="auditoria-datepicker-footer">

              <button
                type="button"
                className="datepicker-cancel"
                onClick={
                  cerrarCalendario
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="datepicker-done"
                onClick={
                  confirmarCalendario
                }
              >
                Listo
              </button>

            </div>

          </div>

        </div>

      )}


      <Toast
        mensaje={mensaje}
        error={error}
      />

    </section>

  );

}