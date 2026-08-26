import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";

import {
  listarZonasDespacho,
  crearZonaDespacho,
  actualizarZonaDespacho,
  cambiarEstadoZonaDespacho,
  eliminarZonaDespacho,
  obtenerSiguienteCodigoZona,
} from "../services/zonaDespacho.service.js";

import Toast from "../components/Toast.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import buscarIcon from "../assets/icons/buscar.png";
import editarIcon from "../assets/icons/Editar-ruta.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import cerrarIcon from "../assets/icons/cerrar.png";
import guardarIcon from "../assets/icons/guardar.png";
import cancelarIcon from "../assets/icons/cancelar.png";
import eliminarIcon from "../assets/icons/Eliminar ruta.png";
import nuevaZonaIcon from "../assets/icons/nueva-zona.png";
import imprimirIcon from "../assets/icons/imprimir.png";

import zonasPrintCss from "../styles/zonas-despacho-print.css?inline";

import "../styles/zonas-despacho.css";

const FORM_INICIAL = {
  codigo: "",
  nombre: "",
  descripcion: "",
  estado: "Activa",
};

export default function ZonasDespacho() {

  const { usuario } = useAuth();

  const [zonas, setZonas] = useState([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState(FORM_INICIAL);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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
     IMPRIMIR ZONAS
  ========================================= */

  function imprimirZonas() {

    if (zonas.length === 0) {
      setError(
        "No hay zonas de despacho para imprimir."
      );
      return;
    }

    /* FECHA Y HORA */

    const fechaHoraImpresion =
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

    /* USUARIO */

    const usuarioImpresion =
      usuario?.nombres ||
      usuario?.apellidos
        ? `${usuario?.nombres || ""} ${
            usuario?.apellidos || ""
          }`.trim()
        : usuario?.usuario ||
          "Usuario";

    /* FILAS */

    const filas =
      zonas
        .map((zona) => {

          return `
            <tr>

              <td>
                <strong>
                  ${escaparHtml(
                    zona.codigo || "-"
                  )}
                </strong>
              </td>

              <td>
                ${escaparHtml(
                  zona.nombre || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  zona.descripcion ||
                  "Sin descripción"
                )}
              </td>

              <td class="zonas-print-status">
                ${escaparHtml(
                  zona.estado || "-"
                )}
              </td>

            </tr>
          `;

        })
        .join("");

    /* VENTANA EMERGENTE */

    const ventanaImpresion =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );

    if (!ventanaImpresion) {
      setError(
        "El navegador bloqueó la ventana de impresión."
      );
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
            Zonas de despacho - WebBuys
          </title>

          <style>
            ${zonasPrintCss}
          </style>

        </head>

        <body>

          <main class="zonas-print-page">

            <header class="zonas-print-header">

              <h1>
                Zonas de despacho
              </h1>

              <p>
                WebBuys - Listado de zonas de despacho
              </p>

              <div class="zonas-print-info">

                <span>
                  <strong>
                    Fecha y hora de impresión:
                  </strong>

                  ${escaparHtml(
                    fechaHoraImpresion
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

            <table class="zonas-print-table">

              <thead>

                <tr>

                  <th>
                    Código
                  </th>

                  <th>
                    Nombre
                  </th>

                  <th>
                    Descripción
                  </th>

                  <th>
                    Estado
                  </th>

                </tr>

              </thead>

              <tbody>
                ${filas}
              </tbody>

            </table>

            <div class="zonas-print-total">

              Total zonas:

              <strong>
                ${zonas.length}
              </strong>

            </div>

            <footer class="zonas-print-footer">
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

  async function cargarZonas() {
    try {
      setCargando(true);

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
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarZonas();
  }, []);

  useEffect(() => {
    if (!mensaje && !error) return;

    const timer = setTimeout(() => {
      setMensaje("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [mensaje, error]);

  function cambiar(event) {
    const { name, value } = event.target;

    setForm((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  // =========================================================
  // NUEVA ZONA - Ahora obtiene el código automáticamente
  // =========================================================
  async function nuevaZona() {
    try {
      setZonaSeleccionada(null);
      setModoEdicion(false);

      const data =
        await obtenerSiguienteCodigoZona();

      setForm({
        ...FORM_INICIAL,
        codigo: data.codigo || "",
      });

      setMensaje("");
      setError("");
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible obtener el siguiente código."
      );
    }
  }

  // =========================================================
  // CARGAR ZONA SELECCIONADA - Actualizada con código y cierre de modal
  // =========================================================
  function cargarZonaSeleccionada(zona) {
    setZonaSeleccionada(zona);

    setForm({
      codigo: zona.codigo || "",
      nombre: zona.nombre || "",
      descripcion: zona.descripcion || "",
      estado: zona.estado || "Activa",
    });

    setModoEdicion(true);
    setModalBuscarAbierto(false);
    setFiltroBuscar("");

    setMensaje("");
    setError("");
  }

  async function guardarZona() {
    setMensaje("");
    setError("");

    if (!form.nombre.trim()) {
      setError(
        "El nombre de la zona es obligatorio."
      );
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
      };

      if (
        modoEdicion &&
        zonaSeleccionada?._id
      ) {
        await actualizarZonaDespacho(
          zonaSeleccionada._id,
          datos
        );

        setMensaje(
          "Zona actualizada correctamente."
        );
      } else {
        await crearZonaDespacho(datos);

        setMensaje(
          "Zona creada correctamente."
        );
      }

      await cargarZonas();

      setZonaSeleccionada(null);
      setModoEdicion(false);
      setMostrarFormulario(false);

      setForm(FORM_INICIAL);

    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible guardar la zona."
      );
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarEstadoSeleccionada() {
    if (!zonaSeleccionada) {
      setError(
        "Seleccione primero una zona."
      );
      return;
    }

    await cambiarEstado(
      zonaSeleccionada
    );

    setZonaSeleccionada(null);
    setModoEdicion(false);
    setForm(FORM_INICIAL);
  }

  async function eliminarZonaSeleccionada() {
    if (!zonaSeleccionada) {
      setError(
        "Seleccione primero una zona."
      );
      return;
    }

    await eliminar(
      zonaSeleccionada
    );

    setZonaSeleccionada(null);
    setModoEdicion(false);
    setForm(FORM_INICIAL);
  }

  async function cambiarEstado(zona) {
    try {
      setMensaje("");
      setError("");

      await cambiarEstadoZonaDespacho(zona._id);

      setMensaje(
        zona.estado === "Activa"
          ? "Zona desactivada correctamente."
          : "Zona activada correctamente."
      );

      await cargarZonas();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible cambiar el estado."
      );
    }
  }

  async function eliminar(zona) {
    const confirmar = window.confirm(
      `¿Deseas eliminar la zona "${zona.nombre}"?`
    );

    if (!confirmar) return;

    try {
      setMensaje("");
      setError("");

      await eliminarZonaDespacho(zona._id);

      setMensaje("Zona eliminada correctamente.");

      await cargarZonas();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible eliminar la zona."
      );
    }
  }

  // =========================================================
  // BUSQUEDA - Ahora incluye código, nombre, descripción y estado
  // =========================================================
  const zonasBusqueda = useMemo(() => {
    const texto =
      filtroBuscar
        .trim()
        .toLowerCase();

    if (!texto) {
      return zonas;
    }

    return zonas.filter((zona) => {
      const codigo =
        String(
          zona.codigo || ""
        ).toLowerCase();

      const nombre =
        String(
          zona.nombre || ""
        ).toLowerCase();

      const descripcion =
        String(
          zona.descripcion || ""
        ).toLowerCase();

      const estado =
        String(
          zona.estado || ""
        ).toLowerCase();

      switch (campoBuscar) {
        case "nombre":
          return nombre.includes(texto);

        case "descripcion":
          return descripcion.includes(texto);

        case "estado":
          return estado.includes(texto);

        default:
          return (
            codigo.includes(texto) ||
            nombre.includes(texto) ||
            descripcion.includes(texto) ||
            estado.includes(texto)
          );
      }
    });
  }, [
    zonas,
    filtroBuscar,
    campoBuscar,
  ]);

  function abrirBuscarZonas() {
    setFiltroBuscar("");
    setCampoBuscar("todos");

    setPosicionModal({
      x: Math.max(
        20,
        (window.innerWidth - 760) / 2
      ),

      y: Math.max(
        20,
        (window.innerHeight - 500) / 2
      ),
    });

    setModalBuscarAbierto(true);
  }

  function iniciarArrastreModal(event) {
    if (!modalBuscarRef.current) return;

    const rect =
      modalBuscarRef.current
        .getBoundingClientRect();

    arrastreRef.current = {
      activo: true,
      offsetX:
        event.clientX - rect.left,
      offsetY:
        event.clientY - rect.top,
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

  function moverModal(event) {
    if (!arrastreRef.current.activo) {
      return;
    }

    const modal =
      modalBuscarRef.current;

    if (!modal) return;

    const ancho = modal.offsetWidth;
    const alto = modal.offsetHeight;

    let x =
      event.clientX -
      arrastreRef.current.offsetX;

    let y =
      event.clientY -
      arrastreRef.current.offsetY;

    x = Math.max(
      10,
      Math.min(
        window.innerWidth - ancho - 10,
        x
      )
    );

    y = Math.max(
      10,
      Math.min(
        window.innerHeight - alto - 10,
        y
      )
    );

    setPosicionModal({
      x,
      y,
    });
  }

  function terminarArrastreModal() {
    arrastreRef.current.activo = false;

    document.removeEventListener(
      "mousemove",
      moverModal
    );

    document.removeEventListener(
      "mouseup",
      terminarArrastreModal
    );
  }

  return (
    <section className="zonas-module">

      <Toast
        mensaje={mensaje}
        error={error}
      />


      {/* =====================================
          CABECERA
      ====================================== */}

      <div className="zonas-title-bar">

        <div className="zonas-title-left">

          <ModulosMenu />

          <div className="zonas-title-info">
            <h2>
              Zonas de despacho
            </h2>
          </div>

        </div>

      </div>


      {/* =====================================
          PANEL DE TRABAJO
      ====================================== */}

      <div className="zonas-work-panel">

        {/* CAMPOS DEL FORMULARIO */}

        <div className="zonas-work-fields">

          {/* =====================================
              CÓDIGO - Nuevo campo (readonly)
          ====================================== */}

          <label>
            Código

            <input
              name="codigo"
              value={form.codigo}
              readOnly
              placeholder=""
            />
          </label>


          <label>
            Nombre

            <input
              name="nombre"
              value={form.nombre}
              onChange={cambiar}
              placeholder="Zona uno"
            />
          </label>


          <label className="zonas-work-description">
            Descripción

            <input
              name="descripcion"
              value={form.descripcion}
              onChange={cambiar}
              placeholder="Descripción de la zona"
            />
          </label>


          <label>
            Estado

            <select
              name="estado"
              value={form.estado}
              onChange={cambiar}
            >
              <option value="Activa">
                Activa
              </option>

              <option value="Inactiva">
                Inactiva
              </option>
            </select>

          </label>

        </div>


        {/* BOTONES DE ACCIÓN */}

        <div className="zonas-work-actions">

          {/* NUEVA */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={nuevaZona}
            data-tooltip="Nueva zona"
          >
            <img
              src={nuevaZonaIcon}
              alt=""
            />
          </button>


          {/* EDITAR */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={() => {
              if (!zonaSeleccionada) {
                setError(
                  "Seleccione primero una zona desde Buscar."
                );
                return;
              }

              setModoEdicion(true);
            }}
            disabled={!zonaSeleccionada}
            data-tooltip="Editar zona"
          >
            <img
              src={editarIcon}
              alt=""
            />
          </button>


          {/* ACTIVAR / DESACTIVAR */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={cambiarEstadoSeleccionada}
            disabled={!zonaSeleccionada}
            data-tooltip={
              zonaSeleccionada?.estado === "Activa"
                ? "Desactivar zona"
                : "Activar zona"
            }
          >
            <img
              src={
                zonaSeleccionada?.estado === "Activa"
                  ? bloquearIcon
                  : desbloquearIcon
              }
              alt=""
            />
          </button>


          {/* ELIMINAR */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={eliminarZonaSeleccionada}
            disabled={!zonaSeleccionada}
            data-tooltip="Eliminar zona"
          >
            <img
              src={eliminarIcon}
              alt=""
            />
          </button>


          {/* BUSCAR */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={abrirBuscarZonas}
            data-tooltip="Buscar zona"
          >
            <img
              src={buscarIcon}
              alt=""
            />
          </button>


          {/* IMPRIMIR */}

          <button
            type="button"
            className="zonas-work-btn"
            onClick={imprimirZonas}
            data-tooltip="Imprimir zonas"
            aria-label="Imprimir zonas"
            disabled={
              guardando ||
              zonas.length === 0
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
            className="zonas-work-btn"
            onClick={guardarZona}
            disabled={guardando}
            data-tooltip={
              modoEdicion
                ? "Guardar cambios"
                : "Guardar zona"
            }
          >
            <img
              src={guardarIcon}
              alt=""
            />
          </button>

        </div>

      </div>


      {/* =====================================
          MODAL BUSCAR ZONAS
      ====================================== */}

      {modalBuscarAbierto && (
        <div className="zonas-search-modal-overlay">
          <div
            ref={modalBuscarRef}
            className="zonas-search-modal"
            style={{
              left: posicionModal.x,
              top: posicionModal.y,
            }}
          >
            <div
              className="zonas-search-modal-header"
              onMouseDown={iniciarArrastreModal}
            >
              <h3>
                Buscar zonas de despacho
              </h3>

              <button
                type="button"
                className="zonas-search-modal-close"
                onClick={() => {
                  setModalBuscarAbierto(false);
                  setFiltroBuscar("");
                }}
                data-tooltip="Cerrar"
                aria-label="Cerrar"
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>
            </div>

            <div className="zonas-search-modal-filters">
              <select
                value={campoBuscar}
                onChange={(event) =>
                  setCampoBuscar(
                    event.target.value
                  )
                }
              >
                <option value="todos">
                  Todos
                </option>

                <option value="nombre">
                  Nombre
                </option>

                <option value="descripcion">
                  Descripción
                </option>

                <option value="estado">
                  Estado
                </option>
              </select>

              <div className="zonas-search-modal-input">
                <img
                  src={buscarIcon}
                  alt=""
                />

                <input
                  type="search"
                  value={filtroBuscar}
                  onChange={(event) =>
                    setFiltroBuscar(
                      event.target.value
                    )
                  }
                  placeholder="Buscar zona..."
                  autoFocus
                />
              </div>
            </div>

            <div className="zonas-search-modal-table-wrap">
              <table className="zonas-search-modal-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {zonasBusqueda.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="zonas-search-empty"
                      >
                        No se encontraron zonas.
                      </td>
                    </tr>
                  ) : (
                    zonasBusqueda.map((zona) => (
                      <tr
                        key={zona._id}
                        onDoubleClick={() => {
                          cargarZonaSeleccionada(zona);
                          setModalBuscarAbierto(false);
                        }}
                      >
                        <td>
                          <strong>
                            {zona.codigo || "Sin código"}
                          </strong>
                        </td>

                        <td>
                          {zona.nombre}
                        </td>

                        <td>
                          {zona.descripcion ||
                            "Sin descripción"}
                        </td>

                        <td>
                          <span
                            className={
                              zona.estado === "Activa"
                                ? "zonas-search-status active"
                                : "zonas-search-status inactive"
                            }
                          >
                            {zona.estado}
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