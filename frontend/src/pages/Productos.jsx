import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  listarProductos,
  obtenerSiguienteCodigoProducto,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  eliminarProducto,
} from "../services/producto.service.js";

import {
  listarCategorias,
} from "../services/categoria.service.js";

import { useAuth }
  from "../context/AuthContext.jsx";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import nuevoProductoIcon
  from "../assets/icons/nuevo-producto.png";

import editarProductoIcon
  from "../assets/icons/editar-producto.png";

import bloquearIcon
  from "../assets/icons/bloquear.png";

import desbloquearIcon
  from "../assets/icons/desbloquear.png";

import eliminarProductoIcon
  from "../assets/icons/eliminar-producto.png";

import buscarIcon
  from "../assets/icons/buscar.png";

import imprimirIcon
  from "../assets/icons/imprimir.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";

import guardarIcon
  from "../assets/icons/guardar.png";

import productosPrintCss
  from "../styles/productos-print.css?inline";

import "../styles/productos.css";


const FORM_INICIAL = {
  codigo: "",
  nombre: "",
  categoria: "",
  marca: "",
  descripcion: "",

  tipoVenta: "Unidad",
  unidad: "Unidad",

  precioCompra: "",
  precioVenta: "",

  stock: "",
  stockMinimo: "",

  reglasPrecio: [],

  presentacionesAdicionales: [],

  sabores: [],

  imagen: "",

  estado: "Activo",
};


const OPCIONES_TIPO_VENTA = [
  "Unidad",
  "Peso",
];


const OPCIONES_UNIDAD = [
  "Unidad",
  "Kg",
  "g",
  "L",
  "ml",
  "Libra",
];


const OPCIONES_PRESENTACION = [
  "Libra y media al vacío",
  "Libra",
  "Media libra",
  "Cuarto",
  "Bloque",
  "1 Litro",
  "1/2 Litro",
  "Mini",
  "250 g",
  "400 g",
  "500 g",
];


