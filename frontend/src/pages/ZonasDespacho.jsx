import { useEffect, useMemo, useRef, useState } from "react";

import {
  listarZonasDespacho,
  crearZonaDespacho,
  actualizarZonaDespacho,
  cambiarEstadoZonaDespacho,
  eliminarZonaDespacho,
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

import "../styles/zonas-despacho.css";

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  estado: "Activa",
};

export default function ZonasDespacho() {
  const [zonas, setZonas] = useState([]);
  const [zonaSeleccionada, setZonaSeleccionada] = useState(null);
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

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState(FORM_INICIAL);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

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

  function nuevaZona() {
    setZonaSeleccionada(null);
    setModoEdicion(false);

    setForm(FORM_INICIAL);

    setMensaje("");
    setError("");
  }

  function cargarZonaSeleccionada(zona) {
    setZonaSeleccionada(zona);

    setForm({
      nombre: zona.nombre || "",
      descripcion: zona.descripcion || "",
      estado: zona.estado || "Activa",
    });

    setModoEdicion(true);

    setModalBuscarAbierto(false);
    setFiltroBuscar("");

    setMensaje(
      `Zona ${zona.nombre} cargada correctamente.`
    );

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

  const zonasBusqueda = useMemo(() => {
    const texto =
      filtroBuscar
        .trim()
        .toLowerCase();

    if (!texto) {
      return zonas;
    }

    return zonas.filter((zona) => {
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
      <Toast mensaje={mensaje} error={error} />

      <ModulosMenu />

      <div className="zonas-title-bar">
        <div className="zonas-title-info">
          <h2>
            {modoEdicion
              ? "Editar Zona"
              : "Zonas de despacho"}
          </h2>
        </div>

        <div className="zonas-title-actions">
          {/* NUEVA */}
          <button
            type="button"
            className="zonas-top-icon-btn"
            onClick={nuevaZona}
            data-tooltip="Nueva zona"
            aria-label="Nueva zona"
          >
            <img
              src={nuevaZonaIcon}
              alt=""
            />
          </button>

          {/* ACTIVAR / DESACTIVAR */}
          <button
            type="button"
            className="zonas-top-icon-btn"
            onClick={cambiarEstadoSeleccionada}
            data-tooltip={
              zonaSeleccionada?.estado === "Activa"
                ? "Desactivar zona"
                : "Activar zona"
            }
            disabled={!zonaSeleccionada}
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
            className="zonas-top-icon-btn"
            onClick={eliminarZonaSeleccionada}
            data-tooltip="Eliminar zona"
            disabled={!zonaSeleccionada}
          >
            <img
              src={eliminarIcon}
              alt=""
            />
          </button>

          {/* BUSCAR */}
          <button
            type="button"
            className="zonas-top-icon-btn"
            onClick={abrirBuscarZonas}
            data-tooltip="Buscar zona"
          >
            <img
              src={buscarIcon}
              alt=""
            />
          </button>

          {/* GUARDAR */}
          <button
            type="button"
            className="zonas-top-icon-btn"
            onClick={guardarZona}
            data-tooltip={
              modoEdicion
                ? "Guardar cambios"
                : "Guardar zona"
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

      <div className="zonas-main-form">
        <label>
          Nombre
          <input
            name="nombre"
            value={form.nombre}
            onChange={cambiar}
            placeholder="Ejemplo: Picaleña"
          />
        </label>

        <label>
          Descripción
          <textarea
            name="descripcion"
            value={form.descripcion}
            onChange={cambiar}
            placeholder="Descripción opcional..."
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
                onMouseDown={(event) =>
                  event.stopPropagation()
                }
                onClick={() =>
                  setModalBuscarAbierto(false)
                }
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
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {zonasBusqueda.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="zonas-search-empty"
                      >
                        No se encontraron zonas.
                      </td>
                    </tr>
                  ) : (
                    zonasBusqueda.map((zona) => (
                      <tr
                        key={zona._id}
                        onDoubleClick={() =>
                          cargarZonaSeleccionada(
                            zona
                          )
                        }
                      >
                        <td>
                          <strong>
                            {zona.nombre}
                          </strong>
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