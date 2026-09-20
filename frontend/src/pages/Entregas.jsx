import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import Toast
  from "../components/Toast.jsx";

import {
  listarEmpleadosPedidos,
} from "../services/empleado.service.js";

import {
  listarEntregas,
  obtenerEntrega,
  actualizarPreparacionEntrega,
  confirmarEntrega,
  cambiarEstadoEntrega,
} from "../services/entrega.service.js";

import {
  imprimirEntrega,
  imprimirEntregasFiltradas,
} from "../utils/entrega.impresion.js";

import imprimirIcon
  from "../assets/icons/imprimir.png";

import imprimirEntregaIcon
  from "../assets/icons/imprimir-pedido.png";

import guardarEntregaIcon
  from "../assets/icons/guardar-entrega.png";

import cerrarEntregaIcon
  from "../assets/icons/cerrar-entrega.png";

import "../styles/entregas.css";


const ESTADOS_FILTRO = [
  "Todos",
  "Por preparar",
  "Pendiente",
  "En ruta",
  "Entregado",
  "Cancelado",
];


const ESTADOS_CONFIRMADOS = [
  "Pendiente",
  "En ruta",
  "Entregado",
  "Cancelado",
];


function moneda(valor) {
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


function fecha(valor) {
  if (!valor) {
    return "—";
  }

  return new Date(
    valor
  ).toLocaleDateString(
    "es-CO"
  );
}


function fechaHora(valor) {
  if (!valor) {
    return "—";
  }

  return new Date(
    valor
  ).toLocaleString(
    "es-CO"
  );
}


function nombreEmpleado(empleado) {
  if (!empleado) {
    return "Sin asignar";
  }

  return (
    [
      empleado.nombres,
      empleado.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    empleado.codigo ||
    "Empleado"
  );
}


function claseEstado(estado) {
  return String(
    estado ||
    ""
  )
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


/* =========================================
   SELECT VISUAL DE ESTADOS
========================================= */

function EstadoSelect({
  value,
  options,
  onChange,
  disabled = false,
  compacto = false,
  filtro = false,
}) {

  const [abierto, setAbierto] =
    useState(false);

  const [posicion, setPosicion] =
    useState({
      top: 0,
      left: 0,
      width: 180,
    });

  const botonRef =
    useRef(null);


  function actualizarPosicion() {

    const boton =
      botonRef.current;

    if (!boton) {
      return;
    }

    const rect =
      boton.getBoundingClientRect();

    const anchoMenu =
      Math.max(
        rect.width,
        filtro ? 190 : 175
      );

    const espacioAbajo =
      window.innerHeight -
      rect.bottom;

    const altoEstimado =
      Math.min(
        options.length * 43 + 14,
        240
      );

    const abrirArriba =
      espacioAbajo <
        altoEstimado + 12 &&
      rect.top >
        altoEstimado + 12;

    let left =
      rect.left;

    if (
      left + anchoMenu >
      window.innerWidth - 10
    ) {
      left =
        Math.max(
          10,
          window.innerWidth -
            anchoMenu -
            10
        );
    }

    setPosicion({
      top: abrirArriba
        ? Math.max(
            10,
            rect.top -
              altoEstimado -
              7
          )
        : rect.bottom + 7,
      left,
      width: anchoMenu,
    });

  }


  useEffect(
    () => {

      if (!abierto) {
        return undefined;
      }

      actualizarPosicion();

      function cerrarAlPresionarFuera(
        event
      ) {

        const dentroBoton =
          botonRef.current
            ?.contains(
              event.target
            );

        const dentroMenu =
          event.target
            ?.closest?.(
              ".entregas-state-menu"
            );

        if (
          !dentroBoton &&
          !dentroMenu
        ) {
          setAbierto(false);
        }

      }

      function cerrarEscape(event) {
        if (event.key === "Escape") {
          setAbierto(false);
        }
      }

      function reposicionar() {
        actualizarPosicion();
      }

      document.addEventListener(
        "mousedown",
        cerrarAlPresionarFuera
      );

      document.addEventListener(
        "keydown",
        cerrarEscape
      );

      window.addEventListener(
        "resize",
        reposicionar
      );

      window.addEventListener(
        "scroll",
        reposicionar,
        true
      );

      return () => {

        document.removeEventListener(
          "mousedown",
          cerrarAlPresionarFuera
        );

        document.removeEventListener(
          "keydown",
          cerrarEscape
        );

        window.removeEventListener(
          "resize",
          reposicionar
        );

        window.removeEventListener(
          "scroll",
          reposicionar,
          true
        );

      };

    },
    [
      abierto,
      filtro,
      options.length,
    ]
  );


  const claseActual =
    claseEstado(value);

  const menu =
    abierto &&
    typeof document !==
      "undefined"
      ? createPortal(

          <div
            className={
              `entregas-state-menu ${
                filtro
                  ? "entregas-state-menu-filter"
                  : ""
              }`
            }
            role="listbox"
            aria-label={
              filtro
                ? "Filtrar por estado"
                : "Cambiar estado de entrega"
            }
            style={{
              top:
                posicion.top,
              left:
                posicion.left,
              width:
                posicion.width,
            }}
          >

            {options.map(
              (estado) => {

                const activo =
                  estado === value;

                const claseOpcion =
                  claseEstado(estado);

                return (

                  <button
                    key={estado}
                    type="button"
                    role="option"
                    aria-selected={
                      activo
                    }
                    className={
                      `entregas-state-option entregas-state-option-${claseOpcion} ${
                        activo
                          ? "active"
                          : ""
                      }`
                    }
                    onClick={() => {

                      setAbierto(
                        false
                      );

                      if (
                        estado !== value
                      ) {
                        onChange(
                          estado
                        );
                      }

                    }}
                  >

                    <span
                      className="entregas-state-option-dot"
                      aria-hidden="true"
                    />

                    <span className="entregas-state-option-text">
                      {estado}
                    </span>

                    {activo && (
                      <span
                        className="entregas-state-option-check"
                        aria-hidden="true"
                      >
                        ✓
                      </span>
                    )}

                  </button>

                );

              }
            )}

          </div>,

          document.body

        )
      : null;


  return (
    <>

      <button
        ref={botonRef}
        type="button"
        className={
          `entregas-state-trigger entregas-state-trigger-${claseActual} ${
            compacto
              ? "entregas-state-trigger-compact"
              : ""
          } ${
            filtro
              ? "entregas-state-trigger-filter"
              : ""
          }`
        }
        onClick={() => {

          if (disabled) {
            return;
          }

          actualizarPosicion();
          setAbierto(
            (actual) =>
              !actual
          );

        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
      >

        <span
          className="entregas-state-trigger-dot"
          aria-hidden="true"
        />

        <span className="entregas-state-trigger-text">
          {value}
        </span>

        <span
          className={
            `entregas-state-trigger-arrow ${
              abierto
                ? "open"
                : ""
            }`
          }
          aria-hidden="true"
        >
          ▾
        </span>

      </button>

      {menu}

    </>
  );

}


export default function Entregas() {

  const [
    entregas,
    setEntregas,
  ] = useState([]);

  const [
    repartidores,
    setRepartidores,
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
  ] = useState("info");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("Todos");

  const [
    filtroTexto,
    setFiltroTexto,
  ] = useState("");

  const [
    vista,
    setVista,
  ] = useState(
    () =>
      localStorage.getItem(
        "webbuys-vista-entregas"
      ) ||
      "tarjetas"
  );

  const [
    modalDetalle,
    setModalDetalle,
  ] = useState(false);

  const [
    detalle,
    setDetalle,
  ] = useState(null);

  const [
    formRepartidor,
    setFormRepartidor,
  ] = useState("");

  const [
    formMetodoPago,
    setFormMetodoPago,
  ] = useState("");

  const [
    formObservaciones,
    setFormObservaciones,
  ] = useState("");

  const [
    formPesos,
    setFormPesos,
  ] = useState({});

  const [
    preparacionSucia,
    setPreparacionSucia,
  ] = useState(false);

  const [
    modalCancelacion,
    setModalCancelacion,
  ] = useState(false);

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] = useState("");

  const [
    entregaCancelacion,
    setEntregaCancelacion,
  ] = useState(null);


  async function cargarDatos() {

    try {

      setCargando(
        true
      );

      const [
        dataEntregas,
        dataEmpleados,
      ] =
        await Promise.all([
          listarEntregas(),
          listarEmpleadosPedidos(),
        ]);

      setEntregas(
        Array.isArray(
          dataEntregas
        )
          ? dataEntregas
          : dataEntregas?.entregas ||
            []
      );

      const listaEmpleados =
        Array.isArray(
          dataEmpleados
        )
          ? dataEmpleados
          : dataEmpleados?.empleados ||
            dataEmpleados?.data ||
            [];

      setRepartidores(
        listaEmpleados.filter(
          (empleado) =>
            String(
              empleado.estado ||
              ""
            )
              .trim()
              .toLowerCase() ===
              "activo" &&
            String(
              empleado.cargo ||
              ""
            )
              .trim()
              .toLowerCase() ===
              "repartidor"
        )
      );

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar el módulo de Entrega."
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
      cargarDatos();
    },
    []
  );


  useEffect(
    () => {

      if (!mensaje) {
        return;
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
    [
      mensaje,
    ]
  );


  const entregasFiltradas =
    useMemo(
      () => {

        const texto =
          filtroTexto
            .trim()
            .toLowerCase();

        return entregas.filter(
          (entrega) => {

            if (
              filtroEstado !==
                "Todos" &&
              entrega.estado !==
                filtroEstado
            ) {
              return false;
            }

            if (!texto) {
              return true;
            }

            return [
              entrega.pedidoCodigo,
              entrega.clienteCodigo,
              entrega.clienteNombre,
              entrega.clienteTelefono,
              entrega.clienteDireccion,
              entrega.zonaDespachoNombre,
              entrega.rutaNombre,
              entrega.repartidor?.nombres,
              entrega.repartidor?.apellidos,
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
        entregas,
        filtroEstado,
        filtroTexto,
      ]
    );


  const resumenVista =
    useMemo(
      () => {

        if (!detalle) {
          return {
            subtotal: 0,
            total: 0,
            pesosPendientes: 0,
          };
        }

        let subtotal = 0;
        let pesosPendientes = 0;

        (
          detalle.items ||
          []
        ).forEach(
          (item) => {

            const precio =
              Number(
                item.precioUnitario ??
                item.precioAplicado ??
                item.precioNormal ??
                0
              );

            if (
              item.tipoVenta ===
              "Peso"
            ) {

              const valor =
                formPesos[
                  item._id
                ];

              const peso =
                Number(
                  valor
                );

              if (
                valor === "" ||
                valor === null ||
                valor === undefined ||
                !Number.isFinite(
                  peso
                ) ||
                peso <= 0
              ) {

                pesosPendientes +=
                  1;

                return;

              }

              subtotal +=
                peso *
                precio;

              return;

            }

            subtotal +=
              Number(
                item.subtotal ||
                0
              );

          }
        );

        subtotal =
          Number(
            subtotal.toFixed(
              2
            )
          );

        const total =
          Number(
            Math.max(
              0,
              subtotal -
              Number(
                detalle.descuento ||
                0
              )
            ).toFixed(
              2
            )
          );

        return {
          subtotal,
          total,
          pesosPendientes,
        };

      },
      [
        detalle,
        formPesos,
      ]
    );


  function manejarImpresionIndividual(
    entrega
  ) {

    const resultado =
      imprimirEntrega(
        entrega
      );

    if (
      resultado &&
      resultado.ok === false
    ) {

      setMensaje(
        resultado.mensaje ||
        "No fue posible imprimir la entrega."
      );

      setTipoMensaje(
        resultado.tipo ||
        "error"
      );

    }

  }


  function manejarImpresionGeneral() {

    const resultado =
      imprimirEntregasFiltradas({
        entregas:
          entregasFiltradas,

        filtros: {
          busqueda:
            filtroTexto,
          estado:
            filtroEstado,
        },
      });

    if (
      resultado &&
      resultado.ok === false
    ) {

      setMensaje(
        resultado.mensaje ||
        "No fue posible imprimir las entregas."
      );

      setTipoMensaje(
        resultado.tipo ||
        "error"
      );

    }

  }


  function cambiarVista(
    nuevaVista
  ) {

    setVista(
      nuevaVista
    );

    localStorage.setItem(
      "webbuys-vista-entregas",
      nuevaVista
    );

  }


  async function abrirDetalle(
    id
  ) {

    try {

      setProcesando(
        true
      );

      const data =
        await obtenerEntrega(
          id
        );

      setDetalle(
        data
      );

      setFormRepartidor(
        data.repartidor?._id ||
        data.repartidor ||
        ""
      );

      setFormMetodoPago(
        data.metodoPago ||
        ""
      );

      setFormObservaciones(
        data.observaciones ||
        ""
      );

      const pesos = {};

      (
        data.items ||
        []
      ).forEach(
        (item) => {

          if (
            item.tipoVenta ===
            "Peso"
          ) {

            pesos[item._id] =
              item.pesoReal ??
              "";

          }

        }
      );

      setFormPesos(
        pesos
      );

      setPreparacionSucia(
        false
      );

      setModalDetalle(
        true
      );

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible consultar la entrega."
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


  function cerrarDetalle() {

    if (procesando) {
      return;
    }

    setModalDetalle(
      false
    );

    setDetalle(
      null
    );

    setPreparacionSucia(
      false
    );

  }


  function marcarPreparacionSucia() {
    setPreparacionSucia(
      true
    );
  }


  async function guardarPreparacion() {

    if (!detalle) {
      return;
    }

    try {

      setProcesando(
        true
      );

      const items =
        Object.entries(
          formPesos
        ).map(
          (
            [
              itemId,
              pesoReal,
            ]
          ) => ({
            itemId,
            pesoReal,
          })
        );

      const respuesta =
        await actualizarPreparacionEntrega(
          detalle._id,
          {
            repartidor:
              formRepartidor ||
              null,

            metodoPago:
              formMetodoPago,

            observaciones:
              formObservaciones,

            items,
          }
        );

      const actualizada =
        respuesta.entrega;

      setDetalle(
        actualizada
      );

      setPreparacionSucia(
        false
      );

      setMensaje(
        respuesta.mensaje ||
        "Preparación guardada."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible guardar la preparación."
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


  async function confirmarPreparacion() {

    if (!detalle) {
      return;
    }

    if (
      preparacionSucia
    ) {

      setMensaje(
        "Guarde los cambios antes de confirmar."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }

    if (
      !formRepartidor
    ) {

      setMensaje(
        "Seleccione un repartidor antes de confirmar."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }

    if (
      !formMetodoPago
    ) {

      setMensaje(
        "Seleccione el tipo de pago antes de confirmar."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }

    if (
      resumenVista
        .pesosPendientes >
      0
    ) {

      setMensaje(
        `Falta registrar el peso real de ${resumenVista.pesosPendientes} producto(s) por KG.`
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

      const respuesta =
        await confirmarEntrega(
          detalle._id
        );

      setDetalle(
        respuesta.entrega
      );

      setMensaje(
        respuesta.mensaje ||
        "Entrega confirmada."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible confirmar la entrega."
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


  async function confirmarDesdeListado(
    entrega
  ) {

    if (!entrega) {
      return;
    }

    if (
      !entrega.preparacionGuardada
    ) {

      setMensaje(
        "Primero debe guardar la preparación de la entrega."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }

    try {

      setProcesando(
        true
      );

      const respuesta =
        await confirmarEntrega(
          entrega._id
        );

      if (
        detalle?._id ===
        entrega._id
      ) {

        setDetalle(
          respuesta.entrega
        );

      }

      setMensaje(
        respuesta.mensaje ||
        "Entrega confirmada."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible confirmar la entrega."
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


  async function cambiarEstadoDirecto(
    entrega,
    estado
  ) {

    if (!entrega) {
      return;
    }

    if (
      estado ===
      "Cancelado"
    ) {

      setEntregaCancelacion(
        entrega
      );

      setMotivoCancelacion(
        ""
      );

      setModalCancelacion(
        true
      );

      return;

    }

    try {

      setProcesando(
        true
      );

      const respuesta =
        await cambiarEstadoEntrega(
          entrega._id,
          estado
        );

      if (
        detalle?._id ===
        entrega._id
      ) {

        setDetalle(
          respuesta.entrega
        );

      }

      setMensaje(
        respuesta.mensaje ||
        "Estado actualizado."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cambiar el estado."
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


  async function cambiarEstado(
    estado
  ) {

    if (!detalle) {
      return;
    }

    await cambiarEstadoDirecto(
      detalle,
      estado
    );

  }


  async function confirmarCancelacion() {

    const objetivo =
      entregaCancelacion ||
      detalle;

    if (!objetivo) {
      return;
    }

    if (
      !motivoCancelacion
        .trim()
    ) {

      setMensaje(
        "Indique el motivo de cancelación."
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

      const respuesta =
        await cambiarEstadoEntrega(
          objetivo._id,
          "Cancelado",
          motivoCancelacion
        );

      if (
        detalle?._id ===
        objetivo._id
      ) {

        setDetalle(
          respuesta.entrega
        );

      }

      setModalCancelacion(
        false
      );

      setEntregaCancelacion(
        null
      );

      setMotivoCancelacion(
        ""
      );

      setMensaje(
        "Entrega cancelada correctamente."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cancelar la entrega."
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


  function limpiarFiltrosEntrega() {

    setFiltroTexto(
      ""
    );

    setFiltroEstado(
      "Todos"
    );

  }


  return (

    <section className="entregas-page">

      <Toast
        mensaje={mensaje}
        tipo={tipoMensaje}
      />


      <header className="entregas-title-bar">

        <div className="entregas-title-info">

          <ModulosMenu />

          <div>
            <h2>
              Entrega
            </h2>

            <p>
              Preparación y despacho de pedidos
            </p>
          </div>

        </div>


        <div className="entregas-title-actions">

          <div className="entregas-view-switch">

            <button
              type="button"
              className={
                `entregas-view-btn ${
                  vista === "tarjetas"
                    ? "entregas-view-btn-active"
                    : ""
                }`
              }
              onClick={() =>
                cambiarVista(
                  "tarjetas"
                )
              }
              title="Ver como tarjetas"
            >

              <span className="entregas-view-grid-icon">
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span>
                Tarjetas
              </span>

            </button>


            <button
              type="button"
              className={
                `entregas-view-btn ${
                  vista === "lista"
                    ? "entregas-view-btn-active"
                    : ""
                }`
              }
              onClick={() =>
                cambiarVista(
                  "lista"
                )
              }
              title="Ver como lista"
            >

              <span className="entregas-view-list-icon">
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span>
                Lista
              </span>

            </button>

          </div>


          <button
            type="button"
            className="entregas-top-icon-btn"
            data-tooltip="Imprimir entregas"
            aria-label="Imprimir entregas"
            onClick={
              manejarImpresionGeneral
            }
            disabled={
              entregasFiltradas.length === 0
            }
          >
            <img
              src={imprimirIcon}
              alt=""
            />
          </button>

        </div>

      </header>


      <main className="entregas-content">

        <section className="entregas-toolbar">

          <label className="entregas-toolbar-search">

            <span>
              Buscar
            </span>

            <input
              type="text"
              placeholder="Pedido, cliente, dirección, ruta..."
              value={
                filtroTexto
              }
              onChange={
                (event) =>
                  setFiltroTexto(
                    event.target.value
                  )
              }
            />

          </label>


          <label className="entregas-toolbar-state">

            <span>
              Estado
            </span>

            <EstadoSelect
              value={
                filtroEstado
              }
              options={
                ESTADOS_FILTRO
              }
              onChange={
                setFiltroEstado
              }
              filtro
            />

          </label>


          <div className="entregas-filter-result">

            <strong>
              {entregasFiltradas.length}
            </strong>

            <span>
              entrega(s)
            </span>

          </div>


          <button
            type="button"
            className="entregas-refresh"
            onClick={
              cargarDatos
            }
            disabled={
              cargando
            }
          >
            Actualizar
          </button>


          <button
            type="button"
            className="entregas-clear-filters"
            onClick={
              limpiarFiltrosEntrega
            }
          >
            Limpiar filtros
          </button>

        </section>


        {cargando ? (

          <div className="entregas-empty">
            Cargando entregas...
          </div>

        ) : entregasFiltradas.length === 0 ? (

          <div className="entregas-empty">
            No hay entregas para mostrar.
          </div>

        ) : vista === "tarjetas" ? (

          <section className="entregas-grid">

            {entregasFiltradas.map(
              (entrega) => {

                const estadoClase =
                  claseEstado(
                    entrega.estado
                  );

                return (

                  <article
                    key={
                      entrega._id
                    }
                    className="entrega-card"
                    onDoubleClick={() =>
                      abrirDetalle(
                        entrega._id
                      )
                    }
                    title="Doble clic para gestionar"
                  >

                    <div className="entrega-card-top">

                      <strong className="entrega-card-code">
                        {entrega.pedidoCodigo}
                      </strong>


                      <div className="entrega-card-top-actions">

                        <button
                          type="button"
                          className="entrega-card-print-btn"
                          title="Imprimir esta entrega"
                          aria-label={`Imprimir ${entrega.pedidoCodigo || "entrega"}`}
                          onClick={
                            (event) => {

                              event.stopPropagation();

                              manejarImpresionIndividual(
                                entrega
                              );

                            }
                          }
                          onDoubleClick={
                            (event) =>
                              event.stopPropagation()
                          }
                        >

                          <img
                            src={
                              imprimirEntregaIcon
                            }
                            alt=""
                          />

                        </button>


                        <span
                          className={
                            `entrega-status entrega-status-${estadoClase}`
                          }
                        >
                          {entrega.estado}
                        </span>

                      </div>

                    </div>


                    <div className="entrega-card-client">

                      <span>
                        Cliente
                      </span>

                      <h3>
                        {entrega.clienteNombre}
                      </h3>

                      <small>
                        {entrega.clienteTelefono ||
                          "Sin teléfono"}
                      </small>

                    </div>


                    <div className="entrega-card-info">

                      <div>
                        <span>
                          Entrega
                        </span>
                        <strong>
                          {fecha(
                            entrega.fechaProgramada
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Ruta
                        </span>
                        <strong>
                          {entrega.rutaNombre ||
                            "Sin ruta"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Zona
                        </span>
                        <strong>
                          {entrega.zonaDespachoNombre ||
                            "Sin zona"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Repartidor
                        </span>
                        <strong>
                          {nombreEmpleado(
                            entrega.repartidor
                          )}
                        </strong>
                      </div>

                    </div>


                    <div className="entrega-card-total">

                      <span>
                        Total
                      </span>

                      <strong>
                        {moneda(
                          entrega.total
                        )}
                      </strong>

                    </div>


                    <div
                      className="entrega-card-hover-action"
                      onClick={
                        (event) =>
                          event.stopPropagation()
                      }
                      onDoubleClick={
                        (event) =>
                          event.stopPropagation()
                      }
                    >

                      <button
                        type="button"
                        className="entrega-card-manage-btn"
                        onClick={() =>
                          abrirDetalle(
                            entrega._id
                          )
                        }
                      >
                        Gestionar
                      </button>

                    </div>


                    <div
                      className="entrega-card-footer"
                      onClick={
                        (event) =>
                          event.stopPropagation()
                      }
                      onDoubleClick={
                        (event) =>
                          event.stopPropagation()
                      }
                    >

                      <span className="entrega-card-footer-label">
                        Estado
                      </span>


                      <div className="entrega-card-quick-action">

                        {!entrega.confirmada ? (

                          entrega.preparacionGuardada ? (

                            <button
                              type="button"
                              className="entregas-quick-confirm"
                              onClick={() =>
                                confirmarDesdeListado(
                                  entrega
                                )
                              }
                              disabled={
                                procesando
                              }
                            >
                              Confirmar
                            </button>

                          ) : (

                            <span className="entregas-quick-wait">
                              Preparar primero
                            </span>

                          )

                        ) : [
                          "Entregado",
                          "Cancelado",
                        ].includes(
                          entrega.estado
                        ) ? (

                          <span
                            className={
                              `entrega-status entrega-status-${estadoClase}`
                            }
                          >
                            {entrega.estado}
                          </span>

                        ) : (

                          <EstadoSelect
                            value={
                              entrega.estado
                            }
                            options={
                              ESTADOS_CONFIRMADOS
                            }
                            onChange={(estado) =>
                              cambiarEstadoDirecto(
                                entrega,
                                estado
                              )
                            }
                            disabled={
                              procesando
                            }
                            compacto
                          />

                        )}

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </section>

        ) : (

          <div className="entregas-table-wrap">

            <table className="entregas-table">

              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Entrega</th>
                  <th>Ruta</th>
                  <th>Repartidor</th>
                  <th>Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th
                    className="entregas-list-print-head"
                    aria-label="Imprimir"
                  >
                  </th>
                </tr>
              </thead>

              <tbody>

                {entregasFiltradas.map(
                  (entrega) => {

                    const estadoClase =
                      claseEstado(
                        entrega.estado
                      );

                    return (

                      <tr
                        key={
                          entrega._id
                        }
                        onDoubleClick={() =>
                          abrirDetalle(
                            entrega._id
                          )
                        }
                        title="Doble clic para gestionar"
                      >

                        <td>
                          <strong>
                            {entrega.pedidoCodigo}
                          </strong>
                        </td>

                        <td>
                          {entrega.clienteNombre}
                        </td>

                        <td>
                          {fecha(
                            entrega.fechaProgramada
                          )}
                        </td>

                        <td>
                          {entrega.rutaNombre ||
                            "—"}
                        </td>

                        <td>
                          {nombreEmpleado(
                            entrega.repartidor
                          )}
                        </td>

                        <td>
                          {entrega.metodoPago ||
                            "Pendiente"}
                        </td>

                        <td>
                          <strong>
                            {moneda(
                              entrega.total
                            )}
                          </strong>
                        </td>

                        <td
                          onClick={
                            (event) =>
                              event.stopPropagation()
                          }
                          onDoubleClick={
                            (event) =>
                              event.stopPropagation()
                          }
                        >

                          <div className="entregas-list-state">

                            {!entrega.confirmada ? (

                              <>

                                <span
                                  className={
                                    `entrega-status entrega-status-${estadoClase}`
                                  }
                                >
                                  {entrega.estado}
                                </span>


                                {entrega.preparacionGuardada && (

                                  <button
                                    type="button"
                                    className="entregas-quick-confirm entregas-list-confirm"
                                    onClick={() =>
                                      confirmarDesdeListado(
                                        entrega
                                      )
                                    }
                                    disabled={
                                      procesando
                                    }
                                  >
                                    Confirmar
                                  </button>

                                )}

                              </>

                            ) : ![
                              "Entregado",
                              "Cancelado",
                            ].includes(
                              entrega.estado
                            ) ? (

                              <EstadoSelect
                                value={
                                  entrega.estado
                                }
                                options={
                                  ESTADOS_CONFIRMADOS
                                }
                                onChange={(estado) =>
                                  cambiarEstadoDirecto(
                                    entrega,
                                    estado
                                  )
                                }
                                disabled={
                                  procesando
                                }
                                compacto
                              />

                            ) : (

                              <span
                                className={
                                  `entrega-status entrega-status-${estadoClase}`
                                }
                              >
                                {entrega.estado}
                              </span>

                            )}

                          </div>

                        </td>

                        <td
                          className="entregas-list-print-cell"
                          onClick={
                            (event) =>
                              event.stopPropagation()
                          }
                          onDoubleClick={
                            (event) =>
                              event.stopPropagation()
                          }
                        >

                          <button
                            type="button"
                            className="entregas-list-print-btn"
                            title="Imprimir esta entrega"
                            aria-label={`Imprimir ${entrega.pedidoCodigo || "entrega"}`}
                            onClick={
                              (event) => {

                                event.stopPropagation();

                                manejarImpresionIndividual(
                                  entrega
                                );

                              }
                            }
                          >

                            <img
                              src={
                                imprimirEntregaIcon
                              }
                              alt=""
                            />

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </main>


      {modalDetalle &&
        detalle && (

        <div className="entregas-modal-overlay">

          <section className="entregas-modal">

            <header className="entregas-modal-header">

              <div>

                <span>
                  Entrega
                </span>

                <h2>
                  {detalle.pedidoCodigo}
                </h2>

              </div>

              <button
                type="button"
                className="entregas-modal-header-close"
                data-tooltip="Cerrar"
                onClick={
                  cerrarDetalle
                }
                disabled={
                  procesando
                }
                aria-label="Cerrar"
              >
                <img
                  src={
                    cerrarEntregaIcon
                  }
                  alt=""
                />
              </button>

            </header>


            <div className="entregas-modal-body">

              <section className="entregas-detail-client">

                <div>
                  <span>Cliente</span>
                  <strong>
                    {detalle.clienteNombre}
                  </strong>
                </div>

                <div>
                  <span>Teléfono</span>
                  <strong>
                    {detalle.clienteTelefono ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Dirección</span>
                  <strong>
                    {detalle.clienteDireccion ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Zona</span>
                  <strong>
                    {detalle.zonaDespachoNombre ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>Ruta</span>
                  <strong>
                    {detalle.rutaNombre ||
                      "—"}
                  </strong>
                </div>

                <div>
                  <span>
                    Fecha programada
                  </span>
                  <strong>
                    {fecha(
                      detalle.fechaProgramada
                    )}
                  </strong>
                </div>

              </section>


              <section className="entregas-preparation">

                <label>

                  <span>
                    Repartidor
                  </span>

                  <select
                    value={
                      formRepartidor
                    }
                    disabled={
                      detalle.confirmada
                    }
                    onChange={
                      (event) => {

                        setFormRepartidor(
                          event.target.value
                        );

                        marcarPreparacionSucia();

                      }
                    }
                  >
                    <option value="">
                      Seleccionar repartidor
                    </option>

                    {repartidores.map(
                      (repartidor) => (
                        <option
                          key={
                            repartidor._id
                          }
                          value={
                            repartidor._id
                          }
                        >
                          {nombreEmpleado(
                            repartidor
                          )}
                        </option>
                      )
                    )}
                  </select>

                </label>


                <label>

                  <span>
                    Tipo de pago
                  </span>

                  <select
                    value={
                      formMetodoPago
                    }
                    disabled={
                      detalle.confirmada
                    }
                    onChange={
                      (event) => {

                        setFormMetodoPago(
                          event.target.value
                        );

                        marcarPreparacionSucia();

                      }
                    }
                  >
                    <option value="">
                      Seleccionar
                    </option>

                    <option value="Efectivo">
                      Efectivo
                    </option>

                    <option value="Transferencia">
                      Transferencia
                    </option>

                    <option value="Crédito">
                      Crédito
                    </option>
                  </select>

                </label>

              </section>


              <section className="entregas-products entregas-products-v4">

                <div className="entregas-section-title">

                  <h3>
                    Productos ({
                      Array.isArray(
                        detalle.items
                      )
                        ? detalle.items.length
                        : 0
                    })
                  </h3>

                  <span>
                    Los productos por KG requieren peso real.
                  </span>

                </div>


                {Array.isArray(
                  detalle.items
                ) &&
                detalle.items.length >
                  0 ? (

                  <div className="entregas-products-v4-list">

                    {detalle.items.map(
                      (
                        item,
                        index
                      ) => {

                        const itemId =
                          `${String(
                            item._id ||
                            "sin-id"
                          )}-${index}`;

                        const pesoTemporal =
                          formPesos[
                            item._id
                          ];

                        const esPeso =
                          item.tipoVenta ===
                          "Peso";

                        const pesoNumero =
                          Number(
                            pesoTemporal
                          );

                        const pesoValido =
                          !esPeso ||
                          (
                            pesoTemporal !== "" &&
                            pesoTemporal !== undefined &&
                            pesoTemporal !== null &&
                            Number.isFinite(
                              pesoNumero
                            ) &&
                            pesoNumero > 0
                          );

                        const precioUnitario =
                          Number(
                            item.precioUnitario ??
                            item.precioAplicado ??
                            item.precioNormal ??
                            0
                          );

                        const subtotalVista =
                          esPeso
                            ? (
                                pesoValido
                                  ? pesoNumero *
                                    precioUnitario
                                  : 0
                              )
                            : Number(
                                item.subtotal ||
                                0
                              );

                        return (

                          <div
                            key={itemId}
                            className="entregas-product-v4-card"
                          >

                            <div className="entregas-product-v4-main">

                              <span className="entregas-product-v4-index">
                                {index + 1}
                              </span>

                              <div>

                                <strong>
                                  {item.nombre ||
                                    item.producto?.nombre ||
                                    "Producto"}
                                </strong>

                                <small>
                                  {item.presentacionNombre ||
                                    item.unidad ||
                                    ""}
                                </small>

                                {esPeso && (
                                  <em>
                                    Venta por KG
                                  </em>
                                )}

                              </div>

                            </div>


                            <div className="entregas-product-v4-data">

                              <div>
                                <span>
                                  Cantidad
                                </span>

                                <strong>
                                  {item.cantidadSolicitada ??
                                    item.cantidad ??
                                    1}
                                </strong>
                              </div>


                              <div>
                                <span>
                                  Precio
                                </span>

                                <strong>
                                  {moneda(
                                    precioUnitario
                                  )}
                                </strong>

                                {esPeso && (
                                  <small>
                                    por KG
                                  </small>
                                )}
                              </div>


                              <div>
                                <span>
                                  Peso real
                                </span>

                                {esPeso ? (

                                  <div className="entregas-weight-field entregas-weight-field-v4">

                                    <input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      placeholder="0.000"
                                      value={
                                        pesoTemporal ??
                                        ""
                                      }
                                      disabled={
                                        detalle.confirmada
                                      }
                                      onChange={
                                        (event) => {

                                          setFormPesos(
                                            (
                                              actual
                                            ) => ({
                                              ...actual,
                                              [item._id]:
                                                event.target.value,
                                            })
                                          );

                                          marcarPreparacionSucia();

                                        }
                                      }
                                    />

                                    <span>
                                      kg
                                    </span>

                                  </div>

                                ) : (

                                  <strong className="entregas-v4-no-aplica">
                                    No aplica
                                  </strong>

                                )}

                              </div>


                              <div>
                                <span>
                                  Subtotal
                                </span>

                                {esPeso &&
                                !pesoValido ? (

                                  <span className="entregas-weight-pending">
                                    Pendiente por pesar
                                  </span>

                                ) : (

                                  <strong className="entregas-v4-subtotal">
                                    {moneda(
                                      subtotalVista
                                    )}
                                  </strong>

                                )}

                              </div>

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                ) : (

                  <div className="entregas-products-v4-empty">

                    No hay productos cargados en esta entrega.

                  </div>

                )}

              </section>

              <section className="entregas-summary">

                <div>
                  <span>
                    Subtotal calculado
                  </span>
                  <strong>
                    {moneda(
                      resumenVista.subtotal
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Descuento
                  </span>
                  <strong>
                    {moneda(
                      detalle.descuento
                    )}
                  </strong>
                </div>

                <div className="entregas-summary-total">
                  <span>
                    Total calculado
                  </span>
                  <strong>
                    {moneda(
                      resumenVista.total
                    )}
                  </strong>
                </div>

                {!detalle.confirmada &&
                resumenVista
                  .pesosPendientes >
                  0 && (

                  <div className="entregas-summary-pending">
                    <span>
                      Pendiente
                    </span>
                    <strong>
                      {resumenVista
                        .pesosPendientes} producto(s) por pesar
                    </strong>
                  </div>

                )}

              </section>


              <label className="entregas-observations">

                <span>
                  Observaciones de entrega
                </span>

                <textarea
                  value={
                    formObservaciones
                  }
                  disabled={
                    detalle.confirmada
                  }
                  onChange={
                    (event) => {

                      setFormObservaciones(
                        event.target.value
                      );

                      marcarPreparacionSucia();

                    }
                  }
                  placeholder="Opcional"
                />

              </label>


              {detalle.confirmada &&
                detalle.fechaConfirmacion && (

                <div className="entregas-confirmed-note">

                  <span>
                    Confirmada
                  </span>

                  <strong>
                    {fechaHora(
                      detalle.fechaConfirmacion
                    )}
                  </strong>

                </div>

              )}


              {detalle.estado ===
                "Cancelado" &&
                detalle.motivoCancelacion && (

                <div className="entregas-cancelled-note">

                  <span>
                    Motivo de cancelación
                  </span>

                  <strong>
                    {detalle.motivoCancelacion}
                  </strong>

                </div>

              )}


              {detalle.estado ===
                "Entregado" && (

                <div className="entregas-delivered-note">

                  <span>
                    Entregado
                  </span>

                  <strong>
                    {fechaHora(
                      detalle.fechaEntregaReal
                    )}
                  </strong>

                </div>

              )}

            </div>


            <footer className="entregas-modal-footer">

              {!detalle.confirmada ? (

                <div className="entregas-before-confirm">

                  <div className="entregas-preparation-state">

                    <span>
                      Preparación
                    </span>

                    <strong>
                      {detalle.preparacionGuardada &&
                      !preparacionSucia
                        ? "Guardada · lista para confirmar"
                        : "Complete los datos y guarde"}
                    </strong>

                  </div>


                  <div className="entregas-footer-actions">

                    <button
                      type="button"
                      className="entregas-footer-icon-btn entregas-save-icon-btn"
                      data-tooltip={
                        procesando
                          ? "Guardando..."
                          : "Guardar"
                      }
                      aria-label={
                        procesando
                          ? "Guardando preparación"
                          : "Guardar preparación"
                      }
                      onClick={
                        guardarPreparacion
                      }
                      disabled={
                        procesando
                      }
                    >
                      <img
                        src={
                          guardarEntregaIcon
                        }
                        alt=""
                      />
                    </button>


                    {detalle.preparacionGuardada &&
                    !preparacionSucia && (

                      <button
                        type="button"
                        className="entregas-confirm"
                        onClick={
                          confirmarPreparacion
                        }
                        disabled={
                          procesando
                        }
                      >
                        Confirmar
                      </button>

                    )}


                  </div>

                </div>

              ) : (

                <div className="entregas-after-confirm">

                  <label className="entregas-state-control">

                    <span>
                      Estado
                    </span>

                    <EstadoSelect
                      value={
                        detalle.estado
                      }
                      options={
                        ESTADOS_CONFIRMADOS
                      }
                      disabled={
                        procesando ||
                        [
                          "Entregado",
                          "Cancelado",
                        ].includes(
                          detalle.estado
                        )
                      }
                      onChange={
                        cambiarEstado
                      }
                    />

                  </label>


                  <button
                    type="button"
                    className="entregas-footer-icon-btn entregas-close-icon-btn"
                    data-tooltip="Cerrar"
                    aria-label="Cerrar"
                    onClick={
                      cerrarDetalle
                    }
                    disabled={
                      procesando
                    }
                  >
                    <img
                      src={
                        cerrarEntregaIcon
                      }
                      alt=""
                    />
                  </button>

                </div>

              )}

            </footer>

          </section>

        </div>

      )}


      {modalCancelacion && (

        <div className="entregas-modal-overlay entregas-modal-overlay-top">

          <section className="entregas-cancel-modal">

            <header>
              <h3>
                Cancelar entrega
              </h3>
            </header>


            <div>

              <label>

                <span>
                  Motivo de cancelación *
                </span>

                <select
                  value={
                    motivoCancelacion
                  }
                  onChange={
                    (event) =>
                      setMotivoCancelacion(
                        event.target.value
                      )
                  }
                >
                  <option value="">
                    Seleccionar motivo
                  </option>

                  <option value="Cliente ausente">
                    Cliente ausente
                  </option>

                  <option value="Dirección incorrecta">
                    Dirección incorrecta
                  </option>

                  <option value="Cliente rechazó el pedido">
                    Cliente rechazó el pedido
                  </option>

                  <option value="Reprogramado">
                    Reprogramado
                  </option>

                  <option value="Otro">
                    Otro
                  </option>
                </select>

              </label>

            </div>


            <footer>

              <button
                type="button"
                onClick={() => {
                  setModalCancelacion(
                    false
                  );

                  setEntregaCancelacion(
                    null
                  );

                  setMotivoCancelacion(
                    ""
                  );
                }}
                disabled={
                  procesando
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="confirm"
                onClick={
                  confirmarCancelacion
                }
                disabled={
                  procesando
                }
              >
                Cancelar entrega
              </button>

            </footer>

          </section>

        </div>

      )}

    </section>

  );

}
