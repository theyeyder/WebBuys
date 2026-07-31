import { useEffect, useState } from "react";

import guardarIcon from "../assets/icons/guardar.png";
import cerrarIcon from "../assets/icons/cerrar.png";

import verIcon from "../assets/icons/ver.png";
import ocultarIcon from "../assets/icons/ocultar.png";

import "../styles/usuario-modal.css";

const FORM_INICIAL = {
  password: "",
  repetirPassword: "",
};

export default function CambiarPasswordModal({
  abierto,
  usuario,
  onGuardar,
  onClose,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
 
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarRepetirPassword, setMostrarRepetirPassword] = useState(false);


  useEffect(() => {
    if (abierto) {
      setForm(FORM_INICIAL);
      setMostrarPassword(false);
      setMostrarRepetirPassword(false);
    }
  }, [abierto]);

  if (!abierto) return null;

  function cambiar(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function enviar(e) {
    e.preventDefault();

    onGuardar(form);
  }

  return (
    <div className="usuario-modal-overlay">
      <div className="usuario-modal-card">
        <div className="usuario-modal-header">
          <div>
            <span>Configuración</span>
            <h2>Cambiar contraseña</h2>
          </div>

          <button
            type="button"
            className="usuario-modal-icon-button usuario-modal-close-button"
            onClick={onClose}
          >
            <img src={cerrarIcon} alt="Cerrar" />
          </button>
        </div>

        <form onSubmit={enviar}>
          <div className="usuario-modal-body">
            <div className="usuario-modal-grid">
              <label className="usuario-modal-full">
                Nueva contraseña

               
                <div className="usuario-password-container">
                  <input
                    type={mostrarPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={cambiar}
                    required
                  />

                  <button
                    type="button"
                    className="usuario-password-toggle"
                    title={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Ver contraseña"
                    }
                    aria-label={
                      mostrarPassword
                        ? "Ocultar contraseña"
                        : "Ver contraseña"
                    }
                    onClick={() =>
                      setMostrarPassword((estadoActual) => !estadoActual)
                    }
                  >
                    <img
                      src={mostrarPassword ? ocultarIcon : verIcon}
                      alt=""
                    />
                  </button>
                </div>
              </label>

              <label className="usuario-modal-full">
                Repetir contraseña

              
                <div className="usuario-password-container">
                  <input
                    type={
                      mostrarRepetirPassword
                        ? "text"
                        : "password"
                    }
                    name="repetirPassword"
                    value={form.repetirPassword}
                    onChange={cambiar}
                    required
                  />

                  <button
                    type="button"
                    className="usuario-password-toggle"
                    title={
                      mostrarRepetirPassword
                        ? "Ocultar contraseña"
                        : "Ver contraseña"
                    }
                    aria-label={
                      mostrarRepetirPassword
                        ? "Ocultar contraseña"
                        : "Ver contraseña"
                    }
                    onClick={() =>
                      setMostrarRepetirPassword(
                        (estadoActual) => !estadoActual
                      )
                    }
                  >
                    <img
                      src={
                        mostrarRepetirPassword
                          ? ocultarIcon
                          : verIcon
                      }
                      alt=""
                    />
                  </button>
                </div>
              </label>
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
              className="usuario-modal-icon-button usuario-modal-close-button"
              type="button"
              title="Cerrar"
              onClick={onClose}
            >
              <img src={cerrarIcon} alt="Cerrar" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}