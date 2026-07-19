import { useEffect, useState } from "react";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";
import UsuarioModal from "../components/UsuarioModal.jsx";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarEstadoUsuario,
} from "../services/usuario.service.js";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState(null);
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

      if (!usuarioEditar) {
        if (!form.password) {
          setError("La contraseña es obligatoria.");
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

  async function resetear(usuario) {
    const confirmar = window.confirm(
      `La contraseña de ${usuario.usuario} quedará en 123. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await resetearPassword(usuario._id);

      setMensaje(
        `La contraseña de ${usuario.usuario} fue restablecida a 123.`
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
              Administra los usuarios y sus roles dentro de WebBuys.
            </p>
          </div>

          <button
            className="primary-btn"
            type="button"
            onClick={abrirNuevoUsuario}
          >
            + Nuevo usuario
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
                {usuarios.length === 0 ? (
                  <tr>
                    <td colSpan="5">
                      No hay usuarios registrados.
                    </td>
                  </tr>
                ) : (
                  usuarios.map((usuario) => (
                    <tr key={usuario._id}>
                      <td>{usuario.usuario}</td>

                      <td>
                        {usuario.nombres} {usuario.apellidos}
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
                            className="icon-btn"
                            type="button"
                            title="Editar usuario"
                            onClick={() =>
                              abrirEditarUsuario(usuario)
                            }
                          >
                            {/* ICONO EDITAR */}
                          </button>

                          <button
                            className="icon-btn"
                            type="button"
                            title="Resetear contraseña"
                            onClick={() => resetear(usuario)}
                          >
                            {/* ICONO RESETEAR */}
                          </button>

                          <button
                            className="icon-btn"
                            type="button"
                            title={
                              usuario.estado === "Activo"
                                ? "Bloquear usuario"
                                : "Desbloquear usuario"
                            }
                            onClick={() =>
                              cambiarEstado(usuario)
                            }
                          >
                            {/* ICONO BLOQUEAR / DESBLOQUEAR */}
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
      />
    </AppLayout>
  );
}