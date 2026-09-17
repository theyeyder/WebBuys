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
  listarClientes,
} from "../services/cliente.service.js";

import {
  listarUsuarios,
} from "../services/usuario.service.js";

import {
  listarProductos,
} from "../services/producto.service.js";

import {
  listarPedidos,
  crearPedido,
  actualizarPedido,
  cambiarEstadoPedido,
  eliminarPedido,
} from "../services/pedido.service.js";

import {
  imprimirPedido,
  imprimirPedidosFiltrados,
} from "../utils/pedido.impresion.js";
import "../styles/pedidos.css";


/* ICONOS */



import pedidosIcon
  from "../assets/icons/nuevo-pedido.png";

import buscarIcon
  from "../assets/icons/buscar.png";

import guardarIcon
  from "../assets/icons/guardar.png";

import editarIcon
  from "../assets/icons/editar-pedido.png";

import eliminarIcon
  from "../assets/icons/eliminar-pedido.png";

import imprimirIcon
  from "../assets/icons/imprimir.png";

import imprimirPedidoIcon
  from "../assets/icons/imprimir-pedido.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";


/* =========================================
   FORMULARIO INICIAL
========================================= */

const FORM_INICIAL = {
  cliente: "",
  empleado: "",
  metodoPago: "Efectivo",
  fechaEntrega: "",
  descuento: "",
  observaciones: "",
  items: [],
};


/* =========================================
   OPCIONES DEL CALENDARIO
========================================= */

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

const ANIOS_CALENDARIO = Array.from(
  { length: 101 },
  (_, index) => 2000 + index
);


/* =========================================
   FORMATEAR MONEDA
========================================= */

function moneda(valor) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(valor || 0)
  );

}


/* =========================================
   CALCULAR PRECIO EN PANTALLA
========================================= */

function calcularPrecioVista(
  precioVenta,
  reglasPrecio,
  cantidad
) {

  const precioNormal =
    Number(
      precioVenta || 0
    );

  const cantidadNumero =
    Number(
      cantidad || 0
    );


  if (
    !Array.isArray(reglasPrecio) ||
    reglasPrecio.length === 0
  ) {

    return {
      precioNormal,
      precioAplicado:
        precioNormal,
      reglaAplicada:
        null,
    };

  }


  const reglasValidas =
    [...reglasPrecio]
      .filter(
        (regla) =>
          Number(regla.desde) <=
          cantidadNumero
      )
      .sort(
        (a, b) =>
          Number(b.desde) -
          Number(a.desde)
      );


  const reglaAplicada =
    reglasValidas[0] ||
    null;


  return {

    precioNormal,

    precioAplicado:
      reglaAplicada
        ? Number(
          reglaAplicada.precio
        )
        : precioNormal,

    reglaAplicada,

  };

}


/* =========================================
   COMPONENTE
========================================= */

