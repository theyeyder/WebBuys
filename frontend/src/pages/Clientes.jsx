import { useEffect, useMemo, useState } from "react";

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

// Importar Toast y ModulosMenu
import Toast from "../components/Toast.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

// Iconos
import buscarIcon from "../assets/icons/buscar.png";
import guardarIcon from "../assets/icons/guardar.png";
import nuevoClienteIcon from "../assets/icons/nuevo-cliente.png";
import editarClienteIcon from "../assets/icons/editar-cliente.png";
import eliminarClienteIcon from "../assets/icons/eliminar-cliente.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import imprimirIcon from "../assets/icons/imprimir.png";
import cerrarIcon from "../assets/icons/cerrar.png";

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
  ciudad: "",
  tipoCliente: "",
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

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  // Estados para el modal de búsqueda de clientes
  const [modalBuscarClientes, setModalBuscarClientes] =
    useState(false);

  const [filtroBuscarCliente, setFiltroBuscarCliente] =
    useState("");

  const [campoBuscarCliente, setCampoBuscarCliente] =
    useState("todos");


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
     SELECCIONAR CLIENTE DESDE BÚSQUEDA
  ========================================= */

  function seleccionarClienteBusqueda(cliente) {

    setClienteSeleccionado(cliente);

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

    setModalBuscarClientes(false);
    setFiltroBuscarCliente("");

    setMensaje(
      `Cliente ${cliente.nombre} cargado correctamente.`
    );

    setTipoMensaje("success");
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
     FILTRADO PARA BÚSQUEDA EMERGENTE
  ========================================= */

  const clientesBusqueda = useMemo(() => {
    const texto =
      filtroBuscarCliente
        .trim()
        .toLowerCase();

    if (!texto) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const documento =
        String(cliente.documento || "")
          .toLowerCase();

      const nombre =
        String(cliente.nombre || "")
          .toLowerCase();

      const razonSocial =
        String(cliente.razonSocial || "")
          .toLowerCase();

      const telefono =
        String(cliente.telefono || "")
          .toLowerCase();

      const barrio =
        String(cliente.barrio || "")
          .toLowerCase();

      const zona =
        String(
          cliente.zonaDespacho?.nombre || ""
        ).toLowerCase();

      switch (campoBuscarCliente) {
        case "documento":
          return documento.includes(texto);

        case "nombre":
          return nombre.includes(texto);

        case "razonSocial":
          return razonSocial.includes(texto);

        case "telefono":
          return telefono.includes(texto);

        case "barrio":
          return barrio.includes(texto);

        case "zona":
          return zona.includes(texto);

        default:
          return (
            documento.includes(texto) ||
            nombre.includes(texto) ||
            razonSocial.includes(texto) ||
            telefono.includes(texto) ||
            barrio.includes(texto) ||
            zona.includes(texto)
          );
      }
    });
  }, [
    clientes,
    filtroBuscarCliente,
    campoBuscarCliente,
  ]);


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="clientes-page">

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
          MODULOS MENU
      =============================== */}

      <ModulosMenu />

      {/* ===============================
          CABECERA CLIENTES
      =============================== */}

      <div className="clientes-title-bar">

        <div className="clientes-title-info">

          <h2>
            {clienteSeleccionado
              ? "Editar Cliente"
              : "Clientes"}
          </h2>

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

          {/* BUSCAR CLIENTE */}

          <button
            type="button"
            className="clientes-icon-btn"
            onClick={() => {
              setFiltroBuscarCliente("");
              setCampoBuscarCliente("todos");
              setModalBuscarClientes(true);
            }}
            data-tooltip="Buscar cliente"
            aria-label="Buscar cliente"
          >
            <img
              src={buscarIcon}
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

      <div className="clientes-main-form">

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
          MODAL BÚSQUEDA DE CLIENTES
      =============================== */}

      {modalBuscarClientes && (
        <div
          className="clientes-search-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setModalBuscarClientes(false);
            }
          }}
        >
          <div className="clientes-search-modal">

            <div className="clientes-search-modal-header">

              <h3>
                Buscar clientes
              </h3>

              <button
                type="button"
                className="clientes-search-modal-close"
                onClick={() =>
                  setModalBuscarClientes(false)
                }
                aria-label="Cerrar"
                data-tooltip="Cerrar"
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>

            <div className="clientes-search-modal-filters">

              <select
                value={campoBuscarCliente}
                onChange={(event) =>
                  setCampoBuscarCliente(
                    event.target.value
                  )
                }
              >
                <option value="todos">
                  Todos
                </option>

                <option value="documento">
                  Documento
                </option>

                <option value="nombre">
                  Nombre
                </option>

                <option value="razonSocial">
                  Razón social
                </option>

                <option value="telefono">
                  Teléfono
                </option>

                <option value="barrio">
                  Barrio
                </option>

                <option value="zona">
                  Zona
                </option>
              </select>

              <div className="clientes-search-modal-input">

                <img
                  src={buscarIcon}
                  alt=""
                />

                <input
                  type="search"
                  value={filtroBuscarCliente}
                  onChange={(event) =>
                    setFiltroBuscarCliente(
                      event.target.value
                    )
                  }
                  placeholder="Buscar cliente..."
                  autoFocus
                />

              </div>

            </div>

            <div className="clientes-search-modal-table-wrap">

              <table className="clientes-search-modal-table">

                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Cliente</th>
                    <th>Teléfono</th>
                    <th>Barrio</th>
                    <th>Zona</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>

                  {clientesBusqueda.length === 0 ? (

                    <tr>
                      <td
                        colSpan="6"
                        className="clientes-search-empty"
                      >
                        No se encontraron clientes.
                      </td>
                    </tr>

                  ) : (

                    clientesBusqueda.map(
                      (cliente) => (

                        <tr
                          key={cliente._id}
                          onDoubleClick={() =>
                            seleccionarClienteBusqueda(
                              cliente
                            )
                          }
                        >

                          <td>
                            <strong>
                              {cliente.tipoDocumento || "CC"}
                            </strong>{" "}
                            {cliente.documento}
                          </td>

                          <td>
                            {cliente.nombre}
                          </td>

                          <td>
                            {cliente.telefono || "—"}
                          </td>

                          <td>
                            {cliente.barrio || "—"}
                          </td>

                          <td>
                            {cliente.zonaDespacho
                              ?.nombre ||
                              "Sin zona"}
                          </td>

                          <td>
                            {cliente.estado
                              ? "Activo"
                              : "Inactivo"}
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