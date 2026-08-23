import { useAuth } from "../context/AuthContext.jsx";

import cerrarSesionIcon from "../assets/icons/cerrar-sesion.png";

import "../styles/user-footer.css";

export default function UserFooter() {
  const { usuario, logout } = useAuth();

  const fechaActual =
    new Date().toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <footer className="user-footer">

      <div className="user-footer-user">
        <span>Usuario:</span>

        <strong>
          {usuario?.nombres || usuario?.apellidos
            ? `${usuario?.nombres || ""} ${usuario?.apellidos || ""}`.trim()
            : usuario?.usuario || "Sin usuario"}
        </strong>
      </div>

      <div className="user-footer-date">
        {fechaActual}
      </div>

      <button
        type="button"
        className="user-footer-logout"
        onClick={logout}
        data-tooltip="Cerrar sesión"
        aria-label="Cerrar sesión"
      >
        <img
          src={cerrarSesionIcon}
          alt=""
        />
      </button>

    </footer>
  );
}