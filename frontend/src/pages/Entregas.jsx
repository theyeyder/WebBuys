import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import useAutoRefresh
  from "../hooks/useAutoRefresh.js";

import {
  useAuth,
} from "../context/AuthContext.jsx";

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
  listarProductos,
} from "../services/producto.service.js";

import {
  listarEntregas,
  obtenerEntrega,
  actualizarPreparacionEntrega,
  confirmarEntrega,
  cambiarEstadoEntrega,
  cambiarMetodoPagoEntrega,
  reabrirPreparacionEntrega,
  revertirEntregaFinalizada,
} from "../services/entrega.service.js";

import {
  imprimirEntrega,
  imprimirEntregasFiltradas,
} from "../utils/entrega.impresion.js";

import imprimirIcon
  from "../assets/icons/imprimir.webp";

import imprimirEntregaIcon
  from "../assets/icons/imprimir-pedido.webp";

import guardarEntregaIcon
  from "../assets/icons/guardar-entrega.webp";

import cerrarEntregaIcon
  from "../assets/icons/cerrar-entrega.webp";

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



function itemsFormularioDesdeEntrega(
  entrega
) {

  return (
    entrega?.items ||
    []
  ).map(
    (item) => ({
      key:
        item._id ||
        item.id,
      itemId:
        item._id ||
        item.id,
      nuevo: false,
      origen:
        item.origen ||
        "Pedido",
      productoId:
        item.producto?._id ||
        item.producto?.id ||
        item.productoId ||
        "",
      presentacionId:
        item.presentacion?._id ||
        item.presentacion?.id ||
        item.presentacionId ||
        "",
      nombre:
        item.nombre ||
        item.producto?.nombre ||
        "Producto",
      presentacionNombre:
        item.presentacionNombre ||
        item.presentacion?.nombre ||
        "",
      tipoVenta:
        item.tipoVenta ||
        "Unidad",
      unidad:
        item.unidad ||
        "",
      cantidadSolicitada:
        Number(
          item.cantidadSolicitada ||
          0
        ),
      cantidadReal:
        item.tipoVenta ===
        "Peso"
          ? ""
          : String(
              item.cantidadReal ??
              item.cantidadSolicitada ??
              1
            ),
      pesoReal:
        item.tipoVenta ===
        "Peso"
          ? String(
              item.pesoReal ??
              ""
            )
          : "",
      precioUnitario:
        Number(
          item.precioUnitario ??
          item.precioAplicado ??
          item.precioNormal ??
          0
        ),
    })
  );

}