export default function Pedidos() {

  const [
    pedidos,
    setPedidos,
  ] = useState([]);


  const [
    clientes,
    setClientes,
  ] = useState([]);


  const [
    empleados,
    setEmpleados,
  ] = useState([]);


  const [
    productos,
    setProductos,
  ] = useState([]);


  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL
  );


  const [
    pedidoSeleccionado,
    setPedidoSeleccionado,
  ] = useState(null);


  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);


  const [
    modalPedido,
    setModalPedido,
  ] = useState(false);


  const [
    modalBuscar,
    setModalBuscar,
  ] = useState(false);


  const [
    filtro,
    setFiltro,
  ] = useState("");


  const [
    fechaDesdeBusqueda,
    setFechaDesdeBusqueda,
  ] = useState("");


  const [
    fechaHastaBusqueda,
    setFechaHastaBusqueda,
  ] = useState("");


  /* =========================================
     CALENDARIO COMPACTO DE BÚSQUEDA
     Estilo basado en Auditoría
  ========================================= */

  const [
    calendarioBusquedaAbierto,
    setCalendarioBusquedaAbierto,
  ] = useState(null);

  const [
    mesCalendarioBusqueda,
    setMesCalendarioBusqueda,
  ] = useState(new Date());

  const [
    fechaTemporalDesdeBusqueda,
    setFechaTemporalDesdeBusqueda,
  ] = useState("");

  const [
    fechaTemporalHastaBusqueda,
    setFechaTemporalHastaBusqueda,
  ] = useState("");

  const [
    fechaTemporalEntrega,
    setFechaTemporalEntrega,
  ] = useState("");


  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("Todos");


  const [
    filtroPago,
    setFiltroPago,
  ] = useState("Todos");


  const [
    filtroClienteAsignado,
    setFiltroClienteAsignado,
  ] = useState("Todos");


  const [
    filtroRuta,
    setFiltroRuta,
  ] = useState("Todas");


  const [
    buscarCliente,
    setBuscarCliente,
  ] = useState("");


  const [
    buscarProducto,
    setBuscarProducto,
  ] = useState("");


  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState("");


  const [
    productoTexto,
    setProductoTexto,
  ] = useState("");


  const [
    presentacionSeleccionada,
    setPresentacionSeleccionada,
  ] = useState("");


  const [
    cantidad,
    setCantidad,
  ] = useState("1");


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    guardando,
    setGuardando,
  ] = useState(false);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState("info");


  /* =========================================
     VISTA DE PEDIDOS
     TARJETAS / LISTA
  ========================================= */

  const [
    vistaPedidos,
    setVistaPedidos,
  ] = useState(
    () =>
      localStorage.getItem(
        "webbuys-vista-pedidos"
      ) || "tarjetas"
  );


  /* =========================================
     CAMBIAR VISTA
  ========================================= */

  function cambiarVistaPedidos(
    vista
  ) {

    setVistaPedidos(
      vista
    );

    localStorage.setItem(
      "webbuys-vista-pedidos",
      vista
    );

    setPedidoSeleccionado(
      null
    );

  }


  /* =========================================
     MOVER VENTANA NUEVO PEDIDO
  ========================================= */

  const modalPedidoRef = useRef(null);

  const [posicionModalPedido, setPosicionModalPedido] = useState({
    x: 0,
    y: 0,
  });

  const arrastrePedidoRef = useRef({
    activo: false,
    offsetX: 0,
    offsetY: 0,
  });


  /* =========================================
     ARRASTRAR VENTANA NUEVO PEDIDO
  ========================================= */

  function iniciarArrastrePedido(event) {

    // No arrastrar si se presiona un botón
    if (event.target.closest("button")) {
      return;
    }

    const modal = modalPedidoRef.current;

    if (!modal) {
      return;
    }

    const rect =
      modal.getBoundingClientRect();

    arrastrePedidoRef.current = {
      activo: true,
      offsetX:
        event.clientX -
        rect.left,
      offsetY:
        event.clientY -
        rect.top,
    };

    setPosicionModalPedido({
      x: rect.left,
      y: rect.top,
    });

    document.addEventListener(
      "mousemove",
      moverModalPedido
    );

    document.addEventListener(
      "mouseup",
      terminarArrastrePedido
    );
  }


  function moverModalPedido(event) {

    if (
      !arrastrePedidoRef
        .current
        .activo
    ) {
      return;
    }

    const modal =
      modalPedidoRef.current;

    if (!modal) {
      return;
    }

    const ancho =
      modal.offsetWidth;

    const alto =
      modal.offsetHeight;

    let x =
      event.clientX -
      arrastrePedidoRef
        .current
        .offsetX;

    let y =
      event.clientY -
      arrastrePedidoRef
        .current
        .offsetY;


    /* NO DEJAR QUE SE PIERDA
       FUERA DE LA PANTALLA */

    x = Math.max(
      8,
      Math.min(
        window.innerWidth -
        ancho -
        8,
        x
      )
    );

    y = Math.max(
      8,
      Math.min(
        window.innerHeight -
        alto -
        8,
        y
      )
    );


    setPosicionModalPedido({
      x,
      y,
    });
  }


  function terminarArrastrePedido() {

    arrastrePedidoRef.current.activo =
      false;

    document.removeEventListener(
      "mousemove",
      moverModalPedido
    );

    document.removeEventListener(
      "mouseup",
      terminarArrastrePedido
    );
  }


  /* =========================================
     CARGAR PRODUCTOS PARA NUEVO PEDIDO
  ========================================= */

  async function cargarProductosPedido() {

    try {

      const data =
        await listarProductos();


      console.log(
        "PRODUCTOS RECIBIDOS:",
        data
      );


      let lista = [];


      if (Array.isArray(data)) {

        lista = data;

      } else if (
        Array.isArray(data?.productos)
      ) {

        lista =
          data.productos;

      } else if (
        Array.isArray(data?.data)
      ) {

        lista =
          data.data;

      } else if (
        Array.isArray(
          data?.data?.productos
        )
      ) {

        lista =
          data.data.productos;

      }


      console.log(
        "LISTA PRODUCTOS:",
        lista
      );


      const activos =
        lista.filter(
          (producto) => {

            const estado =
              String(
                producto.estado ?? ""
              )
                .trim()
                .toLowerCase();


            return (
              estado !== "inactivo" &&
              estado !== "false"
            );

          }
        );


      setProductos(
        activos
      );


      return activos;


    } catch (error) {

      console.error(
        "ERROR CARGANDO PRODUCTOS:",
        error
      );


      setProductos(
        []
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar los productos."
      );


      setTipoMensaje(
        "error"
      );


      return [];

    }

  }


  /* =========================================
     CARGAR EMPLEADOS
  ========================================= */

  async function cargarEmpleados() {

    try {

      const data =
        await listarUsuarios();

      const lista =
        Array.isArray(data)
          ? data
          : data?.usuarios ||
          data?.data ||
          [];


      const empleadosActivos =
        lista.filter(
          (usuario) =>
            usuario.rol === "Empleado" &&
            !usuario.bloqueado
        );


      setEmpleados(
        empleadosActivos
      );

    } catch (error) {

      console.error(
        "Error cargando empleados:",
        error
      );

      setEmpleados([]);

    }

  }


  /* =========================================
     CARGAR TODO
  ========================================= */

  async function cargarTodo() {

    try {

      setCargando(true);


      const [
        dataPedidos,
        dataClientes,
        dataProductos,
      ] =
        await Promise.all([

          listarPedidos(),

          listarClientes(),

          listarProductos(),

        ]);


      setPedidos(
        Array.isArray(
          dataPedidos
        )
          ? dataPedidos
          : dataPedidos?.pedidos ||
          dataPedidos?.data ||
          []
      );


      setClientes(
        (
          Array.isArray(
            dataClientes
          )
            ? dataClientes
            : dataClientes?.clientes ||
            dataClientes?.data ||
            []
        ).filter(
          (cliente) =>
            cliente.estado !== false
        )
      );


      const listaProductos =
        Array.isArray(dataProductos)
          ? dataProductos
          : dataProductos?.productos ||
          dataProductos?.data ||
          [];


      setProductos(
        listaProductos.filter(
          (producto) =>
            producto.estado !== "Inactivo" &&
            producto.estado !== false
        )
      );


    } catch (error) {

      console.error(
        error
      );

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar el módulo de pedidos."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setCargando(false);

    }

  }


  useEffect(() => {

    cargarTodo();
    cargarEmpleados();

  }, []);


  /* =========================================
     OCULTAR TOAST
  ========================================= */

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
      clearTimeout(timer);

  }, [mensaje]);


  /* =========================================
     CLIENTES FILTRADOS
  ========================================= */

  const clientesFiltrados =
    useMemo(() => {

      const texto =
        buscarCliente
          .trim()
          .toLowerCase();


      if (!texto) {

        return clientes.slice(
          0,
          10
        );

      }


      return clientes
        .filter(
          (cliente) => {

            const valores = [
              cliente.codigo,
              cliente.nombre,
              cliente.razonSocial,
              cliente.telefono,
              cliente.direccion,
              cliente.barrio,
              cliente.ciudad,
              cliente.tipoCliente,
            ];


            return valores.some(
              (valor) =>
                String(
                  valor || ""
                )
                  .toLowerCase()
                  .includes(
                    texto
                  )
            );

          }
        )
        .slice(
          0,
          10
        );

    }, [
      clientes,
      buscarCliente,
    ]);


  /* =========================================
     PRODUCTOS FILTRADOS
  ========================================= */

  const productosFiltrados =
    useMemo(() => {

      const texto =
        buscarProducto
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          );


      if (!texto) {

        return [];

      }


      return productos.filter(
        (producto) => {

          const categoria =
            typeof producto.categoria ===
              "object"
              ? producto.categoria
                ?.nombre
              : producto.categoria;


          const valores = [

            producto.codigo,

            producto.nombre,

            producto.marca,

            categoria,

            producto.descripcion,

            producto.unidad,

            producto.tipoVenta,

          ];


          const presentaciones =
            (
              producto
                .presentacionesAdicionales ||
              []
            )
              .map(
                (presentacion) =>
                  presentacion.nombre
              );


          const contenido =
            [
              ...valores,
              ...presentaciones,
            ]
              .map(
                (valor) =>
                  String(
                    valor || ""
                  )
                    .toLowerCase()
                    .normalize(
                      "NFD"
                    )
                    .replace(
                      /[\u0300-\u036f]/g,
                      ""
                    )
              )
              .join(" ");


          return contenido.includes(
            texto
          );

        }
      );

    }, [
      productos,
      buscarProducto,
    ]);


  /* =========================================
     SELECCIONAR PRODUCTO BUSCADO
  ========================================= */

  function seleccionarProductoBuscado(
    producto
  ) {

    setProductoSeleccionado(
      producto._id
    );

    setProductoTexto(
      producto.nombre || ""
    );

    setBuscarProducto(
      ""
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
    );

  }


  /* =========================================
     ESCRIBIR PRODUCTO MANUALMENTE
  ========================================= */

  function escribirProductoManual(
    event
  ) {

    const valor =
      event.target.value;

    setProductoTexto(
      valor
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
    );

    const texto =
      valor
        .trim()
        .toLowerCase();

    if (!texto) {

      setProductoSeleccionado(
        ""
      );

      return;

    }

    const productoEncontrado =
      productos.find(
        (producto) => {

          const nombre =
            String(
              producto.nombre || ""
            )
              .trim()
              .toLowerCase();

          const codigo =
            String(
              producto.codigo || ""
            )
              .trim()
              .toLowerCase();

          return (
            nombre === texto ||
            codigo === texto
          );

        }
      );

    setProductoSeleccionado(
      productoEncontrado?._id ||
      ""
    );

  }


  /* =========================================
     PRODUCTO ACTUAL
  ========================================= */

  const productoActual =
    useMemo(
      () =>
        productos.find(
          (producto) =>
            producto._id ===
            productoSeleccionado
        ) || null,

      [
        productos,
        productoSeleccionado,
      ]
    );


  /* =========================================
     PRESENTACIÓN ACTUAL
  ========================================= */

  const presentacionActual =
    useMemo(() => {

      if (
        !productoActual ||
        !presentacionSeleccionada
      ) {

        return null;

      }


      return (
        productoActual
          .presentacionesAdicionales
          ?.find(
            (presentacion) =>
              presentacion._id ===
              presentacionSeleccionada
          ) ||
        null
      );

    }, [
      productoActual,
      presentacionSeleccionada,
    ]);


  /* =========================================
     PRECIO PREVIO
  ========================================= */

  const precioVista =
    useMemo(() => {

      if (!productoActual) {

        return {
          precioNormal: 0,
          precioAplicado: 0,
          reglaAplicada: null,
        };

      }


      const origen =
        presentacionActual ||
        productoActual;


      return calcularPrecioVista(

        origen.precioVenta,

        origen.reglasPrecio,

        cantidad

      );

    }, [
      productoActual,
      presentacionActual,
      cantidad,
    ]);


  /* =========================================
     TOTALES DEL FORMULARIO
  ========================================= */

  const subtotalFormulario =
    useMemo(
      () =>
        form.items.reduce(
          (
            acumulado,
            item
          ) =>
            acumulado +
            Number(
              item.subtotal || 0
            ),
          0
        ),

      [form.items]
    );


  const descuentoNumero =
    Number(
      form.descuento ||
      0
    );


  const totalFormulario =
    Math.max(
      0,
      subtotalFormulario -
      descuentoNumero
    );


  /* =========================================
     NUEVO PEDIDO
  ========================================= */

  async function nuevoPedido() {

    setModoEdicion(
      false
    );


    setPedidoSeleccionado(
      null
    );


    setForm(
      FORM_INICIAL
    );


    setProductoSeleccionado(
      ""
    );


    setProductoTexto(
      ""
    );


    setPresentacionSeleccionada(
      ""
    );


    setCantidad(
      "1"
    );


    setBuscarCliente(
      ""
    );


    setBuscarProducto(
      ""
    );


    /* =============================
       VOLVER A CARGAR PRODUCTOS
    ============================= */

    const productosCargados =
      await cargarProductosPedido();


    console.log(
      "PRODUCTOS DISPONIBLES EN PEDIDO:",
      productosCargados.length
    );


    setPosicionModalPedido({

      x: Math.max(
        10,
        (
          window.innerWidth -
          900
        ) / 2
      ),

      y: Math.max(
        10,
        window.innerHeight *
        0.07
      ),

    });


    setModalPedido(
      true
    );

  }


  /* =========================================
     CERRAR MODAL
  ========================================= */

  function cerrarModalPedido() {

    if (guardando) {
      return;
    }

    setModalPedido(
      false
    );

  }


  /* =========================================
     SELECCIONAR CLIENTE
  ========================================= */

  function seleccionarCliente(
    cliente
  ) {

    setForm(
      (actual) => ({
        ...actual,
        cliente:
          cliente._id,
      })
    );

    setBuscarCliente(
      cliente.nombre
    );

  }


  /* =========================================
     AGREGAR PRODUCTO
  ========================================= */

  function agregarProducto() {

    if (!productoActual) {

      setMensaje(
        "Seleccione un producto."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const cantidadNumero =
      Number(
        cantidad
      );


    if (
      !Number.isFinite(
        cantidadNumero
      ) ||
      cantidadNumero <= 0
    ) {

      setMensaje(
        "Ingrese una cantidad válida."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    const origen =
      presentacionActual ||
      productoActual;


    const tipoVenta =
      origen.tipoVenta ||
      productoActual.tipoVenta;


    const unidad =
      origen.unidad ||
      productoActual.unidad;


    if (
      tipoVenta === "Unidad" &&
      !Number.isInteger(
        cantidadNumero
      )
    ) {

      setMensaje(
        "Los productos vendidos por unidad deben llevar una cantidad entera."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    const subtotal =
      Number(
        (
          cantidadNumero *
          precioVista.precioAplicado
        ).toFixed(2)
      );


    const nuevoItem = {

      temporalId:
        `${productoActual._id}-${presentacionSeleccionada || "principal"}-${Date.now()}`,

      producto:
        productoActual._id,

      codigo:
        productoActual.codigo,

      nombre:
        productoActual.nombre,

      marca:
        productoActual.marca ||
        "",

      presentacionId:
        presentacionSeleccionada ||
        null,

      presentacionNombre:
        presentacionActual?.nombre ||
        "",

      tipoVenta,

      unidad,

      cantidad:
        cantidadNumero,

      precioNormal:
        precioVista.precioNormal,

      precioAplicado:
        precioVista.precioAplicado,

      reglaAplicadaDesde:
        precioVista
          .reglaAplicada
          ?.desde ??
        null,

      subtotal,

    };


    setForm(
      (actual) => ({
        ...actual,

        items: [
          ...actual.items,
          nuevoItem,
        ],

      })
    );


    setProductoSeleccionado(
      ""
    );

    setProductoTexto(
      ""
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
    );

    setBuscarProducto(
      ""
    );

  }


  /* =========================================
     ELIMINAR ITEM
  ========================================= */

  function quitarItem(
    temporalId
  ) {

    setForm(
      (actual) => ({
        ...actual,

        items:
          actual.items.filter(
            (item) =>
              item.temporalId !==
              temporalId
          ),

      })
    );

  }


  /* =========================================
     GUARDAR PEDIDO
  ========================================= */

  async function guardarPedido() {

    if (
      form.items.length === 0
    ) {

      setMensaje(
        "Agregue al menos un producto al pedido."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    if (
      descuentoNumero < 0 ||
      descuentoNumero >
      subtotalFormulario
    ) {

      setMensaje(
        "El descuento no es válido."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    try {

      setGuardando(
        true
      );


      /*
       * IMPORTANTE:
       * solo enviamos producto,
       * presentación y cantidad.
       *
       * El backend vuelve a calcular
       * precios y subtotales.
       */

      const datos = {

        cliente:
          form.cliente ||
          null,

        empleado:
          form.empleado ||
          null,

        metodoPago:
          form.metodoPago,

        fechaEntrega:
          form.fechaEntrega ||
          null,

        descuento:
          descuentoNumero,

        observaciones:
          form.observaciones.trim(),

        items:
          form.items.map(
            (item) => ({

              producto:
                item.producto,

              presentacionId:
                item.presentacionId ||
                null,

              cantidad:
                Number(
                  item.cantidad
                ),

            })
          ),

      };


      if (
        modoEdicion &&
        pedidoSeleccionado?._id
      ) {

        await actualizarPedido(

          pedidoSeleccionado._id,

          datos

        );


        setMensaje(
          form.cliente
            ? "Pedido actualizado correctamente."
            : "Borrador actualizado sin cliente."
        );

      } else {

        await crearPedido(
          datos
        );


        setMensaje(
          form.cliente
            ? "Pedido guardado como borrador. Ya puedes confirmarlo."
            : "Pedido guardado como borrador sin cliente."
        );

      }


      setTipoMensaje(
        "success"
      );


      setModalPedido(
        false
      );


      setPedidoSeleccionado(
        null
      );


      setModoEdicion(
        false
      );


      setForm(
        FORM_INICIAL
      );


      await cargarTodo();


    } catch (error) {

      console.error(
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible guardar el pedido."
      );


      setTipoMensaje(
        "error"
      );


    } finally {

      setGuardando(
        false
      );

    }

  }


  /* =========================================
     SELECCIONAR PEDIDO
  ========================================= */

  function seleccionarPedido(
    pedido
  ) {

    setPedidoSeleccionado(
      pedido
    );

  }


  /* =========================================
     ABRIR PEDIDO DESDE TARJETA
  ========================================= */

  function abrirPedido(
    pedido
  ) {

    if (!pedido) {
      return;
    }


    setPedidoSeleccionado(
      pedido
    );


    /* PEDIDOS CERRADOS:
       SOLO LOS SELECCIONAMOS */

    if (
      [
        "Entregado",
        "Cancelado",
      ].includes(
        pedido.estado
      )
    ) {

      setMensaje(
        `El pedido ${pedido.codigo} está ${pedido.estado.toLowerCase()} y no se puede editar.`
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const cliente =
      pedido.cliente;


    setForm({

      cliente:
        cliente?._id ||
        cliente ||
        "",

      empleado:
        pedido.empleado?._id ||
        pedido.empleado ||
        "",

      metodoPago:
        pedido.metodoPago ||
        "Efectivo",

      fechaEntrega:
        pedido.fechaEntrega
          ? String(
            pedido.fechaEntrega
          ).slice(
            0,
            10
          )
          : "",

      descuento:
        pedido.descuento ||
        "",

      observaciones:
        pedido.observaciones ||
        "",

      items:
        (
          pedido.items ||
          []
        ).map(
          (
            item,
            index
          ) => ({

            temporalId:
              item._id ||
              `${Date.now()}-${index}`,

            producto:
              item.producto?._id ||
              item.producto,

            codigo:
              item.codigoProducto ||
              item.producto?.codigo ||
              "",

            nombre:
              item.nombre,

            marca:
              item.marca ||
              item.producto?.marca ||
              "",

            presentacionId:
              item.presentacionId ||
              null,

            presentacionNombre:
              item.presentacionNombre ||
              "",

            tipoVenta:
              item.tipoVenta,

            unidad:
              item.unidad,

            cantidad:
              item.cantidad,

            precioNormal:
              item.precioNormal,

            precioAplicado:
              item.precioAplicado,

            reglaAplicadaDesde:
              item.reglaAplicadaDesde,

            subtotal:
              item.subtotal,

          })
        ),

    });


    setBuscarCliente(
      cliente?.nombre ||
      ""
    );


    setProductoSeleccionado(
      ""
    );

    setProductoTexto(
      ""
    );

    setBuscarProducto(
      ""
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
    );


    setModoEdicion(
      true
    );


    /* CENTRAR VENTANA */

    const anchoEstimado =
      Math.min(
        900,
        window.innerWidth - 16
      );


    setPosicionModalPedido({

      x: Math.max(
        8,
        (
          window.innerWidth -
          anchoEstimado
        ) / 2
      ),

      y: Math.max(
        8,
        window.innerHeight *
        0.05
      ),

    });


    setModalPedido(
      true
    );

  }


  /* =========================================
     EDITAR PEDIDO
  ========================================= */

  function editarPedidoSeleccionado() {

    if (
      !pedidoSeleccionado
    ) {

      setMensaje(
        "Seleccione primero un pedido."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    if (
      [
        "Entregado",
        "Cancelado",
      ].includes(
        pedidoSeleccionado.estado
      )
    ) {

      setMensaje(
        "Los pedidos entregados o cancelados no se pueden editar."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const cliente =
      pedidoSeleccionado.cliente;


    setForm({

      cliente:
        cliente?._id ||
        cliente ||
        "",

      empleado:
        pedidoSeleccionado.empleado?._id ||
        pedidoSeleccionado.empleado ||
        "",

      metodoPago:
        pedidoSeleccionado.metodoPago ||
        "Efectivo",

      fechaEntrega:
        pedidoSeleccionado
          .fechaEntrega
          ? String(
            pedidoSeleccionado
              .fechaEntrega
          ).slice(
            0,
            10
          )
          : "",

      descuento:
        pedidoSeleccionado
          .descuento ||
        "",

      observaciones:
        pedidoSeleccionado
          .observaciones ||
        "",

      items:
        (
          pedidoSeleccionado
            .items ||
          []
        ).map(
          (
            item,
            index
          ) => ({

            temporalId:
              item._id ||
              `${Date.now()}-${index}`,

            producto:
              item.producto
                ?._id ||
              item.producto,

            codigo:
              item.codigoProducto ||
              item.producto?.codigo ||
              "",

            nombre:
              item.nombre,

            marca:
              item.marca ||
              item.producto?.marca ||
              "",

            presentacionId:
              item.presentacionId ||
              null,

            presentacionNombre:
              item.presentacionNombre ||
              "",

            tipoVenta:
              item.tipoVenta,

            unidad:
              item.unidad,

            cantidad:
              item.cantidad,

            precioNormal:
              item.precioNormal,

            precioAplicado:
              item.precioAplicado,

            reglaAplicadaDesde:
              item.reglaAplicadaDesde,

            subtotal:
              item.subtotal,

          })
        ),

    });


    setBuscarCliente(
      cliente?.nombre ||
      ""
    );

    setProductoSeleccionado(
      ""
    );

    setProductoTexto(
      ""
    );

    setBuscarProducto(
      ""
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
    );

    setModoEdicion(
      true
    );


    setModalPedido(
      true
    );

  }


  /* =========================================
     ELIMINAR PEDIDO
  ========================================= */

  async function eliminarPedidoSeleccionado() {

    if (
      !pedidoSeleccionado
    ) {

      setMensaje(
        "Seleccione primero un pedido."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    if (
      pedidoSeleccionado.estado ===
      "Entregado"
    ) {

      setMensaje(
        "Un pedido entregado no se puede eliminar."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const confirmar =
      window.confirm(
        `¿Deseas eliminar el pedido ${pedidoSeleccionado.codigo}?`
      );


    if (!confirmar) {
      return;
    }


    try {

      await eliminarPedido(
        pedidoSeleccionado._id
      );


      setPedidoSeleccionado(
        null
      );


      setMensaje(
        "Pedido eliminado correctamente."
      );

      setTipoMensaje(
        "success"
      );


      await cargarTodo();


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible eliminar el pedido."
      );

      setTipoMensaje(
        "error"
      );

    }

  }


  /* =========================================
     ASIGNAR CLIENTE A BORRADOR
  ========================================= */

  function asignarClientePedido(
    pedido
  ) {

    setPedidoSeleccionado(
      pedido
    );

    abrirPedido(
      pedido
    );

    setMensaje(
      "Selecciona un cliente y guarda el pedido."
    );

    setTipoMensaje(
      "info"
    );

  }


  /* =========================================
     CONFIRMAR PEDIDO
  ========================================= */

  async function confirmarPedido(
    pedido
  ) {

    const tieneCliente =
      Boolean(
        pedido.cliente?._id ||
        pedido.cliente ||
        pedido.clienteNombre
      );


    if (!tieneCliente) {

      setMensaje(
        "Debes asignar un cliente antes de confirmar el pedido."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    await cambiarEstado(
      pedido,
      "Pendiente"
    );

  }


  /* =========================================
     CAMBIAR ESTADO
  ========================================= */

  async function cambiarEstado(
    pedido,
    estado
  ) {

    try {

      await cambiarEstadoPedido(
        pedido._id,
        estado
      );


      setMensaje(
        `Pedido cambiado a "${estado}".`
      );

      setTipoMensaje(
        "success"
      );


      await cargarTodo();


    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cambiar el estado."
      );

      setTipoMensaje(
        "error"
      );

    }

  }


  /* =========================================
     RUTAS DISPONIBLES PARA FILTRAR
  ========================================= */

  const rutasDisponibles =
    useMemo(() => {

      return Array.from(
        new Set(
          pedidos
            .map(
              (pedido) =>
                pedido.rutaNombre ||
                pedido.ruta?.nombre ||
                ""
            )
            .filter(Boolean)
        )
      ).sort(
        (a, b) =>
          a.localeCompare(
            b,
            "es"
          )
      );

    }, [pedidos]);


  /* =========================================
     PEDIDOS FILTRADOS
     TEXTO + RANGO DE FECHAS
  ========================================= */

  const pedidosFiltrados =
    useMemo(() => {

      const texto =
        filtro
          .trim()
          .toLowerCase();


      return pedidos.filter(
        (pedido) => {

          /* =============================
             FILTRO POR TEXTO
          ============================= */

          const cliente =
            pedido.cliente ||
            {};


          const coincideTexto =
            !texto ||
            [
              pedido.codigo,
              pedido.clienteCodigo,
              pedido.clienteNombre,
              pedido.clienteRazonSocial,
              pedido.clienteTelefono,
              pedido.clienteDireccion,
              pedido.clienteBarrio,
              pedido.clienteCiudad,
              pedido.clienteTipo,
              pedido.zonaDespachoCodigo,
              pedido.zonaDespachoNombre,
              pedido.rutaCodigo,
              pedido.rutaNombre,
              cliente.codigo,
              cliente.nombre,
              cliente.razonSocial,
              cliente.telefono,
              cliente.direccion,
              cliente.barrio,
              cliente.ciudad,
              cliente.tipoCliente,
              pedido.estado,
              pedido.total,
            ].some(
              (valor) =>
                String(
                  valor || ""
                )
                  .toLowerCase()
                  .includes(
                    texto
                  )
            );


          if (!coincideTexto) {
            return false;
          }


          /* =============================
             FILTRO POR ESTADO
          ============================= */

          if (
            filtroEstado !== "Todos" &&
            pedido.estado !== filtroEstado
          ) {
            return false;
          }


          /* =============================
             FILTRO POR TIPO DE PAGO
          ============================= */

          if (
            filtroPago !== "Todos" &&
            pedido.metodoPago !== filtroPago
          ) {
            return false;
          }


          /* =============================
             CON / SIN CLIENTE
          ============================= */

          const tieneCliente =
            Boolean(
              pedido.cliente?._id ||
              pedido.cliente ||
              pedido.clienteNombre
            );


          if (
            filtroClienteAsignado === "Con cliente" &&
            !tieneCliente
          ) {
            return false;
          }


          if (
            filtroClienteAsignado === "Sin cliente" &&
            tieneCliente
          ) {
            return false;
          }


          /* =============================
             FILTRO POR RUTA
          ============================= */

          const rutaPedido =
            pedido.rutaNombre ||
            pedido.ruta?.nombre ||
            "";


          if (
            filtroRuta !== "Todas" &&
            rutaPedido !== filtroRuta
          ) {
            return false;
          }


          /* =============================
             FECHA DEL PEDIDO
          ============================= */

          if (!pedido.createdAt) {
            return (
              !fechaDesdeBusqueda &&
              !fechaHastaBusqueda
            );
          }


          const fechaPedido =
            new Date(
              pedido.createdAt
            );


          /* =============================
             DESDE
          ============================= */

          if (fechaDesdeBusqueda) {

            const desde =
              new Date(
                `${fechaDesdeBusqueda}T00:00:00`
              );


            if (
              fechaPedido <
              desde
            ) {
              return false;
            }

          }


          /* =============================
             HASTA
          ============================= */

          if (fechaHastaBusqueda) {

            const hasta =
              new Date(
                `${fechaHastaBusqueda}T23:59:59.999`
              );


            if (
              fechaPedido >
              hasta
            ) {
              return false;
            }

          }


          return true;

        }
      );

    }, [
      pedidos,
      filtro,
      fechaDesdeBusqueda,
      fechaHastaBusqueda,
      filtroEstado,
      filtroPago,
      filtroClienteAsignado,
      filtroRuta,
    ]);


  /* =========================================
     CALENDARIO COMPACTO DE BÚSQUEDA
  ========================================= */

  function abrirCalendarioBusqueda(tipo) {
    setCalendarioBusquedaAbierto(tipo);

    if (tipo === "entrega") {
      setFechaTemporalEntrega(
        form.fechaEntrega || ""
      );

      setMesCalendarioBusqueda(
        form.fechaEntrega
          ? new Date(`${form.fechaEntrega}T00:00:00`)
          : new Date()
      );

      return;
    }

    setFechaTemporalDesdeBusqueda(fechaDesdeBusqueda);
    setFechaTemporalHastaBusqueda(fechaHastaBusqueda);

    const fechaBase =
      tipo === "desde"
        ? fechaDesdeBusqueda || fechaHastaBusqueda
        : fechaHastaBusqueda || fechaDesdeBusqueda;

    setMesCalendarioBusqueda(
      fechaBase
        ? new Date(`${fechaBase}T00:00:00`)
        : new Date()
    );
  }

  function cerrarCalendarioBusqueda() {
    setCalendarioBusquedaAbierto(null);
  }

  function confirmarCalendarioBusqueda() {
    if (calendarioBusquedaAbierto === "entrega") {
      setForm(
        (actual) => ({
          ...actual,
          fechaEntrega:
            fechaTemporalEntrega || "",
        })
      );

      setCalendarioBusquedaAbierto(null);
      return;
    }

    setFechaDesdeBusqueda(fechaTemporalDesdeBusqueda);
    setFechaHastaBusqueda(fechaTemporalHastaBusqueda);
    setCalendarioBusquedaAbierto(null);
  }

  function fechaAStringCalendario(fecha) {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, "0");
    const day = String(fecha.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function mostrarFechaBusqueda(valor) {
    if (!valor) return "dd/mm/aaaa";

    return new Date(`${valor}T00:00:00`)
      .toLocaleDateString("es-CO");
  }

  function estaEnSemanaActualCalendario(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const fechaComparar = new Date(fecha);
    fechaComparar.setHours(0, 0, 0, 0);

    return (
      fechaComparar >= inicioSemana &&
      fechaComparar <= finSemana
    );
  }

  function seleccionarDiaCalendarioBusqueda(fecha) {
    const valor = fechaAStringCalendario(fecha);

    if (calendarioBusquedaAbierto === "entrega") {
      setFechaTemporalEntrega(valor);
      return;
    }

    if (calendarioBusquedaAbierto === "desde") {
      setFechaTemporalDesdeBusqueda(valor);

      if (
        fechaTemporalHastaBusqueda &&
        valor > fechaTemporalHastaBusqueda
      ) {
        setFechaTemporalHastaBusqueda(valor);
      }
    } else {
      if (
        fechaTemporalDesdeBusqueda &&
        valor < fechaTemporalDesdeBusqueda
      ) {
        return;
      }

      setFechaTemporalHastaBusqueda(valor);
    }
  }

  function cambiarMesCalendarioBusqueda(cambio) {
    setMesCalendarioBusqueda(
      (actual) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() + cambio,
          1
        )
    );
  }


  function seleccionarMesCalendarioBusqueda(event) {
    const nuevoMes = Number(event.target.value);

    setMesCalendarioBusqueda(
      (actual) =>
        new Date(
          actual.getFullYear(),
          nuevoMes,
          1
        )
    );
  }


  function seleccionarAnioCalendarioBusqueda(event) {
    const nuevoAnio = Number(event.target.value);

    setMesCalendarioBusqueda(
      (actual) =>
        new Date(
          nuevoAnio,
          actual.getMonth(),
          1
        )
    );
  }

  function obtenerDiasCalendarioBusqueda() {
    const year = mesCalendarioBusqueda.getFullYear();
    const month = mesCalendarioBusqueda.getMonth();
    const primerDia = new Date(year, month, 1);
    const inicio = new Date(primerDia);

    inicio.setDate(
      primerDia.getDate() - primerDia.getDay()
    );

    const dias = [];

    for (let i = 0; i < 42; i++) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + i);
      dias.push(fecha);
    }

    return dias;
  }


  /* =========================================
     LIMPIAR BÚSQUEDA DE PEDIDOS
  ========================================= */

  function limpiarBusquedaPedidos() {

    setFiltro(
      ""
    );

    setFechaDesdeBusqueda(
      ""
    );

    setFechaHastaBusqueda(
      ""
    );

    setFiltroEstado(
      "Todos"
    );

    setFiltroPago(
      "Todos"
    );

    setFiltroClienteAsignado(
      "Todos"
    );

    setFiltroRuta(
      "Todas"
    );

  }


  /* =========================================
     IMPRIMIR PEDIDOS SEGÚN FILTROS
  ========================================= */

  function manejarImprimirPedidosFiltrados() {

    const resultado = imprimirPedidosFiltrados({
      pedidos: pedidosFiltrados,
      filtros: {
        busqueda: filtro,
        estado: filtroEstado,
        pago: filtroPago,
        cliente: filtroClienteAsignado,
        ruta: filtroRuta,
        fechaDesde: fechaDesdeBusqueda,
        fechaHasta: fechaHastaBusqueda,
      },
    });

    if (!resultado?.ok) {
      setMensaje(
        resultado?.mensaje ||
        "No fue posible imprimir los pedidos."
      );

      setTipoMensaje(
        resultado?.tipo ||
        "error"
      );
    }

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="pedidos-page">

      <Toast
        mensaje={mensaje}
        tipo={tipoMensaje}
      />


      {/* CABECERA SUPERIOR FIJA DEL MÓDULO */}
      <header className="pedidos-title-bar">

        <div className="pedidos-title-info">
          <ModulosMenu />
          <h2>Pedidos</h2>
        </div>

          <div className="pedidos-title-actions">

            {/* CAMBIAR VISTA */}

            <div className="pedidos-view-switch">

              <button
                type="button"
                className={
                  `pedidos-view-btn ${vistaPedidos ===
                    "tarjetas"
                    ? "pedidos-view-btn-active"
                    : ""
                  }`
                }
                onClick={() =>
                  cambiarVistaPedidos(
                    "tarjetas"
                  )
                }
                title="Ver como tarjetas"
              >

                <span className="pedidos-view-grid-icon">

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
                  `pedidos-view-btn ${vistaPedidos ===
                    "lista"
                    ? "pedidos-view-btn-active"
                    : ""
                  }`
                }
                onClick={() =>
                  cambiarVistaPedidos(
                    "lista"
                  )
                }
                title="Ver como lista"
              >

                <span className="pedidos-view-list-icon">

                  <i></i>
                  <i></i>
                  <i></i>

                </span>

                <span>
                  Lista
                </span>

              </button>

            </div>

            {/* NUEVO */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={nuevoPedido}
              data-tooltip="Nuevo pedido"
              aria-label="Nuevo pedido"
            >
              <img src={pedidosIcon} alt="" />
            </button>

            {/* EDITAR */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={editarPedidoSeleccionado}
              data-tooltip="Editar pedido"
              disabled={!pedidoSeleccionado}
            >
              <img src={editarIcon} alt="" />
            </button>

            {/* ELIMINAR */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={eliminarPedidoSeleccionado}
              data-tooltip="Eliminar pedido"
              disabled={!pedidoSeleccionado}
            >
              <img src={eliminarIcon} alt="" />
            </button>

            {/* BUSCAR */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={() => setModalBuscar(true)}
              data-tooltip="Buscar pedido"
            >
              <img src={buscarIcon} alt="" />
            </button>

            {/* IMPRIMIR PEDIDOS FILTRADOS */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={manejarImprimirPedidosFiltrados}
              data-tooltip="Imprimir pedidos filtrados"
              disabled={pedidosFiltrados.length === 0}
            >
              <img
                src={imprimirIcon}
                alt=""
              />
            </button>

        </div>

      </header>


      {/* =====================================
          FILTROS RÁPIDOS DE PEDIDOS
        ===================================== */}

        <div className="pedidos-quick-filters">

          <label>
            Estado
            <select
              value={filtroEstado}
              onChange={(event) =>
                setFiltroEstado(
                  event.target.value
                )
              }
            >
              <option value="Todos">Todos</option>
              <option value="Borrador">Borrador</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En preparación">En preparación</option>
              <option value="En ruta">En ruta</option>
              <option value="Entregado">Entregado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>


          <label>
            Tipo de pago
            <select
              value={filtroPago}
              onChange={(event) =>
                setFiltroPago(
                  event.target.value
                )
              }
            >
              <option value="Todos">Todos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Crédito">Crédito</option>
            </select>
          </label>


          <label>
            Cliente
            <select
              value={filtroClienteAsignado}
              onChange={(event) =>
                setFiltroClienteAsignado(
                  event.target.value
                )
              }
            >
              <option value="Todos">Todos</option>
              <option value="Con cliente">Con cliente</option>
              <option value="Sin cliente">Sin cliente</option>
            </select>
          </label>


          <label>
            Ruta
            <select
              value={filtroRuta}
              onChange={(event) =>
                setFiltroRuta(
                  event.target.value
                )
              }
            >
              <option value="Todas">Todas</option>

              {rutasDisponibles.map(
                (ruta) => (
                  <option
                    key={ruta}
                    value={ruta}
                  >
                    {ruta}
                  </option>
                )
              )}

            </select>
          </label>


          <div className="pedidos-quick-filter-result">
            <strong>
              {pedidosFiltrados.length}
            </strong>
            <span>
              pedido(s)
            </span>
          </div>


          <button
            type="button"
            className="pedidos-quick-filter-clear"
            onClick={limpiarBusquedaPedidos}
          >
            Limpiar filtros
          </button>

        </div>


        {/* =====================================
            VISTA DE PEDIDOS
            TARJETAS / LISTA
        ===================================== */}

        <section className="pedidos-card">

          {cargando ? (

            <div className="pedidos-cards-empty">

              Cargando pedidos...

            </div>

          ) : pedidosFiltrados.length === 0 ? (

            <div className="pedidos-cards-empty">

              No hay pedidos registrados.

            </div>

          ) : vistaPedidos === "tarjetas" ? (

            /* =====================================
               VISTA TARJETAS
            ===================================== */

            <div className="pedidos-cards-grid">

              {pedidosFiltrados.map(
                (pedido) => {

                  const seleccionado =
                    pedidoSeleccionado
                      ?._id ===
                    pedido._id;


                  const cliente =
                    pedido.cliente ||
                    {};


                  const cantidadProductos =
                    pedido.items?.length ||
                    0;


                  const estadoClase =
                    String(
                      pedido.estado ||
                      ""
                    )
                      .toLowerCase()
                      .replaceAll(
                        " ",
                        "-"
                      )
                      .normalize(
                        "NFD"
                      )
                      .replace(
                        /[\u0300-\u036f]/g,
                        ""
                      );


                  return (

                    <article
                      key={
                        pedido._id
                      }

                      className={
                        `pedidos-client-card ${seleccionado
                          ? "pedidos-client-card-selected"
                          : ""
                        }`
                      }

                      onClick={() =>
                        seleccionarPedido(
                          pedido
                        )
                      }

                      onDoubleClick={() =>
                        abrirPedido(
                          pedido
                        )
                      }
                    >


                      {/* CABECERA */}

                      <div className="pedidos-client-card-top">

                        <strong className="pedidos-client-card-code">

                          {pedido.codigo ||
                            "Pedido"}

                        </strong>


                        <div className="pedidos-client-card-top-actions">


                          {/* IMPRIMIR ESTE PEDIDO */}

                          <button
                            type="button"
                            className="pedidos-card-print-btn"

                            onClick={
                              (event) => {

                                event.stopPropagation();

                                imprimirPedido(
                                  pedido
                                );

                              }
                            }

                            onDoubleClick={
                              (event) =>
                                event.stopPropagation()
                            }

                            title="Imprimir este pedido"
                            aria-label={`Imprimir ${pedido.codigo || "pedido"}`}
                          >

                            <img
                              src={imprimirPedidoIcon}
                              alt=""
                            />

                          </button>


                          {/* ESTADO */}

                          <span
                            className={
                              `pedidos-client-card-status pedidos-card-status-${estadoClase}`
                            }
                          >

                            {pedido.estado ||
                              "Borrador"}

                          </span>

                        </div>

                      </div>


                      {/* CLIENTE */}

                      <div className="pedidos-client-card-client">

                        <span>
                          Cliente
                        </span>

                        <h3>

                          {pedido.clienteNombre ||
                            cliente.nombre ||
                            pedido.clienteRazonSocial ||
                            cliente.razonSocial ||
                            "Sin cliente asignado"}

                        </h3>


                        {(pedido.clienteCodigo || cliente.codigo) && (
                          <small>
                            Código:{" "}
                            <strong>
                              {pedido.clienteCodigo || cliente.codigo}
                            </strong>
                          </small>
                        )}

                      </div>


                      {/* INFORMACIÓN */}

                      <div className="pedidos-client-card-info">

                        <div>
                          <span>Tipo de pago</span>
                          <strong
                            className={
                              `pedidos-payment pedidos-payment-${String(
                                pedido.metodoPago ||
                                "Efectivo"
                              )
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(
                                  /[\u0300-\u036f]/g,
                                  ""
                                )
                              }`
                            }
                          >
                            {pedido.metodoPago || "Efectivo"}
                          </strong>
                        </div>

                        <div>

                          <span>
                            Fecha pedido
                          </span>

                          <strong>

                            {pedido.createdAt
                              ? new Date(
                                pedido.createdAt
                              )
                                .toLocaleDateString(
                                  "es-CO"
                                )
                              : "-"}

                          </strong>

                        </div>


                        <div>

                          <span>
                            Productos
                          </span>

                          <strong>
                            {cantidadProductos}
                          </strong>

                        </div>


                        {(pedido.clienteBarrio || cliente.barrio) && (
                          <div>
                            <span>Barrio</span>
                            <strong>
                              {pedido.clienteBarrio || cliente.barrio}
                            </strong>
                          </div>
                        )}

                        {(pedido.zonaDespachoNombre || pedido.zonaDespacho?.nombre) && (
                          <div>
                            <span>Zona</span>
                            <strong>
                              {pedido.zonaDespachoNombre || pedido.zonaDespacho?.nombre}
                            </strong>
                          </div>
                        )}

                        {(pedido.rutaNombre || pedido.ruta?.nombre) && (
                          <div>
                            <span>Ruta</span>
                            <strong>
                              {pedido.rutaNombre || pedido.ruta?.nombre}
                            </strong>
                          </div>
                        )}


                        {pedido.fechaEntrega && (

                          <div>

                            <span>
                              Entrega
                            </span>

                            <strong>

                              {new Date(
                                pedido.fechaEntrega
                              )
                                .toLocaleDateString(
                                  "es-CO"
                                )}

                            </strong>

                          </div>

                        )}

                      </div>


                      {/* TOTAL */}

                      <div className="pedidos-client-card-total">

                        <span>
                          Total
                        </span>

                        <strong>

                          {moneda(
                            pedido.total
                          )}

                        </strong>

                      </div>


                      {/* ABRIR */}

                      <div
                        className="pedidos-client-card-actions"
                        onClick={
                          (event) =>
                            event.stopPropagation()
                        }
                      >

                        <button
                          type="button"
                          className="pedidos-card-open-btn"
                          onClick={() =>
                            abrirPedido(
                              pedido
                            )
                          }
                        >

                          Abrir

                        </button>

                      </div>


                      {/* ESTADO */}

                      <div
                        className="pedidos-client-card-footer"
                        onClick={
                          (event) =>
                            event.stopPropagation()
                        }
                      >

                        {pedido.estado === "Borrador" ? (

                          <>

                            <span>
                              Borrador
                            </span>

                            {(
                              pedido.cliente?._id ||
                              pedido.cliente ||
                              pedido.clienteNombre
                            ) ? (

                              <button
                                type="button"
                                className="pedidos-confirm-btn"
                                onClick={() =>
                                  confirmarPedido(
                                    pedido
                                  )
                                }
                              >
                                Confirmar pedido
                              </button>

                            ) : (

                              <button
                                type="button"
                                className="pedidos-assign-client-btn"
                                onClick={() =>
                                  asignarClientePedido(
                                    pedido
                                  )
                                }
                              >
                                ⚠ Asignar cliente
                              </button>

                            )}

                          </>

                        ) : (

                          <>

                            <span>
                              Estado
                            </span>

                            {pedido.estado === "Borrador" ? (

                              (
                                pedido.cliente?._id ||
                                pedido.cliente ||
                                pedido.clienteNombre
                              ) ? (

                                <button
                                  type="button"
                                  className="pedidos-confirm-btn"
                                  onClick={() =>
                                    confirmarPedido(
                                      pedido
                                    )
                                  }
                                >
                                  Confirmar
                                </button>

                              ) : (

                                <button
                                  type="button"
                                  className="pedidos-assign-client-btn"
                                  onClick={() =>
                                    asignarClientePedido(
                                      pedido
                                    )
                                  }
                                >
                                  ⚠ Asignar cliente
                                </button>

                              )

                            ) : (

                              <select
                                className={
                                  `pedidos-status pedidos-status-${estadoClase}`
                                }

                                value={
                                  pedido.estado
                                }

                                onChange={
                                  (event) =>
                                    cambiarEstado(
                                      pedido,
                                      event.target.value
                                    )
                                }
                              >

                                <option value="Pendiente">
                                  Pendiente
                                </option>

                                <option value="En preparación">
                                  En preparación
                                </option>

                                <option value="En ruta">
                                  En ruta
                                </option>

                                <option value="Entregado">
                                  Entregado
                                </option>

                                <option value="Cancelado">
                                  Cancelado
                                </option>

                              </select>

                            )}

                          </>

                        )}

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          ) : (

            /* =====================================
               VISTA LISTA
            ===================================== */

            <div className="pedidos-list-wrap">

              <table className="pedidos-list-table">

                <thead>

                  <tr>

                    <th>
                      Pedido
                    </th>

                    <th>
                      Cliente
                    </th>

                    <th>
                      Zona
                    </th>

                    <th>
                      Ruta
                    </th>

                    <th>
                      Fecha
                    </th>

                    <th>
                      Entrega
                    </th>

                    <th>
                      Productos
                    </th>

                    <th>
                      Total
                    </th>

                    <th>
                      Tipo de pago
                    </th>

                    <th>
                      Estado
                    </th>

                    <th
                      className="pedidos-list-print-head"
                      aria-label="Imprimir"
                    >
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {pedidosFiltrados.map(
                    (pedido) => {

                      const seleccionado =
                        pedidoSeleccionado
                          ?._id ===
                        pedido._id;


                      const cliente =
                        pedido.cliente ||
                        {};


                      const estadoClase =
                        String(
                          pedido.estado ||
                          ""
                        )
                          .toLowerCase()
                          .replaceAll(
                            " ",
                            "-"
                          )
                          .normalize(
                            "NFD"
                          )
                          .replace(
                            /[\u0300-\u036f]/g,
                            ""
                          );


                      return (

                        <tr
                          key={
                            pedido._id
                          }

                          className={
                            seleccionado
                              ? "pedidos-list-row-selected"
                              : ""
                          }

                          onClick={() =>
                            seleccionarPedido(
                              pedido
                            )
                          }

                          onDoubleClick={() =>
                            abrirPedido(
                              pedido
                            )
                          }
                        >


                          {/* PEDIDO */}

                          <td>

                            <strong className="pedidos-list-code">

                              {pedido.codigo ||
                                "-"}

                            </strong>

                          </td>


                          {/* CLIENTE */}

                          <td>

                            <strong className="pedidos-list-client">

                              {pedido.clienteNombre ||
                                cliente.nombre ||
                                pedido.clienteRazonSocial ||
                                cliente.razonSocial ||
                                "Sin cliente asignado"}

                            </strong>

                          </td>


                          {/* ZONA */}

                          <td>
                            {pedido.zonaDespachoNombre ||
                              pedido.zonaDespacho?.nombre ||
                              "-"}
                          </td>


                          {/* RUTA */}

                          <td>
                            {pedido.rutaNombre ||
                              pedido.ruta?.nombre ||
                              "-"}
                          </td>


                          {/* FECHA */}

                          <td>

                            {pedido.createdAt
                              ? new Date(
                                pedido.createdAt
                              )
                                .toLocaleDateString(
                                  "es-CO"
                                )
                              : "-"}

                          </td>


                          {/* ENTREGA */}

                          <td>

                            {pedido.fechaEntrega
                              ? new Date(
                                pedido.fechaEntrega
                              )
                                .toLocaleDateString(
                                  "es-CO"
                                )
                              : "-"}

                          </td>


                          {/* PRODUCTOS */}

                          <td>

                            <span className="pedidos-list-products">

                              {pedido.items?.length ||
                                0}

                            </span>

                          </td>


                          {/* TOTAL */}

                          <td>

                            <strong className="pedidos-list-total">

                              {moneda(
                                pedido.total
                              )}

                            </strong>

                          </td>


                          {/* TIPO DE PAGO */}

                          <td>
                            <span
                              className={
                                `pedidos-payment pedidos-payment-${String(
                                  pedido.metodoPago ||
                                  "Efectivo"
                                )
                                  .toLowerCase()
                                  .normalize("NFD")
                                  .replace(
                                    /[\u0300-\u036f]/g,
                                    ""
                                  )
                                }`
                              }
                            >
                              {pedido.metodoPago || "Efectivo"}
                            </span>
                          </td>

                          {/* ESTADO */}

                          <td
                            onClick={
                              (event) =>
                                event.stopPropagation()
                            }
                          >

                            {pedido.estado === "Borrador" ? (

                              (
                                pedido.cliente?._id ||
                                pedido.cliente ||
                                pedido.clienteNombre
                              ) ? (

                                <button
                                  type="button"
                                  className="pedidos-confirm-btn"
                                  onClick={() =>
                                    confirmarPedido(
                                      pedido
                                    )
                                  }
                                >
                                  Confirmar
                                </button>

                              ) : (

                                <button
                                  type="button"
                                  className="pedidos-assign-client-btn"
                                  onClick={() =>
                                    asignarClientePedido(
                                      pedido
                                    )
                                  }
                                >
                                  ⚠ Asignar cliente
                                </button>

                              )

                            ) : (

                              <select
                                className={
                                  `pedidos-status pedidos-status-${estadoClase}`
                                }

                                value={
                                  pedido.estado
                                }

                                onChange={
                                  (event) =>
                                    cambiarEstado(
                                      pedido,
                                      event.target.value
                                    )
                                }
                              >

                                <option value="Pendiente">
                                  Pendiente
                                </option>

                                <option value="En preparación">
                                  En preparación
                                </option>

                                <option value="En ruta">
                                  En ruta
                                </option>

                                <option value="Entregado">
                                  Entregado
                                </option>

                                <option value="Cancelado">
                                  Cancelado
                                </option>

                              </select>

                            )}

                          </td>


                          {/* IMPRIMIR ESTE PEDIDO */}

                          <td
                            className="pedidos-list-print-cell"

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

                              className="pedidos-list-print-btn"

                              onClick={
                                (event) => {

                                  event.stopPropagation();

                                  imprimirPedido(
                                    pedido
                                  );

                                }
                              }

                              title="Imprimir este pedido"

                              aria-label={
                                `Imprimir ${pedido.codigo || "pedido"}`
                              }
                            >

                              <img
                                src={imprimirPedidoIcon}
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

        </section>


        {/* ===============================
            MODAL NUEVO / EDITAR PEDIDO
        =============================== */}

        {modalPedido && (

          <div
            className="pedidos-modal-overlay pedidos-modal-overlay-movable"
          >

            <div
              ref={modalPedidoRef}
              className="pedidos-modal pedidos-modal-movable"

              style={{
                left: posicionModalPedido.x,
                top: posicionModalPedido.y,
              }}

              onMouseDown={
                (event) =>
                  event.stopPropagation()
              }
            >


              <header
                className="pedidos-modal-header"
                onMouseDown={iniciarArrastrePedido}
              >

                <div>



                  <h2>
                    {modoEdicion
                      ? `Editar ${pedidoSeleccionado?.codigo || "pedido"}`
                      : "Nuevo pedido"}
                  </h2>

                </div>


                <button
                  type="button"
                  className="pedidos-close"
                  onClick={
                    cerrarModalPedido
                  }
                >

                  <img
                    src={cerrarIcon}
                    alt="Cerrar"
                  />

                </button>

              </header>


              <div className="pedidos-modal-body">


                {/* CLIENTE */}

                <section className="pedidos-form-section">

                  <h3>
                    Cliente
                    <small className="pedidos-client-optional">
                      Opcional mientras el pedido sea borrador
                    </small>
                  </h3>


                  {!form.cliente && (
                    <div className="pedidos-draft-client-notice">
                      Puedes guardar este pedido sin cliente. Quedará como borrador y deberás asignar un cliente antes de confirmarlo.
                    </div>
                  )}


                  <div className="pedidos-client-search">

                    <label>

                      Buscar cliente

                      <input
                        type="search"
                        value={
                          buscarCliente
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setBuscarCliente(
                              event.target
                                .value
                            )
                        }

                      />

                    </label>


                    {buscarCliente &&
                      !form.cliente && (

                        <div className="pedidos-suggestions">

                          {clientesFiltrados.map(
                            (
                              cliente
                            ) => (

                              <button
                                key={
                                  cliente._id
                                }
                                type="button"
                                onClick={() =>
                                  seleccionarCliente(
                                    cliente
                                  )
                                }
                              >

                                <strong>
                                  {
                                    cliente.nombre
                                  }
                                </strong>

                                <span>
                                  {[
                                    cliente.codigo,
                                    cliente.telefono,
                                    cliente.barrio,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </span>

                              </button>

                            )
                          )}

                        </div>

                      )}


                    {form.cliente && (() => {

                      const clienteActual =
                        clientes.find(
                          (cliente) =>
                            cliente._id === form.cliente
                        ) || {};

                      const pedidoActual =
                        modoEdicion
                          ? pedidoSeleccionado || {}
                          : {};

                      const zonaNombre =
                        pedidoActual.zonaDespachoNombre ||
                        pedidoActual.zonaDespacho?.nombre ||
                        clienteActual.zonaDespacho?.nombre ||
                        "";

                      const rutaNombre =
                        pedidoActual.rutaNombre ||
                        pedidoActual.ruta?.nombre ||
                        "";

                      const diasRuta =
                        pedidoActual.rutaDiasAtencion ||
                        pedidoActual.ruta?.diasAtencion ||
                        [];

                      return (

                        <div className="pedidos-client-selected">

                          <div className="pedidos-client-selected-main">

                            <strong>
                              {clienteActual.nombre ||
                                pedidoActual.clienteNombre ||
                                buscarCliente}
                            </strong>

                            {(
                              clienteActual.razonSocial ||
                              pedidoActual.clienteRazonSocial
                            ) && (
                              <span>
                                {clienteActual.razonSocial ||
                                  pedidoActual.clienteRazonSocial}
                              </span>
                            )}

                            <div className="pedidos-client-selected-data">

                              <span>
                                <b>Código:</b>{" "}
                                {clienteActual.codigo ||
                                  pedidoActual.clienteCodigo ||
                                  "-"}
                              </span>

                              <span>
                                <b>Teléfono:</b>{" "}
                                {clienteActual.telefono ||
                                  pedidoActual.clienteTelefono ||
                                  "-"}
                              </span>

                              <span>
                                <b>Tipo:</b>{" "}
                                {clienteActual.tipoCliente ||
                                  pedidoActual.clienteTipo ||
                                  "-"}
                              </span>

                              <span>
                                <b>Dirección:</b>{" "}
                                {clienteActual.direccion ||
                                  pedidoActual.clienteDireccion ||
                                  "-"}
                              </span>

                              <span>
                                <b>Barrio:</b>{" "}
                                {clienteActual.barrio ||
                                  pedidoActual.clienteBarrio ||
                                  "-"}
                              </span>

                              <span>
                                <b>Ciudad:</b>{" "}
                                {clienteActual.ciudad ||
                                  pedidoActual.clienteCiudad ||
                                  "-"}
                              </span>

                              <span>
                                <b>Zona:</b>{" "}
                                {zonaNombre || "Sin zona"}
                              </span>

                              <span>
                                <b>Ruta:</b>{" "}
                                {rutaNombre ||
                                  (modoEdicion
                                    ? "Sin ruta"
                                    : "Se asignará al guardar")}
                              </span>

                              {diasRuta.length > 0 && (
                                <span>
                                  <b>Días:</b>{" "}
                                  {diasRuta.join(" · ")}
                                </span>
                              )}

                            </div>

                          </div>


                          <button
                            type="button"
                            onClick={() => {

                              setForm(
                                (actual) => ({
                                  ...actual,
                                  cliente: "",
                                })
                              );

                              setBuscarCliente("");

                            }}
                          >
                            Cambiar
                          </button>

                        </div>

                      );

                    })()}

                  </div>

                </section>


                {/* PRODUCTOS */}

                <section className="pedidos-form-section">

                  <h3>
                    Productos
                  </h3>


                  <div className="pedidos-product-builder">

                    {/* BUSCAR PRODUCTO */}

                    <div className="pedidos-product-search-box">

                      <label>

                        Buscar producto

                        <div className="pedidos-product-search-input">

                          <img
                            src={buscarIcon}
                            alt=""
                          />

                          <input
                            type="search"
                            value={
                              buscarProducto
                            }
                            onChange={
                              (event) =>
                                setBuscarProducto(
                                  event.target.value
                                )
                            }
                            placeholder="Nombre, código, marca o categoría"
                            autoComplete="off"
                          />

                        </div>

                      </label>


                      {buscarProducto.trim() && (

                        <div className="pedidos-product-results">

                          {productosFiltrados.length === 0 ? (

                            <div className="pedidos-product-no-results">

                              No se encontraron productos.

                            </div>

                          ) : (

                            productosFiltrados
                              .slice(0, 8)
                              .map(
                                (producto) => (

                                  <div
                                    key={
                                      producto._id
                                    }
                                    className="pedidos-product-result"
                                  >

                                    <div className="pedidos-product-result-info">

                                      <strong>
                                        {producto.nombre}
                                      </strong>

                                      <span>

                                        {producto.codigo ||
                                          "Sin código"}

                                        {" · "}

                                        {producto.categoria
                                          ?.nombre ||
                                          "Sin categoría"}

                                      </span>

                                    </div>


                                    <button
                                      type="button"
                                      onClick={() =>
                                        seleccionarProductoBuscado(
                                          producto
                                        )
                                      }
                                    >
                                      Seleccionar
                                    </button>

                                  </div>

                                )
                              )

                          )}

                        </div>

                      )}

                    </div>

                    {/* PRODUCTO MANUAL */}

                    <label>

                      Producto

                      <input
                        type="text"
                        value={
                          productoTexto
                        }
                        onChange={
                          escribirProductoManual
                        }
                        list="pedidos-productos-disponibles"
                        autoComplete="off"
                        placeholder="Escriba o seleccione un producto"
                      />

                      <datalist id="pedidos-productos-disponibles">

                        {productos.map(
                          (producto) => (

                            <option
                              key={
                                producto._id
                              }
                              value={
                                producto.nombre
                              }
                            >
                              {producto.codigo ||
                                ""}

                              {" "}

                              {producto.categoria
                                ?.nombre ||
                                ""}
                            </option>

                          )
                        )}

                      </datalist>

                    </label>


                    {productoActual && (

                      <label>

                        Presentación

                        <select
                          value={
                            presentacionSeleccionada
                          }
                          onChange={
                            (
                              event
                            ) =>
                              setPresentacionSeleccionada(
                                event.target.value
                              )
                          }
                        >

                          <option value="">
                            {productoActual.unidad ||
                              "Principal"}
                          </option>

                          {(
                            productoActual
                              .presentacionesAdicionales ||
                            []
                          )
                            .filter(
                              (
                                presentacion
                              ) =>
                                presentacion.estado ===
                                "Activo" ||
                                presentacion.estado ===
                                "Activa" ||
                                presentacion.estado ===
                                true
                            )
                            .map(
                              (
                                presentacion
                              ) => (

                                <option
                                  key={
                                    presentacion._id
                                  }
                                  value={
                                    presentacion._id
                                  }
                                >
                                  {
                                    presentacion.nombre
                                  }
                                </option>

                              )
                            )}

                        </select>

                      </label>

                    )}


                    <label>

                      {(
                        presentacionActual ||
                        productoActual
                      )?.tipoVenta ===
                        "Peso"
                        ? "Peso"
                        : "Cantidad"}

                      <input
                        type="number"
                        min="0.01"
                        step={
                          (
                            presentacionActual ||
                            productoActual
                          )?.tipoVenta ===
                            "Peso"
                            ? "0.01"
                            : "1"
                        }
                        value={
                          cantidad
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setCantidad(
                              event.target
                                .value
                            )
                        }
                      />

                    </label>


                    {productoActual && (

                      <div className="pedidos-price-preview">

                        <span>
                          Precio
                        </span>

                        <strong>
                          {moneda(
                            precioVista
                              .precioAplicado
                          )}
                        </strong>

                        <small>
                          por{" "}
                          {(
                            presentacionActual ||
                            productoActual
                          )?.unidad ||
                            "unidad"}
                        </small>


                        {precioVista
                          .reglaAplicada && (

                            <em>

                              Precio especial desde{" "}

                              {
                                precioVista
                                  .reglaAplicada
                                  .desde
                              }

                            </em>

                          )}

                      </div>

                    )}


                    <button
                      type="button"
                      className="pedidos-add-product"
                      onClick={
                        agregarProducto
                      }
                    >
                      + Agregar
                    </button>

                  </div>


                  {/* ITEMS */}

                  <div className="pedidos-items-wrap">

                    <table className="pedidos-items-table">

                      <thead>

                        <tr>
                          <th>Producto</th>
                          <th>Marca</th>
                          <th>Cantidad</th>
                          <th>Precio</th>
                          <th>Subtotal</th>
                          <th></th>
                        </tr>

                      </thead>


                      <tbody>

                        {form.items.length ===
                          0 ? (

                          <tr>

                            <td
                              colSpan="6"
                              className="pedidos-empty"
                            >
                              Agregue productos al pedido.
                            </td>

                          </tr>

                        ) : (

                          form.items.map(
                            (
                              item
                            ) => (

                              <tr
                                key={
                                  item.temporalId
                                }
                              >

                                <td>

                                  <strong>
                                    {
                                      item.nombre
                                    }
                                  </strong>

                                  {item.presentacionNombre && (

                                    <small>
                                      {
                                        item.presentacionNombre
                                      }
                                    </small>

                                  )}

                                </td>


                                <td>
                                  {item.marca ||
                                    "Sin marca"}
                                </td>


                                <td>
                                  {item.cantidad}
                                </td>


                                <td>

                                  <strong>
                                    {moneda(
                                      item.precioAplicado
                                    )}
                                  </strong>

                                  {item.precioAplicado !==
                                    item.precioNormal && (

                                      <small className="pedidos-old-price">

                                        {moneda(
                                          item.precioNormal
                                        )}

                                      </small>

                                    )}

                                </td>


                                <td>

                                  <strong>
                                    {moneda(
                                      item.subtotal
                                    )}
                                  </strong>

                                </td>


                                <td>

                                  <button
                                    type="button"
                                    className="pedidos-remove-item"
                                    onClick={() =>
                                      quitarItem(
                                        item.temporalId
                                      )
                                    }
                                  >

                                    <img
                                      src={
                                        eliminarIcon
                                      }
                                      alt="Eliminar"
                                    />

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


                {/* DATOS FINALES */}

                <section className="pedidos-form-section">

                  <div className="pedidos-final-grid">

                    <label>

                      Tipo de pago

                      <select
                        value={form.metodoPago}
                        onChange={(event) =>
                          setForm((actual) => ({
                            ...actual,
                            metodoPago: event.target.value,
                          }))
                        }
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                        <option value="Crédito">Crédito</option>
                      </select>

                    </label>

                    <label>

                      Empleado asignado

                      <select
                        value={
                          form.empleado
                        }
                        onChange={
                          (event) =>
                            setForm(
                              (actual) => ({
                                ...actual,

                                empleado:
                                  event.target.value,

                              })
                            )
                        }
                      >

                        <option value="">
                          Sin asignar
                        </option>

                        {empleados.map(
                          (empleado) => (

                            <option
                              key={
                                empleado._id
                              }
                              value={
                                empleado._id
                              }
                            >

                              {empleado.nombres
                                ? `${empleado.nombres} ${empleado.apellidos ||
                                  ""
                                  }`.trim()
                                : empleado.nombre ||
                                "Empleado"}

                            </option>

                          )
                        )}

                      </select>

                    </label>


                    <label>

                      Fecha de entrega

                      <button
                        type="button"
                        className="pedidos-form-date-trigger"
                        onClick={() =>
                          abrirCalendarioBusqueda("entrega")
                        }
                      >
                       

                        <strong>
                          {mostrarFechaBusqueda(
                            form.fechaEntrega
                          )}
                        </strong>
                      </button>

                    </label>


                    <label>

                      Descuento

                      <input
                        type="number"
                        min="0"
                        value={
                          form.descuento
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setForm(
                              (
                                actual
                              ) => ({
                                ...actual,

                                descuento:
                                  event
                                    .target
                                    .value,

                              })
                            )
                        }
                        placeholder="0"
                      />

                    </label>


                    <label className="pedidos-observaciones">

                      Observaciones

                      <textarea
                        rows="3"
                        value={
                          form.observaciones
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setForm(
                              (
                                actual
                              ) => ({
                                ...actual,

                                observaciones:
                                  event
                                    .target
                                    .value,

                              })
                            )
                        }
                        placeholder="Observaciones del pedido..."
                      />

                    </label>

                  </div>

                </section>


                {/* TOTALES */}

                <div className="pedidos-summary">

                  <div>
                    <span>
                      Subtotal
                    </span>

                    <strong>
                      {moneda(
                        subtotalFormulario
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Descuento
                    </span>

                    <strong>
                      {moneda(
                        descuentoNumero
                      )}
                    </strong>
                  </div>


                  <div className="pedidos-summary-total">

                    <span>
                      Total
                    </span>

                    <strong>
                      {moneda(
                        totalFormulario
                      )}
                    </strong>

                  </div>

                </div>

              </div>


              {/* FOOTER MODAL */}

              <footer className="pedidos-modal-footer">

                <button
                  type="button"
                  className="pedidos-cancel-btn"
                  onClick={
                    cerrarModalPedido
                  }
                >
                  Cancelar
                </button>


                <button
                  type="button"
                  className="pedidos-save-btn"
                  disabled={
                    guardando
                  }
                  onClick={
                    guardarPedido
                  }
                >

                  <img
                    src={
                      guardarIcon
                    }
                    alt=""
                  />

                  {guardando
                    ? "Guardando..."
                    : modoEdicion
                      ? "Guardar cambios"
                      : "Guardar borrador"}

                </button>

              </footer>

            </div>

          </div>

        )}


        {/* ===============================
            MODAL BUSCAR PEDIDO
        =============================== */}

        {modalBuscar && (

          <div
            className="pedidos-modal-overlay"
          >

            <div
              className="pedidos-search-modal"
              onMouseDown={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="pedidos-search-header">

                <h3>
                  Buscar pedido
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setModalBuscar(
                      false
                    )
                  }
                >
                  <img
                    src={cerrarIcon}
                    alt="Cerrar"
                  />
                </button>

              </div>


              <div className="pedidos-search-filters">


                {/* BUSCAR CLIENTE / PEDIDO */}

                <div className="pedidos-search-input">

                  <img
                    src={buscarIcon}
                    alt=""
                  />

                  <input
                    type="search"
                    autoFocus
                    value={
                      filtro
                    }
                    onChange={
                      (event) =>
                        setFiltro(
                          event.target.value
                        )
                    }
                    placeholder="Cliente, código, zona, ruta o estado..."
                  />

                </div>


                {/* RANGO DE FECHAS */}

                <div className="pedidos-search-date-grid">

                  <div className="pedidos-date-field">

                    <button
                      type="button"
                      className="pedidos-date-trigger"
                      onClick={() =>
                        abrirCalendarioBusqueda("desde")
                      }
                    >
                      <span>DESDE</span>
                      <strong>
                        {mostrarFechaBusqueda(fechaDesdeBusqueda)}
                      </strong>
                    </button>
                  </div>

                  <div className="pedidos-date-field">

                    <button
                      type="button"
                      className="pedidos-date-trigger"
                      onClick={() =>
                        abrirCalendarioBusqueda("hasta")
                      }
                    >
                      <span>HASTA</span>
                      <strong>
                        {mostrarFechaBusqueda(fechaHastaBusqueda)}
                      </strong>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="pedidos-search-clear"
                    onClick={limpiarBusquedaPedidos}
                  >
                    Limpiar
                  </button>

                </div>


                {/* INFORMACIÓN DEL FILTRO */}

                <div className="pedidos-search-filter-info">

                  <span>
                    {
                      pedidosFiltrados.length
                    } pedido(s) encontrado(s)
                  </span>


                  {(fechaDesdeBusqueda ||
                    fechaHastaBusqueda) && (

                      <span>

                        {fechaDesdeBusqueda
                          ? `Desde ${new Date(
                            `${fechaDesdeBusqueda}T00:00:00`
                          ).toLocaleDateString(
                            "es-CO"
                          )}`
                          : "Desde el inicio"}

                        {" — "}

                        {fechaHastaBusqueda
                          ? `Hasta ${new Date(
                            `${fechaHastaBusqueda}T00:00:00`
                          ).toLocaleDateString(
                            "es-CO"
                          )}`
                          : "Hasta hoy"}

                      </span>

                    )}

                </div>


                {/* IMPRIMIR SOLO LOS RESULTADOS DE ESTA BÚSQUEDA */}

                <div className="pedidos-search-print-actions">

                  <button
                    type="button"
                    className="pedidos-search-print-results"
                    onClick={manejarImprimirPedidosFiltrados}
                    disabled={pedidosFiltrados.length === 0}
                    title="Imprimir pedidos encontrados"
                  >
                    <img
                      src={imprimirIcon}
                      alt=""
                    />

                    <span>
                      Imprimir encontrados
                    </span>
                  </button>

                </div>

              </div>


              <div className="pedidos-search-results">

                {pedidosFiltrados.map(
                  (pedido) => (

                    <button
                      type="button"
                      key={
                        pedido._id
                      }
                      onClick={() => {

                        setPedidoSeleccionado(
                          pedido
                        );

                        setModalBuscar(
                          false
                        );

                      }}
                    >

                      <span>

                        <strong>
                          {pedido.codigo}
                        </strong>

                        <b>
                          {pedido.clienteNombre ||
                            pedido.cliente?.nombre ||
                            "Sin cliente asignado"}
                        </b>

                        <small>

                          {pedido.createdAt
                            ? new Date(
                              pedido.createdAt
                            ).toLocaleDateString(
                              "es-CO"
                            )
                            : "Sin fecha"}

                          {(pedido.zonaDespachoNombre ||
                            pedido.zonaDespacho?.nombre)
                            ? ` · Zona: ${pedido.zonaDespachoNombre ||
                              pedido.zonaDespacho?.nombre}`
                            : ""}

                          {(pedido.rutaNombre ||
                            pedido.ruta?.nombre)
                            ? ` · Ruta: ${pedido.rutaNombre ||
                              pedido.ruta?.nombre}`
                            : ""}

                        </small>

                      </span>

                      <strong>
                        {moneda(
                          pedido.total
                        )}
                      </strong>

                    </button>

                  )
                )}

              </div>

            </div>

          </div>

        )}


      {/* =====================================
          CALENDARIO COMPACTO - BÚSQUEDA
          No cierra al hacer clic fuera
      ====================================== */}

      {calendarioBusquedaAbierto && (

        <div className="pedidos-datepicker-overlay">

          <div className="pedidos-datepicker">

            <div className="pedidos-datepicker-title">
              {calendarioBusquedaAbierto === "entrega"
                ? "Fecha de entrega"
                : calendarioBusquedaAbierto === "desde"
                  ? "Seleccionar fecha desde"
                  : "Seleccionar fecha hasta"}
            </div>

            <div className="pedidos-datepicker-header">
              <button
                type="button"
                className="pedidos-datepicker-nav"
                onClick={() => cambiarMesCalendarioBusqueda(-1)}
                aria-label="Mes anterior"
                title="Mes anterior"
              >
                ‹
              </button>

              <div className="pedidos-datepicker-period">

                <select
                  className="pedidos-datepicker-select pedidos-datepicker-month-select"
                  value={mesCalendarioBusqueda.getMonth()}
                  onChange={seleccionarMesCalendarioBusqueda}
                  aria-label="Seleccionar mes"
                  title="Seleccionar mes"
                >
                  {MESES_CALENDARIO.map(
                    (mes, index) => (
                      <option
                        key={mes}
                        value={index}
                      >
                        {mes}
                      </option>
                    )
                  )}
                </select>

                <select
                  className="pedidos-datepicker-select pedidos-datepicker-year-select"
                  value={mesCalendarioBusqueda.getFullYear()}
                  onChange={seleccionarAnioCalendarioBusqueda}
                  aria-label="Seleccionar año"
                  title="Seleccionar año"
                >
                  {ANIOS_CALENDARIO.map(
                    (anio) => (
                      <option
                        key={anio}
                        value={anio}
                      >
                        {anio}
                      </option>
                    )
                  )}
                </select>

              </div>

              <button
                type="button"
                className="pedidos-datepicker-nav"
                onClick={() => cambiarMesCalendarioBusqueda(1)}
                aria-label="Mes siguiente"
                title="Mes siguiente"
              >
                ›
              </button>
            </div>

            <div className="pedidos-datepicker-weekdays">
              {["D", "L", "M", "M", "J", "V", "S"].map(
                (dia, index) => (
                  <span key={index}>
                    {dia}
                  </span>
                )
              )}
            </div>

            <div className="pedidos-datepicker-days">
              {obtenerDiasCalendarioBusqueda().map((fecha) => {
                const valor = fechaAStringCalendario(fecha);

                const fueraMes =
                  fecha.getMonth() !==
                  mesCalendarioBusqueda.getMonth();

                const seleccionadoDesde =
                  valor === fechaTemporalDesdeBusqueda;

                const seleccionadoHasta =
                  valor === fechaTemporalHastaBusqueda;

                const seleccionadoEntrega =
                  calendarioBusquedaAbierto === "entrega" &&
                  valor === fechaTemporalEntrega;

                const enRango =
                  calendarioBusquedaAbierto !== "entrega" &&
                  fechaTemporalDesdeBusqueda &&
                  fechaTemporalHastaBusqueda &&
                  valor >= fechaTemporalDesdeBusqueda &&
                  valor <= fechaTemporalHastaBusqueda;

                const semanaActual =
                  estaEnSemanaActualCalendario(fecha);

                const inicioSemanaActual =
                  semanaActual && fecha.getDay() === 0;

                const finSemanaActual =
                  semanaActual && fecha.getDay() === 6;

                const deshabilitado =
                  calendarioBusquedaAbierto === "hasta" &&
                  fechaTemporalDesdeBusqueda &&
                  valor < fechaTemporalDesdeBusqueda;

                return (
                  <button
                    type="button"
                    key={valor}
                    disabled={Boolean(deshabilitado)}
                    className={[
                      fueraMes ? "outside" : "",
                      semanaActual ? "current-week" : "",
                      inicioSemanaActual
                        ? "current-week-start"
                        : "",
                      finSemanaActual
                        ? "current-week-end"
                        : "",
                      enRango ? "range" : "",
                      seleccionadoDesde ? "start" : "",
                      seleccionadoHasta ? "end" : "",
                      seleccionadoEntrega ? "single" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      seleccionarDiaCalendarioBusqueda(fecha)
                    }
                  >
                    {fecha.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="pedidos-datepicker-footer">
              <button
                type="button"
                className="pedidos-datepicker-cancel"
                onClick={cerrarCalendarioBusqueda}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="pedidos-datepicker-done"
                onClick={confirmarCalendarioBusqueda}
              >
                Listo
              </button>
            </div>

          </div>

        </div>

      )}

    </section>

  );

}