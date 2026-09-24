import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarCartera,
  obtenerResumenCartera,
  obtenerCartera,
  actualizarCartera,
  registrarPagoCartera,
} from "../services/cartera.service.js";

import cerrarIcon
  from "../assets/icons/cerrar.png";

import guardarIcon
  from "../assets/icons/guardar.png";

import calendarioIcon
  from "../assets/icons/calendario.png";

import "../styles/cartera.css";



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


function fechaDesdeInput(
  valor
) {

  if (!valor) {
    return null;
  }


  const partes =
    String(
      valor
    )
      .split("-")
      .map(Number);


  if (
    partes.length !==
      3 ||
    partes.some(
      (parte) =>
        !Number.isFinite(
          parte
        )
    )
  ) {
    return null;
  }


  const [
    year,
    month,
    day,
  ] = partes;


  const resultado =
    new Date(
      year,
      month - 1,
      day
    );


  if (
    Number.isNaN(
      resultado.getTime()
    )
  ) {
    return null;
  }


  return resultado;

}


function fechaAInputCalendario(
  valor
) {

  if (!valor) {
    return "";
  }


  return [
    valor.getFullYear(),
    String(
      valor.getMonth() +
      1
    ).padStart(
      2,
      "0"
    ),
    String(
      valor.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");

}


function fechaVisibleCalendario(
  valor
) {

  const fechaValor =
    fechaDesdeInput(
      valor
    );


  if (!fechaValor) {
    return "Seleccionar fecha";
  }


  return fechaValor
    .toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

}


function SelectMejorado({
  value,
  onChange,
  options = [],
  ariaLabel = "Seleccionar",
  className = "",
  disabled = false,
}) {

  const [
    abierto,
    setAbierto,
  ] = useState(false);


  const contenedorRef =
    useRef(null);


  useEffect(
    () => {

      function manejarFuera(
        event
      ) {

        if (
          contenedorRef
            .current &&
          !contenedorRef
            .current
            .contains(
              event.target
            )
        ) {

          setAbierto(
            false
          );

        }

      }


      document.addEventListener(
        "mousedown",
        manejarFuera
      );


      return () =>
        document.removeEventListener(
          "mousedown",
          manejarFuera
        );

    },
    []
  );


  const opcionActual =
    options.find(
      (opcion) =>
        String(
          opcion.value
        ) ===
        String(
          value
        )
    ) ||
    options[0] ||
    null;


  return (

    <div
      ref={contenedorRef}
      className={
        `cartera-select-mejorado ${className}`.trim()
      }
    >

      <button
        type="button"
        className={
          `cartera-select-trigger ${
            abierto
              ? "open"
              : ""
          }`
        }
        onClick={() =>
          !disabled &&
          setAbierto(
            (actual) =>
              !actual
          )
        }
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >

        <span>
          {opcionActual
            ?.label ||
            "Seleccionar"}
        </span>

        <span
          className="cartera-select-chevron"
          aria-hidden="true"
        >
          ▾
        </span>

      </button>


      {abierto && !disabled && (

        <div
          className="cartera-select-options"
          role="listbox"
        >

          {options.map(
            (opcion) => {

              const activa =
                String(
                  opcion.value
                ) ===
                String(
                  value
                );


              return (

                <button
                  key={
                    opcion.value
                  }
                  type="button"
                  className={
                    `cartera-select-option ${
                      activa
                        ? "selected"
                        : ""
                    }`
                  }
                  onMouseDown={
                    (event) =>
                      event.preventDefault()
                  }
                  onClick={() => {

                    onChange(
                      opcion.value
                    );

                    setAbierto(
                      false
                    );

                  }}
                  role="option"
                  aria-selected={activa}
                >

                  <span>
                    {opcion.label}
                  </span>

                  {activa && (
                    <span
                      className="cartera-select-check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}

                </button>

              );

            }
          )}

        </div>

      )}

    </div>

  );

}


function CalendarioCartera({
  value,
  onChange,
  disabled = false,
}) {

  const [
    abierto,
    setAbierto,
  ] = useState(false);


  const [
    fechaTemporal,
    setFechaTemporal,
  ] = useState(
    value ||
    ""
  );


  const fechaInicial =
    fechaDesdeInput(
      value
    ) ||
    new Date();


  const [
    vista,
    setVista,
  ] = useState(
    new Date(
      fechaInicial.getFullYear(),
      fechaInicial.getMonth(),
      1
    )
  );


  useEffect(
    () => {

      setFechaTemporal(
        value ||
        ""
      );


      const nuevaFecha =
        fechaDesdeInput(
          value
        );


      if (
        nuevaFecha
      ) {

        setVista(
          new Date(
            nuevaFecha.getFullYear(),
            nuevaFecha.getMonth(),
            1
          )
        );

      }

    },
    [value]
  );


  const hoy =
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    );


  const inicioSemanaActual =
    new Date(
      hoy
    );

  inicioSemanaActual.setDate(
    hoy.getDate() -
      hoy.getDay()
  );


  const finSemanaActual =
    new Date(
      inicioSemanaActual
    );

  finSemanaActual.setDate(
    inicioSemanaActual.getDate() +
      6
  );


  const fechaTemporalDate =
    fechaDesdeInput(
      fechaTemporal
    );


  const yearActual =
    hoy.getFullYear();


  const yearTemporal =
    fechaTemporalDate
      ?.getFullYear();


  const inicioAnios =
    Math.min(
      yearActual - 10,
      yearTemporal ||
        yearActual
    );


  const finAnios =
    Math.max(
      yearActual + 25,
      yearTemporal ||
        yearActual
    );


  const anios =
    Array.from(
      {
        length:
          finAnios -
          inicioAnios +
          1,
      },
      (
        _,
        index
      ) =>
        inicioAnios +
        index
    );


  const primerDia =
    new Date(
      vista.getFullYear(),
      vista.getMonth(),
      1
    );


  const inicioGrilla =
    new Date(
      primerDia
    );


  inicioGrilla.setDate(
    primerDia.getDate() -
      primerDia.getDay()
  );


  const dias =
    Array.from(
      {
        length: 42,
      },
      (
        _,
        index
      ) => {

        const fecha =
          new Date(
            inicioGrilla
          );


        fecha.setDate(
          inicioGrilla.getDate() +
            index
        );


        return {
          fecha,
          dia:
            fecha.getDate(),

          dentroMes:
            fecha.getMonth() ===
            vista.getMonth(),
        };

      }
    );


  function abrirCalendario() {

    if (disabled) {
      return;
    }


    const base =
      fechaDesdeInput(
        value
      ) ||
      hoy;


    setFechaTemporal(
      value ||
      ""
    );


    setVista(
      new Date(
        base.getFullYear(),
        base.getMonth(),
        1
      )
    );


    setAbierto(
      true
    );

  }


  function cancelarCalendario() {

    setFechaTemporal(
      value ||
      ""
    );


    setAbierto(
      false
    );

  }


  function confirmarCalendario() {

    onChange(
      fechaTemporal
    );


    setAbierto(
      false
    );

  }


  function cambiarMes(
    cantidad
  ) {

    setVista(
      new Date(
        vista.getFullYear(),
        vista.getMonth() +
          cantidad,
        1
      )
    );

  }


  function seleccionarDia(
    fecha
  ) {

    setFechaTemporal(
      fechaAInputCalendario(
        fecha
      )
    );

  }


  function mismaFecha(
    fechaA,
    fechaB
  ) {

    if (
      !fechaA ||
      !fechaB
    ) {
      return false;
    }


    return (
      fechaA.getFullYear() ===
        fechaB.getFullYear() &&
      fechaA.getMonth() ===
        fechaB.getMonth() &&
      fechaA.getDate() ===
        fechaB.getDate()
    );

  }


  function estaEnSemanaActual(
    fecha
  ) {

    const fechaComparar =
      new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate()
      );


    return (
      fechaComparar >=
        inicioSemanaActual &&
      fechaComparar <=
        finSemanaActual
    );

  }


  return (

    <div className="cartera-calendar">

      <button
        type="button"
        className={
          `cartera-calendar-trigger ${
            abierto
              ? "open"
              : ""
          }`
        }
        onClick={() => {

          if (
            abierto
          ) {

            cancelarCalendario();

          } else {

            abrirCalendario();

          }

        }}
        disabled={disabled}
        aria-expanded={abierto}
      >

        <span className="cartera-calendar-value">
          {fechaVisibleCalendario(
            value
          )}
        </span>

        <img
          src={calendarioIcon}
          alt=""
          className="cartera-calendar-trigger-icon"
        />

      </button>


      {abierto && !disabled && (

        <div
          className="cartera-datepicker-overlay"
          onMouseDown={
            (event) => {

              /*
                El calendario NO se cierra
                haciendo clic fuera.
              */
              if (
                event.target ===
                event.currentTarget
              ) {
                event.preventDefault();
              }

            }
          }
        >

          <div
            className="cartera-datepicker"
            onMouseDown={
              (event) =>
                event.stopPropagation()
            }
          >

            <div className="cartera-datepicker-header">

              <button
                type="button"
                className="cartera-datepicker-arrow"
                onClick={() =>
                  cambiarMes(
                    -1
                  )
                }
                aria-label="Mes anterior"
              >
                ‹
              </button>


              <div className="cartera-datepicker-selects">

                <SelectMejorado
                  value={
                    vista.getMonth()
                  }
                  onChange={
                    (nuevoMes) =>
                      setVista(
                        new Date(
                          vista.getFullYear(),
                          Number(
                            nuevoMes
                          ),
                          1
                        )
                      )
                  }
                  options={
                    MESES_CALENDARIO.map(
                      (
                        nombre,
                        index
                      ) => ({
                        value:
                          index,

                        label:
                          nombre,
                      })
                    )
                  }
                  ariaLabel="Seleccionar mes"
                  className="cartera-datepicker-month"
                />


                <SelectMejorado
                  value={
                    vista.getFullYear()
                  }
                  onChange={
                    (nuevoYear) =>
                      setVista(
                        new Date(
                          Number(
                            nuevoYear
                          ),
                          vista.getMonth(),
                          1
                        )
                      )
                  }
                  options={
                    anios.map(
                      (year) => ({
                        value:
                          year,

                        label:
                          String(
                            year
                          ),
                      })
                    )
                  }
                  ariaLabel="Seleccionar año"
                  className="cartera-datepicker-year"
                />

              </div>


              <button
                type="button"
                className="cartera-datepicker-arrow"
                onClick={() =>
                  cambiarMes(
                    1
                  )
                }
                aria-label="Mes siguiente"
              >
                ›
              </button>

            </div>


            <div className="cartera-datepicker-weekdays">

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


            <div className="cartera-datepicker-days">

              {dias.map(
                (
                  item
                ) => {

                  const seleccionada =
                    mismaFecha(
                      item.fecha,
                      fechaTemporalDate
                    );


                  const hoyActual =
                    mismaFecha(
                      item.fecha,
                      hoy
                    );


                  const semanaActual =
                    estaEnSemanaActual(
                      item.fecha
                    );


                  const inicioSemana =
                    semanaActual &&
                    item.fecha.getDay() ===
                      0;


                  const finSemana =
                    semanaActual &&
                    item.fecha.getDay() ===
                      6;


                  return (

                    <button
                      type="button"
                      key={
                        fechaAInputCalendario(
                          item.fecha
                        )
                      }
                      className={
                        [
                          !item.dentroMes
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

                          hoyActual
                            ? "today"
                            : "",

                          seleccionada
                            ? "selected"
                            : "",
                        ]
                          .filter(
                            Boolean
                          )
                          .join(
                            " "
                          )
                      }
                      onClick={() =>
                        seleccionarDia(
                          item.fecha
                        )
                      }
                    >
                      {item.dia}
                    </button>

                  );

                }
              )}

            </div>


            <div className="cartera-datepicker-footer">

              <button
                type="button"
                className="cartera-datepicker-cancel"
                onClick={
                  cancelarCalendario
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="cartera-datepicker-done"
                onClick={
                  confirmarCalendario
                }
                disabled={
                  !fechaTemporal
                }
              >
                Listo
              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}



function moneda(
  valor
) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(
      valor ||
      0
    )
  );

}


function fecha(
  valor
) {

  if (!valor) {
    return "—";
  }


  return new Date(
    valor
  ).toLocaleDateString(
    "es-CO"
  );

}


function fechaInput(
  valor
) {

  if (!valor) {
    return "";
  }


  const f =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      f.getTime()
    )
  ) {
    return "";
  }


  return [
    f.getFullYear(),
    String(
      f.getMonth() +
      1
    ).padStart(
      2,
      "0"
    ),
    String(
      f.getDate()
    ).padStart(
      2,
      "0"
    ),
  ].join("-");

}



function fechaCarteraLocal(
  valor
) {

  const normalizada =
    fechaInput(
      valor
    );


  if (!normalizada) {
    return null;
  }


  return fechaDesdeInput(
    normalizada
  );

}


function hoySinHora() {

  const ahora =
    new Date();


  return new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate()
  );

}


function estadoVisualCartera(
  cuenta
) {

  if (!cuenta) {
    return "Pendiente";
  }


  const saldo =
    Number(
      cuenta.saldoPendiente ||
      0
    );


  if (
    cuenta.estado ===
      "Pagada" ||
    saldo <= 0
  ) {
    return "Pagada";
  }


  const vencimiento =
    fechaCarteraLocal(
      cuenta.fechaVencimiento
    );


  if (
    vencimiento &&
    vencimiento <
      hoySinHora()
  ) {
    return "Vencida";
  }


  if (
    cuenta.estado ===
      "Abonada" ||
    Number(
      cuenta.totalAbonado ||
      0
    ) > 0
  ) {
    return "Abonada";
  }


  return "Pendiente";

}


function infoVencimientoCartera(
  cuenta
) {

  if (!cuenta) {

    return {
      texto:
        "Sin vencimiento",
      tipo:
        "sin-fecha",
      dias:
        null,
    };

  }


  if (
    estadoVisualCartera(
      cuenta
    ) ===
    "Pagada"
  ) {

    return {
      texto:
        "Cuenta pagada",
      tipo:
        "pagada",
      dias:
        null,
    };

  }


  const vencimiento =
    fechaCarteraLocal(
      cuenta.fechaVencimiento
    );


  if (!vencimiento) {

    return {
      texto:
        "Sin vencimiento",
      tipo:
        "sin-fecha",
      dias:
        null,
    };

  }


  const diferencia =
    Math.round(
      (
        vencimiento.getTime() -
        hoySinHora().getTime()
      ) /
      86400000
    );


  if (
    diferencia < 0
  ) {

    const dias =
      Math.abs(
        diferencia
      );


    return {
      texto:
        `${dias} ${
          dias === 1
            ? "día vencida"
            : "días vencida"
        }`,
      tipo:
        "vencida",
      dias:
        diferencia,
    };

  }


  if (
    diferencia === 0
  ) {

    return {
      texto:
        "Vence hoy",
      tipo:
        "hoy",
      dias:
        0,
    };

  }


  if (
    diferencia === 1
  ) {

    return {
      texto:
        "Vence mañana",
      tipo:
        "proxima",
      dias:
        1,
    };

  }


  return {
    texto:
      `Vence en ${diferencia} días`,
    tipo:
      diferencia <= 3
        ? "proxima"
        : "normal",
    dias:
      diferencia,
  };

}


function nombreUsuario(
  usuario
) {

  if (!usuario) {
    return "—";
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
    "—"
  );

}


export default function Cartera() {

  const [
    cuentas,
    setCuentas,
  ] = useState([]);


  const [
    resumen,
    setResumen,
  ] = useState({
    valorOriginal: 0,
    totalAbonado: 0,
    saldoPendiente: 0,
    cuentas: 0,
    pendientes: 0,
    pagadas: 0,
  });


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    filtro,
    setFiltro,
  ] = useState("");


  const [
    estadoFiltro,
    setEstadoFiltro,
  ] = useState("Todas");


  const [
    detalle,
    setDetalle,
  ] = useState(null);


  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] = useState(false);


  const [
    fechaVencimiento,
    setFechaVencimiento,
  ] = useState("");


  const [
    observaciones,
    setObservaciones,
  ] = useState("");


  const [
    valorPago,
    setValorPago,
  ] = useState("");


  const [
    metodoPago,
    setMetodoPago,
  ] = useState("Efectivo");


  const [
    referenciaPago,
    setReferenciaPago,
  ] = useState("");


  const [
    observacionPago,
    setObservacionPago,
  ] = useState("");


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
  ] = useState("info");


  async function cargar() {

    try {

      setCargando(
        true
      );


      const [
        dataCartera,
        dataResumen,
      ] =
        await Promise.all([
          listarCartera(),
          obtenerResumenCartera(),
        ]);


      setCuentas(
        Array.isArray(
          dataCartera
        )
          ? dataCartera
          : []
      );


      setResumen(
        dataResumen ||
        {}
      );

    } catch (error) {

      console.error(
        "Error cargando cartera:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar Cartera."
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


  useEffect(
    () => {
      cargar();
    },
    []
  );


  useEffect(
    () => {

      if (!mensaje) {
        return undefined;
      }


      const timer =
        setTimeout(
          () =>
            setMensaje(""),
          3200
        );


      return () =>
        clearTimeout(
          timer
        );

    },
    [mensaje]
  );


  const cuentasConEstado =
    useMemo(
      () =>
        cuentas.map(
          (cuenta) => ({
            ...cuenta,

            estadoVisual:
              estadoVisualCartera(
                cuenta
              ),

            vencimientoInfo:
              infoVencimientoCartera(
                cuenta
              ),
          })
        ),
      [cuentas]
    );


  const cuentasFiltradas =
    useMemo(
      () => {

        const texto =
          filtro
            .trim()
            .toLowerCase();


        return cuentasConEstado.filter(
          (cuenta) => {

            if (
              estadoFiltro !==
                "Todas" &&
              cuenta.estadoVisual !==
                estadoFiltro
            ) {
              return false;
            }


            if (!texto) {
              return true;
            }


            return [
              cuenta.codigo,
              cuenta.pedidoCodigo,
              cuenta.clienteCodigo,
              cuenta.clienteNombre,
              cuenta.clienteDocumento,
              cuenta.cliente?.documento,
              cuenta.cliente?.telefono,
              cuenta.estadoVisual,
              cuenta.vencimientoInfo
                ?.texto,
            ].some(
              (valor) =>
                String(
                  valor ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    texto
                  )
            );

          }
        );

      },
      [
        cuentasConEstado,
        filtro,
        estadoFiltro,
      ]
    );


  async function abrirDetalle(
    cuenta
  ) {

    try {

      setCargandoDetalle(
        true
      );


      const data =
        await obtenerCartera(
          cuenta._id
        );


      setDetalle(
        data
      );


      setFechaVencimiento(
        fechaInput(
          data?.cartera
            ?.fechaVencimiento
        )
      );


      setObservaciones(
        data?.cartera
          ?.observaciones ||
        ""
      );


      setValorPago("");
      setMetodoPago("Efectivo");
      setReferenciaPago("");
      setObservacionPago("");

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible abrir la cuenta de cartera."
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


  function cerrarDetalle() {

    if (procesando) {
      return;
    }


    setDetalle(
      null
    );

  }


  async function guardarDatosCuenta() {

    if (!detalle?.cartera) {
      return;
    }


    try {

      setProcesando(
        true
      );


      await actualizarCartera(
        detalle.cartera._id,
        {
          fechaVencimiento:
            fechaVencimiento ||
            null,

          observaciones,
        }
      );


      setMensaje(
        "Cuenta de cartera actualizada correctamente."
      );

      setTipoMensaje(
        "success"
      );


      await cargar();
      await abrirDetalle(
        detalle.cartera
      );

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible guardar los cambios."
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


  async function registrarAbono(
    event
  ) {

    event.preventDefault();


    if (!detalle?.cartera) {
      return;
    }


    const valor =
      Number(
        valorPago
      );


    if (
      !Number.isFinite(
        valor
      ) ||
      valor <= 0
    ) {

      setMensaje(
        "Digite un valor válido para el abono."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    if (
      valor >
      Number(
        detalle.cartera
          .saldoPendiente ||
        0
      )
    ) {

      setMensaje(
        "El abono no puede superar el saldo pendiente."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    try {

      setProcesando(
        true
      );


      const data =
        await registrarPagoCartera(
          detalle.cartera._id,
          {
            valor,
            metodoPago,
            referencia:
              referenciaPago,
            observacion:
              observacionPago,
          }
        );


      setDetalle({
        cartera:
          data.cartera,
        pagos:
          data.pagos ||
          [],
      });


      setFechaVencimiento(
        fechaInput(
          data.cartera
            ?.fechaVencimiento
        )
      );

      setObservaciones(
        data.cartera
          ?.observaciones ||
        ""
      );

      setValorPago("");
      setReferenciaPago("");
      setObservacionPago("");


      setMensaje(
        data.mensaje ||
        "Abono registrado correctamente."
      );

      setTipoMensaje(
        "success"
      );


      await cargar();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible registrar el abono."
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


  const cuentaDetalle =
    detalle?.cartera ||
    null;


  const pagosDetalle =
    detalle?.pagos ||
    [];


  const estadoDetalle =
    cuentaDetalle
      ? estadoVisualCartera(
          cuentaDetalle
        )
      : "";


  const vencimientoDetalle =
    cuentaDetalle
      ? infoVencimientoCartera(
          cuentaDetalle
        )
      : {
          texto:
            "Sin vencimiento",
          tipo:
            "sin-fecha",
        };


  return (

    <section className="cartera-page">

      <header className="cartera-header">

        <div className="cartera-header-left">
          <ModulosMenu />
          <div>
            <h1>Cartera</h1>
            <p>Ventas entregadas a crédito y recaudo de abonos</p>
          </div>
        </div>

        <button
          type="button"
          className="cartera-refresh"
          onClick={cargar}
          disabled={cargando}
        >
          {cargando
            ? "Actualizando..."
            : "Actualizar"}
        </button>

      </header>


      <main className="cartera-content">

        <section className="cartera-summary-grid">

          <article className="cartera-summary-card">
            <span>Crédito vendido</span>
            <strong>
              {moneda(
                resumen.valorOriginal
              )}
            </strong>
            <small>
              {resumen.cuentas || 0} cuenta(s)
            </small>
          </article>


          <article className="cartera-summary-card cartera-summary-card-paid">
            <span>Total recaudado</span>
            <strong>
              {moneda(
                resumen.totalAbonado
              )}
            </strong>
            <small>Abonos registrados</small>
          </article>


          <article className="cartera-summary-card cartera-summary-card-balance">
            <span>Saldo de cartera</span>
            <strong>
              {moneda(
                resumen.saldoPendiente
              )}
            </strong>
            <small>
              {resumen.pendientes || 0} pendiente(s)
            </small>
          </article>


          <article className="cartera-summary-card cartera-summary-card-done">
            <span>Cuentas pagadas</span>
            <strong>
              {resumen.pagadas || 0}
            </strong>
            <small>Saldo en cero</small>
          </article>

        </section>


        <section className="cartera-panel">

          <div className="cartera-toolbar">

            <div className="cartera-search">
              <span>⌕</span>
              <input
                type="search"
                value={filtro}
                onChange={
                  (event) =>
                    setFiltro(
                      event.target.value
                    )
                }
                placeholder="Buscar pedido, cliente, documento o cartera..."
              />
            </div>


            <div className="cartera-filter-buttons">

              {[
                "Todas",
                "Pendiente",
                "Abonada",
                "Vencida",
                "Pagada",
              ].map(
                (estado) => (
                  <button
                    key={estado}
                    type="button"
                    className={
                      estadoFiltro === estado
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setEstadoFiltro(
                        estado
                      )
                    }
                  >
                    {estado}
                  </button>
                )
              )}

            </div>

          </div>


          <div className="cartera-table-wrap">

            <table className="cartera-table">

              <thead>
                <tr>
                  <th>Cartera</th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Vencimiento</th>
                  <th>Valor</th>
                  <th>Abonado</th>
                  <th>Saldo</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>


              <tbody>

                {cargando ? (

                  <tr>
                    <td
                      colSpan="10"
                      className="cartera-empty"
                    >
                      Cargando cartera...
                    </td>
                  </tr>

                ) : cuentasFiltradas.length === 0 ? (

                  <tr>
                    <td
                      colSpan="10"
                      className="cartera-empty"
                    >
                      No hay cuentas que coincidan con los filtros.
                    </td>
                  </tr>

                ) : (

                  cuentasFiltradas.map(
                    (cuenta) => (

                      <tr
                        key={cuenta._id}
                        className={
                          cuenta.estadoVisual ===
                            "Vencida"
                            ? "cartera-row-vencida"
                            : ""
                        }
                        onDoubleClick={() =>
                          abrirDetalle(
                            cuenta
                          )
                        }
                      >

                        <td>
                          <strong className="cartera-code">
                            {cuenta.codigo}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {cuenta.pedidoCodigo}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {cuenta.clienteNombre}
                          </strong>
                          <small>
                            {cuenta.cliente?.documento ||
                              cuenta.clienteDocumento ||
                              cuenta.clienteCodigo ||
                              "—"}
                          </small>
                        </td>

                        <td>
                          {fecha(
                            cuenta.fechaEntrega
                          )}
                        </td>

                        <td>
                          <strong className="cartera-due-date">
                            {fecha(
                              cuenta.fechaVencimiento
                            )}
                          </strong>

                          <small
                            className={
                              `cartera-due-text cartera-due-${cuenta.vencimientoInfo
                                ?.tipo ||
                                "sin-fecha"}`
                            }
                          >
                            {cuenta.vencimientoInfo
                              ?.texto ||
                              "Sin vencimiento"}
                          </small>
                        </td>

                        <td>
                          {moneda(
                            cuenta.valorOriginal
                          )}
                        </td>

                        <td>
                          {moneda(
                            cuenta.totalAbonado
                          )}
                        </td>

                        <td>
                          <strong className="cartera-balance-value">
                            {moneda(
                              cuenta.saldoPendiente
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              `cartera-status cartera-status-${cuenta.estadoVisual
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )}`
                            }
                          >
                            {cuenta.estadoVisual}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="cartera-manage-btn"
                            onClick={() =>
                              abrirDetalle(
                                cuenta
                              )
                            }
                          >
                            Gestionar
                          </button>
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


      {(detalle || cargandoDetalle) && (

        <div className="cartera-modal-overlay">

          <section className="cartera-modal">

            <header className="cartera-modal-header">

              <div>
                <span>CUENTA DE CARTERA</span>

                <div className="cartera-modal-title-line">
                  <h2>
                    {cuentaDetalle?.codigo ||
                      "Cargando..."}
                  </h2>

                  {cuentaDetalle && (
                    <span
                      className={
                        `cartera-status cartera-modal-status cartera-status-${estadoDetalle
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`
                      }
                    >
                      {estadoDetalle}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="cartera-modal-close"
                onClick={cerrarDetalle}
                disabled={procesando}
                aria-label="Cerrar"
              >
                <img
                  src={cerrarIcon}
                  alt=""
                  className="cartera-modal-close-icon"
                />
              </button>

            </header>


            {cargandoDetalle || !cuentaDetalle ? (

              <div className="cartera-modal-loading">
                Cargando información...
              </div>

            ) : (

              <div className="cartera-modal-body">

                <section className="cartera-account-summary">

                  <div>
                    <span>Pedido</span>
                    <strong>
                      {cuentaDetalle.pedidoCodigo}
                    </strong>
                  </div>

                  <div>
                    <span>Cliente</span>
                    <strong>
                      {cuentaDetalle.clienteNombre}
                    </strong>
                  </div>

                  <div>
                    <span>Fecha entrega</span>
                    <strong>
                      {fecha(
                        cuentaDetalle.fechaEntrega
                      )}
                    </strong>
                  </div>

                  <div
                    className={
                      `cartera-account-due cartera-account-due-${vencimientoDetalle.tipo}`
                    }
                  >
                    <span>Vencimiento</span>

                    <strong>
                      {fecha(
                        cuentaDetalle.fechaVencimiento
                      )}
                    </strong>

                    <small>
                      {vencimientoDetalle.texto}
                    </small>
                  </div>

                  <div>
                    <span>Valor original</span>
                    <strong>
                      {moneda(
                        cuentaDetalle.valorOriginal
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Total abonado</span>
                    <strong>
                      {moneda(
                        cuentaDetalle.totalAbonado
                      )}
                    </strong>
                  </div>

                  <div className="cartera-account-balance">
                    <span>Saldo pendiente</span>
                    <strong>
                      {moneda(
                        cuentaDetalle.saldoPendiente
                      )}
                    </strong>
                  </div>

                  <div className="cartera-account-state">
                    <span>Estado actual</span>

                    <span
                      className={
                        `cartera-status cartera-status-${estadoDetalle
                          .toLowerCase()
                          .replace(
                            /\s+/g,
                            "-"
                          )}`
                      }
                    >
                      {estadoDetalle}
                    </span>
                  </div>

                </section>


                <section className="cartera-details-grid">

                  <label className="cartera-date-field">
                    <span>Fecha de vencimiento</span>

                    <CalendarioCartera
                      value={fechaVencimiento}
                      onChange={
                        setFechaVencimiento
                      }
                      disabled={procesando}
                    />
                  </label>

                  <label className="cartera-observations-field">
                    <span>Observaciones de cartera</span>
                    <textarea
                      value={observaciones}
                      onChange={
                        (event) =>
                          setObservaciones(
                            event.target.value
                          )
                      }
                      placeholder="Opcional"
                    />
                  </label>

                  <button
                    type="button"
                    className="cartera-save-btn"
                    onClick={guardarDatosCuenta}
                    disabled={procesando}
                  >
                    <img
                      src={guardarIcon}
                      alt=""
                      className="cartera-save-icon"
                    />

                    <span>
                      {procesando
                        ? "Guardando..."
                        : "Guardar datos"}
                    </span>
                  </button>

                </section>


                {cuentaDetalle.estado !== "Pagada" && (

                  <form
                    className="cartera-payment-panel"
                    onSubmit={registrarAbono}
                  >

                    <div className="cartera-section-title">
                      <div>
                        <span>RECAUDO</span>
                        <h3>Registrar abono</h3>
                      </div>
                      <small>
                        Requiere una Caja abierta.
                      </small>
                    </div>


                    <div className="cartera-payment-grid">

                      <label>
                        <span>Valor del abono</span>
                        <input
                          type="number"
                          min="1"
                          max={
                            cuentaDetalle.saldoPendiente
                          }
                          step="1"
                          value={valorPago}
                          onChange={
                            (event) =>
                              setValorPago(
                                event.target.value
                              )
                          }
                          placeholder="0"
                          required
                        />
                      </label>


                      <label>
                        <span>Medio de pago</span>

                        <SelectMejorado
                          value={metodoPago}
                          onChange={
                            setMetodoPago
                          }
                          options={[
                            {
                              value:
                                "Efectivo",
                              label:
                                "Efectivo",
                            },
                            {
                              value:
                                "Transferencia",
                              label:
                                "Transferencia",
                            },
                          ]}
                          ariaLabel="Seleccionar medio de pago"
                          disabled={procesando}
                        />
                      </label>


                      <label>
                        <span>Referencia</span>
                        <input
                          type="text"
                          value={referenciaPago}
                          onChange={
                            (event) =>
                              setReferenciaPago(
                                event.target.value
                              )
                          }
                          placeholder="Opcional"
                        />
                      </label>


                      <label className="cartera-payment-observation">
                        <span>Observación</span>
                        <input
                          type="text"
                          value={observacionPago}
                          onChange={
                            (event) =>
                              setObservacionPago(
                                event.target.value
                              )
                          }
                          placeholder="Opcional"
                        />
                      </label>

                    </div>


                    <div className="cartera-payment-actions">

                      <button
                        type="button"
                        className="cartera-pay-all"
                        onClick={() =>
                          setValorPago(
                            String(
                              cuentaDetalle.saldoPendiente
                            )
                          )
                        }
                        disabled={procesando}
                      >
                        Pagar todo
                      </button>


                      <button
                        type="submit"
                        className="cartera-register-payment"
                        disabled={procesando}
                      >
                        {procesando
                          ? "Registrando..."
                          : "Registrar abono"}
                      </button>

                    </div>

                  </form>

                )}


                <section className="cartera-history-panel">

                  <div className="cartera-section-title">
                    <div>
                      <span>HISTORIAL</span>
                      <h3>Pagos y abonos</h3>
                    </div>
                    <small>
                      {pagosDetalle.length} movimiento(s)
                    </small>
                  </div>


                  <div className="cartera-history-table-wrap">

                    <table className="cartera-history-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Valor</th>
                          <th>Medio</th>
                          <th>Referencia</th>
                          <th>Caja</th>
                          <th>Registrado por</th>
                        </tr>
                      </thead>
                      <tbody>

                        {pagosDetalle.length === 0 ? (

                          <tr>
                            <td
                              colSpan="6"
                              className="cartera-empty"
                            >
                              Aún no hay abonos registrados.
                            </td>
                          </tr>

                        ) : (

                          pagosDetalle.map(
                            (pago) => (
                              <tr key={pago._id}>
                                <td>
                                  {fecha(
                                    pago.fechaPago
                                  )}
                                </td>
                                <td>
                                  <strong>
                                    {moneda(
                                      pago.valor
                                    )}
                                  </strong>
                                </td>
                                <td>
                                  {pago.metodoPago}
                                </td>
                                <td>
                                  {pago.referencia ||
                                    "—"}
                                </td>
                                <td>
                                  {pago.caja?.codigo ||
                                    "—"}
                                </td>
                                <td>
                                  {nombreUsuario(
                                    pago.usuario
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

              </div>

            )}

          </section>

        </div>

      )}


      <Toast
        mensaje={mensaje}
        tipo={tipoMensaje}
      />

    </section>

  );

}