export default function Entregas() {

  const {
    esAdministrador,
  } = useAuth();


  const [
    entregas,
    setEntregas,
  ] = useState([]);

  const [
    repartidores,
    setRepartidores,
  ] = useState([]);

  const [
    productos,
    setProductos,
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
    formItems,
    setFormItems,
  ] = useState([]);

  const [
    nuevoProductoId,
    setNuevoProductoId,
  ] = useState("");

  const [
    nuevaPresentacionId,
    setNuevaPresentacionId,
  ] = useState("");

  const [
    nuevaCantidad,
    setNuevaCantidad,
  ] = useState("1");

  const [
    nuevoPeso,
    setNuevoPeso,
  ] = useState("");

  const [
    modalReversion,
    setModalReversion,
  ] = useState(false);

  const [
    motivoReversion,
    setMotivoReversion,
  ] = useState("");

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


  async function cargarDatos(
    { silencioso = false } = {}
  ) {

    try {

      if (!silencioso) {
        setCargando(
          true
        );
      }

      const [
        dataEntregas,
        dataEmpleados,
        dataProductos,
      ] =
        await Promise.all([
          listarEntregas(),
          listarEmpleadosPedidos(),
          listarProductos(),
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


      const listaProductos =
        Array.isArray(
          dataProductos
        )
          ? dataProductos
          : dataProductos?.productos ||
            [];

      setProductos(
        listaProductos.filter(
          (producto) =>
            String(
              producto.estado ||
              ""
            )
              .trim()
              .toLowerCase() ===
              "activo"
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

      if (!silencioso) {
        setCargando(
          false
        );
      }

    }

  }


  useEffect(
    () => {
      cargarDatos();
    },
    []
  );


  useAutoRefresh(
    () =>
      cargarDatos({
        silencioso: true,
      }),
    {
      intervalMs: 10000,
    }
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

        let subtotal = 0;
        let pesosPendientes = 0;

        formItems.forEach(
          (item) => {

            const precio =
              Number(
                item.precioUnitario ||
                0
              );

            if (
              item.tipoVenta ===
              "Peso"
            ) {

              const peso =
                Number(
                  item.pesoReal
                );

              if (
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

            } else {

              const cantidad =
                Number(
                  item.cantidadReal
                );

              if (
                Number.isFinite(
                  cantidad
                ) &&
                cantidad > 0
              ) {

                subtotal +=
                  cantidad *
                  precio;

              }

            }

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
                detalle?.descuento ||
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
        formItems,
      ]
    );


  const productoNuevoSeleccionado =
    useMemo(
      () =>
        productos.find(
          (producto) =>
            String(
              producto._id ||
              producto.id
            ) ===
            String(
              nuevoProductoId
            )
        ) ||
        null,
      [
        productos,
        nuevoProductoId,
      ]
    );


  const presentacionesNuevoProducto =
    useMemo(
      () =>
        (
          productoNuevoSeleccionado
            ?.presentacionesAdicionales ||
          []
        ).filter(
          (presentacion) =>
            String(
              presentacion.estado ||
              ""
            )
              .trim()
              .toLowerCase() ===
            "activa"
        ),
      [
        productoNuevoSeleccionado,
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

      setFormItems(
        itemsFormularioDesdeEntrega(
          data
        )
      );

      setNuevoProductoId(
        ""
      );

      setNuevaPresentacionId(
        ""
      );

      setNuevaCantidad(
        "1"
      );

      setNuevoPeso(
        ""
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

    setFormItems(
      []
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


  function actualizarItemFormulario(
    key,
    campo,
    valor
  ) {

    setFormItems(
      (actual) =>
        actual.map(
          (item) =>
            item.key === key
              ? {
                  ...item,
                  [campo]:
                    valor,
                }
              : item
        )
    );

    marcarPreparacionSucia();

  }


  function quitarItemFormulario(
    key
  ) {

    setFormItems(
      (actual) =>
        actual.filter(
          (item) =>
            item.key !== key
        )
    );

    marcarPreparacionSucia();

  }


  function agregarProductoFormulario() {

    const producto =
      productoNuevoSeleccionado;

    if (!producto) {

      setMensaje(
        "Seleccione un producto."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    const presentacion =
      nuevaPresentacionId
        ? presentacionesNuevoProducto.find(
            (item) =>
              String(
                item._id ||
                item.id
              ) ===
              String(
                nuevaPresentacionId
              )
          )
        : null;

    const fuente =
      presentacion ||
      producto;

    const tipoVenta =
      fuente.tipoVenta ||
      producto.tipoVenta ||
      "Unidad";

    const cantidad =
      Number(
        nuevaCantidad
      );

    const peso =
      Number(
        nuevoPeso
      );


    if (
      tipoVenta !==
        "Peso" &&
      (
        !Number.isInteger(
          cantidad
        ) ||
        cantidad <= 0
      )
    ) {

      setMensaje(
        "La cantidad debe ser un entero mayor que cero."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    if (
      tipoVenta ===
        "Peso" &&
      (
        !Number.isFinite(
          peso
        ) ||
        peso <= 0
      )
    ) {

      setMensaje(
        "Registre el peso real del producto."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    const productoId =
      producto._id ||
      producto.id;

    const presentacionId =
      presentacion
        ? (
            presentacion._id ||
            presentacion.id
          )
        : "";

    const duplicado =
      formItems.some(
        (item) =>
          String(
            item.productoId
          ) ===
            String(
              productoId
            ) &&
          String(
            item.presentacionId ||
            ""
          ) ===
            String(
              presentacionId ||
              ""
            )
      );

    if (duplicado) {

      setMensaje(
        "Ese producto/presentación ya está en la entrega. Modifique su cantidad o peso."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const key =
      `nuevo-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    setFormItems(
      (actual) => [
        ...actual,
        {
          key,
          itemId: null,
          nuevo: true,
          origen: "Agregado",
          productoId,
          presentacionId,
          nombre:
            producto.nombre ||
            "Producto",
          presentacionNombre:
            presentacion?.nombre ||
            "",
          tipoVenta,
          unidad:
            fuente.unidad ||
            producto.unidad ||
            "",
          cantidadSolicitada: 0,
          cantidadReal:
            tipoVenta ===
              "Peso"
              ? ""
              : String(
                  cantidad
                ),
          pesoReal:
            tipoVenta ===
              "Peso"
              ? String(
                  peso
                )
              : "",
          precioUnitario:
            Number(
              fuente.precioVenta ||
              0
            ),
        },
      ]
    );

    setNuevoProductoId(
      ""
    );

    setNuevaPresentacionId(
      ""
    );

    setNuevaCantidad(
      "1"
    );

    setNuevoPeso(
      ""
    );

    marcarPreparacionSucia();

  }


  async function manejarCambioMetodoPago(
    nuevoMetodo
  ) {

    setFormMetodoPago(
      nuevoMetodo
    );


    if (
      !detalle?.confirmada
    ) {

      marcarPreparacionSucia();

      return;

    }


    if (
      ![
        "Pendiente",
        "En ruta",
      ].includes(
        detalle.estado
      )
    ) {
      return;
    }


    try {

      setProcesando(
        true
      );

      const respuesta =
        await cambiarMetodoPagoEntrega(
          detalle._id,
          nuevoMetodo
        );

      setDetalle(
        respuesta.entrega
      );

      setMensaje(
        respuesta.mensaje ||
        "Tipo de pago actualizado."
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos({
        silencioso: true,
      });


    } catch (error) {

      setFormMetodoPago(
        detalle.metodoPago ||
        ""
      );

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cambiar el tipo de pago."
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


  async function reabrirPreparacionActual() {

    if (!detalle) {
      return;
    }


    try {

      setProcesando(
        true
      );

      const respuesta =
        await reabrirPreparacionEntrega(
          detalle._id
        );

      const actualizada =
        respuesta.entrega;

      setDetalle(
        actualizada
      );

      setFormItems(
        itemsFormularioDesdeEntrega(
          actualizada
        )
      );

      setPreparacionSucia(
        false
      );

      setMensaje(
        respuesta.mensaje
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos({
        silencioso: true,
      });


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible reabrir la preparación."
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


  function abrirReversionEntrega() {

    setMotivoReversion(
      ""
    );

    setModalReversion(
      true
    );

  }


  async function confirmarReversionEntrega() {

    const motivo =
      motivoReversion.trim();

    if (
      !detalle ||
      motivo.length < 5
    ) {

      setMensaje(
        "Debe indicar un motivo de al menos 5 caracteres."
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
        await revertirEntregaFinalizada(
          detalle._id,
          motivo
        );

      const actualizada =
        respuesta.entrega;

      setDetalle(
        actualizada
      );

      setFormItems(
        itemsFormularioDesdeEntrega(
          actualizada
        )
      );

      setFormMetodoPago(
        actualizada.metodoPago ||
        ""
      );

      setModalReversion(
        false
      );

      setMotivoReversion(
        ""
      );

      setPreparacionSucia(
        false
      );

      setMensaje(
        respuesta.mensaje
      );

      setTipoMensaje(
        "success"
      );

      await cargarDatos({
        silencioso: true,
      });


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible revertir la entrega."
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


  async function guardarPreparacion() {

    if (!detalle) {
      return;
    }

    try {

      setProcesando(
        true
      );

      const items =
        formItems.map(
          (item) => ({
            itemId:
              item.nuevo
                ? undefined
                : item.itemId,
            nuevo:
              Boolean(
                item.nuevo
              ),
            producto:
              item.nuevo
                ? item.productoId
                : undefined,
            presentacion:
              item.nuevo
                ? (
                    item.presentacionId ||
                    null
                  )
                : undefined,
            cantidadReal:
              item.tipoVenta ===
              "Peso"
                ? undefined
                : item.cantidadReal,
            pesoReal:
              item.tipoVenta ===
              "Peso"
                ? item.pesoReal
                : undefined,
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

      setFormItems(
        itemsFormularioDesdeEntrega(
          actualizada
        )
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
                      procesando ||
                      [
                        "Entregado",
                        "Cancelado",
                      ].includes(
                        detalle.estado
                      )
                    }
                    onChange={
                      (event) =>
                        manejarCambioMetodoPago(
                          event.target.value
                        )
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

                  <div>
                    <h3>
                      Productos ({
                        formItems.length
                      })
                    </h3>

                    <span>
                      Puede ajustar cantidad, peso, quitar productos o agregar otros mientras esté Por preparar.
                    </span>
                  </div>

                  {!detalle.confirmada && (

                    <span className="entregas-editable-badge">
                      Edición habilitada
                    </span>

                  )}

                </div>


                {formItems.length > 0 ? (

                  <div className="entregas-products-v4-list">

                    {formItems.map(
                      (
                        item,
                        index
                      ) => {

                        const esPeso =
                          item.tipoVenta ===
                          "Peso";

                        const cantidad =
                          Number(
                            item.cantidadReal
                          );

                        const peso =
                          Number(
                            item.pesoReal
                          );

                        const precioUnitario =
                          Number(
                            item.precioUnitario ||
                            0
                          );

                        const valorReal =
                          esPeso
                            ? peso
                            : cantidad;

                        const valorValido =
                          Number.isFinite(
                            valorReal
                          ) &&
                          valorReal > 0;

                        const subtotalVista =
                          valorValido
                            ? valorReal *
                              precioUnitario
                            : 0;

                        return (

                          <div
                            key={
                              item.key
                            }
                            className="entregas-product-v4-card entregas-product-edit-card"
                          >

                            <div className="entregas-product-v4-main">

                              <span className="entregas-product-v4-index">
                                {index + 1}
                              </span>

                              <div>

                                <strong>
                                  {item.nombre}
                                </strong>

                                <small>
                                  {item.presentacionNombre ||
                                    item.unidad ||
                                    ""}
                                </small>

                                <div className="entregas-item-tags">

                                  {esPeso && (
                                    <em>
                                      Venta por peso
                                    </em>
                                  )}

                                  {item.origen ===
                                    "Agregado" && (
                                    <em className="entregas-added-tag">
                                      Agregado en Entrega
                                    </em>
                                  )}

                                </div>

                              </div>


                              {!detalle.confirmada && (

                                <button
                                  type="button"
                                  className="entregas-remove-product"
                                  onClick={() =>
                                    quitarItemFormulario(
                                      item.key
                                    )
                                  }
                                  disabled={
                                    procesando
                                  }
                                  title="Quitar producto de la entrega"
                                >
                                  Quitar
                                </button>

                              )}

                            </div>


                            <div className="entregas-product-v4-data">

                              <div>
                                <span>
                                  Solicitado
                                </span>

                                <strong>
                                  {item.cantidadSolicitada ||
                                    "—"}
                                </strong>
                              </div>


                              <div>
                                <span>
                                  {esPeso
                                    ? "Peso real"
                                    : "Cantidad real"}
                                </span>

                                {esPeso ? (

                                  <div className="entregas-weight-field entregas-weight-field-v4">

                                    <input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      placeholder="0.000"
                                      value={
                                        item.pesoReal
                                      }
                                      disabled={
                                        detalle.confirmada ||
                                        procesando
                                      }
                                      onChange={
                                        (event) =>
                                          actualizarItemFormulario(
                                            item.key,
                                            "pesoReal",
                                            event.target.value
                                          )
                                      }
                                    />

                                    <span>
                                      {item.unidad ||
                                        "kg"}
                                    </span>

                                  </div>

                                ) : (

                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    className="entregas-quantity-input"
                                    value={
                                      item.cantidadReal
                                    }
                                    disabled={
                                      detalle.confirmada ||
                                      procesando
                                    }
                                    onChange={
                                      (event) =>
                                        actualizarItemFormulario(
                                          item.key,
                                          "cantidadReal",
                                          event.target.value
                                        )
                                    }
                                  />

                                )}

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
                                    por {item.unidad ||
                                      "kg"}
                                  </small>
                                )}
                              </div>


                              <div>
                                <span>
                                  Subtotal
                                </span>

                                {!valorValido ? (

                                  <span className="entregas-weight-pending">
                                    Pendiente
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


                {!detalle.confirmada && (

                  <div className="entregas-add-product-panel">

                    <div className="entregas-add-product-title">

                      <div>
                        <strong>
                          Agregar producto
                        </strong>

                        <span>
                          El producto agregado también afectará inventario al confirmar/finalizar la entrega.
                        </span>
                      </div>

                    </div>


                    <div className="entregas-add-product-grid">

                      <label>

                        <span>
                          Producto
                        </span>

                        <select
                          value={
                            nuevoProductoId
                          }
                          onChange={
                            (event) => {

                              setNuevoProductoId(
                                event.target.value
                              );

                              setNuevaPresentacionId(
                                ""
                              );

                              setNuevaCantidad(
                                "1"
                              );

                              setNuevoPeso(
                                ""
                              );

                            }
                          }
                          disabled={
                            procesando
                          }
                        >
                          <option value="">
                            Seleccionar producto
                          </option>

                          {productos.map(
                            (producto) => (
                              <option
                                key={
                                  producto._id ||
                                  producto.id
                                }
                                value={
                                  producto._id ||
                                  producto.id
                                }
                              >
                                {producto.codigo
                                  ? `${producto.codigo} · `
                                  : ""}
                                {producto.nombre}
                              </option>
                            )
                          )}

                        </select>

                      </label>


                      <label>

                        <span>
                          Presentación
                        </span>

                        <select
                          value={
                            nuevaPresentacionId
                          }
                          onChange={
                            (event) => {

                              setNuevaPresentacionId(
                                event.target.value
                              );

                              setNuevaCantidad(
                                "1"
                              );

                              setNuevoPeso(
                                ""
                              );

                            }
                          }
                          disabled={
                            !productoNuevoSeleccionado ||
                            procesando
                          }
                        >
                          <option value="">
                            Principal
                          </option>

                          {presentacionesNuevoProducto.map(
                            (presentacion) => (
                              <option
                                key={
                                  presentacion._id ||
                                  presentacion.id
                                }
                                value={
                                  presentacion._id ||
                                  presentacion.id
                                }
                              >
                                {presentacion.nombre}
                              </option>
                            )
                          )}

                        </select>

                      </label>


                      {(
                        (
                          nuevaPresentacionId
                            ? presentacionesNuevoProducto.find(
                                (item) =>
                                  String(
                                    item._id ||
                                    item.id
                                  ) ===
                                  String(
                                    nuevaPresentacionId
                                  )
                              )
                            : productoNuevoSeleccionado
                        )?.tipoVenta ||
                        "Unidad"
                      ) === "Peso" ? (

                        <label>

                          <span>
                            Peso real
                          </span>

                          <input
                            type="number"
                            min="0.001"
                            step="0.001"
                            placeholder="0.000"
                            value={
                              nuevoPeso
                            }
                            onChange={
                              (event) =>
                                setNuevoPeso(
                                  event.target.value
                                )
                            }
                            disabled={
                              !productoNuevoSeleccionado ||
                              procesando
                            }
                          />

                        </label>

                      ) : (

                        <label>

                          <span>
                            Cantidad
                          </span>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={
                              nuevaCantidad
                            }
                            onChange={
                              (event) =>
                                setNuevaCantidad(
                                  event.target.value
                                )
                            }
                            disabled={
                              !productoNuevoSeleccionado ||
                              procesando
                            }
                          />

                        </label>

                      )}


                      <button
                        type="button"
                        className="entregas-add-product-btn"
                        onClick={
                          agregarProductoFormulario
                        }
                        disabled={
                          !productoNuevoSeleccionado ||
                          procesando
                        }
                      >
                        + Agregar
                      </button>

                    </div>

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


                  <div className="entregas-after-confirm-actions">

                    {[
                      "Pendiente",
                      "En ruta",
                    ].includes(
                      detalle.estado
                    ) && (

                      <button
                        type="button"
                        className="entregas-reopen-btn"
                        onClick={
                          reabrirPreparacionActual
                        }
                        disabled={
                          procesando
                        }
                      >
                        Reabrir preparación
                      </button>

                    )}


                    {esAdministrador &&
                    detalle.estado ===
                      "Entregado" && (

                      <button
                        type="button"
                        className="entregas-revert-btn"
                        onClick={
                          abrirReversionEntrega
                        }
                        disabled={
                          procesando
                        }
                      >
                        Revertir entrega
                      </button>

                    )}

                  </div>


                </div>

              )}

            </footer>

          </section>

        </div>

      )}


      {modalReversion &&
        detalle && (

        <div className="entregas-modal-overlay entregas-modal-overlay-top">

          <section className="entregas-cancel-modal entregas-revert-modal">

            <header>
              <h3>
                Revertir entrega
              </h3>
            </header>


            <div>

              <div className="entregas-revert-warning">

                <strong>
                  {detalle.pedidoCodigo}
                </strong>

                <p>
                  La entrega volverá a Por preparar. El inventario se devolverá automáticamente y el movimiento de Caja se anulará si la caja sigue abierta.
                </p>

                <small>
                  Si existe una factura vigente, pagos de Cartera o una Caja cerrada relacionada, el sistema bloqueará la reversión e indicará qué debe revertirse primero.
                </small>

              </div>


              <label>

                <span>
                  Motivo de reversión *
                </span>

                <textarea
                  rows="4"
                  value={
                    motivoReversion
                  }
                  onChange={
                    (event) =>
                      setMotivoReversion(
                        event.target.value
                      )
                  }
                  placeholder="Ejemplo: Se registró una cantidad incorrecta."
                  disabled={
                    procesando
                  }
                />

              </label>

            </div>


            <footer>

              <button
                type="button"
                className="entregas-cancel-back"
                onClick={() =>
                  setModalReversion(
                    false
                  )
                }
                disabled={
                  procesando
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="entregas-revert-confirm-btn"
                onClick={
                  confirmarReversionEntrega
                }
                disabled={
                  procesando ||
                  motivoReversion.trim()
                    .length < 5
                }
              >
                {procesando
                  ? "Revirtiendo..."
                  : "Revertir entrega"}
              </button>

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
