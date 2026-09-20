import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import Toast
  from "../components/Toast.jsx";

import calendarioIcon
  from "../assets/icons/calendario.png";

import ingresoIcon
  from "../assets/icons/Ingresos.png";

import egresoIcon
  from "../assets/icons/Egresos.png";

import cerrarCajaIcon
  from "../assets/icons/Cerrar-caja.png";

import {
  abrirCaja,
  cerrarCaja,
  listarHistorialCaja,
  listarMovimientosCaja,
  obtenerDetalleCaja,
  obtenerResumenCaja,
  registrarMovimientoCaja,
} from "../services/caja.service.js";

import {
  imprimirCierreCaja,
} from "../utils/cajaImpresion.js";

import "../styles/caja.css";




function moneda(
  valor
) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style:
        "currency",

      currency:
        "COP",

      maximumFractionDigits:
        0,
    }
  ).format(
    Number(
      valor ||
      0
    )
  );

}


function fechaHora(
  fecha
) {

  if (!fecha) {
    return "-";
  }


  return new Date(
    fecha
  ).toLocaleString(
    "es-CO"
  );

}


function nombreUsuario(
  usuario
) {

  if (!usuario) {
    return "-";
  }


  return (
    [
      usuario.nombres,
      usuario.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    usuario.usuario ||
    "-"
  );

}


const MESES_CALENDARIO = [
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


const DIAS_SEMANA = [
  "D",
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
];


const ANIO_ACTUAL =
  new Date()
    .getFullYear();


const ANIOS_CALENDARIO =
  Array.from(
    {
      length: 31,
    },
    (
      _,
      index
    ) =>
      ANIO_ACTUAL -
      15 +
      index
  );


function fechaAStringCalendario(
  fecha
) {

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function stringAFechaCalendario(
  valor
) {

  if (!valor) {
    return null;
  }


  const [
    year,
    month,
    day,
  ] =
    valor
      .split("-")
      .map(Number);


  if (
    !year ||
    !month ||
    !day
  ) {
    return null;
  }


  return new Date(
    year,
    month - 1,
    day
  );

}


function fechaBonitaCalendario(
  valor
) {

  const fecha =
    stringAFechaCalendario(
      valor
    );


  if (!fecha) {
    return "Seleccionar fecha";
  }


  return fecha.toLocaleDateString(
    "es-CO",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric",
    }
  );

}


function obtenerDiasCalendario(
  mesVisible
) {

  const primerDia =
    new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth(),
      1
    );


  const inicio =
    new Date(
      primerDia
    );


  inicio.setDate(
    1 -
    primerDia.getDay()
  );


  return Array.from(
    {
      length: 42,
    },
    (
      _,
      index
    ) => {

      const fecha =
        new Date(
          inicio
        );


      fecha.setDate(
        inicio.getDate() +
        index
      );


      return fecha;

    }
  );

}


export default function Caja() {

  const [
    datosCaja,
    setDatosCaja,
  ] = useState(null);


  const [
    movimientos,
    setMovimientos,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    procesando,
    setProcesando,
  ] = useState(false);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState(
    "info"
  );


  const [
    saldoInicial,
    setSaldoInicial,
  ] = useState("0");


  const [
    observacionApertura,
    setObservacionApertura,
  ] = useState("");


  const [
    modalMovimiento,
    setModalMovimiento,
  ] = useState(false);


  const [
    tipoMovimiento,
    setTipoMovimiento,
  ] = useState(
    "Ingreso"
  );


  const [
    conceptoMovimiento,
    setConceptoMovimiento,
  ] = useState("");


  const [
    valorMovimiento,
    setValorMovimiento,
  ] = useState("");


  const [
    modalCierre,
    setModalCierre,
  ] = useState(false);


  const [
    efectivoContado,
    setEfectivoContado,
  ] = useState("");


  const [
    observacionCierre,
    setObservacionCierre,
  ] = useState("");


  const [
    filtroTipo,
    setFiltroTipo,
  ] = useState(
    "Todos"
  );


  const [
    historial,
    setHistorial,
  ] = useState([]);


  const [
    desdeHistorial,
    setDesdeHistorial,
  ] = useState("");


  const [
    hastaHistorial,
    setHastaHistorial,
  ] = useState("");


  const [
    detalleCaja,
    setDetalleCaja,
  ] = useState(null);


  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false);


  const [
    calendarioAbierto,
    setCalendarioAbierto,
  ] = useState(null);


  const [
    fechaTemporalHistorial,
    setFechaTemporalHistorial,
  ] = useState("");


  const [
    mesCalendarioHistorial,
    setMesCalendarioHistorial,
  ] = useState(
    new Date()
  );


  function abrirCalendarioHistorial(
    tipo
  ) {

    const valorActual =
      tipo === "desde"
        ? desdeHistorial
        : hastaHistorial;


    const fechaBase =
      stringAFechaCalendario(
        valorActual
      ) ||
      new Date();


    setFechaTemporalHistorial(
      valorActual
    );


    setMesCalendarioHistorial(
      new Date(
        fechaBase.getFullYear(),
        fechaBase.getMonth(),
        1
      )
    );


    setCalendarioAbierto(
      tipo
    );

  }


  function cerrarCalendarioHistorial() {

    setCalendarioAbierto(
      null
    );

    setFechaTemporalHistorial(
      ""
    );

  }


  function moverMesCalendarioHistorial(
    desplazamiento
  ) {

    setMesCalendarioHistorial(
      (
        actual
      ) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() +
            desplazamiento,
          1
        )
    );

  }


  function cambiarMesCalendarioHistorial(
    event
  ) {

    const nuevoMes =
      Number(
        event.target.value
      );


    setMesCalendarioHistorial(
      (
        actual
      ) =>
        new Date(
          actual.getFullYear(),
          nuevoMes,
          1
        )
    );

  }


  function cambiarAnioCalendarioHistorial(
    event
  ) {

    const nuevoAnio =
      Number(
        event.target.value
      );


    setMesCalendarioHistorial(
      (
        actual
      ) =>
        new Date(
          nuevoAnio,
          actual.getMonth(),
          1
        )
    );

  }


  function seleccionarHoyCalendarioHistorial() {

    const hoy =
      new Date();


    setFechaTemporalHistorial(
      fechaAStringCalendario(
        hoy
      )
    );


    setMesCalendarioHistorial(
      new Date(
        hoy.getFullYear(),
        hoy.getMonth(),
        1
      )
    );

  }


  function aplicarCalendarioHistorial() {

    if (
      calendarioAbierto ===
      "desde"
    ) {

      if (
        fechaTemporalHistorial &&
        hastaHistorial &&
        fechaTemporalHistorial >
          hastaHistorial
      ) {

        setMensaje(
          "La fecha Desde no puede ser posterior a la fecha Hasta."
        );

        setTipoMensaje(
          "error"
        );

        return;

      }


      setDesdeHistorial(
        fechaTemporalHistorial
      );

    }


    if (
      calendarioAbierto ===
      "hasta"
    ) {

      if (
        fechaTemporalHistorial &&
        desdeHistorial &&
        fechaTemporalHistorial <
          desdeHistorial
      ) {

        setMensaje(
          "La fecha Hasta no puede ser anterior a la fecha Desde."
        );

        setTipoMensaje(
          "error"
        );

        return;

      }


      setHastaHistorial(
        fechaTemporalHistorial
      );

    }


    cerrarCalendarioHistorial();

  }


  async function cargarCaja() {

    try {

      setCargando(
        true
      );


      const [
        resumen,
        lista,
        dataHistorial,
      ] =
        await Promise.all([

          obtenerResumenCaja(),

          listarMovimientosCaja(),

          listarHistorialCaja({
            limite: 20,
          }),

        ]);


      setDatosCaja(
        resumen
      );


      setMovimientos(
        Array.isArray(
          lista
        )
          ? lista
          : lista?.movimientos ||
            []
      );


      setHistorial(
        Array.isArray(
          dataHistorial
        )
          ? dataHistorial
          : dataHistorial?.cajas ||
            []
      );


    } catch (error) {

      console.error(
        "Error cargando Caja:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar el módulo de Caja."
      );


      setTipoMensaje(
        "error"
      );


    } finally {

      setCargando(
        false
      );

    }

  }


  useEffect(() => {

    cargarCaja();

  }, []);


  useEffect(() => {

    if (!mensaje) {
      return;
    }


    const timer =
      setTimeout(
        () =>
          setMensaje(""),
        3000
      );


    return () =>
      clearTimeout(
        timer
      );

  }, [
    mensaje,
  ]);


  const abierta =
    Boolean(
      datosCaja?.abierta
    );


  const resumen =
    datosCaja?.resumen ||
    {};


  const caja =
    datosCaja?.caja ||
    null;


  const diferenciaClase =
    useMemo(
      () => {

        const valor =
          Number(
            resumen.diferencia
          );


        if (
          resumen.diferencia ===
            null ||
          resumen.diferencia ===
            undefined
        ) {
          return "";
        }


        if (valor === 0) {
          return "caja-diferencia-ok";
        }


        return valor > 0
          ? "caja-diferencia-sobra"
          : "caja-diferencia-falta";

      },
      [
        resumen.diferencia,
      ]
    );


  async function manejarAbrirCaja(
    event
  ) {

    event.preventDefault();


    try {

      setProcesando(
        true
      );


      await abrirCaja({

        saldoInicial:
          Number(
            saldoInicial ||
            0
          ),

        observaciones:
          observacionApertura,

      });


      setMensaje(
        "Caja abierta correctamente."
      );

      setTipoMensaje(
        "success"
      );

      setObservacionApertura(
        ""
      );

      await cargarCaja();


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible abrir la caja."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setProcesando(
        false
      );

    }

  }


  function abrirModalMovimiento(
    tipo
  ) {

    setTipoMovimiento(
      tipo
    );

    setConceptoMovimiento(
      ""
    );

    setValorMovimiento(
      ""
    );

    setModalMovimiento(
      true
    );

  }


  async function guardarMovimiento(
    event
  ) {

    event.preventDefault();


    try {

      setProcesando(
        true
      );


      await registrarMovimientoCaja({

        tipo:
          tipoMovimiento,

        concepto:
          conceptoMovimiento,

        valor:
          Number(
            valorMovimiento
          ),

      });


      setModalMovimiento(
        false
      );


      setMensaje(
        `${
          tipoMovimiento
        } registrado correctamente.`
      );

      setTipoMensaje(
        "success"
      );


      await cargarCaja();


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible registrar el movimiento."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setProcesando(
        false
      );

    }

  }


  function abrirModalCierre() {

    setEfectivoContado(
      String(
        resumen.saldoActual ??
        0
      )
    );

    setObservacionCierre(
      ""
    );

    setModalCierre(
      true
    );

  }


  async function manejarCerrarCaja(
    event
  ) {

    event.preventDefault();


    try {

      setProcesando(
        true
      );


      await cerrarCaja({

        efectivoContado:
          Number(
            efectivoContado
          ),

        observaciones:
          observacionCierre,

      });


      setModalCierre(
        false
      );


      setMensaje(
        "Caja cerrada correctamente."
      );

      setTipoMensaje(
        "success"
      );


      await cargarCaja();


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cerrar la caja."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setProcesando(
        false
      );

    }

  }


  const pedidosCaja =
    useMemo(
      () =>
        movimientos.filter(
          (
            movimiento
          ) =>
            movimiento.estado !==
              "Anulado" &&
            (
              movimiento.origen ===
                "Pedido" ||
              (
                movimiento.origen ===
                  "Factura" &&
                movimiento.tipo ===
                  "Ingreso"
              )
            )
        ),
      [
        movimientos,
      ]
    );


  const movimientosManuales =
    useMemo(
      () =>
        movimientos.filter(
          (
            movimiento
          ) =>
            movimiento.estado !==
              "Anulado" &&
            !(
              movimiento.origen ===
                "Pedido" ||
              (
                movimiento.origen ===
                  "Factura" &&
                movimiento.tipo ===
                  "Ingreso"
              )
            )
        ),
      [
        movimientos,
      ]
    );


  const movimientosFiltrados =
    useMemo(
      () => {

        if (
          filtroTipo ===
          "Todos"
        ) {
          return movimientosManuales;
        }


        return movimientosManuales.filter(
          (
            movimiento
          ) =>
            movimiento.tipo ===
            filtroTipo
        );

      },
      [
        movimientosManuales,
        filtroTipo,
      ]
    );


  function facturaMovimiento(
    movimiento
  ) {

    return (
      movimiento.facturaCodigo ||
      movimiento.factura?.codigo ||
      "—"
    );

  }


  function pedidoMovimiento(
    movimiento
  ) {

    return (
      movimiento.pedidoCodigo ||
      movimiento.pedido?.codigo ||
      movimiento.factura
        ?.pedidoCodigo ||
      "—"
    );

  }


  function clienteMovimiento(
    movimiento
  ) {

    return (
      movimiento.clienteNombre ||
      movimiento.cliente?.nombre ||
      movimiento.cliente
        ?.razonSocial ||
      "—"
    );

  }


  function observacionMovimiento(
    movimiento
  ) {

    if (
      movimiento.observacion
    ) {
      return movimiento.observacion;
    }


    if (
      (
        movimiento.origen ===
          "Pedido" ||
        movimiento.origen ===
          "Factura"
      ) &&
      facturaMovimiento(
        movimiento
      ) ===
        "—"
    ) {

      return "Pedido sin factura generada";

    }


    if (
      movimiento.origen ===
      "Pedido"
    ) {

      return "Factura generada";

    }


    return "—";

  }


  const conciliacionCorrecta =
    Math.abs(
      Number(
        resumen
          .diferenciaConciliacion ||
        0
      )
    ) <
    0.01;


  async function cargarHistorial() {

    try {

      const data =
        await listarHistorialCaja({

          desde:
            desdeHistorial ||
            undefined,

          hasta:
            hastaHistorial ||
            undefined,

          limite:
            50,

        });


      setHistorial(
        Array.isArray(
          data
        )
          ? data
          : data?.cajas ||
            []
      );


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar el historial."
      );

      setTipoMensaje(
        "error"
      );

    }

  }


  async function verDetalleCaja(
    id
  ) {

    try {

      setCargandoDetalle(
        true
      );


      const data =
        await obtenerDetalleCaja(
          id
        );


      setDetalleCaja(
        data
      );


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible consultar el detalle de la caja."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setCargandoDetalle(
        false
      );

    }

  }


  async function imprimirCajaHistorial(
    id
  ) {

    try {

      const data =
        await obtenerDetalleCaja(
          id
        );


      imprimirCierreCaja(
        data
      );


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible preparar la impresión."
      );

      setTipoMensaje(
        "error"
      );

    }

  }


  return (

    <section className="caja-page">

      <header className="caja-header">

        <div className="caja-header-left">

          <ModulosMenu />

          <div>

            <h1>
              Caja
            </h1>

            

          </div>

        </div>


        {abierta && (

          <div className="caja-header-actions">

            <button
              type="button"
              className="caja-header-icon-btn caja-header-icon-income"
              onClick={() =>
                abrirModalMovimiento(
                  "Ingreso"
                )
              }
              aria-label="Registrar ingreso"
              data-tooltip="Registrar ingreso"
            >
              <img
                src={ingresoIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="caja-header-icon-btn caja-header-icon-expense"
              onClick={() =>
                abrirModalMovimiento(
                  "Egreso"
                )
              }
              aria-label="Registrar egreso"
              data-tooltip="Registrar egreso"
            >
              <img
                src={egresoIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="caja-header-icon-btn caja-header-icon-close"
              onClick={
                abrirModalCierre
              }
              aria-label="Cerrar caja"
              data-tooltip="Cerrar caja"
            >
              <img
                src={cerrarCajaIcon}
                alt=""
              />
            </button>

          </div>

        )}

      </header>


      <main className="caja-content">

        {cargando ? (

          <div className="caja-empty">
            Cargando caja...
          </div>

        ) : !abierta ? (

          <>

            {caja &&
              caja.estado ===
                "Cerrada" && (

                <section className="caja-last-close">

                  <div>

                    <span>
                      Última caja
                    </span>

                    <strong>
                      {caja.codigo}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Cerrada
                    </span>

                    <strong>
                      {fechaHora(
                        caja.fechaCierre
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Saldo esperado
                    </span>

                    <strong>
                      {moneda(
                        caja.saldoEsperado
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Efectivo contado
                    </span>

                    <strong>
                      {moneda(
                        caja.efectivoContado
                      )}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Diferencia
                    </span>

                    <strong
                      className={
                        diferenciaClase
                      }
                    >
                      {moneda(
                        caja.diferencia
                      )}
                    </strong>

                  </div>

                </section>

            )}


            <section className="caja-open-card">

              <div className="caja-open-info">

                <span className="caja-open-badge">
                  Caja cerrada
                </span>

                <h2>
                  Abrir caja del día
                </h2>

                <p>
                  Indica el efectivo disponible al comenzar la jornada.
                </p>

              </div>


              <form
                className="caja-open-form"
                onSubmit={
                  manejarAbrirCaja
                }
              >

                <label>

                  <span>
                    Saldo inicial
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      saldoInicial
                    }
                    onChange={
                      (event) =>
                        setSaldoInicial(
                          event.target.value
                        )
                    }
                    required
                  />

                </label>


                <label>

                  <span>
                    Observación
                  </span>

                  <input
                    type="text"
                    value={
                      observacionApertura
                    }
                    onChange={
                      (event) =>
                        setObservacionApertura(
                          event.target.value
                        )
                    }
                    placeholder="Opcional"
                  />

                </label>


                <button
                  type="submit"
                  className="caja-btn caja-btn-primary"
                  disabled={
                    procesando
                  }
                >
                  {procesando
                    ? "Abriendo..."
                    : "Abrir caja"}
                </button>

              </form>

            </section>

          </>

        ) : (

          <>

            {/* =====================================
                RESUMEN DE VENTAS ENTREGADAS
            ====================================== */}

            <section className="caja-sales-panel">

              <div className="caja-section-header">

                <div>

                  <h2>
                    Ventas entregadas
                  </h2>

                  <p>
                    Los valores llegan automáticamente desde los pedidos en estado Entregado.
                  </p>

                </div>


                <div
                  className={`caja-reconciliation ${
                    conciliacionCorrecta
                      ? "is-ok"
                      : "is-warning"
                  }`}
                >
                  <span>
                    Conciliación
                  </span>

                  <strong>
                    {conciliacionCorrecta
                      ? "Cuadrada"
                      : moneda(
                          resumen
                            .diferenciaConciliacion
                        )}
                  </strong>
                </div>

              </div>


              <div className="caja-sales-grid">

                <article className="caja-sale-card caja-sale-card-total">

                  <span>
                    Total entregado
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalVentasEntregadas
                    )}
                  </strong>

                  <small>
                    {Number(
                      resumen
                        .cantidadPedidosEntregados ||
                      0
                    )} pedidos
                  </small>

                </article>


                <article className="caja-sale-card caja-sale-card-cash">

                  <span>
                    Efectivo
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalEfectivoPedidos
                    )}
                  </strong>

                  <small>
                    Sí entra al efectivo físico
                  </small>

                </article>


                <article className="caja-sale-card caja-sale-card-transfer">

                  <span>
                    Transferencias
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalTransferencias
                    )}
                  </strong>

                  <small>
                    Venta registrada, no suma efectivo
                  </small>

                </article>


                <article className="caja-sale-card caja-sale-card-credit">

                  <span>
                    Crédito
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalCredito
                    )}
                  </strong>

                  <small>
                    Venta entregada pendiente de recaudo
                  </small>

                </article>


                <article className="caja-sale-card">

                  <span>
                    Total medios de pago
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalMediosPago
                    )}
                  </strong>

                  <small>
                    Efectivo + transferencia + crédito
                  </small>

                </article>

              </div>

            </section>


            {/* =====================================
                EFECTIVO FÍSICO
            ====================================== */}

            <section className="caja-cash-panel">

              <div className="caja-section-header">

                <div>

                  <h2>
                    Efectivo físico de caja
                  </h2>

                  <p>
                    Solo incluye valores que realmente aumentan o disminuyen el dinero en efectivo.
                  </p>

                </div>

              </div>


              <div className="caja-cash-grid">

                <article>
                  <span>
                    Saldo inicial
                  </span>

                  <strong>
                    {moneda(
                      resumen.saldoInicial
                    )}
                  </strong>
                </article>


                <article>
                  <span>
                    Pedidos en efectivo
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalEfectivoPedidos
                    )}
                  </strong>
                </article>


                <article>
                  <span>
                    Ingresos manuales
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .totalIngresosManuales
                    )}
                  </strong>
                </article>


                <article>
                  <span>
                    Egresos
                  </span>

                  <strong className="caja-value-expense">
                    {moneda(
                      resumen
                        .totalEgresos
                    )}
                  </strong>
                </article>


                <article className="caja-cash-main">
                  <span>
                    Efectivo esperado
                  </span>

                  <strong>
                    {moneda(
                      resumen
                        .saldoActual
                    )}
                  </strong>
                </article>

              </div>

            </section>


            {/* =====================================
                DATOS DE LA SESIÓN
            ====================================== */}

            <section className="caja-session-info">

              <div>

                <span>
                  Caja
                </span>

                <strong>
                  {caja?.codigo ||
                    "-"}
                </strong>

              </div>


              <div>

                <span>
                  Apertura
                </span>

                <strong>
                  {fechaHora(
                    caja?.fechaApertura
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Abierta por
                </span>

                <strong>
                  {nombreUsuario(
                    caja?.abiertoPor
                  )}
                </strong>

              </div>

            </section>


            {/* =====================================
                PEDIDOS ENTREGADOS
            ====================================== */}

            <section className="caja-movements-card caja-orders-card">

              <div className="caja-section-header">

                <div>

                  <h2>
                    Pedidos entregados
                  </h2>

                  <p>
                    Cada pedido aparece una sola vez. La factura es opcional y solo complementa el registro.
                  </p>

                </div>


                <span className="caja-count">
                  {pedidosCaja.length}
                </span>

              </div>


              <div className="caja-table-wrap">

                <table className="caja-table caja-orders-table">

                  <thead>

                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Tipo de pago</th>
                      <th>Factura</th>
                      <th>Observación</th>
                      <th>Total</th>
                    </tr>

                  </thead>


                  <tbody>

                    {pedidosCaja.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="6"
                          className="caja-empty"
                        >
                          Aún no hay pedidos entregados en esta caja.
                        </td>

                      </tr>

                    ) : (

                      pedidosCaja.map(
                        (
                          movimiento
                        ) => (

                          <tr
                            key={
                              movimiento._id
                            }
                          >

                            <td>
                              <strong className="caja-order-code">
                                {pedidoMovimiento(
                                  movimiento
                                )}
                              </strong>
                            </td>


                            <td>
                              {clienteMovimiento(
                                movimiento
                              )}
                            </td>


                            <td>

                              <span
                                className={`caja-payment-badge caja-payment-${
                                  String(
                                    movimiento.metodoPago ||
                                    "Efectivo"
                                  )
                                    .normalize(
                                      "NFD"
                                    )
                                    .replace(
                                      /[\u0300-\u036f]/g,
                                      ""
                                    )
                                    .toLowerCase()
                                }`}
                              >
                                {movimiento.metodoPago ||
                                  "Efectivo"}
                              </span>

                            </td>


                            <td>

                              {facturaMovimiento(
                                movimiento
                              ) ===
                              "—" ? (
                                <span className="caja-no-invoice">
                                  —
                                </span>
                              ) : (
                                <strong className="caja-invoice-code">
                                  {facturaMovimiento(
                                    movimiento
                                  )}
                                </strong>
                              )}

                            </td>


                            <td>

                              <span
                                className={
                                  facturaMovimiento(
                                    movimiento
                                  ) ===
                                  "—"
                                    ? "caja-observation-warning"
                                    : "caja-observation-ok"
                                }
                              >
                                {observacionMovimiento(
                                  movimiento
                                )}
                              </span>

                            </td>


                            <td className="caja-order-total">
                              {moneda(
                                movimiento.valor
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>


            {/* =====================================
                MOVIMIENTOS MANUALES
            ====================================== */}

            <section className="caja-movements-card caja-manual-card">

              <div className="caja-section-header">

                <div>

                  <h2>
                    Movimientos manuales
                  </h2>

                  <p>
                    Ingresos, egresos y ajustes que afectan el efectivo físico.
                  </p>

                </div>


                <div className="caja-movement-tools">

                  <select
                    value={
                      filtroTipo
                    }
                    onChange={
                      (event) =>
                        setFiltroTipo(
                          event.target.value
                        )
                    }
                    aria-label="Filtrar movimientos manuales"
                  >
                    <option value="Todos">
                      Todos
                    </option>

                    <option value="Ingreso">
                      Ingresos
                    </option>

                    <option value="Egreso">
                      Egresos
                    </option>

                  </select>


                  <span className="caja-count">
                    {movimientosFiltrados.length}
                  </span>

                </div>

              </div>


              <div className="caja-table-wrap">

                <table className="caja-table">

                  <thead>

                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Origen</th>
                      <th>Concepto</th>
                      <th>Usuario</th>
                      <th>Valor</th>
                    </tr>

                  </thead>


                  <tbody>

                    {movimientosFiltrados.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="6"
                          className="caja-empty"
                        >
                          No hay movimientos manuales en esta caja.
                        </td>

                      </tr>

                    ) : (

                      movimientosFiltrados.map(
                        (
                          movimiento
                        ) => (

                          <tr
                            key={
                              movimiento._id
                            }
                          >

                            <td>
                              {fechaHora(
                                movimiento.createdAt
                              )}
                            </td>


                            <td>

                              <span
                                className={`caja-type ${
                                  movimiento.tipo ===
                                  "Ingreso"
                                    ? "caja-type-income"
                                    : "caja-type-expense"
                                }`}
                              >
                                {movimiento.tipo}
                              </span>

                            </td>


                            <td>
                              {movimiento.origen}
                            </td>


                            <td>
                              {movimiento.concepto}
                            </td>


                            <td>
                              {nombreUsuario(
                                movimiento.usuario
                              )}
                            </td>


                            <td
                              className={
                                movimiento.tipo ===
                                "Ingreso"
                                  ? "caja-value-income"
                                  : "caja-value-expense"
                              }
                            >
                              {movimiento.tipo ===
                              "Ingreso"
                                ? "+"
                                : "−"}
                              {moneda(
                                movimiento.valor
                              )}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>




          </>

        )}


        <section className="caja-history-card">

          <div className="caja-section-header caja-history-header">

            <div>

              <h2>
                Filtro por fechas
              </h2>

              <p>
                Consulta cierres anteriores y vuelve a imprimirlos.
              </p>

            </div>


            <div className="caja-history-filters">

              <div className="caja-date-filter">
                <span>
                  Desde
                </span>

                <button
                  type="button"
                  className={`caja-date-trigger ${
                    desdeHistorial
                      ? "has-value"
                      : ""
                  }`}
                  onClick={() =>
                    abrirCalendarioHistorial(
                      "desde"
                    )
                  }
                >
                  <img
                    src={
                      calendarioIcon
                    }
                    alt=""
                  />

                  <span>
                    {fechaBonitaCalendario(
                      desdeHistorial
                    )}
                  </span>
                </button>
              </div>


              <div className="caja-date-filter">
                <span>
                  Hasta
                </span>

                <button
                  type="button"
                  className={`caja-date-trigger ${
                    hastaHistorial
                      ? "has-value"
                      : ""
                  }`}
                  onClick={() =>
                    abrirCalendarioHistorial(
                      "hasta"
                    )
                  }
                >
                  <img
                    src={
                      calendarioIcon
                    }
                    alt=""
                  />

                  <span>
                    {fechaBonitaCalendario(
                      hastaHistorial
                    )}
                  </span>
                </button>
              </div>


              <button
                type="button"
                className="caja-btn caja-btn-secondary"
                onClick={
                  cargarHistorial
                }
              >
                Buscar
              </button>

            </div>

          </div>


          <div className="caja-table-wrap">

            <table className="caja-table caja-history-table">

              <thead>

                <tr>
                  <th>Caja</th>
                  <th>Apertura</th>
                  <th>Ventas</th>
                  <th>Efectivo</th>
                  <th>Transferencia</th>
                  <th>Crédito</th>
                  <th>Egresos</th>
                  <th>Esperado</th>
                  <th>Contado</th>
                  <th>Diferencia</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>

              </thead>


              <tbody>

                {historial.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan="12"
                      className="caja-empty"
                    >
                      No hay cajas en el historial.
                    </td>

                  </tr>

                ) : (

                  historial.map(
                    (
                      item
                    ) => (

                      <tr
                        key={
                          item._id
                        }
                      >

                        <td>
                          <strong>
                            {item.codigo}
                          </strong>
                        </td>

                        <td>
                          {fechaHora(
                            item.fechaApertura
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.totalVentasEntregadas
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.totalEfectivoPedidos
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.totalTransferencias
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.totalCredito
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.totalEgresos
                          )}
                        </td>

                        <td>
                          {moneda(
                            item.saldoEsperado
                          )}
                        </td>

                        <td>
                          {item.efectivoContado ===
                            null ||
                          item.efectivoContado ===
                            undefined
                            ? "—"
                            : moneda(
                                item.efectivoContado
                              )}
                        </td>

                        <td>
                          {item.diferencia ===
                            null ||
                          item.diferencia ===
                            undefined
                            ? "—"
                            : moneda(
                                item.diferencia
                              )}
                        </td>

                        <td>
                          <span
                            className={`caja-status ${
                              item.estado ===
                              "Abierta"
                                ? "caja-status-open"
                                : "caja-status-closed"
                            }`}
                          >
                            {item.estado}
                          </span>
                        </td>

                        <td>

                          <div className="caja-row-actions">

                            <button
                              type="button"
                              className="caja-icon-btn"
                              onClick={() =>
                                verDetalleCaja(
                                  item._id
                                )
                              }
                              title="Ver detalle"
                            >
                              👁️
                            </button>


                            <button
                              type="button"
                              className="caja-icon-btn"
                              onClick={() =>
                                imprimirCajaHistorial(
                                  item._id
                                )
                              }
                              title="Imprimir cierre"
                            >
                              🖨️
                            </button>

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>


      {modalMovimiento && (

        <div
          className="caja-modal-overlay"
          onMouseDown={
            (event) =>
              event.stopPropagation()
          }
        >

          <form
            className="caja-modal"
            onSubmit={
              guardarMovimiento
            }
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="caja-modal-header">

              <div>

                <span>
                  Movimiento manual
                </span>

                <h3>
                  Registrar {tipoMovimiento.toLowerCase()}
                </h3>

              </div>


              <button
                type="button"
                className="caja-modal-x"
                onClick={() =>
                  setModalMovimiento(
                    false
                  )
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <label>

              <span>
                Tipo
              </span>

              <select
                value={
                  tipoMovimiento
                }
                onChange={
                  (event) =>
                    setTipoMovimiento(
                      event.target.value
                    )
                }
              >

                <option value="Ingreso">
                  Ingreso
                </option>

                <option value="Egreso">
                  Egreso
                </option>

              </select>

            </label>


            <label>

              <span>
                Concepto
              </span>

              <input
                type="text"
                value={
                  conceptoMovimiento
                }
                onChange={
                  (event) =>
                    setConceptoMovimiento(
                      event.target.value
                    )
                }
                placeholder="Ej. Compra de bolsas"
                required
              />

            </label>


            <label>

              <span>
                Valor
              </span>

              <input
                type="number"
                min="1"
                step="1"
                value={
                  valorMovimiento
                }
                onChange={
                  (event) =>
                    setValorMovimiento(
                      event.target.value
                    )
                }
                required
              />

            </label>


            <div className="caja-modal-actions">

              <button
                type="button"
                className="caja-btn caja-btn-secondary"
                onClick={() =>
                  setModalMovimiento(
                    false
                  )
                }
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="caja-btn caja-btn-primary"
                disabled={
                  procesando
                }
              >
                {procesando
                  ? "Guardando..."
                  : "Guardar"}
              </button>

            </div>

          </form>

        </div>

      )}


      {modalCierre && (

        <div
          className="caja-modal-overlay"
          onMouseDown={
            (event) =>
              event.stopPropagation()
          }
        >

          <form
            className="caja-modal"
            onSubmit={
              manejarCerrarCaja
            }
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="caja-modal-header">

              <div>

                <span>
                  Cierre de caja
                </span>

                <h3>
                  Confirmar efectivo
                </h3>

              </div>


              <button
                type="button"
                className="caja-modal-x"
                onClick={() =>
                  setModalCierre(
                    false
                  )
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="caja-close-summary">

              <span>
                Saldo esperado
              </span>

              <strong>
                {moneda(
                  resumen.saldoEsperado ??
                    resumen.saldoActual
                )}
              </strong>

            </div>


            <label>

              <span>
                Efectivo contado
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  efectivoContado
                }
                onChange={
                  (event) =>
                    setEfectivoContado(
                      event.target.value
                    )
                }
                required
              />

            </label>


            <label>

              <span>
                Observaciones
              </span>

              <textarea
                rows="3"
                value={
                  observacionCierre
                }
                onChange={
                  (event) =>
                    setObservacionCierre(
                      event.target.value
                    )
                }
                placeholder="Opcional"
              />

            </label>


            <div className="caja-modal-actions">

              <button
                type="button"
                className="caja-btn caja-btn-secondary"
                onClick={() =>
                  setModalCierre(
                    false
                  )
                }
              >
                Cancelar
              </button>


              <button
                type="submit"
                className="caja-btn caja-btn-close"
                disabled={
                  procesando
                }
              >
                {procesando
                  ? "Cerrando..."
                  : "Cerrar caja"}
              </button>

            </div>

          </form>

        </div>

      )}




      {calendarioAbierto && (

        <div
          className="caja-datepicker-overlay"
          role="presentation"
        >

          <div
            className="caja-datepicker"
            role="dialog"
            aria-modal="true"
            aria-label={
              calendarioAbierto ===
              "desde"
                ? "Seleccionar fecha desde"
                : "Seleccionar fecha hasta"
            }
          >

            {/* CABECERA */}

            <div className="caja-datepicker-header">

              <button
                type="button"
                onClick={() =>
                  moverMesCalendarioHistorial(
                    -1
                  )
                }
                aria-label="Mes anterior"
              >
                ‹
              </button>


              <div className="caja-datepicker-selects">

                <select
                  value={
                    mesCalendarioHistorial
                      .getMonth()
                  }
                  onChange={
                    cambiarMesCalendarioHistorial
                  }
                  aria-label="Mes"
                >

                  {MESES_CALENDARIO.map(
                    (
                      mes,
                      index
                    ) => (

                      <option
                        key={
                          mes
                        }
                        value={
                          index
                        }
                      >
                        {mes}
                      </option>

                    )
                  )}

                </select>


                <select
                  value={
                    mesCalendarioHistorial
                      .getFullYear()
                  }
                  onChange={
                    cambiarAnioCalendarioHistorial
                  }
                  aria-label="Año"
                >

                  {ANIOS_CALENDARIO.map(
                    (
                      year
                    ) => (

                      <option
                        key={
                          year
                        }
                        value={
                          year
                        }
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>

              </div>


              <button
                type="button"
                onClick={() =>
                  moverMesCalendarioHistorial(
                    1
                  )
                }
                aria-label="Mes siguiente"
              >
                ›
              </button>

            </div>


            {/* DÍAS DE LA SEMANA */}

            <div className="caja-datepicker-weekdays">

              {DIAS_SEMANA.map(
                (
                  dia,
                  index
                ) => (

                  <span
                    key={
                      `${dia}-${index}`
                    }
                  >
                    {dia}
                  </span>

                )
              )}

            </div>


            {/* DÍAS */}

            <div className="caja-datepicker-days">

              {obtenerDiasCalendario(
                mesCalendarioHistorial
              ).map(
                (
                  fecha
                ) => {

                  const valor =
                    fechaAStringCalendario(
                      fecha
                    );


                  const fueraMes =
                    fecha.getMonth() !==
                    mesCalendarioHistorial
                      .getMonth();


                  const seleccionado =
                    fechaTemporalHistorial ===
                    valor;


                  const hoyFecha =
                    new Date();


                  const inicioSemanaActual =
                    new Date(
                      hoyFecha.getFullYear(),
                      hoyFecha.getMonth(),
                      hoyFecha.getDate() -
                        hoyFecha.getDay()
                    );


                  inicioSemanaActual.setHours(
                    0,
                    0,
                    0,
                    0
                  );


                  const finSemanaActual =
                    new Date(
                      inicioSemanaActual
                    );


                  finSemanaActual.setDate(
                    inicioSemanaActual
                      .getDate() +
                      6
                  );


                  finSemanaActual.setHours(
                    23,
                    59,
                    59,
                    999
                  );


                  const fechaComparar =
                    new Date(
                      fecha.getFullYear(),
                      fecha.getMonth(),
                      fecha.getDate()
                    );


                  const semanaActual =
                    fechaComparar >=
                      inicioSemanaActual &&
                    fechaComparar <=
                      finSemanaActual;


                  const inicioSemana =
                    semanaActual &&
                    fecha.getDay() ===
                      0;


                  const finSemana =
                    semanaActual &&
                    fecha.getDay() ===
                      6;


                  return (

                    <button
                      type="button"
                      key={
                        valor
                      }
                      className={
                        [
                          fueraMes
                            ? "outside"
                            : "",

                          semanaActual
                            ? "current-week"
                            : "",

                          inicioSemana
                            ? "current-week-start"
                            : "",

                          finSemana
                            ? "current-week-end"
                            : "",

                          seleccionado
                            ? "selected"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                      onClick={() =>
                        setFechaTemporalHistorial(
                          valor
                        )
                      }
                    >
                      {fecha.getDate()}
                    </button>

                  );

                }
              )}

            </div>


            {/* PIE */}

            <div className="caja-datepicker-footer">

              <button
                type="button"
                className="caja-datepicker-cancel"
                onClick={
                  cerrarCalendarioHistorial
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="caja-datepicker-done"
                onClick={
                  aplicarCalendarioHistorial
                }
              >
                Listo
              </button>

            </div>

          </div>

        </div>

      )}


      {detalleCaja && (

        <div
          className="caja-modal-overlay"
          onMouseDown={
            (event) =>
              event.stopPropagation()
          }
        >

          <div
            className="caja-modal caja-detail-modal"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="caja-modal-header">

              <div>

                <span>
                  Historial
                </span>

                <h3>
                  {detalleCaja
                    .caja
                    ?.codigo ||
                    "Detalle de caja"}
                </h3>

              </div>


              <button
                type="button"
                className="caja-modal-x"
                onClick={() =>
                  setDetalleCaja(
                    null
                  )
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="caja-detail-sales-grid">

              <div>
                <span>Ventas entregadas</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalVentasEntregadas
                  )}
                </strong>
              </div>

              <div>
                <span>Efectivo</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalEfectivoPedidos
                  )}
                </strong>
              </div>

              <div>
                <span>Transferencias</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalTransferencias
                  )}
                </strong>
              </div>

              <div>
                <span>Crédito</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalCredito
                  )}
                </strong>
              </div>

              <div>
                <span>Total medios de pago</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalMediosPago
                  )}
                </strong>
              </div>

              <div>
                <span>Conciliación</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.diferenciaConciliacion
                  )}
                </strong>
              </div>

            </div>


            <div className="caja-detail-grid">

              <div>
                <span>Saldo inicial</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.saldoInicial
                  )}
                </strong>
              </div>

              <div>
                <span>Ingresos manuales</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalIngresosManuales
                  )}
                </strong>
              </div>

              <div>
                <span>Egresos</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.totalEgresos
                  )}
                </strong>
              </div>

              <div>
                <span>Efectivo esperado</span>
                <strong>
                  {moneda(
                    detalleCaja
                      .resumen
                      ?.saldoEsperado
                  )}
                </strong>
              </div>

              <div>
                <span>Efectivo contado</span>
                <strong>
                  {detalleCaja
                    .resumen
                    ?.efectivoContado ===
                    null ||
                  detalleCaja
                    .resumen
                    ?.efectivoContado ===
                    undefined
                    ? "—"
                    : moneda(
                        detalleCaja
                          .resumen
                          ?.efectivoContado
                      )}
                </strong>
              </div>

              <div>
                <span>Diferencia</span>
                <strong>
                  {detalleCaja
                    .resumen
                    ?.diferencia ===
                    null ||
                  detalleCaja
                    .resumen
                    ?.diferencia ===
                    undefined
                    ? "—"
                    : moneda(
                        detalleCaja
                          .resumen
                          ?.diferencia
                      )}
                </strong>
              </div>

            </div>


            <div className="caja-detail-section-title">
              Pedidos entregados
            </div>


            <div className="caja-detail-table-wrap">

              <table className="caja-table caja-orders-table">

                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Pago</th>
                    <th>Factura</th>
                    <th>Observación</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>

                  {(
                    detalleCaja
                      .movimientos ||
                    []
                  )
                    .filter(
                      (
                        movimiento
                      ) =>
                        movimiento.estado !==
                          "Anulado" &&
                        (
                          movimiento.origen ===
                            "Pedido" ||
                          (
                            movimiento.origen ===
                              "Factura" &&
                            movimiento.tipo ===
                              "Ingreso"
                          )
                        )
                    )
                    .length ===
                  0 ? (

                    <tr>
                      <td
                        colSpan="6"
                        className="caja-empty"
                      >
                        Sin pedidos entregados.
                      </td>
                    </tr>

                  ) : (

                    (
                      detalleCaja
                        .movimientos ||
                      []
                    )
                      .filter(
                        (
                          movimiento
                        ) =>
                          movimiento.estado !==
                            "Anulado" &&
                          (
                            movimiento.origen ===
                              "Pedido" ||
                            (
                              movimiento.origen ===
                                "Factura" &&
                              movimiento.tipo ===
                                "Ingreso"
                            )
                          )
                      )
                      .map(
                        (
                          movimiento
                        ) => (

                          <tr
                            key={
                              movimiento._id
                            }
                          >

                            <td>
                              <strong className="caja-order-code">
                                {pedidoMovimiento(
                                  movimiento
                                )}
                              </strong>
                            </td>

                            <td>
                              {clienteMovimiento(
                                movimiento
                              )}
                            </td>

                            <td>
                              {movimiento.metodoPago ||
                                "Efectivo"}
                            </td>

                            <td>
                              {facturaMovimiento(
                                movimiento
                              )}
                            </td>

                            <td>
                              {observacionMovimiento(
                                movimiento
                              )}
                            </td>

                            <td className="caja-order-total">
                              {moneda(
                                movimiento.valor
                              )}
                            </td>

                          </tr>

                        )
                      )

                  )}

                </tbody>

              </table>

            </div>


            <div className="caja-detail-section-title">
              Movimientos manuales
            </div>


            <div className="caja-detail-table-wrap">

              <table className="caja-table">

                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Valor</th>
                  </tr>
                </thead>

                <tbody>

                  {(
                    detalleCaja
                      .movimientos ||
                    []
                  )
                    .filter(
                      (
                        movimiento
                      ) =>
                        movimiento.estado !==
                          "Anulado" &&
                        !(
                          movimiento.origen ===
                            "Pedido" ||
                          (
                            movimiento.origen ===
                              "Factura" &&
                            movimiento.tipo ===
                              "Ingreso"
                          )
                        )
                    )
                    .length ===
                  0 ? (

                    <tr>
                      <td
                        colSpan="4"
                        className="caja-empty"
                      >
                        Sin movimientos manuales.
                      </td>
                    </tr>

                  ) : (

                    (
                      detalleCaja
                        .movimientos ||
                      []
                    )
                      .filter(
                        (
                          movimiento
                        ) =>
                          movimiento.estado !==
                            "Anulado" &&
                          !(
                            movimiento.origen ===
                              "Pedido" ||
                            (
                              movimiento.origen ===
                                "Factura" &&
                              movimiento.tipo ===
                                "Ingreso"
                            )
                          )
                      )
                      .map(
                        (
                          movimiento
                        ) => (

                          <tr
                            key={
                              movimiento._id
                            }
                          >
                            <td>
                              {fechaHora(
                                movimiento.createdAt
                              )}
                            </td>

                            <td>
                              {movimiento.tipo}
                            </td>

                            <td>
                              {movimiento.concepto}
                            </td>

                            <td>
                              {moneda(
                                movimiento.valor
                              )}
                            </td>
                          </tr>

                        )
                      )

                  )}

                </tbody>

              </table>

            </div>


            <div className="caja-modal-actions">

              <button
                type="button"
                className="caja-btn caja-btn-secondary"
                onClick={() =>
                  setDetalleCaja(
                    null
                  )
                }
              >
                Cerrar
              </button>


              <button
                type="button"
                className="caja-btn caja-btn-primary"
                onClick={() =>
                  imprimirCierreCaja(
                    detalleCaja
                  )
                }
              >
                Imprimir
              </button>

            </div>

          </div>

        </div>

      )}


      <Toast
        mensaje={
          mensaje
        }
        tipo={
          tipoMensaje
        }
      />

    </section>

  );

}
