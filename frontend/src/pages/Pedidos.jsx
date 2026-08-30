import {
  useEffect,
  useMemo,
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
  from "../assets/icons/pedidos.png";

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


     


      setProductos(
        (
          Array.isArray(
            dataProductos
          )
            ? dataProductos
            : dataProductos?.productos ||
            dataProductos?.data ||
            []
        ).filter(
          (producto) =>
            producto.estado ===
            "Activo" ||
            producto.estado === true
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
          .toLowerCase();


      if (!texto) {

        return productos;

      }


      return productos.filter(
        (producto) => {

          const categoria =
            producto.categoria
              ?.nombre ||
            "";


          return [
            producto.codigo,
            producto.nombre,
            producto.marca,
            categoria,
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

        }
      );

    }, [
      productos,
      buscarProducto,
    ]);


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

  function nuevoPedido() {

    setModoEdicion(false);

    setPedidoSeleccionado(
      null
    );

    setForm(
      FORM_INICIAL
    );

    setProductoSeleccionado(
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
     CAMBIAR PRODUCTO
  ========================================= */

  function cambiarProducto(
    event
  ) {

    setProductoSeleccionado(
      event.target.value
    );

    setPresentacionSeleccionada(
      ""
    );

    setCantidad(
      "1"
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
  ========================================= */

  const pedidosFiltrados =
    useMemo(() => {

      const texto =
        filtro
          .trim()
          .toLowerCase();


      if (!texto) {

        return pedidos;

      }


      return pedidos.filter(
        (pedido) => {

          const cliente =
            pedido.cliente ||
            {};


          return [
            pedido.codigo,
            cliente.nombre,
            cliente.documento,
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

        }
      );

    }, [
      pedidos,
      filtro,
    ]);


  /* =========================================
     IMPRIMIR PEDIDO
  ========================================= */

  function imprimirPedido() {

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


    const pedido =
      pedidoSeleccionado;


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


        {/* CABECERA */}

        <div className="pedidos-header">

          <div>

            <span className="pedidos-eyebrow">
              Gestión comercial
            </span>

            <h1>
              Pedidos
            </h1>

            <p>
              Registra y administra los pedidos de tus clientes.
            </p>

          </div>


          <div className="pedidos-header-actions">

            <ModulosMenu />


            <button
              type="button"
              className="pedidos-action-btn"
              data-tooltip="Nuevo pedido"
              onClick={
                nuevoPedido
              }
            >
              <img
                src={pedidosIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="pedidos-action-btn"
              data-tooltip="Buscar pedido"
              onClick={() =>
                setModalBuscar(
                  true
                )
              }
            >
              <img
                src={buscarIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="pedidos-action-btn"
              data-tooltip="Editar pedido"
              onClick={
                editarPedidoSeleccionado
              }
            >
              <img
                src={editarIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="pedidos-action-btn"
              data-tooltip="Eliminar pedido"
              onClick={
                eliminarPedidoSeleccionado
              }
            >
              <img
                src={eliminarIcon}
                alt=""
              />
            </button>


            <button
              type="button"
              className="pedidos-action-btn"
              data-tooltip="Imprimir pedido"
              onClick={
                imprimirPedido
              }
            >
              <img
                src={imprimirIcon}
                alt=""
              />
            </button>

          </div>

        </div>


        {/* TABLA */}

        <section className="pedidos-card">

          <div className="pedidos-table-wrap">

            <table className="pedidos-table">

              <thead>

                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>

              </thead>


              <tbody>

                {cargando ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="pedidos-empty"
                    >
                      Cargando pedidos...
                    </td>
                  </tr>

                ) : pedidosFiltrados.length === 0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="pedidos-empty"
                    >
                      No hay pedidos registrados.
                    </td>
                  </tr>

                ) : (

                  pedidosFiltrados.map(
                    (pedido) => (

                      <tr
                        key={
                          pedido._id
                        }
                        className={
                          pedidoSeleccionado
                            ?._id ===
                            pedido._id
                            ? "pedidos-row-selected"
                            : ""
                        }
                        onClick={() =>
                          seleccionarPedido(
                            pedido
                          )
                        }
                      >

                        <td>
                          <strong>
                            {pedido.codigo}
                          </strong>
                        </td>


                        <td>

                          <strong>
                            {pedido.cliente
                              ?.nombre ||
                              "Cliente"}
                          </strong>

                          <small>
                            {pedido.cliente
                              ?.documento ||
                              ""}
                          </small>

                        </td>


                        <td>

                          {pedido.createdAt
                            ? new Date(
                              pedido.createdAt
                            ).toLocaleDateString(
                              "es-CO"
                            )
                            : "-"}

                        </td>


                        <td>

                          <span className="pedidos-products-count">

                            {
                              pedido.items
                                ?.length ||
                              0
                            }

                            {" "}

                            producto(s)

                          </span>

                        </td>


                        <td>

                          <strong className="pedidos-total">

                            {moneda(
                              pedido.total
                            )}

                          </strong>

                        </td>


                        <td>

                          <select
                            className={`pedidos-status pedidos-status-${String(
                              pedido.estado
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
                              )}`}
                            value={
                              pedido.estado
                            }
                            onClick={
                              (
                                event
                              ) =>
                                event.stopPropagation()
                            }
                            onChange={
                              (
                                event
                              ) =>
                                cambiarEstado(
                                  pedido,
                                  event.target
                                    .value
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

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>


        {/* ===============================
            MODAL NUEVO / EDITAR PEDIDO
        =============================== */}

        {modalPedido && (

          <div
            className="pedidos-modal-overlay"
            onMouseDown={
              cerrarModalPedido
            }
          >

            <div
              className="pedidos-modal"
              onMouseDown={
                (event) =>
                  event.stopPropagation()
              }
            >


              <header className="pedidos-modal-header">

                <div>

                  <span>
                    WebBuys
                  </span>

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
                        placeholder="Ej. Tienda Central o 123456..."
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


                    <label>

                      Buscar producto

                      <input
                        type="search"
                        value={
                          buscarProducto
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setBuscarProducto(
                              event.target
                                .value
                            )
                        }
                        placeholder="Buscar por producto, código o categoría..."
                      />

                    </label>


                    <label>

                      Producto

                      <select
                        value={
                          productoSeleccionado
                        }
                        onChange={
                          cambiarProducto
                        }
                      >

                        <option value="">
                          Seleccione
                        </option>

                        {productosFiltrados.map(
                          (
                            producto
                          ) => (

                            <option
                              key={
                                producto._id
                              }
                              value={
                                producto._id
                              }
                            >

                              {producto.codigo
                                ? `${producto.codigo} - `
                                : ""}

                              {producto.nombre}

                            </option>

                          )
                        )}

                      </select>

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
                    : "Guardar pedido"}

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
                    (
                      event
                    ) =>
                      setFiltro(
                        event.target
                          .value
                      )
                  }
                  placeholder="Código, cliente, documento o estado..."
                />

              </div>


              <div className="pedidos-search-results">

                {pedidosFiltrados.map(
                  (
                    pedido
                  ) => (

                    <button
                      type="button"
                      key={
                        pedido._id
                      }
                      onDoubleClick={() => {

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
                          {
                            pedido.codigo
                          }
                        </strong>

                        {
                          pedido.cliente
                            ?.nombre
                        }

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