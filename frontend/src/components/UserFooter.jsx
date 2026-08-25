import {
  useEffect,
  useState,
} from "react";

import { useAuth }
  from "../context/AuthContext.jsx";

import {
  obtenerConfiguracion,
} from "../services/configuracion.service.js";

import cerrarSesionIcon
  from "../assets/icons/cerrar-sesion.png";

import empresaIcon
  from "../assets/icons/empresa.png";

import "../styles/user-footer.css";


export default function UserFooter() {

  const {
    usuario,
    logout,
  } = useAuth();


  const [
    nombreEmpresa,
    setNombreEmpresa,
  ] = useState("");


  /* =========================================
     CARGAR EMPRESA
  ========================================= */

  useEffect(() => {

    async function cargarEmpresa() {

      try {

        const respuesta =
          await obtenerConfiguracion();

        const configuracion =
          respuesta?.configuracion ||
          respuesta ||
          {};

        setNombreEmpresa(
          configuracion.nombreComercial ||
          ""
        );

      } catch (error) {

        console.error(
          "No fue posible cargar el nombre de la empresa:",
          error
        );

      }

    }

    cargarEmpresa();

  }, []);


  /* =========================================
     FECHA
  ========================================= */

  const fechaActual =
    new Date().toLocaleDateString(
      "es-CO",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );


  return (

    <footer className="user-footer">


      {/* USUARIO */}

      <div className="user-footer-user">

        <span>
          Usuario:
        </span>

        <strong>

          {usuario?.nombres ||
          usuario?.apellidos
            ? `${usuario?.nombres || ""} ${usuario?.apellidos || ""}`.trim()
            : usuario?.usuario ||
              "Sin usuario"}

        </strong>

      </div>


      {/* FECHA */}

      <div className="user-footer-date">
        {fechaActual}
      </div>


      {/* DERECHA */}

      <div className="user-footer-right">


        {/* EMPRESA */}

        {nombreEmpresa && (

          <div className="user-footer-company">

            <img
              src={empresaIcon}
              alt=""
            />

            <strong>
              {nombreEmpresa}
            </strong>

          </div>

        )}


        {/* CERRAR SESIÓN */}

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

      </div>

    </footer>

  );
}