export default function Productos() {

  const { usuario } = useAuth();

  const [
    productos,
    setProductos,
  ] = useState([]);

  const [
    categorias,
    setCategorias,
  ] = useState([]);

  const [
    productoSeleccionado,
    setProductoSeleccionado,
  ] = useState(null);

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(FORM_INICIAL);

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
    error,
    setError,
  ] = useState("");


  /* =========================================
     SABORES
  ========================================= */

  const [
    nuevoSabor,
    setNuevoSabor,
  ] = useState("");


  /* =========================================
     BUSCAR
  ========================================= */

  const [
    modalBuscarAbierto,
    setModalBuscarAbierto,
  ] = useState(false);

  const [
    filtroBuscar,
    setFiltroBuscar,
  ] = useState("");

  const [
    campoBuscar,
    setCampoBuscar,
  ] = useState("todos");

  const modalBuscarRef =
    useRef(null);

  const [
    posicionModal,
    setPosicionModal,
  ] = useState({
    x: 0,
    y: 0,
  });

  const arrastreRef =
    useRef({
      activo: false,
      offsetX: 0,
      offsetY: 0,
    });


  /* =========================================
     CARGAR PRODUCTOS
  ========================================= */

  async function cargarProductos() {

    try {

      setCargando(true);

      const data =
        await listarProductos();

      setProductos(
        Array.isArray(data)
          ? data
          : data?.productos ||
            []
      );

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible cargar los productos."
      );

    } finally {

      setCargando(false);

    }

  }


  /* =========================================
     CARGAR CATEGORÍAS
  ========================================= */

  async function cargarCategorias() {

    try {

      const data =
        await listarCategorias();

      setCategorias(
        (
          Array.isArray(data)
            ? data
            : data?.categorias ||
              []
        ).filter(
          (categoria) =>
            categoria.estado === "Activa"
        )
      );

    } catch (err) {

      console.error(
        "Error cargando categorías:",
        err
      );

    }

  }


  useEffect(() => {

    cargarProductos();
    cargarCategorias();

  }, []);


  useEffect(() => {

    if (!mensaje && !error) {
      return;
    }

    const timer =
      setTimeout(() => {

        setMensaje("");
        setError("");

      }, 3000);

    return () =>
      clearTimeout(timer);

  }, [
    mensaje,
    error,
  ]);


  /* =========================================
     NUEVO PRODUCTO
  ========================================= */

  async function nuevoProducto() {

    try {

      setProductoSeleccionado(
        null
      );

      setModoEdicion(false);

      setMensaje("");
      setError("");

      setNuevoSabor("");

      const data =
        await obtenerSiguienteCodigoProducto();

      setForm({
        ...FORM_INICIAL,

        codigo:
          data?.codigo || "",
      });

      setMostrarFormulario(
        true
      );

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible obtener el siguiente código."
      );

    }

  }


  /* =========================================
     EDITAR PRODUCTO
  ========================================= */

  function abrirEditarProducto(
    producto
  ) {

    if (!producto) {
      return;
    }


    setProductoSeleccionado(
      producto
    );

    setModoEdicion(true);

    setNuevoSabor("");


    setForm({

      codigo:
        producto.codigo || "",

      nombre:
        producto.nombre || "",

      categoria:
        producto.categoria?._id ||
        producto.categoria ||
        "",

      marca:
        producto.marca || "",

      descripcion:
        producto.descripcion || "",

      tipoVenta:
        producto.tipoVenta ||
        "Unidad",

      unidad:
        producto.unidad ||
        "Unidad",

      precioCompra:
        producto.precioCompra ??
        "",

      precioVenta:
        producto.precioVenta ??
        "",

      stock:
        producto.stock ??
        "",

      stockMinimo:
        producto.stockMinimo ??
        "",

      reglasPrecio:
        Array.isArray(
          producto.reglasPrecio
        )
          ? producto.reglasPrecio.map(
              (regla) => ({
                desde:
                  regla.desde,

                precio:
                  regla.precio,
              })
            )
          : [],

      presentacionesAdicionales:
        Array.isArray(
          producto.presentacionesAdicionales
        )
          ? producto.presentacionesAdicionales.map(
              (presentacion) => ({
                ...presentacion,
              })
            )
          : [],

      sabores:
        Array.isArray(
          producto.sabores
        )
          ? [...producto.sabores]
          : [],

      imagen:
        producto.imagen || "",

      estado:
        producto.estado ||
        "Activo",
    });


    setMostrarFormulario(
      true
    );

    setMensaje("");
    setError("");

  }


  function cerrarFormulario() {

    setMostrarFormulario(
      false
    );

    setProductoSeleccionado(
      null
    );

    setModoEdicion(false);

    setNuevoSabor("");

    setForm(
      FORM_INICIAL
    );

  }


  /* =========================================
     CAMBIAR CAMPOS
  ========================================= */

  function cambiarCampo(
    event
  ) {

    const {
      name,
      value,
    } = event.target;

    setForm(
      (actual) => ({
        ...actual,
        [name]: value,
      })
    );

  }


  function cambiarCampoMoneda(
    campo,
    valor
  ) {

    setForm((actual) => ({
      ...actual,

      [campo]:
        limpiarMoneda(valor),
    }));
  }


  /* =========================================
     REGLAS DE PRECIO
  ========================================= */

  function agregarReglaPrecio() {

    setForm((actual) => ({
      ...actual,

      reglasPrecio: [
        ...actual.reglasPrecio,
        {
          desde: "",
          precio: "",
        },
      ],
    }));
  }


  function cambiarReglaPrecio(
    index,
    campo,
    valor
  ) {

    setForm((actual) => ({
      ...actual,

      reglasPrecio:
        actual.reglasPrecio.map(
          (regla, indice) =>
            indice === index
              ? {
                  ...regla,

                  [campo]:
                    campo === "precio"
                      ? limpiarMoneda(
                          valor
                        )
                      : valor,
                }
              : regla
        ),
    }));
  }


  function eliminarReglaPrecio(
    index
  ) {

    setForm((actual) => ({
      ...actual,

      reglasPrecio:
        actual.reglasPrecio.filter(
          (_, indice) =>
            indice !== index
        ),
    }));
  }


  /* =========================================
     PRESENTACIONES ADICIONALES
  ========================================= */

  function agregarPresentacionAdicional() {

    setForm((actual) => ({
      ...actual,

      presentacionesAdicionales: [
        ...actual.presentacionesAdicionales,

        {
          nombre: "",
          tipoVenta: "Unidad",
          unidad: "Unidad",
          precioCompra: "",
          precioVenta: "",
          stock: "",
          stockMinimo: "",
          reglasPrecio: [],
          estado: "Activa",
        },
      ],
    }));
  }


  function cambiarPresentacionAdicional(
    index,
    campo,
    valor
  ) {

    setForm((actual) => ({
      ...actual,

      presentacionesAdicionales:
        actual.presentacionesAdicionales.map(
          (presentacion, indice) =>
            indice === index
              ? {
                  ...presentacion,

                  [campo]:
                    [
                      "precioCompra",
                      "precioVenta",
                    ].includes(campo)
                      ? limpiarMoneda(
                          valor
                        )
                      : valor,
                }
              : presentacion
        ),
    }));
  }


  function eliminarPresentacionAdicional(
    index
  ) {

    setForm((actual) => ({
      ...actual,

      presentacionesAdicionales:
        actual.presentacionesAdicionales.filter(
          (_, indice) =>
            indice !== index
        ),
    }));
  }


  /* =========================================
     SABORES
  ========================================= */

  function agregarSabor() {

    const sabor =
      nuevoSabor.trim();

    if (!sabor) {
      return;
    }


    const existe =
      form.sabores.some(
        (item) =>
          item.toLowerCase() ===
          sabor.toLowerCase()
      );


    if (existe) {

      setError(
        "Ese sabor ya está agregado."
      );

      return;
    }


    setForm(
      (actual) => ({
        ...actual,

        sabores: [
          ...actual.sabores,
          sabor,
        ],
      })
    );


    setNuevoSabor("");

  }


  function eliminarSabor(
    sabor
  ) {

    setForm(
      (actual) => ({
        ...actual,

        sabores:
          actual.sabores.filter(
            (item) =>
              item !== sabor
          ),
      })
    );

  }


  /* =========================================
     VALIDAR
  ========================================= */

  function validarFormulario() {

    if (!form.nombre.trim()) {

      setError(
        "El nombre del producto es obligatorio."
      );

      return false;
    }


    if (!form.categoria) {

      setError(
        "Debes seleccionar una categoría."
      );

      return false;
    }


    if (!form.unidad) {

      setError(
        "Debes seleccionar la unidad de venta."
      );

      return false;
    }


    if (
      form.precioVenta === ""
    ) {

      setError(
        "El precio de venta es obligatorio."
      );

      return false;
    }


    for (
      const regla
      of form.reglasPrecio
    ) {

      if (
        !regla.desde ||
        regla.precio === ""
      ) {

        setError(
          "Completa todas las reglas de precio."
        );

        return false;
      }

    }


    return true;
  }


  /* =========================================
     FORMATO MONEDA COLOMBIANA
  ========================================= */

  function formatearMoneda(valor) {

    if (
      valor === "" ||
      valor === null ||
      valor === undefined
    ) {
      return "";
    }

    const numero =
      String(valor)
        .replace(/\D/g, "");

    if (!numero) {
      return "";
    }

    return `$ ${Number(numero).toLocaleString(
      "es-CO"
    )}`;
  }


  function limpiarMoneda(valor) {

    return String(valor || "")
      .replace(/\D/g, "");

  }


  /* =========================================
     GUARDAR
  ========================================= */

  async function guardarProducto() {

    if (!validarFormulario()) {
      return;
    }


    try {

      setGuardando(true);

      setMensaje("");
      setError("");


      const datos = {

        nombre:
          form.nombre.trim(),

        categoria:
          form.categoria,

        marca:
          form.marca.trim(),

        descripcion:
          form.descripcion.trim(),

        tipoVenta:
          form.tipoVenta,

        unidad:
          form.unidad,

        precioCompra:
          Number(
            form.precioCompra ||
            0
          ),

        precioVenta:
          Number(
            form.precioVenta ||
            0
          ),

        stock:
          Number(
            form.stock ||
            0
          ),

        stockMinimo:
          Number(
            form.stockMinimo ||
            0
          ),

        reglasPrecio:
          form.reglasPrecio.map(
            (regla) => ({
              desde:
                Number(
                  regla.desde
                ),

              precio:
                Number(
                  regla.precio
                ),
            })
          ),

        presentacionesAdicionales:
          form.presentacionesAdicionales.map(
            (presentacion) => ({
              nombre:
                presentacion.nombre.trim(),

              tipoVenta:
                presentacion.tipoVenta,

              unidad:
                presentacion.unidad,

              precioCompra:
                Number(
                  presentacion.precioCompra ||
                  0
                ),

              precioVenta:
                Number(
                  presentacion.precioVenta ||
                  0
                ),

              stock:
                Number(
                  presentacion.stock ||
                  0
                ),

              stockMinimo:
                Number(
                  presentacion.stockMinimo ||
                  0
                ),

              reglasPrecio:
                presentacion.reglasPrecio ||
                [],

              estado:
                presentacion.estado ||
                "Activa",
            })
          ),

        sabores:
          form.sabores,

        imagen:
          form.imagen.trim(),
      };


      if (
        modoEdicion &&
        productoSeleccionado?._id
      ) {

        await actualizarProducto(
          productoSeleccionado._id,
          datos
        );

        setMensaje(
          "Producto actualizado correctamente."
        );

      } else {

        await crearProducto(
          datos
        );

        setMensaje(
          "Producto creado correctamente."
        );

      }


      await cargarProductos();

      cerrarFormulario();


    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible guardar el producto."
      );

    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     ESTADO
  ========================================= */

  async function cambiarEstadoSeleccionado() {

    if (!productoSeleccionado) {

      setError(
        "Seleccione primero un producto."
      );

      return;
    }


    try {

      const respuesta =
        await cambiarEstadoProducto(
          productoSeleccionado._id
        );

      setMensaje(
        respuesta?.mensaje ||
        "Estado actualizado correctamente."
      );

      setProductoSeleccionado(
        null
      );

      await cargarProductos();


    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible cambiar el estado."
      );

    }

  }


  /* =========================================
     ELIMINAR
  ========================================= */

  async function eliminarSeleccionado() {

    if (!productoSeleccionado) {

      setError(
        "Seleccione primero un producto."
      );

      return;
    }


    const confirmar =
      window.confirm(
        `¿Deseas eliminar el producto "${productoSeleccionado.nombre}"?`
      );


    if (!confirmar) {
      return;
    }


    try {

      await eliminarProducto(
        productoSeleccionado._id
      );

      setMensaje(
        "Producto eliminado correctamente."
      );

      setProductoSeleccionado(
        null
      );

      await cargarProductos();


    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible eliminar el producto."
      );

    }

  }


  /* =========================================
     BUSCAR
  ========================================= */

  const productosBusqueda =
    useMemo(() => {

      const texto =
        filtroBuscar
          .trim()
          .toLowerCase();


      if (!texto) {
        return productos;
      }


      return productos.filter(
        (producto) => {

          const codigo =
            String(
              producto.codigo || ""
            ).toLowerCase();

          const nombre =
            String(
              producto.nombre || ""
            ).toLowerCase();

          const categoria =
            String(
              producto.categoria
                ?.nombre || ""
            ).toLowerCase();

          const tipoVenta =
            String(
              producto.tipoVenta || ""
            ).toLowerCase();

          const unidad =
            String(
              producto.unidad || ""
            ).toLowerCase();

          const estado =
            String(
              producto.estado || ""
            ).toLowerCase();


          switch (campoBuscar) {

            case "codigo":
              return codigo.includes(
                texto
              );

            case "nombre":
              return nombre.includes(
                texto
              );

            case "categoria":
              return categoria.includes(
                texto
              );

            case "tipoVenta":
              return tipoVenta.includes(
                texto
              );

            case "unidad":
              return unidad.includes(
                texto
              );

            case "estado":
              return estado.includes(
                texto
              );

            default:
              return (
                codigo.includes(texto) ||
                nombre.includes(texto) ||
                categoria.includes(texto) ||
                tipoVenta.includes(texto) ||
                unidad.includes(texto) ||
                estado.includes(texto)
              );

          }

        }
      );

    }, [
      productos,
      filtroBuscar,
      campoBuscar,
    ]);


  function abrirBuscarProductos() {

    setFiltroBuscar("");
    setCampoBuscar("todos");

    setPosicionModal({
      x: Math.max(
        20,
        (window.innerWidth - 900) / 2
      ),

      y: Math.max(
        20,
        (window.innerHeight - 560) / 2
      ),
    });

    setModalBuscarAbierto(
      true
    );

  }


  /* =========================================
     ARRASTRAR MODAL
  ========================================= */

  function iniciarArrastreModal(
    event
  ) {

    if (!modalBuscarRef.current) {
      return;
    }


    const rect =
      modalBuscarRef.current
        .getBoundingClientRect();


    arrastreRef.current = {
      activo: true,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,
    };


    document.addEventListener(
      "mousemove",
      moverModal
    );

    document.addEventListener(
      "mouseup",
      terminarArrastreModal
    );

  }


  function moverModal(
    event
  ) {

    if (
      !arrastreRef.current.activo
    ) {
      return;
    }


    const modal =
      modalBuscarRef.current;

    if (!modal) {
      return;
    }


    const ancho =
      modal.offsetWidth;

    const alto =
      modal.offsetHeight;


    let x =
      event.clientX -
      arrastreRef.current.offsetX;

    let y =
      event.clientY -
      arrastreRef.current.offsetY;


    x =
      Math.max(
        10,
        Math.min(
          window.innerWidth -
          ancho -
          10,
          x
        )
      );


    y =
      Math.max(
        10,
        Math.min(
          window.innerHeight -
          alto -
          10,
          y
        )
      );


    setPosicionModal({
      x,
      y,
    });

  }


  function terminarArrastreModal() {

    arrastreRef.current.activo =
      false;


    document.removeEventListener(
      "mousemove",
      moverModal
    );

    document.removeEventListener(
      "mouseup",
      terminarArrastreModal
    );

  }


  /* =========================================
     ESCAPAR HTML
  ========================================= */

  function escaparHtml(valor) {

    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================================
     IMPRIMIR
  ========================================= */

  function imprimirProductos() {

    if (!productos.length) {

      setError(
        "No hay productos para imprimir."
      );

      return;
    }


    const fechaHora =
      new Date().toLocaleString(
        "es-CO",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );


    const usuarioImpresion =
      usuario?.nombres ||
      usuario?.apellidos
        ? `${usuario?.nombres || ""} ${
            usuario?.apellidos || ""
          }`.trim()
        : usuario?.usuario ||
          "Usuario";


    const filas =
      productos
        .map(
          (producto) => `
            <tr>

              <td>
                <strong>
                  ${escaparHtml(
                    producto.codigo || "-"
                  )}
                </strong>
              </td>

              <td>
                ${escaparHtml(
                  producto.nombre || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  producto.categoria
                    ?.nombre || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  producto.tipoVenta === "Peso"
                    ? "Por peso"
                    : "Por unidad"
                )}
              </td>

              <td>
                ${escaparHtml(
                  producto.unidad || "-"
                )}
              </td>

              <td>
                ${formatearMoneda(
                  producto.precioVenta
                )}
              </td>

              <td>
                ${escaparHtml(
                  producto.estado || "-"
                )}
              </td>

            </tr>
          `
        )
        .join("");


    const ventana =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );


    if (!ventana) {

      setError(
        "El navegador bloqueó la ventana de impresión."
      );

      return;
    }


    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8" />

          <title>
            Productos registrados
          </title>

          <style>
            ${productosPrintCss}
          </style>

        </head>

        <body>

          <main class="productos-print-page">

            <header class="productos-print-header">

              <h1>
                Productos registrados
              </h1>

              <p>
                WebBuys - Listado de productos
              </p>

              <div class="productos-print-info">

                <span>
                  <strong>
                    Fecha y hora de impresión:
                  </strong>

                  ${escaparHtml(
                    fechaHora
                  )}
                </span>

                <span>
                  <strong>
                    Usuario:
                  </strong>

                  ${escaparHtml(
                    usuarioImpresion
                  )}
                </span>

              </div>

            </header>


            <table class="productos-print-table">

              <thead>

                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Tipo venta</th>
                  <th>Unidad</th>
                  <th>Precio</th>
                  <th>Estado</th>
                </tr>

              </thead>

              <tbody>
                ${filas}
              </tbody>

            </table>


            <div class="productos-print-total">

              Total productos:

              <strong>
                ${productos.length}
              </strong>

            </div>


            <footer class="productos-print-footer">
              WebBuys
            </footer>

          </main>

        </body>

      </html>
    `);


    ventana.document.close();

    ventana.focus();


    setTimeout(
      () => {
        ventana.print();
      },
      300
    );

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="productos-module">

      <Toast
        mensaje={mensaje}
        error={error}
      />


      {/* CABECERA */}

      <div className="productos-title-bar">

        <div className="productos-title-left">

          <ModulosMenu />

          <div className="productos-title-info">
            <h2>
              Productos
            </h2>
          </div>

        </div>

      </div>


      {/* PANEL LISTADO */}

      <div className="productos-list-panel">

        <div className="productos-list-header">

          <div>

            <h3>
              Productos registrados
            </h3>

            <span>
              {productos.length} productos
            </span>

          </div>


          <div className="productos-list-actions">


            {/* NUEVO */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={nuevoProducto}
              data-tooltip="Nuevo producto"
              aria-label="Nuevo producto"
            >
              <img
                src={nuevoProductoIcon}
                alt=""
              />
            </button>


            {/* EDITAR */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={() =>
                abrirEditarProducto(
                  productoSeleccionado
                )
              }
              disabled={!productoSeleccionado}
              data-tooltip="Editar producto"
              aria-label="Editar producto"
            >
              <img
                src={editarProductoIcon}
                alt=""
              />
            </button>


            {/* ESTADO */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={
                cambiarEstadoSeleccionado
              }
              disabled={!productoSeleccionado}
              data-tooltip={
                productoSeleccionado
                  ?.estado === "Activo"
                  ? "Desactivar producto"
                  : "Activar producto"
              }
              aria-label={
                productoSeleccionado
                  ?.estado === "Activo"
                  ? "Desactivar producto"
                  : "Activar producto"
              }
            >
              <img
                src={
                  productoSeleccionado
                    ?.estado === "Activo"
                    ? bloquearIcon
                    : desbloquearIcon
                }
                alt=""
              />
            </button>


            {/* ELIMINAR */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={eliminarSeleccionado}
              disabled={!productoSeleccionado}
              data-tooltip="Eliminar producto"
              aria-label="Eliminar producto"
            >
              <img
                src={eliminarProductoIcon}
                alt=""
              />
            </button>


            {/* BUSCAR */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={
                abrirBuscarProductos
              }
              data-tooltip="Buscar producto"
              aria-label="Buscar producto"
            >
              <img
                src={buscarIcon}
                alt=""
              />
            </button>


            {/* IMPRIMIR */}

            <button
              type="button"
              className="productos-work-btn"
              onClick={
                imprimirProductos
              }
              disabled={!productos.length}
              data-tooltip="Imprimir productos"
              aria-label="Imprimir productos"
            >
              <img
                src={imprimirIcon}
                alt=""
              />
            </button>

          </div>

        </div>


        {/* TABLA */}

        <div className="productos-table-wrap">

          <table className="productos-table">

            <thead>

              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Tipo venta</th>
                <th>Unidad</th>
                <th>Precio venta</th>
                <th>Estado</th>
              </tr>

            </thead>


            <tbody>

              {cargando ? (

                <tr>

                  <td
                    colSpan="7"
                    className="productos-table-empty"
                  >
                    Cargando productos...
                  </td>

                </tr>

              ) : productos.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="productos-table-empty"
                  >
                    No hay productos registrados.
                  </td>

                </tr>

              ) : (

                productos.map(
                  (producto) => (

                    <tr
                      key={
                        producto._id
                      }
                      className={
                        productoSeleccionado
                          ?._id ===
                        producto._id
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        setProductoSeleccionado(
                          producto
                        )
                      }
                    >

                      <td>
                        <strong className="productos-code">
                          {producto.codigo}
                        </strong>
                      </td>


                      <td>
                        <strong>
                          {producto.nombre}
                        </strong>
                      </td>


                      <td>
                        {producto.categoria
                          ?.nombre ||
                          "Sin categoría"}
                      </td>


                      <td>
                        {producto.tipoVenta === "Peso"
                          ? "Por peso"
                          : "Por unidad"}
                      </td>


                      <td>
                        {producto.unidad || "—"}
                      </td>


                      <td>
                        <strong className="productos-price">
                          {formatearMoneda(
                            producto.precioVenta
                          )}
                        </strong>
                      </td>


                      <td>

                        <span
                          className={
                            producto.estado ===
                            "Activo"
                              ? "productos-status active"
                              : "productos-status inactive"
                          }
                        >
                          {producto.estado}
                        </span>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* MODAL NUEVO / EDITAR */}

      {mostrarFormulario && (

        <div
          className="productos-form-overlay"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarFormulario();
            }

          }}
        >

          <div className="productos-form-modal">

            <div className="productos-form-header">

              <h3>
                {modoEdicion
                  ? "Editar producto"
                  : "Nuevo producto"}
              </h3>


              <button
                type="button"
                onClick={
                  cerrarFormulario
                }
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>


            <div className="productos-form-body">


              {/* DATOS GENERALES */}

              <div className="productos-form-section">

                <h4>
                  Datos generales
                </h4>


                <div className="productos-form-grid">

                  <label className="producto-field-small">

                    Código

                    <input
                      value={
                        form.codigo
                      }
                      readOnly
                    />

                  </label>


                  <label>

                    Nombre *

                    <input
                      name="nombre"
                      value={
                        form.nombre
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Ej. Queso Campesino"
                      autoFocus
                    />

                  </label>


                  <label>

                    Categoría *

                    <select
                      name="categoria"
                      value={
                        form.categoria
                      }
                      onChange={
                        cambiarCampo
                      }
                    >

                      <option value="">
                        Seleccione categoría
                      </option>

                      {categorias.map(
                        (categoria) => (

                          <option
                            key={
                              categoria._id
                            }
                            value={
                              categoria._id
                            }
                          >
                            {categoria.nombre}
                          </option>

                        )
                      )}

                    </select>

                  </label>


                  <label>

                    Marca

                    <input
                      name="marca"
                      value={
                        form.marca
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Ej. Nápoles"
                    />

                  </label>


                  <label className="producto-field-full">

                    Descripción

                    <textarea
                      name="descripcion"
                      value={
                        form.descripcion
                      }
                      onChange={
                        cambiarCampo
                      }
                      placeholder="Descripción del producto"
                    />

                  </label>

                </div>

              </div>


              {/* VENTA PRINCIPAL */}

              <div className="productos-form-section">

                <h4>
                  Venta principal
                </h4>

                <div className="productos-sale-grid">


                  <label>
                    Tipo de venta

                    <select
                      name="tipoVenta"
                      value={form.tipoVenta}
                      onChange={cambiarCampo}
                    >

                      {OPCIONES_TIPO_VENTA.map(
                        (opcion) => (
                          <option
                            key={opcion}
                            value={opcion}
                          >
                            {opcion === "Peso"
                              ? "Por peso"
                              : "Por unidad"}
                          </option>
                        )
                      )}

                    </select>

                  </label>


                  <label>
                    Unidad de medida

                    <select
                      name="unidad"
                      value={form.unidad}
                      onChange={cambiarCampo}
                    >

                      {OPCIONES_UNIDAD.map(
                        (opcion) => (
                          <option
                            key={opcion}
                            value={opcion}
                          >
                            {opcion}
                          </option>
                        )
                      )}

                    </select>

                  </label>


                  <label>
                    Valor unitario

                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        formatearMoneda(
                          form.precioCompra
                        )
                      }
                      onChange={(event) =>
                        cambiarCampoMoneda(
                          "precioCompra",
                          event.target.value
                        )
                      }
                      placeholder="$ 0"
                    />

                  </label>


                  <label>
                    Precio venta *

                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        formatearMoneda(
                          form.precioVenta
                        )
                      }
                      onChange={(event) =>
                        cambiarCampoMoneda(
                          "precioVenta",
                          event.target.value
                        )
                      }
                      placeholder="$ 0"
                    />

                  </label>


                  <label>
                    Stock inicial

                    <input
                      type="number"
                      min="0"
                      name="stock"
                      value={form.stock}
                      onChange={cambiarCampo}
                      placeholder="0"
                    />

                  </label>


                  <label>
                    Stock mínimo

                    <input
                      type="number"
                      min="0"
                      name="stockMinimo"
                      value={form.stockMinimo}
                      onChange={cambiarCampo}
                      placeholder="0"
                    />

                  </label>

                </div>

              </div>


              {/* PRECIO POR CANTIDAD */}

              <div className="productos-form-section">

                <div className="productos-section-header">

                  <div>

                    <h4>
                      Precio por cantidad
                    </h4>

                    <p className="productos-section-help">
                      Opcional. El sistema aplicará automáticamente
                      el precio cuando se alcance la cantidad indicada.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="productos-add-btn"
                    onClick={agregarReglaPrecio}
                  >
                    + Agregar regla
                  </button>

                </div>


                {form.reglasPrecio.length ===
                0 ? (

                  <div className="productos-empty-option">
                    Sin reglas de precio.
                  </div>

                ) : (

                  <div className="productos-price-rules">

                    {form.reglasPrecio.map(
                      (regla, index) => (

                        <div
                          className="productos-price-rule"
                          key={index}
                        >

                          <label>
                            Desde cantidad

                            <input
                              type="number"
                              min="0"
                              step={
                                form.tipoVenta ===
                                "Peso"
                                  ? "0.01"
                                  : "1"
                              }
                              value={
                                regla.desde
                              }
                              onChange={(event) =>
                                cambiarReglaPrecio(
                                  index,
                                  "desde",
                                  event.target.value
                                )
                              }
                              placeholder={
                                form.tipoVenta ===
                                "Peso"
                                  ? "Ej. 3.5"
                                  : "Ej. 5"
                              }
                            />

                          </label>


                          <label>
                            Nuevo precio

                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                formatearMoneda(
                                  regla.precio
                                )
                              }
                              onChange={(event) =>
                                cambiarReglaPrecio(
                                  index,
                                  "precio",
                                  event.target.value
                                )
                              }
                              placeholder="$ 0"
                            />

                          </label>


                          <button
                            type="button"
                            className="productos-remove-rule"
                            onClick={() =>
                              eliminarReglaPrecio(
                                index
                              )
                            }
                          >
                            ×
                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* PRESENTACIONES ADICIONALES */}

              <div className="productos-form-section">

                <div className="productos-section-header">

                  <div>

                    <h4>
                      Presentaciones adicionales
                    </h4>

                    <p className="productos-section-help">
                      Opcional. Úsalo solamente cuando el producto
                      tenga otra forma especial de venta.
                    </p>

                  </div>


                  <button
                    type="button"
                    className="productos-add-btn"
                    onClick={
                      agregarPresentacionAdicional
                    }
                  >
                    + Agregar presentación
                  </button>

                </div>


                {form.presentacionesAdicionales
                  .length === 0 ? (

                  <div className="productos-empty-option">
                    Sin presentaciones adicionales.
                  </div>

                ) : (

                  <div className="productos-extra-list">

                    {form.presentacionesAdicionales.map(
                      (
                        presentacion,
                        index
                      ) => (

                        <div
                          className="productos-extra-card"
                          key={index}
                        >

                          <div className="productos-extra-grid">


                            <label>
                              Presentación

                              <select
                                value={
                                  presentacion.nombre
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "nombre",
                                    event.target.value
                                  )
                                }
                              >

                                <option value="">
                                  Seleccione
                                </option>

                                {OPCIONES_PRESENTACION.map(
                                  (opcion) => (
                                    <option
                                      key={opcion}
                                      value={opcion}
                                    >
                                      {opcion}
                                    </option>
                                  )
                                )}

                              </select>

                            </label>


                            <label>
                              Tipo venta

                              <select
                                value={
                                  presentacion.tipoVenta
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "tipoVenta",
                                    event.target.value
                                  )
                                }
                              >

                                <option value="Unidad">
                                  Por unidad
                                </option>

                                <option value="Peso">
                                  Por peso
                                </option>

                              </select>

                            </label>


                            <label>
                              Unidad

                              <select
                                value={
                                  presentacion.unidad
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "unidad",
                                    event.target.value
                                  )
                                }
                              >

                                {OPCIONES_UNIDAD.map(
                                  (opcion) => (
                                    <option
                                      key={opcion}
                                      value={opcion}
                                    >
                                      {opcion}
                                    </option>
                                  )
                                )}

                              </select>

                            </label>


                            <label>
                              Valor unitario

                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  formatearMoneda(
                                    presentacion.precioCompra
                                  )
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "precioCompra",
                                    event.target.value
                                  )
                                }
                                placeholder="$ 0"
                              />

                            </label>


                            <label>
                              Precio venta

                              <input
                                type="text"
                                inputMode="numeric"
                                value={
                                  formatearMoneda(
                                    presentacion.precioVenta
                                  )
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "precioVenta",
                                    event.target.value
                                  )
                                }
                                placeholder="$ 0"
                              />

                            </label>


                            <label>
                              Stock inicial

                              <input
                                type="number"
                                min="0"
                                value={
                                  presentacion.stock
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "stock",
                                    event.target.value
                                  )
                                }
                              />

                            </label>


                            <label>
                              Stock mínimo

                              <input
                                type="number"
                                min="0"
                                value={
                                  presentacion.stockMinimo
                                }
                                onChange={(event) =>
                                  cambiarPresentacionAdicional(
                                    index,
                                    "stockMinimo",
                                    event.target.value
                                  )
                                }
                              />

                            </label>


                            <button
                              type="button"
                              className="productos-remove-extra"
                              onClick={() =>
                                eliminarPresentacionAdicional(
                                  index
                                )
                              }
                            >
                              ×
                            </button>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </div>


              {/* SABORES */}

              <div className="productos-form-section">

                <h4>
                  Sabores / Variantes
                </h4>


                <div className="productos-sabor-add">

                  <input
                    value={
                      nuevoSabor
                    }
                    onChange={
                      (event) =>
                        setNuevoSabor(
                          event.target.value
                        )
                    }
                    onKeyDown={
                      (event) => {

                        if (
                          event.key ===
                          "Enter"
                        ) {
                          event.preventDefault();

                          agregarSabor();
                        }

                      }
                    }
                    placeholder="Ej. Fresa"
                  />


                  <button
                    type="button"
                    onClick={
                      agregarSabor
                    }
                  >
                    Agregar
                  </button>

                </div>


                <div className="productos-sabores-list">

                  {form.sabores.length ===
                  0 ? (

                    <span className="productos-no-sabores">
                      Sin sabores o variantes.
                    </span>

                  ) : (

                    form.sabores.map(
                      (sabor) => (

                        <span
                          key={sabor}
                          className="productos-sabor-chip"
                        >

                          {sabor}

                          <button
                            type="button"
                            onClick={() =>
                              eliminarSabor(
                                sabor
                              )
                            }
                          >
                            ×
                          </button>

                        </span>

                      )
                    )

                  )}

                </div>

              </div>

            </div>


            {/* FOOTER MODAL */}

            <div className="productos-form-actions">

              <button
                type="button"
                className="productos-form-cancel"
                onClick={
                  cerrarFormulario
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="productos-form-save"
                onClick={
                  guardarProducto
                }
                disabled={
                  guardando
                }
              >

                <img
                  src={guardarIcon}
                  alt=""
                />

                Guardar

              </button>

            </div>

          </div>

        </div>

      )}


      {/* MODAL BUSCAR */}

      {modalBuscarAbierto && (

        <div className="productos-search-modal-overlay">

          <div
            ref={modalBuscarRef}
            className="productos-search-modal"
            style={{
              left:
                posicionModal.x,

              top:
                posicionModal.y,
            }}
          >

            <div
              className="productos-search-modal-header"
              onMouseDown={
                iniciarArrastreModal
              }
            >

              <h3>
                Buscar productos
              </h3>


              <button
                type="button"
                onMouseDown={
                  (event) =>
                    event.stopPropagation()
                }
                onClick={() =>
                  setModalBuscarAbierto(
                    false
                  )
                }
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>


            <div className="productos-search-modal-filters">

              <select
                value={
                  campoBuscar
                }
                onChange={
                  (event) =>
                    setCampoBuscar(
                      event.target.value
                    )
                }
              >

                <option value="todos">
                  Todos
                </option>

                <option value="codigo">
                  Código
                </option>

                <option value="nombre">
                  Producto
                </option>

                <option value="categoria">
                  Categoría
                </option>

                <option value="tipoVenta">
                  Tipo venta
                </option>

                <option value="unidad">
                  Unidad
                </option>

                <option value="estado">
                  Estado
                </option>

              </select>


              <div className="productos-search-modal-input">

                <img
                  src={buscarIcon}
                  alt=""
                />

                <input
                  type="text"
                  value={
                    filtroBuscar
                  }
                  onChange={
                    (event) =>
                      setFiltroBuscar(
                        event.target.value
                      )
                  }
                  placeholder="Buscar producto..."
                  autoFocus
                />

              </div>

            </div>


            <div className="productos-search-modal-table-wrap">

              <table className="productos-search-modal-table">

                <thead>

                  <tr>
                    <th>Código</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Tipo venta</th>
                    <th>Unidad</th>
                    <th>Precio</th>
                    <th>Estado</th>
                  </tr>

                </thead>


                <tbody>

                  {productosBusqueda.length ===
                  0 ? (

                    <tr>

                      <td
                        colSpan="7"
                        className="productos-search-empty"
                      >
                        No se encontraron productos.
                      </td>

                    </tr>

                  ) : (

                    productosBusqueda.map(
                      (producto) => (

                        <tr
                          key={
                            producto._id
                          }
                          onDoubleClick={() => {

                            setProductoSeleccionado(
                              producto
                            );

                            setModalBuscarAbierto(
                              false
                            );

                          }}
                        >

                          <td>
                            <strong>
                              {producto.codigo}
                            </strong>
                          </td>


                          <td>
                            {producto.nombre}
                          </td>


                          <td>
                            {producto.categoria
                              ?.nombre ||
                              "Sin categoría"}
                          </td>


                          <td>
                            {producto.tipoVenta === "Peso"
                              ? "Por peso"
                              : "Por unidad"}
                          </td>


                          <td>
                            {producto.unidad || "—"}
                          </td>


                          <td>
                            {formatearMoneda(
                              producto.precioVenta
                            )}
                          </td>


                          <td>

                            <span
                              className={
                                producto.estado ===
                                "Activo"
                                  ? "productos-status active"
                                  : "productos-status inactive"
                              }
                            >
                              {producto.estado}
                            </span>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}