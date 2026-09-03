import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import AppLayout
  from "../layouts/AppLayout.jsx";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarClientes,
} from "../services/cliente.service.js";

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
  fechaEntrega: "",
  descuento: "",
  observaciones: "",
  items: [],
};


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
              cliente.documento,
              cliente.nombre,
              cliente.razonSocial,
              cliente.telefono,
              cliente.barrio,
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

    if (!form.cliente) {

      setMensaje(
        "Seleccione un cliente."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


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
          form.cliente,

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
          "Pedido actualizado correctamente."
        );

      } else {

        await crearPedido(
          datos
        );


        setMensaje(
          "Pedido creado correctamente."
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
              cliente.nombre,
              cliente.documento,
              cliente.telefono,
              cliente.barrio,
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
    ]);


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

  }


  /* =========================================
     IMPRIMIR PEDIDO
  ========================================= */

  function imprimirPedido(
    pedidoDirecto = null
  ) {

    const pedido =
      pedidoDirecto ||
      pedidoSeleccionado;


    if (!pedido) {

      setMensaje(
        "Seleccione primero un pedido."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const filas =
      (
        pedido.items ||
        []
      )
        .map(
          (item) => `
            <tr>
              <td>
                ${item.codigoProducto || ""}
              </td>

              <td>
                ${item.nombre || ""}
                ${item.presentacionNombre
              ? `<br><small>${item.presentacionNombre}</small>`
              : ""
            }
              </td>

              <td>
                ${item.cantidad} ${item.unidad || ""}
              </td>

              <td>
                ${moneda(item.precioAplicado)}
              </td>

              <td>
                ${moneda(item.subtotal)}
              </td>
            </tr>
          `
        )
        .join("");


    const ventana =
      window.open(
        "",
        "_blank",
        "width=1000,height=800"
      );


    if (!ventana) {

      setMensaje(
        "El navegador bloqueó la ventana de impresión."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">

      <head>

        <meta charset="UTF-8">

        <title>
          ${pedido.codigo} - WebBuys
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 35px;
            font-family: Arial, sans-serif;
            color: #172033;
          }

          h1 {
            margin: 0;
            color: #087f5b;
          }

          .info {
            margin: 20px 0;
            padding: 16px;
            background: #f4fbf8;
            border-radius: 12px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th {
            padding: 11px;
            background: #087f5b;
            color: white;
            text-align: left;
          }

          td {
            padding: 11px;
            border-bottom: 1px solid #e6e9ee;
          }

          .totales {
            width: 340px;
            margin: 25px 0 0 auto;
          }

          .totales div {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
          }

          .total-final {
            border-top: 2px solid #087f5b;
            font-size: 20px;
            font-weight: bold;
            color: #087f5b;
          }

          @media print {
            body {
              padding: 0;
            }
          }

        </style>

      </head>

      <body>

        <h1>
          Pedido ${pedido.codigo}
        </h1>

        <div class="info">

          <strong>
            Cliente:
          </strong>

          ${pedido.cliente?.nombre || ""}

          <br>

          <strong>
            Documento:
          </strong>

          ${pedido.cliente?.documento || ""}

          <br>

          <strong>
            Estado:
          </strong>

          ${pedido.estado}

        </div>

        <table>

          <thead>

            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
            </tr>

          </thead>

          <tbody>
            ${filas}
          </tbody>

        </table>

        <div class="totales">

          <div>
            <span>Subtotal</span>
            <strong>
              ${moneda(pedido.subtotal)}
            </strong>
          </div>

          <div>
            <span>Descuento</span>
            <strong>
              ${moneda(pedido.descuento)}
            </strong>
          </div>

          <div class="total-final">
            <span>Total</span>
            <strong>
              ${moneda(pedido.total)}
            </strong>
          </div>

        </div>

      </body>

      </html>
    `);


    ventana.document.close();

    ventana.focus();


    setTimeout(
      () =>
        ventana.print(),
      300
    );

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <AppLayout title="Pedidos">

      <Toast
        mensaje={mensaje}
        tipo={tipoMensaje}
      />


      <section className="pedidos-page">


        {/* MENÚ DE MÓDULOS */}
        <ModulosMenu />

        {/* CABECERA PEDIDOS */}
        <div className="pedidos-title-bar">

          <div className="pedidos-title-info">
            <h2>Pedidos</h2>
          </div>

          <div className="pedidos-title-actions">

            {/* CAMBIAR VISTA */}

            <div className="pedidos-view-switch">

              <button
                type="button"
                className={
                  `pedidos-view-btn ${
                    vistaPedidos ===
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
                  `pedidos-view-btn ${
                    vistaPedidos ===
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

            {/* IMPRIMIR */}
            <button
              type="button"
              className="pedidos-top-icon-btn"
              onClick={() =>
                imprimirPedido()
              }
              data-tooltip="Imprimir pedido"
              disabled={!pedidoSeleccionado}
            >
              <img
                src={imprimirIcon}
                alt=""
              />
            </button>

          </div>

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
                        `pedidos-client-card ${
                          seleccionado
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
                              "Pendiente"}

                          </span>

                        </div>

                      </div>


                      {/* CLIENTE */}

                      <div className="pedidos-client-card-client">

                        <span>
                          Cliente
                        </span>

                        <h3>

                          {cliente.nombre ||
                            cliente.razonSocial ||
                            "Cliente"}

                        </h3>


                        {cliente.documento && (

                          <small>

                            Documento:{" "}

                            <strong>
                              {cliente.documento}
                            </strong>

                          </small>

                        )}

                      </div>


                      {/* INFORMACIÓN */}

                      <div className="pedidos-client-card-info">

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


                        {cliente.barrio && (

                          <div>

                            <span>
                              Barrio
                            </span>

                            <strong>
                              {cliente.barrio}
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

                        <span>
                          Estado
                        </span>


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
                      Documento
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

                              {cliente.nombre ||
                                cliente.razonSocial ||
                                "Cliente"}

                            </strong>

                          </td>


                          {/* DOCUMENTO */}

                          <td>

                            {cliente.documento ||
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


                          {/* ESTADO */}

                          <td
                            onClick={
                              (event) =>
                                event.stopPropagation()
                            }
                          >

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
            onMouseDown={
              cerrarModalPedido
            }
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
                  </h3>


                  <div className="pedidos-client-search">

                    <label>

                      Buscar por nombre o documento

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
                                  {
                                    cliente.documento
                                  }
                                </span>

                              </button>

                            )
                          )}

                        </div>

                      )}


                    {form.cliente && (

                      <div className="pedidos-client-selected">

                        <div>

                          <span>
                            Cliente seleccionado
                          </span>

                          <strong>

                            {
                              clientes.find(
                                (
                                  cliente
                                ) =>
                                  cliente._id ===
                                  form.cliente
                              )?.nombre ||
                              buscarCliente
                            }

                          </strong>

                        </div>


                        <button
                          type="button"
                          onClick={() => {

                            setForm(
                              (
                                actual
                              ) => ({
                                ...actual,
                                cliente:
                                  "",
                              })
                            );

                            setBuscarCliente(
                              ""
                            );

                          }}
                        >
                          Cambiar
                        </button>

                      </div>

                    )}

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


                    {productoActual
                      ?.presentacionesAdicionales
                      ?.filter(
                        (
                          presentacion
                        ) =>
                          presentacion.estado ===
                          "Activo" ||
                          presentacion.estado ===
                          true
                      )
                      .length >
                      0 && (

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
                                  event.target
                                    .value
                                )
                            }
                          >

                            <option value="">
                              Presentación principal
                            </option>

                            {productoActual
                              .presentacionesAdicionales
                              .filter(
                                (
                                  presentacion
                                ) =>
                                  presentacion.estado ===
                                  "Activo" ||
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
                              colSpan="5"
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
                                  {item.cantidad}{" "}
                                  {item.unidad}
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

                      Fecha de entrega

                      <input
                        type="date"
                        value={
                          form.fechaEntrega
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

                                fechaEntrega:
                                  event
                                    .target
                                    .value,

                              })
                            )
                        }
                      />

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
                    : ""}

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
            onMouseDown={() =>
              setModalBuscar(
                false
              )
            }
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
                    placeholder="Cliente, documento, código o estado..."
                  />

                </div>


                {/* RANGO DE FECHAS */}

                <div className="pedidos-search-date-grid">


                  <label>

                    Desde

                    <input
                      type="date"
                      value={
                        fechaDesdeBusqueda
                      }
                      onChange={
                        (event) =>
                          setFechaDesdeBusqueda(
                            event.target.value
                          )
                      }
                      max={
                        fechaHastaBusqueda ||
                        undefined
                      }
                    />

                  </label>


                  <label>

                    Hasta

                    <input
                      type="date"
                      value={
                        fechaHastaBusqueda
                      }
                      onChange={
                        (event) =>
                          setFechaHastaBusqueda(
                            event.target.value
                          )
                      }
                      min={
                        fechaDesdeBusqueda ||
                        undefined
                      }
                    />

                  </label>


                  <button
                    type="button"
                    className="pedidos-search-clear"
                    onClick={
                      limpiarBusquedaPedidos
                    }
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
                          {pedido.cliente
                            ?.nombre ||
                            "Cliente"}
                        </b>

                        <small>

                          {pedido.createdAt
                            ? new Date(
                                pedido.createdAt
                              ).toLocaleDateString(
                                "es-CO"
                              )
                            : "Sin fecha"}

                          {pedido.cliente
                            ?.documento
                            ? ` · ${pedido.cliente.documento}`
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

      </section>

    </AppLayout>

  );

}