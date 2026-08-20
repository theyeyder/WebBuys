import { useEffect, useMemo, useState } from "react";

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
import nuevaZonaIcon from "../assets/icons/zonas-despacho.png";

import "../styles/zonas-despacho.css";

const FORM_INICIAL = {
  nombre: "",
  descripcion: "",
  estado: "Activa",
};

export default function ZonasDespacho() {
  const [zonas, setZonas] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [zonaEditando, setZonaEditando] = useState(null);

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

  const zonasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return zonas;

    return zonas.filter((zona) =>
      [
        zona.nombre,
        zona.descripcion,
        zona.estado,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto)
    );
  }, [zonas, busqueda]);

  function cambiar(event) {
    const { name, value } = event.target;

    setForm((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  function abrirNuevaZona() {
    setZonaEditando(null);
    setForm(FORM_INICIAL);
    setError("");
    setModalAbierto(true);
  }

  function abrirEditarZona(zona) {
    setZonaEditando(zona);

    setForm({
      nombre: zona.nombre || "",
      descripcion: zona.descripcion || "",
      estado: zona.estado || "Activa",
    });

    setError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;

    setModalAbierto(false);
    setZonaEditando(null);
    setForm(FORM_INICIAL);
  }

  async function guardarZona(event) {
    event.preventDefault();

    setMensaje("");
    setError("");

    if (!form.nombre.trim()) {
      setError("El nombre de la zona es obligatorio.");
      return;
    }

    try {
      setGuardando(true);

      const datos = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim(),
        estado: form.estado,
      };

      if (zonaEditando) {
        await actualizarZonaDespacho(
          zonaEditando._id,
          datos
        );

        setMensaje("Zona actualizada correctamente.");
      } else {
        await crearZonaDespacho(datos);

        setMensaje("Zona creada correctamente.");
      }

      cerrarModal();
      await cargarZonas();
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible guardar la zona."
      );
    } finally {
      setGuardando(false);
    }
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

  return (
    <section className="rutas-module">
      <Toast mensaje={mensaje} error={error} />

      <ModulosMenu />

      <div className="rutas-header">
        
        <div className="rutas-header-actions">
          <div className="rutas-search-box">
            <img
              src={buscarIcon}
              alt=""
              className="rutas-search-icon"
            />

            <input
              type="search"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por nombre, descripción, estado..."
            />

            {busqueda && (
              <button
                type="button"
                className="rutas-search-clear"
                onClick={() => setBusqueda("")}
                aria-label="Limpiar búsqueda"
              >
                ×
              </button>
            )}
          </div>

          <button
            type="button"
            className="rutas-icon-main"
            data-tooltip="Nueva zona"
            aria-label="Nueva zona"
            onClick={abrirNuevaZona}
          >
            <img
              src={nuevaZonaIcon}
              alt=""
              className="rutas-icon-main-image"
            />
          </button>
        </div>
      </div>

      <div className="rutas-results-row">
        <span className="rutas-search-results">
          {zonasFiltradas.length}{" "}
          {zonasFiltradas.length === 1
            ? "zona"
            : "zonas"}
        </span>
      </div>

      {cargando ? (
        <div className="rutas-loading">
          Cargando zonas...
        </div>
      ) : (
        <div className="rutas-table-responsive">
          <table className="rutas-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {zonasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="rutas-empty"
                  >
                    No hay zonas de despacho.
                  </td>
                </tr>
              ) : (
                zonasFiltradas.map((zona) => (
                  <tr key={zona._id}>
                    <td>
                      <strong>{zona.nombre}</strong>
                    </td>

                    <td>
                      {zona.descripcion ||
                        "Sin descripción"}
                    </td>

                    <td>
                      <span
                        className={`rutas-status ${
                          zona.estado === "Activa"
                            ? "active"
                            : "inactive"
                        }`}
                      >
                        {zona.estado}
                      </span>
                    </td>

                    <td>
                      <div className="rutas-actions">
                        <button
                          type="button"
                          className="rutas-icon-btn"
                          data-tooltip="Editar zona"
                          onClick={() =>
                            abrirEditarZona(zona)
                          }
                        >
                          <img
                            src={editarIcon}
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          className="rutas-icon-btn"
                          data-tooltip={
                            zona.estado === "Activa"
                              ? "Desactivar"
                              : "Activar"
                          }
                          onClick={() =>
                            cambiarEstado(zona)
                          }
                        >
                          <img
                            src={
                              zona.estado === "Activa"
                                ? bloquearIcon
                                : desbloquearIcon
                            }
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          className="rutas-icon-btn"
                          data-tooltip="Eliminar zona"
                          onClick={() =>
                            eliminar(zona)
                          }
                        >
                          <img
                            src={eliminarIcon}
                            alt=""
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <div
          className="rutas-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarModal();
            }
          }}
        >
          <form
            className="rutas-modal"
            onSubmit={guardarZona}
          >
            <div className="rutas-modal-header">
              <div>
                <span className="rutas-eyebrow">
                  {zonaEditando
                    ? "Editar zona"
                    : "Nueva zona"}
                </span>
              </div>

              <button
                type="button"
                className="rutas-modal-icon-btn rutas-tooltip-bottom"
                data-tooltip="Cerrar"
                onClick={cerrarModal}
              >
                <img
                  src={cerrarIcon}
                  alt=""
                  className="rutas-modal-icon-image"
                />
              </button>
            </div>

            <div className="rutas-form-grid">
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

              <label className="rutas-field-full">
                Descripción
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={cambiar}
                  placeholder="Descripción opcional..."
                />
              </label>
            </div>

            <div className="rutas-modal-footer">
              <button
                type="button"
                className="rutas-modal-icon-btn"
                data-tooltip="Cancelar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                <img
                  src={cancelarIcon}
                  alt=""
                  className="rutas-modal-icon-image"
                />
              </button>

              <button
                type="submit"
                className="rutas-modal-icon-btn rutas-modal-save-btn"
                data-tooltip={
                  zonaEditando
                    ? "Guardar cambios"
                    : "Crear zona"
                }
                disabled={guardando}
              >
                <img
                  src={guardarIcon}
                  alt=""
                  className="rutas-modal-icon-image"
                />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}