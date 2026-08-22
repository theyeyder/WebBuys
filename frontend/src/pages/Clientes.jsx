import { useEffect, useMemo, useState } from "react";

import AppLayout from "../layouts/AppLayout.jsx";

import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../services/cliente.service.js";

import {
  listarZonasDespacho,
} from "../services/zonaDespacho.service.js";

import "../styles/clientes.css";
import clientesPrintCss from "../styles/clientes-print.css?inline";

// Iconos
import clientesIcon from "../assets/icons/clientes.png";
import buscarIcon from "../assets/icons/buscar.png";
import guardarIcon from "../assets/icons/guardar.png";
import nuevoClienteIcon from "../assets/icons/nuevo-cliente.png";
import editarClienteIcon from "../assets/icons/editar-cliente.png";
import eliminarClienteIcon from "../assets/icons/eliminar-cliente.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import imprimirIcon from "../assets/icons/imprimir.png";


/* =========================================
   FORMULARIO INICIAL
========================================= */

const FORM_INICIAL = {
  tipoDocumento: "CC",
  documento: "",
  nombre: "",
  razonSocial: "",
  telefono: "",
  direccion: "",
  barrio: "",
  zonaDespacho: "",
  ciudad: "Ibagué",
  tipoCliente: "Tienda",
  estado: true,
};


/* =========================================
   COMPONENTE
========================================= */

