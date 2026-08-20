import { useEffect, useMemo, useState } from "react";

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

  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
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
     BUSCADOR - RUTAS
  =========================== */

  const rutasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return rutas;
    return rutas.filter((ruta) => {
      const empleado = ruta.empleado?.nombre || "";
      const dias = Array.isArray(ruta.diasAtencion)
        ? ruta.diasAtencion.join(" ")
        : "";
      return [
        ruta.codigo,
        ruta.nombre,
        ruta.descripcion,
        ruta.estado,
        empleado,
        dias,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [rutas, busqueda]);

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

  async function abrirNuevaRuta() {
    try {
      setRutaEditando(null);
      setError("");
      const data = await obtenerSiguienteCodigoRuta();
      setForm({
        ...FORM_INICIAL,
        codigo: data.codigo || "",
      });
      setModalAbierto(true);
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible obtener el siguiente código."
      );
    }
  }

  function abrirEditarRuta(ruta) {
    setRutaEditando(ruta);
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
    setError("");
    setModalAbierto(true);
  }

  function cerrarModal() {
    if (guardando) return;
    setModalAbierto(false);
    setRutaEditando(null);
    setForm(FORM_INICIAL);
  }

  /* ===========================
     GUARDAR - RUTAS
  =========================== */

  async function guardarRuta(event) {
    event.preventDefault();
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

      if (rutaEditando) {
        await actualizarRuta(rutaEditando._id, datos);
        setMensaje("Ruta actualizada correctamente.");
      } else {
        await crearRuta(datos);
        setMensaje("Ruta creada correctamente.");
      }

      setModalAbierto(false);
      setRutaEditando(null);
      setForm(FORM_INICIAL);
      await cargarRutas();
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
      {/* MENÚ DE MÓDULOS */}
      <ModulosMenu />

      {/* CABECERA */}
      <div className="rutas-header">
        <div className="rutas-header-title">
          <h2>
            <span className="rutas-eyebrow"></span>
          </h2>
        </div>

        <div className="rutas-header-actions">
          {/* BUSCADOR */}
          <div className="rutas-search-box">
            <img src={buscarIcon} alt="" className="rutas-search-icon" />

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, ruta, empleado, día..."
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

          {/* NUEVA RUTA */}
          <button
            type="button"
            className="rutas-icon-main"
            data-tooltip="Nueva ruta"
            aria-label="Nueva ruta"
            onClick={abrirNuevaRuta}
          >
            <img
              src={nuevaRutaIcon}
              alt=""
              className="rutas-icon-main-image"
            />
          </button>
        </div>
      </div>

      {/* CONTADOR */}
      <div className="rutas-search-container">
        <div className="rutas-tools">
          <span className="rutas-search-results">
            {rutasFiltradas.length}{" "}
            {rutasFiltradas.length === 1 ? "ruta" : "rutas"}
          </span>
        </div>
      </div>

      {/* TABLA DE RUTAS */}
      {cargando ? (
        <div className="rutas-loading">Cargando rutas...</div>
      ) : (
        <div className="rutas-table-responsive">
          <table className="rutas-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Ruta</th>
                <th>Empleado</th>
                <th>Zonas</th>
                <th>Días de atención</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {rutasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="rutas-empty">
                    No hay rutas para mostrar.
                  </td>
                </tr>
              ) : (
                rutasFiltradas.map((ruta) => (
                  <tr key={ruta._id}>
                    <td>
                      <strong>{ruta.codigo}</strong>
                    </td>

                    <td>
                      <div className="ruta-info">
                        <strong>{ruta.nombre}</strong>
                        {ruta.descripcion && (
                          <small>{ruta.descripcion}</small>
                        )}
                      </div>
                    </td>

                    <td>{ruta.empleado?.nombre || "Sin asignar"}</td>

                    <td>
                      <div className="rutas-zonas-list">
                        {ruta.zonasDespacho?.length ? (
                          ruta.zonasDespacho.map((zona) => (
                            <span key={zona._id} className="rutas-zona-tag">
                              {zona.nombre}
                            </span>
                          ))
                        ) : (
                          <span className="rutas-sin-zonas">Sin zonas</span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="rutas-dias-list">
                        {ruta.diasAtencion?.length
                          ? ruta.diasAtencion.map((dia) => (
                              <span key={dia}>{dia.slice(0, 3)}</span>
                            ))
                          : "Sin días"}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`rutas-status ${
                          ruta.estado === "Activa" ? "active" : "inactive"
                        }`}
                      >
                        {ruta.estado}
                      </span>
                    </td>

                    <td>
                      <div className="rutas-actions">
                        <button
                          type="button"
                          className="rutas-icon-btn"
                          data-tooltip="Editar Ruta"
                          onClick={() => abrirEditarRuta(ruta)}
                        >
                          <img src={editarIcon} alt="Editar-ruta" />
                        </button>

                        <button
                          type="button"
                          className="rutas-icon-btn"
                          data-tooltip={
                            ruta.estado === "Activa" ? "Desactivar" : "Activar"
                          }
                          onClick={() => cambiarEstado(ruta)}
                        >
                          <img
                            src={
                              ruta.estado === "Activa"
                                ? bloquearIcon
                                : desbloquearIcon
                            }
                            alt=""
                          />
                        </button>

                        <button
                          type="button"
                          className="rutas-icon-btn rutas-delete-btn"
                          data-tooltip="Eliminar"
                          onClick={() => eliminar(ruta)}
                        >
                          <img src={EliminarRutaIcon} alt="Eliminar ruta" />
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

      {/* ===========================
          MODAL - RUTAS
      =========================== */}
      {modalAbierto && (
        <div
          className="rutas-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              cerrarModal();
            }
          }}
        >
          <form className="rutas-modal" onSubmit={guardarRuta}>
            <div className="rutas-modal-header">
              <div>
                <span className="rutas-eyebrow">
                  {rutaEditando ? "Editar Ruta" : "Crear Ruta"}
                </span>
              </div>

              <button
                type="button"
                className="rutas-modal-icon-btn rutas-tooltip-bottom"
                data-tooltip="Cerrar"
                aria-label="Cerrar"
                onClick={cerrarModal}
              >
                <img src={cerrarIcon} alt="" className="rutas-modal-icon-image" />
              </button>
            </div>

            <div className="rutas-form-grid">
              {/* Código */}
              <label>
                Código
                <input
                  name="codigo"
                  value={form.codigo}
                  readOnly
                  placeholder="Código automático"
                  autoComplete="off"
                />
              </label>

              {/* Nombre */}
              <label>
                Nombre de la ruta
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={cambiar}
                  placeholder="Ruta Centro"
                  autoComplete="off"
                />
              </label>

              {/* Descripción */}
              <label className="rutas-field-full">
                Descripción
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={cambiar}
                  placeholder="Descripción de la ruta..."
                />
              </label>

              {/* Empleado asignado */}
              <label>
                Empleado asignado
                <select name="empleado" value={form.empleado} onChange={cambiar}>
                  <option value="">Sin asignar</option>
                  {empleados.map((empleado) => (
                    <option key={empleado._id} value={empleado._id}>
                      {empleado.nombre}
                    </option>
                  ))}
                </select>
              </label>

              {/* ZONAS DE DESPACHO */}
              <div className="rutas-field-full">
                <span className="rutas-field-label">Zonas de despacho</span>

                <div className="rutas-zonas-selector">
                  {zonas
                    .filter((zona) => zona.estado === "Activa")
                    .map((zona) => {
                      const seleccionada =
                        form.zonasDespacho.includes(zona._id);

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

              {/* Estado */}
              <label>
                Estado
                <select name="estado" value={form.estado} onChange={cambiar}>
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </label>

              {/* Días de atención */}
              <div className="rutas-field-full">
                <span className="rutas-field-label">Días de atención</span>

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

            <div className="rutas-modal-footer">
              <button
                type="button"
                className="rutas-modal-icon-btn"
                title="Cancelar"
                data-tooltip="Cancelar"
                aria-label="Cancelar"
                onClick={cerrarModal}
                disabled={guardando}
              >
                <img src={cancelarIcon} alt="" className="rutas-modal-icon-image" />
              </button>

              <button
                type="submit"
                className="rutas-modal-icon-btn rutas-modal-save-btn"
                title={
                  guardando
                    ? "Guardando..."
                    : rutaEditando
                    ? "Guardar cambios"
                    : "Crear ruta"
                }
                data-tooltip={
                  guardando
                    ? "Guardando..."
                    : rutaEditando
                    ? "Guardar cambios"
                    : "Crear ruta"
                }
                aria-label={rutaEditando ? "Guardar cambios" : "Crear ruta"}
                disabled={guardando}
              >
                <img src={guardarIcon} alt="" className="rutas-modal-icon-image" />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}