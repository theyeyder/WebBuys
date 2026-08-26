import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  listarRutas,
  crearRuta,
  actualizarRuta,
  cambiarEstadoRuta,
  eliminarRuta,
  obtenerSiguienteCodigoRuta,
} from "../services/ruta.service.js";

import { listarUsuarios } from "../services/usuario.service.js";

import {
  listarZonasDespacho,
} from "../services/zonaDespacho.service.js";

import Toast from "../components/Toast.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import buscarIcon from "../assets/icons/buscar.png";
import editarIcon from "../assets/icons/Editar-ruta.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import cerrarIcon from "../assets/icons/cerrar.png";
import nuevaRutaIcon from "../assets/icons/nueva-ruta.png";
import guardarIcon from "../assets/icons/guardar.png";
import cancelarIcon from "../assets/icons/cancelar.png";
import EliminarRutaIcon from "../assets/icons/Eliminar ruta.png";
import imprimirIcon from "../assets/icons/imprimir.png";

import "../styles/rutas.css";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const FORM_INICIAL = {
  codigo: "",
  nombre: "",
  descripcion: "",
  empleado: "",
  zonasDespacho: [],
  diasAtencion: [],
  estado: "Activa",
};

export default function Rutas() {
  const [rutas, setRutas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [zonas, setZonas] = useState([]);

  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [modalBuscarAbierto, setModalBuscarAbierto] = useState(false);
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [campoBuscar, setCampoBuscar] = useState("todos");

  const modalBuscarRef = useRef(null);

  const [posicionModal, setPosicionModal] = useState({
    x: 0,
    y: 0,
  });

  const arrastreRef = useRef({
    activo: false,
    offsetX: 0,
    offsetY: 0,
  });

  const [form, setForm] = useState(FORM_INICIAL);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  /* ===========================
     CARGAR DATOS
  =========================== */

  async function cargarRutas() {
    try {
      setCargando(true);
      const data = await listarRutas();
      setRutas(Array.isArray(data) ? data : data?.rutas || []);
    } catch (err) {
      setError(
        err?.response?.data?.mensaje || "No fue posible cargar las rutas."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarEmpleados() {
    try {
      const data = await listarUsuarios();
      const usuarios = Array.isArray(data) ? data : data?.usuarios || [];
      setEmpleados(
        usuarios.filter(
          (usuario) => usuario.rol === "Empleado" && !usuario.bloqueado
        )
      );
    } catch (err) {
      console.error("Error cargando empleados:", err);
    }
  }

  async function cargarZonas() {
    try {
      const data = await listarZonasDespacho();
      setZonas(
        Array.isArray(data)
          ? data
          : data?.zonas || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible cargar las zonas de despacho."
      );
    }
  }

  useEffect(() => {
    cargarRutas();
    cargarEmpleados();
    cargarZonas();
    nuevaRuta();
  }, []);

  /* ===========================
     TOAST 3 SEGUNDOS
  =========================== */

  useEffect(() => {
    if (!mensaje && !error) return;
    const timer = setTimeout(() => {
      setMensaje("");
      setError("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [mensaje, error]);

  /* ===========================
     FILTRAR RUTAS - MODAL
  =========================== */

  const rutasBusqueda = useMemo(() => {
    const texto = filtroBuscar.trim().toLowerCase();

    if (!texto) {
      return rutas;
    }

    return rutas.filter((ruta) => {
      const codigo = String(ruta.codigo || "").toLowerCase();
      const nombre = String(ruta.nombre || "").toLowerCase();
      const empleado = String(
        ruta.empleado?.nombre ||
        ruta.empleado?.usuario ||
        ""
      ).toLowerCase();
      const zonas = Array.isArray(ruta.zonasDespacho)
        ? ruta.zonasDespacho
            .map((zona) =>
              typeof zona === "object"
                ? zona.nombre
                : ""
            )
            .join(" ")
            .toLowerCase()
        : "";

      switch (campoBuscar) {
        case "codigo":
          return codigo.includes(texto);
        case "nombre":
          return nombre.includes(texto);
        case "empleado":
          return empleado.includes(texto);
        case "zona":
          return zonas.includes(texto);
        default:
          return (
            codigo.includes(texto) ||
            nombre.includes(texto) ||
            empleado.includes(texto) ||
            zonas.includes(texto)
          );
      }
    });
  }, [rutas, filtroBuscar, campoBuscar]);

  /* ===========================
     FORMULARIO - RUTAS
  =========================== */

  function cambiar(event) {
    const { name, value } = event.target;
    setForm((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function cambiarDia(dia) {
    setForm((actual) => {
      const seleccionado = actual.diasAtencion.includes(dia);
      return {
        ...actual,
        diasAtencion: seleccionado
          ? actual.diasAtencion.filter((item) => item !== dia)
          : [...actual.diasAtencion, dia],
      };
    });
  }

  async function nuevaRuta() {
    try {
      setError("");
      setMensaje("");

      setRutaSeleccionada(null);
      setModoEdicion(false);

      const data = await obtenerSiguienteCodigoRuta();

      setForm({
        ...FORM_INICIAL,
        codigo: data.codigo || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible obtener el siguiente código."
      );
    }
  }

  function seleccionarRutaBusqueda(ruta) {
    setRutaSeleccionada(ruta);

    setForm({
      codigo: ruta.codigo || "",
      nombre: ruta.nombre || "",
      descripcion: ruta.descripcion || "",
      empleado: ruta.empleado?._id || ruta.empleado || "",
      zonasDespacho: Array.isArray(ruta.zonasDespacho)
        ? ruta.zonasDespacho.map((zona) =>
            typeof zona === "object" ? zona._id : zona
          )
        : [],
      diasAtencion: ruta.diasAtencion || [],
      estado: ruta.estado || "Activa",
    });

    setModoEdicion(true);

    setModalBuscarAbierto(false);
    setFiltroBuscar("");

    setMensaje(`Ruta ${ruta.codigo} cargada correctamente.`);
  }

  /* ===========================
     ACCIONES SUPERIORES
  =========================== */

  function editarRutaSeleccionada() {
    if (!rutaSeleccionada) {
      setError("Seleccione primero una ruta desde Buscar.");
      return;
    }

    setModoEdicion(true);
  }

  async function cambiarEstadoSeleccionado() {
    if (!rutaSeleccionada) {
      setError("Seleccione primero una ruta.");
      return;
    }

    await cambiarEstado(rutaSeleccionada);

    setRutaSeleccionada(null);
    setModoEdicion(false);

    await nuevaRuta();
  }

  async function eliminarRutaSeleccionada() {
    if (!rutaSeleccionada) {
      setError("Seleccione primero una ruta.");
      return;
    }

    await eliminar(rutaSeleccionada);

    setRutaSeleccionada(null);
    setModoEdicion(false);

    await nuevaRuta();
  }

  /* ===========================
     ABRIR BUSCAR RUTAS
  =========================== */

  function abrirBuscarRutas() {
    setFiltroBuscar("");
    setCampoBuscar("todos");

    setPosicionModal({
      x: Math.max(20, (window.innerWidth - 950) / 2),
      y: Math.max(20, (window.innerHeight - 560) / 2),
    });

    setModalBuscarAbierto(true);
  }

  function iniciarArrastreModal(event) {
    if (!modalBuscarRef.current) return;

    const rect = modalBuscarRef.current.getBoundingClientRect();

    arrastreRef.current = {
      activo: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    document.addEventListener("mousemove", moverModal);
    document.addEventListener("mouseup", terminarArrastreModal);
  }

  function moverModal(event) {
    if (!arrastreRef.current.activo) {
      return;
    }

    const modal = modalBuscarRef.current;

    if (!modal) return;

    const ancho = modal.offsetWidth;
    const alto = modal.offsetHeight;

    let x = event.clientX - arrastreRef.current.offsetX;
    let y = event.clientY - arrastreRef.current.offsetY;

    x = Math.max(10, Math.min(window.innerWidth - ancho - 10, x));
    y = Math.max(10, Math.min(window.innerHeight - alto - 10, y));

    setPosicionModal({
      x,
      y,
    });
  }

  function terminarArrastreModal() {
    arrastreRef.current.activo = false;

    document.removeEventListener("mousemove", moverModal);
    document.removeEventListener("mouseup", terminarArrastreModal);
  }

  /* ===========================
   IMPRIMIR RUTAS
=========================== */

function imprimirRutas() {

  if (!rutas.length) {
    setError(
      "No hay rutas registradas para imprimir."
    );
    return;
  }


  const fecha =
    new Date().toLocaleString(
      "es-CO",
      {
        dateStyle: "long",
        timeStyle: "short",
      }
    );


  const filas =
    rutas
      .map((ruta) => {

        const empleado =
          ruta.empleado?.nombre ||
          ruta.empleado?.nombres ||
          ruta.empleado?.usuario ||
          "Sin asignar";


        const zonas =
          ruta.zonasDespacho?.length
            ? ruta.zonasDespacho
                .map(
                  (zona) =>
                    zona?.nombre ||
                    "—"
                )
                .join(", ")
            : "Sin zonas";


        const dias =
          ruta.diasAtencion?.length
            ? ruta.diasAtencion
                .map(
                  (dia) =>
                    dia.slice(0, 3)
                )
                .join(", ")
            : "Sin días";


        return `
          <tr>

            <td class="codigo">
              ${ruta.codigo || "—"}
            </td>

            <td>
              ${ruta.nombre || "—"}
            </td>

            <td>
              ${empleado}
            </td>

            <td>
              ${zonas}
            </td>

            <td>
              ${dias}
            </td>

            <td>
              <span class="${
                ruta.estado === "Activa"
                  ? "estado activo"
                  : "estado inactivo"
              }">
                ${ruta.estado || "—"}
              </span>
            </td>

          </tr>
        `;

      })
      .join("");


  const ventana =
    window.open(
      "",
      "ImprimirRutas",
      "width=1150,height=750,left=100,top=50"
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
        Listado de Rutas
      </title>

      <style>

        * {
          box-sizing: border-box;
        }


        body {
          margin: 0;

          padding: 28px;

          background: #f4f8f6;

          color: #25333d;

          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }


        /* ==========================
           DOCUMENTO
        ========================== */

        .documento {
          width: 100%;
          max-width: 1100px;

          margin: 0 auto;

          overflow: hidden;

          border-radius: 14px;

          background: #ffffff;

          box-shadow:
            0 12px 35px
            rgba(15, 23, 42, 0.10);
        }


        /* ==========================
           CABECERA VERDE
        ========================== */

        .cabecera {
          padding: 24px 30px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 20px;

          background:
            linear-gradient(
              135deg,
              #087443 0%,
              #159a75 55%,
              #20afb2 100%
            );

          color: #ffffff;
        }


        .cabecera h1 {
          margin: 0 0 5px;

          font-size: 24px;
          font-weight: 800;
        }


        .cabecera p {
          margin: 0;

          font-size: 12px;

          opacity: 0.88;
        }


        .cabecera-marca {
          padding: 7px 13px;

          border:
            1px solid
            rgba(255,255,255,0.30);

          border-radius: 8px;

          background:
            rgba(255,255,255,0.12);

          font-size: 12px;
          font-weight: 800;
        }


        /* ==========================
           INFORMACIÓN
        ========================== */

        .informacion {
          padding: 16px 24px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 15px;

          border-bottom:
            1px solid #e6ece9;

          background: #f8fbfa;
        }


        .informacion span {
          color: #667085;

          font-size: 11px;
        }


        .informacion strong {
          color: #087443;
        }


        /* ==========================
           TABLA
        ========================== */

        .tabla-contenedor {
          padding: 20px 24px 24px;
        }


        table {
          width: 100%;

          border-spacing: 0;
          border-collapse: separate;

          border:
            1px solid #d9e4df;

          border-radius: 9px;

          overflow: hidden;
        }


        thead th {
          padding: 11px 9px;

          background: #16856f;

          color: #ffffff;

          border-right:
            1px solid
            rgba(255,255,255,0.16);

          font-size: 10px;
          font-weight: 800;

          text-align: center;

          text-transform: uppercase;
        }


        thead th:last-child {
          border-right: none;
        }


        tbody td {
          padding: 10px 8px;

          border-right:
            1px solid #e3ebe7;

          border-bottom:
            1px solid #e3ebe7;

          color: #344054;

          font-size: 10px;

          text-align: center;

          vertical-align: middle;
        }


        tbody td:last-child {
          border-right: none;
        }


        tbody tr:last-child td {
          border-bottom: none;
        }


        tbody tr:nth-child(even) {
          background: #f5faf8;
        }


        .codigo {
          color: #087443;

          font-weight: 800;
        }


        /* ==========================
           ESTADO
        ========================== */

        .estado {
          display: inline-block;

          min-width: 62px;

          padding: 4px 7px;

          border-radius: 999px;

          font-size: 9px;
          font-weight: 800;
        }


        .activo {
          background: #dcfae6;

          color: #067647;
        }


        .inactivo {
          background: #fef3f2;

          color: #b42318;
        }


        /* ==========================
           PIE
        ========================== */

        .pie {
          padding: 14px 24px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          border-top:
            1px solid #e6ece9;

          color: #667085;

          font-size: 10px;
        }


        /* ==========================
           BOTONES
        ========================== */

        .acciones {
          max-width: 1100px;

          margin: 18px auto 0;

          display: flex;
          justify-content: flex-end;

          gap: 10px;
        }


        .acciones button {
          height: 40px;

          padding: 0 20px;

          border: none;
          border-radius: 8px;

          font-size: 12px;
          font-weight: 800;

          cursor: pointer;
        }


        .cerrar {
          background: #ffffff;

          color: #475467;

          border:
            1px solid #d0d5dd !important;
        }


        .imprimir {
          background: #087443;

          color: #ffffff;
        }


        .imprimir:hover {
          background: #05603a;
        }


        /* ==========================
           IMPRESIÓN
        ========================== */

        @media print {

          @page {
            size: landscape;
            margin: 10mm;
          }


          body {
            padding: 0;

            background: #ffffff;
          }


          .documento {
            max-width: none;

            border-radius: 0;

            box-shadow: none;
          }


          .acciones {
            display: none;
          }


          .cabecera,
          thead th,
          .activo,
          .inactivo {
            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }


          thead {
            display:
              table-header-group;
          }


          tr {
            break-inside: avoid;

            page-break-inside: avoid;
          }

        }

      </style>

    </head>


    <body>


      <div class="documento">


        <header class="cabecera">

          <div>

            <h1>
              Listado de Rutas
            </h1>

            <p>
              Reporte general de rutas
              registradas en el sistema
            </p>

          </div>


          <div class="cabecera-marca">
            WebBuys
          </div>

        </header>


        <section class="informacion">

          <span>
            Generado:
            <strong>
              ${fecha}
            </strong>
          </span>


          <span>
            Total de rutas:
            <strong>
              ${rutas.length}
            </strong>
          </span>

        </section>


        <div class="tabla-contenedor">

          <table>

            <thead>

              <tr>
                <th>Código</th>
                <th>Ruta</th>
                <th>Empleado</th>
                <th>Zonas de despacho</th>
                <th>Días de atención</th>
                <th>Estado</th>
              </tr>

            </thead>


            <tbody>
              ${filas}
            </tbody>

          </table>

        </div>


        <footer class="pie">

          <span>
            WebBuys
          </span>

          <span>
            Reporte de Rutas
          </span>

        </footer>

      </div>


      <div class="acciones">

        <button
          type="button"
          class="cerrar"
          onclick="window.close()"
        >
          Cerrar
        </button>


        <button
          type="button"
          class="imprimir"
          onclick="window.print()"
        >
          Imprimir
        </button>

      </div>


    </body>

    </html>
  `);


  ventana.document.close();

  ventana.focus();
}
  /* ===========================
     GUARDAR - RUTAS
  =========================== */

  async function guardarRuta() {
    setMensaje("");
    setError("");

    if (!form.codigo.trim()) {
      setError("El código de la ruta es obligatorio.");
      return;
    }

    if (!form.nombre.trim()) {
      setError("El nombre de la ruta es obligatorio.");
      return;
    }

    try {
      setGuardando(true);
      const datos = {
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        empleado: form.empleado || null,
        zonasDespacho: form.zonasDespacho,
        diasAtencion: form.diasAtencion,
        estado: form.estado,
      };

      if (modoEdicion && rutaSeleccionada?._id) {
        await actualizarRuta(rutaSeleccionada._id, datos);
        setMensaje("Ruta actualizada correctamente.");
      } else {
        await crearRuta(datos);
        setMensaje("Ruta creada correctamente.");
      }

      await cargarRutas();

      setRutaSeleccionada(null);
      setModoEdicion(false);

      const siguiente = await obtenerSiguienteCodigoRuta();

      setForm({
        ...FORM_INICIAL,
        codigo: siguiente.codigo || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.mensaje || "No fue posible guardar la ruta."
      );
    } finally {
      setGuardando(false);
    }
  }

  /* ===========================
     CAMBIAR ESTADO - RUTAS
  =========================== */

  async function cambiarEstado(ruta) {
    try {
      setMensaje("");
      setError("");
      await cambiarEstadoRuta(ruta._id);
      setMensaje(
        ruta.estado === "Activa"
          ? "Ruta desactivada correctamente."
          : "Ruta activada correctamente."
      );
      await cargarRutas();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje || "No fue posible cambiar el estado."
      );
    }
  }

  /* ===========================
     ELIMINAR - RUTAS
  =========================== */

  async function eliminar(ruta) {
    const confirmar = window.confirm(`¿Deseas eliminar la ruta "${ruta.nombre}"?`);
    if (!confirmar) return;

    try {
      setMensaje("");
      setError("");
      await eliminarRuta(ruta._id);
      setMensaje("Ruta eliminada correctamente.");
      await cargarRutas();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje || "No fue posible eliminar la ruta."
      );
    }
  }

  /* ===========================
     RENDER
  =========================== */

  return (
    <section className="rutas-module">
      {/* =========================================
          REPORTE PARA IMPRESIÓN
      ========================================= */}

      <div className="rutas-print-report">

        <div className="rutas-print-header">

          <h1>
            WEBBUYS
          </h1>

          <h2>
            Listado de Rutas
          </h2>

          <p>
            Fecha:{" "}
            {new Date().toLocaleDateString(
              "es-CO"
            )}
          </p>

        </div>


        <table className="rutas-print-table">

          <thead>

            <tr>
              <th>Código</th>
              <th>Ruta</th>
              <th>Empleado</th>
              <th>Zonas de despacho</th>
              <th>Días de atención</th>
              <th>Estado</th>
            </tr>

          </thead>


          <tbody>

            {rutas.map((ruta) => (

              <tr key={ruta._id}>

                <td>
                  {ruta.codigo || "—"}
                </td>

                <td>
                  {ruta.nombre || "—"}
                </td>

                <td>
                  {ruta.empleado?.nombre ||
                    ruta.empleado?.usuario ||
                    "Sin asignar"}
                </td>

                <td>
                  {ruta.zonasDespacho?.length
                    ? ruta.zonasDespacho
                        .map(
                          (zona) =>
                            zona.nombre
                        )
                        .join(", ")
                    : "Sin zonas"}
                </td>

                <td>
                  {ruta.diasAtencion?.length
                    ? ruta.diasAtencion.join(
                        ", "
                      )
                    : "Sin días"}
                </td>

                <td>
                  {ruta.estado}
                </td>

              </tr>

            ))}

          </tbody>

        </table>


        <div className="rutas-print-footer">

          <span>
            Total de rutas:{" "}
            <strong>
              {rutas.length}
            </strong>
          </span>

          <span>
            Generado por WebBuys
          </span>

        </div>

      </div>

      {/* MENÚ DE MÓDULOS */}
      <ModulosMenu />

      {/* BARRA SUPERIOR */}
      <div className="rutas-title-bar">
        <div className="rutas-title-info">
          <h2>
            {modoEdicion ? "Editar Ruta" : "Rutas"}
          </h2>
        </div>

        <div className="rutas-title-actions">
          {/* NUEVA */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={nuevaRuta}
            data-tooltip="Nueva ruta"
            aria-label="Nueva ruta"
          >
            <img src={nuevaRutaIcon} alt="" />
          </button>

          {/* EDITAR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={editarRutaSeleccionada}
            data-tooltip="Editar ruta"
            disabled={!rutaSeleccionada}
          >
            <img src={editarIcon} alt="" />
          </button>

          {/* ACTIVAR / DESACTIVAR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={cambiarEstadoSeleccionado}
            data-tooltip={
              rutaSeleccionada?.estado === "Activa"
                ? "Desactivar ruta"
                : "Activar ruta"
            }
            disabled={!rutaSeleccionada}
          >
            <img
              src={
                rutaSeleccionada?.estado === "Activa"
                  ? bloquearIcon
                  : desbloquearIcon
              }
              alt=""
            />
          </button>

          {/* ELIMINAR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={eliminarRutaSeleccionada}
            data-tooltip="Eliminar ruta"
            disabled={!rutaSeleccionada}
          >
            <img src={EliminarRutaIcon} alt="" />
          </button>

          {/* BUSCAR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={abrirBuscarRutas}
            data-tooltip="Buscar ruta"
          >
            <img src={buscarIcon} alt="" />
          </button>

          {/* IMPRIMIR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={imprimirRutas}
            data-tooltip="Imprimir rutas"
            aria-label="Imprimir rutas"
          >
            <img
              src={imprimirIcon}
              alt=""
            />
          </button>

          {/* GUARDAR */}
          <button
            type="button"
            className="rutas-top-icon-btn"
            onClick={guardarRuta}
            data-tooltip={
              modoEdicion
                ? "Guardar cambios"
                : "Guardar ruta"
            }
            disabled={guardando}
          >
            <img src={guardarIcon} alt="" />
          </button>
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="rutas-main-form">
        <label>
          Código
          <input
            name="codigo"
            value={form.codigo}
            readOnly
            placeholder="Código automático"
          />
        </label>

        <label>
          Nombre de la ruta
          <input
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Ruta Centro"
          />
        </label>

        <label>
          Descripción
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            placeholder="Descripción de la ruta..."
          />
        </label>

        <label>
          Empleado asignado
          <select
            name="empleado"
            value={form.empleado}
            onChange={cambiar}
          >
            <option value="">Sin asignar</option>
            {empleados.map((empleado) => (
              <option key={empleado._id} value={empleado._id}>
                {empleado.nombres
                  ? `${empleado.nombres} ${empleado.apellidos || ""}`
                  : empleado.usuario}
              </option>
            ))}
          </select>
        </label>

        <div className="rutas-main-field">
          <span className="rutas-field-label">
            Zonas de despacho
          </span>

          <div className="rutas-zonas-selector">
            {zonas
              .filter((zona) => zona.estado === "Activa")
              .map((zona) => {
                const seleccionada = form.zonasDespacho.includes(zona._id);

                return (
                  <button
                    key={zona._id}
                    type="button"
                    className={seleccionada ? "selected" : ""}
                    onClick={() => {
                      setForm((actual) => ({
                        ...actual,
                        zonasDespacho: seleccionada
                          ? actual.zonasDespacho.filter(
                              (id) => id !== zona._id
                            )
                          : [...actual.zonasDespacho, zona._id],
                      }));
                    }}
                  >
                    {zona.nombre}
                  </button>
                );
              })}
          </div>
        </div>

        <label>
          Estado
          <select
            name="estado"
            value={form.estado}
            onChange={cambiar}
          >
            <option value="Activa">Activa</option>
            <option value="Inactiva">Inactiva</option>
          </select>
        </label>

        <div className="rutas-main-field">
          <span className="rutas-field-label">
            Días de atención
          </span>

          <div className="rutas-days-selector">
            {DIAS.map((dia) => {
              const activo = form.diasAtencion.includes(dia);

              return (
                <button
                  key={dia}
                  type="button"
                  className={activo ? "selected" : ""}
                  onClick={() => cambiarDia(dia)}
                >
                  {dia.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Toast mensaje={mensaje} error={error} />

      {/* ===========================
          MODAL BUSCAR RUTAS
      =========================== */}
      {modalBuscarAbierto && (
        <div className="rutas-search-modal-overlay">
          <div
            ref={modalBuscarRef}
            className="rutas-search-modal"
            style={{
              left: posicionModal.x,
              top: posicionModal.y,
            }}
          >
            <div
              className="rutas-search-modal-header"
              onMouseDown={iniciarArrastreModal}
            >
              <h3>Buscar rutas</h3>

              <button
                type="button"
                className="rutas-search-modal-close"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setModalBuscarAbierto(false)}
              >
                <img src={cerrarIcon} alt="" />
              </button>
            </div>

            <div className="rutas-search-modal-filters">
              <select
                value={campoBuscar}
                onChange={(event) => setCampoBuscar(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="codigo">Código</option>
                <option value="nombre">Ruta</option>
                <option value="empleado">Empleado</option>
                <option value="zona">Zona</option>
              </select>

              <div className="rutas-search-modal-input">
                <img src={buscarIcon} alt="" />
                <input
                  type="search"
                  value={filtroBuscar}
                  onChange={(event) => setFiltroBuscar(event.target.value)}
                  placeholder="Buscar ruta..."
                  autoFocus
                />
              </div>
            </div>

            <div className="rutas-search-modal-table-wrap">
              <table className="rutas-search-modal-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Ruta</th>
                    <th>Empleado</th>
                    <th>Zonas</th>
                    <th>Días</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {rutasBusqueda.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="rutas-search-empty">
                        No se encontraron rutas.
                      </td>
                    </tr>
                  ) : (
                    rutasBusqueda.map((ruta) => (
                      <tr
                        key={ruta._id}
                        onDoubleClick={() => seleccionarRutaBusqueda(ruta)}
                      >
                        <td>
                          <strong>{ruta.codigo}</strong>
                        </td>

                        <td>{ruta.nombre}</td>

                        <td>
                          {ruta.empleado?.nombre ||
                            ruta.empleado?.usuario ||
                            "Sin asignar"}
                        </td>

                        <td>
                          <div className="rutas-search-zonas">
                            {ruta.zonasDespacho?.length
                              ? ruta.zonasDespacho.map((zona) => (
                                  <span key={zona._id}>
                                    {zona.nombre}
                                  </span>
                                ))
                              : "Sin zonas"}
                          </div>
                        </td>

                        <td>
                          <div className="rutas-search-dias">
                            {ruta.diasAtencion?.length
                              ? ruta.diasAtencion.map((dia) => (
                                  <span key={dia}>
                                    {dia.slice(0, 3)}
                                  </span>
                                ))
                              : "Sin días"}
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              ruta.estado === "Activa"
                                ? "rutas-search-status active"
                                : "rutas-search-status inactive"
                            }
                          >
                            {ruta.estado}
                          </span>
                        </td>
                      </tr>
                    ))
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