export default function Clientes() {

  const [clientes, setClientes] = useState([]);
  const [zonas, setZonas] = useState([]);

  const [form, setForm] = useState(FORM_INICIAL);

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState(null);

  const [modoEdicion, setModoEdicion] = useState(false);

  const [filtro, setFiltro] = useState("");

  const [paginaActual, setPaginaActual] = useState(1);
  const CLIENTES_POR_PAGINA = 5;

  const [orden, setOrden] = useState({
    campo: "nombre",
    direccion: "asc",
  });

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");


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
     CARGAR CLIENTES
  ========================================= */

  async function cargarClientes() {

    try {

      setCargando(true);

      const data = await listarClientes();

      setClientes(
        Array.isArray(data)
          ? data
          : data?.clientes || data?.data || []
      );

    } catch (error) {

      console.error(error);

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar los clientes."
      );

      setTipoMensaje("error");

    } finally {

      setCargando(false);

    }

  }


  /* =========================================
     CARGAR ZONAS DE DESPACHO
  ========================================= */

  async function cargarZonas() {

    try {

      const data = await listarZonasDespacho();

      setZonas(
        Array.isArray(data)
          ? data
          : data?.zonas || data?.data || []
      );

    } catch (error) {

      console.error(error);

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar las zonas de despacho."
      );

      setTipoMensaje("error");

    }

  }


  useEffect(() => {

    cargarClientes();
    cargarZonas();

  }, []);


  /* =========================================
     OCULTAR NOTIFICACIONES
     DESPUÉS DE 3 SEGUNDOS
  ========================================= */

  useEffect(() => {

    if (!mensaje) return;

    const timer = setTimeout(() => {
      setMensaje("");
    }, 3000);

    return () => clearTimeout(timer);

  }, [mensaje]);


  /* =========================================
     CAMBIAR CAMPOS
  ========================================= */

  function cambiar(e) {

    const {
      name,
      value,
    } = e.target;

    setForm((actual) => ({
      ...actual,

      [name]:
        name === "estado"
          ? value === "true"
          : value,
    }));

  }


  /* =========================================
     NUEVO CLIENTE
  ========================================= */

  function nuevoCliente() {

    setClienteSeleccionado(null);

    setModoEdicion(false);

    setForm(FORM_INICIAL);

    setMensaje("");

    setTipoMensaje("info");

  }


  /* =========================================
     SELECCIONAR CLIENTE
  ========================================= */

  function seleccionarCliente(cliente) {

    setClienteSeleccionado(cliente);

    setMensaje("");

  }


  /* =========================================
     EDITAR CLIENTE SELECCIONADO
  ========================================= */

  function editarClienteSeleccionado() {

    if (!clienteSeleccionado) {

      setMensaje("Seleccione primero un cliente.");

      setTipoMensaje("info");

      return;

    }

    const cliente = clienteSeleccionado;

    setForm({

      tipoDocumento:
        cliente.tipoDocumento || "CC",

      documento:
        cliente.documento || "",

      nombre:
        cliente.nombre || "",

      razonSocial:
        cliente.razonSocial || "",

      telefono:
        cliente.telefono || "",

      direccion:
        cliente.direccion || "",

      barrio:
        cliente.barrio || "",

      zonaDespacho:
        cliente.zonaDespacho?._id ||
        cliente.zonaDespacho ||
        "",

      ciudad:
        cliente.ciudad || "Ibagué",

      tipoCliente:
        cliente.tipoCliente || "Tienda",

      estado:
        cliente.estado ?? true,

    });

    setModoEdicion(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  }


  /* =========================================
     ACTIVAR / DESACTIVAR CLIENTE SELECCIONADO
  ========================================= */

  async function cambiarEstadoClienteSeleccionado() {

    if (!clienteSeleccionado?._id) {

      setMensaje("Seleccione primero un cliente.");

      setTipoMensaje("info");

      return;

    }

    try {

      const nuevoEstado =
        !clienteSeleccionado.estado;

      await actualizarCliente(
        clienteSeleccionado._id,
        {
          estado: nuevoEstado,
        }
      );

      setMensaje(
        nuevoEstado
          ? "Cliente activado correctamente."
          : "Cliente desactivado correctamente."
      );

      setTipoMensaje("success");

      setClienteSeleccionado((actual) => ({
        ...actual,
        estado: nuevoEstado,
      }));

      setForm((actual) => ({
        ...actual,
        estado: nuevoEstado,
      }));

      await cargarClientes();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cambiar el estado del cliente."
      );

      setTipoMensaje("error");

    }

  }


  /* =========================================
     ELIMINAR CLIENTE SELECCIONADO
  ========================================= */

  async function eliminarClienteSeleccionado() {

    if (!clienteSeleccionado?._id) {

      setMensaje("Seleccione primero un cliente.");

      setTipoMensaje("info");

      return;

    }

    const confirmar = window.confirm(
      `¿Deseas eliminar al cliente "${clienteSeleccionado.nombre}"?`
    );

    if (!confirmar) return;

    try {

      await eliminarCliente(
        clienteSeleccionado._id
      );

      setMensaje(
        "Cliente eliminado correctamente."
      );

      setTipoMensaje("success");

      setClienteSeleccionado(null);

      setModoEdicion(false);

      setForm(FORM_INICIAL);

      await cargarClientes();

    } catch (error) {

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible eliminar el cliente."
      );

      setTipoMensaje("error");

    }

  }


  /* =========================================
     VALIDAR FORMULARIO
  ========================================= */

  function validarFormulario() {

    const documento = form.documento.trim();
    const nombre = form.nombre.trim();
    const telefono = form.telefono.trim();

    if (!documento) {

      setMensaje(
        "El número de documento es obligatorio."
      );

      setTipoMensaje("error");

      return false;

    }

    if (!nombre) {

      setMensaje(
        "El nombre del cliente es obligatorio."
      );

      setTipoMensaje("error");

      return false;

    }

    /* =========================
       VALIDAR CC
    ========================= */

    if (
      form.tipoDocumento === "CC" &&
      !/^\d{5,12}$/.test(documento)
    ) {

      setMensaje(
        "La cédula debe contener únicamente números (5-12 dígitos)."
      );

      setTipoMensaje("error");

      return false;

    }

    /* =========================
       VALIDAR NIT
    ========================= */

    if (
      form.tipoDocumento === "NIT" &&
      !/^\d{8,10}-?\d?$/.test(documento)
    ) {

      setMensaje(
        "Ingrese un NIT válido. Ejemplo: 900123456-7"
      );

      setTipoMensaje("error");

      return false;

    }

    /* =========================
       VALIDAR TELÉFONO
    ========================= */

    if (
      telefono &&
      !/^\d{7,10}$/.test(telefono)
    ) {

      setMensaje(
        "El teléfono debe contener entre 7 y 10 números."
      );

      setTipoMensaje("error");

      return false;

    }

    /* =========================
       DOCUMENTO DUPLICADO
    ========================= */

    const documentoExiste = clientes.some(
      (cliente) =>
        cliente.documento
          ?.trim()
          .toLowerCase() ===
          documento.toLowerCase() &&
        cliente._id !==
          clienteSeleccionado?._id
    );

    if (documentoExiste) {

      setMensaje(
        "Ya existe un cliente registrado con este documento."
      );

      setTipoMensaje("error");

      return false;

    }

    return true;

  }


  /* =========================================
     GUARDAR CLIENTE
  ========================================= */

  async function guardarCliente() {

    if (!validarFormulario()) {
      return;
    }

    try {

      setGuardando(true);
      setMensaje("");

      const datos = {

        tipoDocumento:
          form.tipoDocumento,

        documento:
          form.documento.trim(),

        nombre:
          form.nombre.trim(),

        razonSocial:
          form.razonSocial.trim(),

        telefono:
          form.telefono.trim(),

        direccion:
          form.direccion.trim(),

        barrio:
          form.barrio.trim(),

        zonaDespacho:
          form.zonaDespacho || null,

        ciudad:
          form.ciudad.trim() || "Ibagué",

        tipoCliente:
          form.tipoCliente,

        estado:
          form.estado,

      };

      /* EDITAR */

      if (
        modoEdicion &&
        clienteSeleccionado?._id
      ) {

        await actualizarCliente(
          clienteSeleccionado._id,
          datos
        );

        setMensaje(
          "Cliente actualizado correctamente."
        );

      }

      /* CREAR */

      else {

        await crearCliente(datos);

        setMensaje(
          "Cliente creado correctamente."
        );

      }


      setTipoMensaje("success");

      await cargarClientes();

      setForm(FORM_INICIAL);

      setClienteSeleccionado(null);

      setModoEdicion(false);

      setPaginaActual(1);


    } catch (error) {

      console.error(error);

      const mensajeBackend =
        error?.response?.data?.mensaje ||
        error?.response?.data?.message;

      if (
        error?.response?.status === 409 ||
        error?.response?.status === 11000
      ) {

        setMensaje(
          "Ya existe un cliente con este documento."
        );

      } else {

        setMensaje(
          mensajeBackend ||
          "No fue posible guardar el cliente."
        );

      }

      setTipoMensaje("error");


    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     CAMBIAR ESTADO DESDE LA TABLA
  ========================================= */

  async function cambiarEstadoCliente(cliente) {

    try {

      const nuevoEstado = !cliente.estado;

      await actualizarCliente(
        cliente._id,
        {
          estado: nuevoEstado,
        }
      );

      setMensaje(
        nuevoEstado
          ? "Cliente activado correctamente."
          : "Cliente desactivado correctamente."
      );

      setTipoMensaje("success");

      if (
        clienteSeleccionado?._id === cliente._id
      ) {

        setForm((actual) => ({
          ...actual,
          estado: nuevoEstado,
        }));

      }

      await cargarClientes();


    } catch (error) {

      console.error(error);

      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cambiar el estado del cliente."
      );

      setTipoMensaje("error");

    }

  }


  /* =========================================
     CAMBIAR ORDEN
  ========================================= */

  function cambiarOrden(campo) {

    setOrden((actual) => {

      if (actual.campo === campo) {

        return {
          campo,
          direccion:
            actual.direccion === "asc"
              ? "desc"
              : "asc",
        };

      }

      return {
        campo,
        direccion: "asc",
      };

    });

    setPaginaActual(1);

  }


  /* =========================================
     IMPRIMIR CLIENTES
  ========================================= */

  function imprimirClientes() {

    if (clientes.length === 0) {

      setMensaje("No hay clientes para imprimir.");

      setTipoMensaje("info");

      return;

    }

    const filas = clientes
      .map((cliente) => {

        const tipoDocumento =
          cliente.tipoDocumento || "-";

        const documento =
          cliente.documento || "-";

        const nombre =
          cliente.nombre || "-";

        const telefono =
          cliente.telefono || "-";

        const direccion =
          cliente.direccion || "-";

        const barrio =
          cliente.barrio || "-";

        const zona =
          obtenerNombreZona(cliente);

        const tipoCliente =
          cliente.tipoCliente || "-";

        const estado =
          cliente.estado
            ? "Activo"
            : "Inactivo";

        return `
          <tr>

            <td class="clientes-print-document">
              <strong>
                ${escaparHtml(tipoDocumento)}
              </strong>

              ${escaparHtml(documento)}
            </td>

            <td>
              ${escaparHtml(nombre)}
            </td>

            <td>
              ${escaparHtml(telefono)}
            </td>

            <td>
              ${escaparHtml(direccion)}
            </td>

            <td>
              ${escaparHtml(barrio)}
            </td>

            <td>
              ${escaparHtml(zona)}
            </td>

            <td>
              ${escaparHtml(tipoCliente)}
            </td>

            <td class="clientes-print-status">
              ${estado}
            </td>

          </tr>
        `;

      })
      .join("");

    const ventanaImpresion =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!ventanaImpresion) {

      setMensaje(
        "El navegador bloqueó la ventana de impresión."
      );

      setTipoMensaje("error");

      return;

    }

    ventanaImpresion.document.write(`
      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8" />

          <meta
            name="viewport"
            content="width=device-width, initial-scale=1"
          />

          <title>
            Clientes registrados - WebBuys
          </title>

          <style>
            ${clientesPrintCss}
          </style>

        </head>

        <body>

          <main class="clientes-print-page">

            <header class="clientes-print-header">

              <h1>
                Clientes registrados
              </h1>

              <p>
                WebBuys - Listado de clientes
              </p>

            </header>


            <table class="clientes-print-table">

              <thead>

                <tr>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Dirección</th>
                  <th>Barrio</th>
                  <th>Zona</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>

              </thead>

              <tbody>
                ${filas}
              </tbody>

            </table>


            <div class="clientes-print-total">

              Total clientes:

              <strong>
                ${clientes.length}
              </strong>

            </div>


            <footer class="clientes-print-footer">
              WebBuys
            </footer>

          </main>

        </body>

      </html>
    `);

    ventanaImpresion.document.close();

    ventanaImpresion.focus();

    setTimeout(() => {
      ventanaImpresion.print();
    }, 300);

  }


  /* =========================================
     CLIENTES FILTRADOS
  ========================================= */

  const clientesFiltrados = useMemo(() => {

    const textoBusqueda =
      filtro.trim().toLowerCase();

    if (!textoBusqueda) {
      return clientes;
    }

    return clientes.filter((cliente) => {

      const zona =
        cliente.zonaDespacho?.nombre || "";

      const texto = `
        ${cliente.tipoDocumento || ""}
        ${cliente.documento || ""}
        ${cliente.nombre || ""}
        ${cliente.razonSocial || ""}
        ${cliente.telefono || ""}
        ${cliente.direccion || ""}
        ${cliente.barrio || ""}
        ${zona}
        ${cliente.ciudad || ""}
        ${cliente.tipoCliente || ""}
      `.toLowerCase();

      return texto.includes(textoBusqueda);

    });

  }, [clientes, filtro]);


  /* =========================================
     CLIENTES ORDENADOS
  ========================================= */

  const clientesOrdenados = useMemo(() => {

    const lista = [...clientesFiltrados];

    lista.sort((a, b) => {

      let valorA = "";
      let valorB = "";

      switch (orden.campo) {

        case "documento":
          valorA = `${a.tipoDocumento || ""} ${a.documento || ""}`;
          valorB = `${b.tipoDocumento || ""} ${b.documento || ""}`;
          break;

        case "nombre":
          valorA = a.nombre || "";
          valorB = b.nombre || "";
          break;

        case "barrio":
          valorA = a.barrio || "";
          valorB = b.barrio || "";
          break;

        case "zona":
          valorA =
            a.zonaDespacho?.nombre ||
            obtenerNombreZona(a) ||
            "";

          valorB =
            b.zonaDespacho?.nombre ||
            obtenerNombreZona(b) ||
            "";
          break;

        case "estado":
          valorA = a.estado ? "Activo" : "Inactivo";
          valorB = b.estado ? "Activo" : "Inactivo";
          break;

        default:
          return 0;

      }

      const resultado = String(valorA).localeCompare(
        String(valorB),
        "es",
        {
          sensitivity: "base",
          numeric: true,
        }
      );

      return orden.direccion === "asc"
        ? resultado
        : -resultado;

    });

    return lista;

  }, [clientesFiltrados, orden, zonas]);


  /* =========================================
     PAGINACIÓN
  ========================================= */

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      clientesOrdenados.length /
        CLIENTES_POR_PAGINA
    )
  );

  const indiceInicial =
    (paginaActual - 1) *
    CLIENTES_POR_PAGINA;

  const indiceFinal =
    indiceInicial +
    CLIENTES_POR_PAGINA;

  const clientesPaginados =
    clientesOrdenados.slice(
      indiceInicial,
      indiceFinal
    );


  /* =========================================
     OBTENER NOMBRE ZONA
  ========================================= */

  function obtenerNombreZona(cliente) {

    if (
      cliente.zonaDespacho &&
      typeof cliente.zonaDespacho === "object"
    ) {

      return cliente.zonaDespacho.nombre || "-";

    }

    const zonaEncontrada =
      zonas.find(
        (zona) =>
          zona._id === cliente.zonaDespacho
      );

    return zonaEncontrada?.nombre || "-";

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <AppLayout title="Clientes">

      <div className="clientes-page">


        {/* ===============================
            MENSAJES
        =============================== */}

        {mensaje && (

          <div
            className={`clientes-alert clientes-alert--${tipoMensaje}`}
          >
            {mensaje}
          </div>

        )}


        {/* ===============================
            TARJETA PRINCIPAL
        =============================== */}

        <section className="clientes-card">


          {/* ===============================
              BARRA SUPERIOR
          =============================== */}

          <div className="clientes-title-bar">

            <div className="clientes-title-info">

              <div className="clientes-title-icon">
                <img
                  src={clientesIcon}
                  alt=""
                />
              </div>

              <div>

                <h2>
                  {clienteSeleccionado
                    ? "Editar Cliente"
                    : "Clientes"}
                </h2>

              </div>

            </div>


            <div className="clientes-title-actions">


              {/* NUEVO */}

              <button
                type="button"
                className="clientes-icon-btn"
                onClick={nuevoCliente}
                data-tooltip="Nuevo cliente"
                aria-label="Nuevo cliente"
                disabled={guardando}
              >
                <img
                  src={nuevoClienteIcon}
                  alt=""
                />
              </button>


              {/* EDITAR */}

              <button
                type="button"
                className="clientes-icon-btn clientes-icon-btn-edit"
                onClick={editarClienteSeleccionado}
                data-tooltip="Editar cliente"
                aria-label="Editar cliente"
                disabled={
                  guardando ||
                  !clienteSeleccionado
                }
              >
                <img
                  src={editarClienteIcon}
                  alt=""
                />
              </button>


              {/* ACTIVAR / DESACTIVAR */}

              <button
                type="button"
                className="clientes-icon-btn"
                onClick={cambiarEstadoClienteSeleccionado}
                data-tooltip={
                  clienteSeleccionado?.estado
                    ? "Desactivar cliente"
                    : "Activar cliente"
                }
                aria-label={
                  clienteSeleccionado?.estado
                    ? "Desactivar cliente"
                    : "Activar cliente"
                }
                disabled={
                  guardando ||
                  !clienteSeleccionado
                }
              >
                <img
                  src={
                    clienteSeleccionado?.estado
                      ? bloquearIcon
                      : desbloquearIcon
                  }
                  alt=""
                />
              </button>


              {/* ELIMINAR */}

              <button
                type="button"
                className="clientes-icon-btn clientes-icon-btn-delete"
                onClick={eliminarClienteSeleccionado}
                data-tooltip="Eliminar cliente"
                aria-label="Eliminar cliente"
                disabled={
                  guardando ||
                  !clienteSeleccionado
                }
              >
                <img
                  src={eliminarClienteIcon}
                  alt=""
                />
              </button>


              {/* IMPRIMIR */}

              <button
                type="button"
                className="clientes-icon-btn"
                onClick={imprimirClientes}
                data-tooltip="Imprimir clientes"
                aria-label="Imprimir clientes"
                disabled={
                  guardando ||
                  clientes.length === 0
                }
              >
                <img
                  src={imprimirIcon}
                  alt=""
                />
              </button>


              {/* GUARDAR */}

              <button
                type="button"
                className="clientes-icon-btn"
                onClick={guardarCliente}
                data-tooltip={
                  modoEdicion
                    ? "Guardar cambios"
                    : "Guardar cliente"
                }
                aria-label={
                  modoEdicion
                    ? "Guardar cambios"
                    : "Guardar cliente"
                }
                disabled={guardando}
              >
                <img
                  src={guardarIcon}
                  alt=""
                />
              </button>


            </div>

          </div>


          {/* ===============================
              FORMULARIO
          =============================== */}

          <div className="clientes-form-grid">


            {/* TIPO DOCUMENTO */}

            <div className="clientes-field clientes-field-tipo">

              <label>
                Tipo
              </label>

              <select
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={cambiar}
                disabled={guardando}
              >
                <option value="CC">
                  CC
                </option>

                <option value="NIT">
                  NIT
                </option>
              </select>

            </div>


            {/* DOCUMENTO */}

            <div className="clientes-field">

              <label>
                Documento *
              </label>

              <input
                type="text"
                name="documento"
                value={form.documento}
                onChange={cambiar}
                placeholder={
                  form.tipoDocumento === "NIT"
                    ? "900123456-7"
                    : "Número de cédula"
                }
                disabled={guardando}
              />

            </div>


            {/* NOMBRE */}

            <div className="clientes-field">

              <label>
                Nombre *
              </label>

              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={cambiar}
                placeholder="Nombre del cliente"
                disabled={guardando}
              />

            </div>


            {/* RAZÓN SOCIAL */}

            <div className="clientes-field">

              <label>
                Razón social
              </label>

              <input
                type="text"
                name="razonSocial"
                value={form.razonSocial}
                onChange={cambiar}
                placeholder="Razón social"
                disabled={guardando}
              />

            </div>


            {/* TELÉFONO */}

            <div className="clientes-field">

              <label>
                Teléfono
              </label>

              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={cambiar}
                placeholder="Teléfono"
                disabled={guardando}
              />

            </div>


            {/* DIRECCIÓN */}

            <div className="clientes-field">

              <label>
                Dirección
              </label>

              <input
                type="text"
                name="direccion"
                value={form.direccion}
                onChange={cambiar}
                placeholder="Dirección"
                disabled={guardando}
              />

            </div>


            {/* BARRIO */}

            <div className="clientes-field">

              <label>
                Barrio
              </label>

              <input
                type="text"
                name="barrio"
                value={form.barrio}
                onChange={cambiar}
                placeholder="Barrio"
                disabled={guardando}
              />

            </div>


            {/* ZONA */}

            <div className="clientes-field">

              <label>
                Zona de despacho
              </label>

              <select
                name="zonaDespacho"
                value={form.zonaDespacho}
                onChange={cambiar}
                disabled={guardando}
              >

                <option value="">
                  Seleccione una zona
                </option>

                {zonas
                  .filter(
                    (zona) =>
                      zona.estado === "Activa" ||
                      zona.estado === true
                  )
                  .map((zona) => (

                    <option
                      key={zona._id}
                      value={zona._id}
                    >
                      {zona.nombre}
                    </option>

                  ))}

              </select>

            </div>


            {/* CIUDAD */}

            <div className="clientes-field">

              <label>
                Ciudad
              </label>

              <input
                type="text"
                name="ciudad"
                value={form.ciudad}
                onChange={cambiar}
                placeholder="Ciudad"
                disabled={guardando}
              />

            </div>


            {/* TIPO CLIENTE */}

            <div className="clientes-field">

              <label>
                Tipo de cliente
              </label>

              <select
                name="tipoCliente"
                value={form.tipoCliente}
                onChange={cambiar}
                disabled={guardando}
              >

                <option value="Tienda">
                  Tienda
                </option>

                <option value="Restaurante">
                  Restaurante
                </option>

                <option value="Supermercado">
                  Supermercado
                </option>

                <option value="Persona Natural">
                  Persona Natural
                </option>

                <option value="Otro">
                  Otro
                </option>

              </select>

            </div>


            {/* ESTADO */}

            <div className="clientes-field clientes-field-estado">

              <label>
                Estado
              </label>

              <select
                name="estado"
                value={
                  form.estado
                    ? "true"
                    : "false"
                }
                onChange={cambiar}
                disabled={guardando}
              >

                <option value="true">
                  Activo
                </option>

                <option value="false">
                  Inactivo
                </option>

              </select>

            </div>

          </div>


          {/* ===============================
              BUSCADOR
          =============================== */}

          <div className="clientes-search-bar">

            <div className="clientes-search-box">

              <img
                src={buscarIcon}
                alt=""
                className="clientes-search-icon"
              />

              <input
                type="text"
                value={filtro}
                onChange={(e) => {
                  setFiltro(e.target.value);
                  setPaginaActual(1);
                }}
                placeholder="Buscar por documento, nombre, teléfono, barrio, zona..."
              />

              {filtro && (

                <button
                  type="button"
                  className="clientes-clear-search"
                  onClick={() => {
                    setFiltro("");
                    setPaginaActual(1);
                  }}
                  title="Limpiar búsqueda"
                >
                  ×
                </button>

              )}

            </div>


            <div className="clientes-counter">

              <strong>
                {clientesFiltrados.length}
              </strong>

              <span>
                {clientesFiltrados.length === 1
                  ? "cliente"
                  : "clientes"}
              </span>

            </div>

          </div>


          {/* ===============================
              TABLA
          =============================== */}

          <div className="clientes-table-wrap">

            <table className="clientes-table">

              <thead>

                <tr>

                  <th>
                    <button
                      type="button"
                      className="clientes-sort-btn"
                      onClick={() =>
                        cambiarOrden("documento")
                      }
                    >
                      Documento

                      {orden.campo === "documento" && (
                        <span>
                          {orden.direccion === "asc"
                            ? " ↑"
                            : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="clientes-sort-btn"
                      onClick={() =>
                        cambiarOrden("nombre")
                      }
                    >
                      Cliente

                      {orden.campo === "nombre" && (
                        <span>
                          {orden.direccion === "asc"
                            ? " ↑"
                            : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>

                  <th>
                    Teléfono
                  </th>

                  <th>
                    <button
                      type="button"
                      className="clientes-sort-btn"
                      onClick={() =>
                        cambiarOrden("barrio")
                      }
                    >
                      Barrio

                      {orden.campo === "barrio" && (
                        <span>
                          {orden.direccion === "asc"
                            ? " ↑"
                            : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>

                  <th>
                    <button
                      type="button"
                      className="clientes-sort-btn"
                      onClick={() =>
                        cambiarOrden("zona")
                      }
                    >
                      Zona

                      {orden.campo === "zona" && (
                        <span>
                          {orden.direccion === "asc"
                            ? " ↑"
                            : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>

                  <th>
                    Tipo
                  </th>

                  <th>
                    <button
                      type="button"
                      className="clientes-sort-btn"
                      onClick={() =>
                        cambiarOrden("estado")
                      }
                    >
                      Estado

                      {orden.campo === "estado" && (
                        <span>
                          {orden.direccion === "asc"
                            ? " ↑"
                            : " ↓"}
                        </span>
                      )}
                    </button>
                  </th>

                </tr>

              </thead>


              <tbody>

                {cargando ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="clientes-table-message"
                    >
                      Cargando clientes...
                    </td>

                  </tr>

                ) : clientesPaginados.length > 0 ? (

                  clientesPaginados.map(
                    (cliente) => (

                      <tr
                        key={cliente._id}
                        className={
                          clienteSeleccionado?._id ===
                          cliente._id
                            ? "clientes-row-selected"
                            : ""
                        }
                        onClick={() =>
                          seleccionarCliente(cliente)
                        }
                      >


                        {/* DOCUMENTO */}

                        <td>

                          <div className="clientes-document-cell">

                            <span className="clientes-document-type">
                              {cliente.tipoDocumento || "-"}
                            </span>

                            <strong>
                              {cliente.documento}
                            </strong>

                          </div>

                        </td>


                        {/* CLIENTE */}

                        <td>

                          <div className="clientes-name-cell">

                            <strong>
                              {cliente.nombre}
                            </strong>

                            {cliente.razonSocial && (

                              <small>
                                {cliente.razonSocial}
                              </small>

                            )}

                          </div>

                        </td>


                        {/* TELÉFONO */}

                        <td>
                          {cliente.telefono || "-"}
                        </td>


                        {/* BARRIO */}

                        <td>
                          {cliente.barrio || "-"}
                        </td>


                        {/* ZONA */}

                        <td>

                          <span className="clientes-zone-badge">

                            {obtenerNombreZona(cliente)}

                          </span>

                        </td>


                        {/* TIPO */}

                        <td>
                          {cliente.tipoCliente || "-"}
                        </td>


                        {/* ESTADO */}

                        <td>

                          <span
                            className={
                              cliente.estado
                                ? "clientes-status clientes-status--active"
                                : "clientes-status clientes-status--inactive"
                            }
                          >

                            <i></i>

                            {cliente.estado
                              ? "Activo"
                              : "Inactivo"}

                          </span>

                        </td>

                      </tr>

                    )
                  )

                ) : (

                  <tr>

                    <td
                      colSpan="7"
                      className="clientes-empty"
                    >

                      <div>

                        <strong>
                          No hay clientes
                        </strong>

                        <span>
                          {filtro
                            ? "No encontramos clientes que coincidan con la búsqueda."
                            : "Todavía no hay clientes registrados."}
                        </span>

                      </div>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>


          {/* ===============================
              PAGINACIÓN
          =============================== */}

          {clientesFiltrados.length > 0 && (

            <div className="clientes-pagination">

              <div className="clientes-pagination-info">

                Mostrando{" "}
                <strong>
                  {indiceInicial + 1}
                </strong>
                {" - "}
                <strong>
                  {Math.min(
                    indiceFinal,
                    clientesFiltrados.length
                  )}
                </strong>
                {" de "}
                <strong>
                  {clientesFiltrados.length}
                </strong>
                {" clientes"}

              </div>


              <div className="clientes-pagination-controls">

                <button
                  type="button"
                  onClick={() =>
                    setPaginaActual(
                      (pagina) =>
                        Math.max(1, pagina - 1)
                    )
                  }
                  disabled={paginaActual === 1}
                  title="Página anterior"
                >
                  ‹
                </button>


                <span>
                  Página{" "}
                  <strong>{paginaActual}</strong>
                  {" de "}
                  <strong>{totalPaginas}</strong>
                </span>


                <button
                  type="button"
                  onClick={() =>
                    setPaginaActual(
                      (pagina) =>
                        Math.min(
                          totalPaginas,
                          pagina + 1
                        )
                    )
                  }
                  disabled={
                    paginaActual === totalPaginas
                  }
                  title="Página siguiente"
                >
                  ›
                </button>

              </div>

            </div>

          )}

        </section>

      </div>

    </AppLayout>

  );

}