import { useEffect, useState } from "react";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";
import UsuarioModal from "../components/UsuarioModal.jsx";
import CambiarPasswordModal from "../components/CambiarPasswordModal.jsx";


import editarIcon from "../assets/icons/editar.png";
import resetearIcon from "../assets/icons/resetear.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import nuevoUsuarioIcon from "../assets/icons/nuevo-usuario.png";
import cambiarPasswordIcon from "../assets/icons/cambiar-password.png";
import buscarIcon from "../assets/icons/buscar.png";


import "../styles/usuarios.css";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarPassword,
  cambiarEstadoUsuario,
} from "../services/usuario.service.js";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);

  const [modalPasswordAbierto, setModalPasswordAbierto] =
    useState(false);

  const [usuarioPassword, setUsuarioPassword] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError("");

      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los usuarios."
      );
    } finally {
      setCargando(false);
    }
  }

  function abrirNuevoUsuario() {
    setUsuarioEditar(null);
    setModalAbierto(true);
    setMensaje("");
    setError("");
  }

  function abrirEditarUsuario(usuario) {
    setUsuarioEditar(usuario);
    setModalAbierto(true);
    setMensaje("");
    setError("");
  }

  function cerrarModal() {
    setModalAbierto(false);
    setUsuarioEditar(null);
  }

  function abrirCambiarPassword(usuario) {
    setUsuarioPassword(usuario);
    setModalPasswordAbierto(true);
    setMensaje("");
    setError("");
  }

  function cerrarCambiarPassword() {
    setModalPasswordAbierto(false);
    setUsuarioPassword(null);
  }

  async function guardarUsuario(form) {
    try {
      setError("");
      setMensaje("");

      if (!form.nombres.trim()) {
        setError("Los nombres son obligatorios.");
        return;
      }

      if (!form.apellidos.trim()) {
        setError("Los apellidos son obligatorios.");
        return;
      }

      if (!form.usuario.trim()) {
        setError("El usuario es obligatorio.");
        return;
      }

      if (!usuarioEditar) {
        if (!form.password) {
          setError("La contraseña es obligatoria.");
          return;
        }

        if (form.password.length < 6) {
          setError(
            "La contraseña debe tener mínimo 6 caracteres."
          );
          return;
        }

        if (form.password !== form.repetirPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }

        await crearUsuario(form);
        setMensaje("Usuario creado correctamente.");
      } else {
        
        await actualizarUsuario(usuarioEditar._id, {
          nombres: form.nombres,
          apellidos: form.apellidos,
          usuario: form.usuario,
          rol: form.rol,
        });

        setMensaje("Usuario actualizado correctamente.");
      }

      cerrarModal();
      await cargarUsuarios();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible guardar el usuario."
      );
    }
  }

  async function guardarNuevaPassword(form) {
    try {
      setError("");
      setMensaje("");

      if (!usuarioPassword?._id) {
        setError("No se seleccionó un usuario.");
        return;
      }

      if (!form.password || !form.repetirPassword) {
        setError(
          "Debes ingresar y repetir la nueva contraseña."
        );
        return;
      }

      if (form.password.length < 6) {
        setError(
          "La contraseña debe tener mínimo 6 caracteres."
        );
        return;
      }

      if (form.password !== form.repetirPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      await cambiarPassword(usuarioPassword._id, form);

      setMensaje(
        `La contraseña de ${usuarioPassword.usuario} fue actualizada correctamente.`
      );

      cerrarCambiarPassword();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cambiar la contraseña."
      );
    }
  }

  async function resetear(usuario) {
    const confirmar = window.confirm(
      `La contraseña de ${usuario.usuario} quedará en 123456. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await resetearPassword(usuario._id);

      setMensaje(
        `La contraseña de ${usuario.usuario} fue restablecida a 123456.`
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible restablecer la contraseña."
      );
    }
  }

  async function cambiarEstado(usuario) {
    const accion =
      usuario.estado === "Activo"
        ? "bloquear"
        : "desbloquear";

    const confirmar = window.confirm(
      `¿Deseas ${accion} al usuario ${usuario.usuario}?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await cambiarEstadoUsuario(usuario._id);

      setMensaje("Estado del usuario actualizado.");
      await cargarUsuarios();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cambiar el estado del usuario."
      );
    }
  }

  // ✅ NUEVO: Filtrar usuarios según la búsqueda
  const usuariosFiltrados = usuarios.filter((usuario) => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    if (!textoBusqueda) {
      return true;
    }

    const nombreCompleto =
      `${usuario.nombres || ""} ${usuario.apellidos || ""}`.toLowerCase();

    return (
      usuario.usuario?.toLowerCase().includes(textoBusqueda) ||
      usuario.nombres?.toLowerCase().includes(textoBusqueda) ||
      usuario.apellidos?.toLowerCase().includes(textoBusqueda) ||
      nombreCompleto.includes(textoBusqueda) ||
      usuario.rol?.toLowerCase().includes(textoBusqueda) ||
      usuario.estado?.toLowerCase().includes(textoBusqueda)
    );
  });

  return (
    <AppLayout title="Usuarios">
      <SpatialCard className="usuarios-module">
        <div className="module-header">
          <div>
            <span className="eyebrow">
              Configuración
            </span>

            <h2>Usuarios</h2>

            <p>
              Administracion de usuarios
            </p>
          </div>

          <button
            className="primary-btn"
            type="button"
            onClick={abrirNuevoUsuario}
          >
            <img
              src={nuevoUsuarioIcon}
              alt="Nuevo usuario"
              className="btn-icon"
            />

            <span>Nuevo usuario</span>
          </button>
        </div>

        {mensaje && (
          <div className="success-message">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {/* ✅ NUEVO: Barra de búsqueda */}
        <div className="usuarios-search-container">
          <div className="usuarios-search-box">
            <img
              src={buscarIcon}
              alt=""
              className="usuarios-search-icon"
            />

            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por usuario, nombre, apellido, rol o estado..."
              aria-label="Buscar usuarios"
            />

            {busqueda && (
              <button
                type="button"
                className="usuarios-search-clear"
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
                onClick={() => setBusqueda("")}
              >
                ×
              </button>
            )}
          </div>

          {busqueda && (
            <span className="usuarios-search-results">
              {usuariosFiltrados.length} resultado
              {usuariosFiltrados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {cargando ? (
          <p>Cargando usuarios...</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre completo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
             
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      {busqueda
                        ? "No se encontraron usuarios con esa búsqueda."
                        : "No hay usuarios registrados."}
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario._id}>
                      <td>{usuario.usuario}</td>

                      <td>
                        {usuario.nombres}{" "}
                        {usuario.apellidos}
                      </td>

                      <td>{usuario.rol}</td>

                      <td>
                        <span
                          className={
                            usuario.estado === "Activo"
                              ? "status-badge active"
                              : "status-badge blocked"
                          }
                        >
                          {usuario.estado}
                        </span>
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-btn icon-btn-edit"
                            type="button"
                            title="Editar usuario"
                            data-tooltip="Editar usuario"
                            aria-label={`Editar usuario ${usuario.usuario}`}
                            onClick={() =>
                              abrirEditarUsuario(usuario)
                            }
                          >
                            <img
                              src={editarIcon}
                              alt=""
                              className="table-icon"
                            />
                          </button>

                          <button
                            className="icon-btn icon-btn-reset"
                            type="button"
                            title="Resetear contraseña"
                            data-tooltip="Resetear contraseña"
                            aria-label={`Resetear contraseña de ${usuario.usuario}`}
                            onClick={() => resetear(usuario)}
                          >
                            <img
                              src={resetearIcon}
                              alt=""
                              className="table-icon"
                            />
                          </button>

                          <button
                            className="icon-btn icon-btn-password"
                            type="button"
                            title="Cambiar contraseña"
                            data-tooltip="Cambiar contraseña"
                            aria-label={`Cambiar contraseña de ${usuario.usuario}`}
                            onClick={() => abrirCambiarPassword(usuario)}
                          >
                            <img
                              src={cambiarPasswordIcon}
                              alt=""
                              className="table-icon"
                            />
                          </button>

                          <button
                            className={
                              usuario.estado === "Activo"
                                ? "icon-btn icon-btn-block"
                                : "icon-btn icon-btn-unblock"
                            }
                            type="button"
                            title={
                              usuario.estado === "Activo"
                                ? "Bloquear usuario"
                                : "Desbloquear usuario"
                            }
                            data-tooltip={
                              usuario.estado === "Activo"
                                ? "Bloquear usuario"
                                : "Desbloquear usuario"
                            }
                            aria-label={
                              usuario.estado === "Activo"
                                ? `Bloquear usuario ${usuario.usuario}`
                                : `Desbloquear usuario ${usuario.usuario}`
                            }
                            onClick={() =>
                              cambiarEstado(usuario)
                            }
                          >
                            <img
                              src={
                                usuario.estado === "Activo"
                                  ? bloquearIcon
                                  : desbloquearIcon
                              }
                              alt=""
                              className="table-icon"
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
      </SpatialCard>

      <UsuarioModal
        abierto={modalAbierto}
        usuarioEditar={usuarioEditar}
        onClose={cerrarModal}
        onGuardar={guardarUsuario}
        onResetear={resetear}
        onCambiarEstado={cambiarEstado}
      />

      <CambiarPasswordModal
        abierto={modalPasswordAbierto}
        usuario={usuarioPassword}
        onClose={cerrarCambiarPassword}
        onGuardar={guardarNuevaPassword}
      />
    </AppLayout>
  );
}