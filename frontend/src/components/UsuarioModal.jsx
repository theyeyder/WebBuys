import { useEffect, useState } from "react";

import guardarIcon from "../assets/icons/guardar.png";
import resetearIcon from "../assets/icons/resetear.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import cerrarIcon from "../assets/icons/cerrar.png";


import "../styles/usuario-modal.css";

const FORM_INICIAL = {
  nombres: "",
  apellidos: "",
  rol: "Empleado",
  password: "",
  repetirPassword: "",
};

export default function UsuarioModal({
  abierto,
  onClose,
  onGuardar,
  onResetear,
  onCambiarEstado,
  usuarioEditar = null,
}) {
  const [form, setForm] = useState(FORM_INICIAL);

  useEffect(() => {
    if (!abierto) return;

    if (usuarioEditar) {
      setForm({
        nombres: usuarioEditar.nombres || "",
        apellidos: usuarioEditar.apellidos || "",
        rol: usuarioEditar.rol || "Empleado",
        password: "",
        repetirPassword: "",
      });
    } else {
      setForm(FORM_INICIAL);
    }
  }, [abierto, usuarioEditar]);

  if (!abierto) return null;

  function cambiar(event) {
    const { name, value } = event.target;
    setForm((actual) => ({ ...actual, [name]: value }));
  }

  function limpiar() {
    if (usuarioEditar) {
      setForm({
        nombres: usuarioEditar.nombres || "",
        apellidos: usuarioEditar.apellidos || "",
        rol: usuarioEditar.rol || "Empleado",
        password: "",
        repetirPassword: "",
      });
    } else {
      setForm(FORM_INICIAL);
    }
  }

  function enviar(event) {
    event.preventDefault();
    onGuardar(form);
  }

  return (
    <div className="usuario-modal-overlay">
      <div className="usuario-modal-card">
        <div className="usuario-modal-header">
          <div>
            <span>Configuración</span>
            <h2>{usuarioEditar ? "Editar usuario" : "Nuevo usuario"}</h2>
          </div>

          <button
            className="usuario-modal-icon-button usuario-modal-close-button"
            type="button"
            title="Cerrar"
            onClick={onClose}
          >
            <img src={cerrarIcon} alt="Cerrar" />
          </button>
        </div>

        <form onSubmit={enviar}>
          <div className="usuario-modal-body">
            <div className="usuario-modal-grid">
              <label>
                Nombres
                <input
                  name="nombres"
                  value={form.nombres}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Apellidos
                <input
                  name="apellidos"
                  value={form.apellidos}
                  onChange={cambiar}
                  required
                />
              </label>

              <label className="usuario-modal-full">
                Rol
                <select name="rol" value={form.rol} onChange={cambiar}>
                  <option value="Administrador">Administrador</option>
                  <option value="Empleado">Empleado</option>
                </select>
              </label>

              {!usuarioEditar && (
                <>
                  <label>
                    Contraseña
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={cambiar}
                      required
                    />
                  </label>

                  <label>
                    Repetir contraseña
                    <input
                      type="password"
                      name="repetirPassword"
                      value={form.repetirPassword}
                      onChange={cambiar}
                      required
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          <div className="usuario-modal-footer">
            <button
              className="usuario-modal-icon-button usuario-modal-save-button"
              type="submit"
              title="Guardar"
            >
              <img src={guardarIcon} alt="Guardar" />
            </button>

            <button
              className="usuario-modal-icon-button usuario-modal-reset-button"
              type="button"
              title={usuarioEditar ? "Resetear contraseña" : "Limpiar campos"}
              onClick={
                usuarioEditar
                  ? () => onResetear?.(usuarioEditar)
                  : limpiar
              }
            >
              <img src={resetearIcon} alt="Resetear" />
            </button>

            {usuarioEditar && (
              <button
                className={
                  usuarioEditar.estado === "Activo"
                    ? "usuario-modal-icon-button usuario-modal-block-button"
                    : "usuario-modal-icon-button usuario-modal-unblock-button"
                }
                type="button"
                title={
                  usuarioEditar.estado === "Activo"
                    ? "Bloquear usuario"
                    : "Desbloquear usuario"
                }
                onClick={() => onCambiarEstado?.(usuarioEditar)}
              >
                <img
                  src={
                    usuarioEditar.estado === "Activo"
                      ? bloquearIcon
                      : desbloquearIcon
                  }
                  alt={
                    usuarioEditar.estado === "Activo"
                      ? "Bloquear"
                      : "Desbloquear"
                  }
                />
              </button>
            )}

            
          </div>
        </form>
      </div>
    </div>
  );
}