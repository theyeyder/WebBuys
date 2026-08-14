import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";


import dashboardIcon from "../assets/icons/dashboard.png";
import clientesIcon from "../assets/icons/clientes.png";
import categoriasIcon from "../assets/icons/categorias.png";    
import productosIcon from "../assets/icons/productos.png";
import pedidosIcon from "../assets/icons/pedidos.png";
import facturacionIcon from "../assets/icons/facturacion.png";
import empleadosIcon from "../assets/icons/empleados.png";
import configuracionIcon from "../assets/icons/configuracion.png";
import modulosIcon from "../assets/icons/modulos.png";

import "../styles/ModulosMenu.jsx.css";

const MODULOS = [
  {
    nombre: "Dashboard",
    ruta: "/",
    icono: dashboardIcon,
  },

  {
    nombre: "Clientes",
    ruta: "/clientes",
    icono: clientesIcon,
  },

  {
    nombre: "Categorías",
    ruta: "/categorias",
    icono: categoriasIcon,
  },

  {
    nombre: "Productos",
    ruta: "/productos",
    icono: productosIcon,
  },

  {
    nombre: "Pedidos",
    ruta: "/pedidos",
    icono: pedidosIcon,
  },

  {
    nombre: "Facturación",
    ruta: "/facturacion",
    icono: facturacionIcon,
  },

  {
    nombre: "Empleados",
    ruta: "/empleados",
    icono: empleadosIcon,
  },

  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: configuracionIcon,
  },
];

export default function ModulosMenu() {
  const [abierto, setAbierto] =
    useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  function estaActivo(modulo) {
    if (modulo.ruta === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(
      modulo.ruta
    );
  }

  return (
    <div
      className={`config-quick-menu ${
        abierto ? "open" : ""
      }`}
      onMouseEnter={() =>
        setAbierto(true)
      }
      onMouseLeave={() =>
        setAbierto(false)
      }
    >
      {/* BOTÓN QUE ABRE LOS MÓDULOS */}

      <button
        type="button"
        className="config-quick-trigger"
        onClick={() =>
          setAbierto(
            (actual) => !actual
          )
        }
        aria-label="Abrir módulos"
        title="Módulos"
      >
        <img
          src={modulosIcon}
          alt=""
          className="config-modulos-icon"
        />
      </button>

      {/* MÓDULOS PRINCIPALES */}

      <div className="config-quick-panel">
        {MODULOS.map((modulo) => {
          const activo =
            estaActivo(modulo);

          return (
            <button
              key={modulo.ruta}
              type="button"
              className={`config-quick-item ${
                activo
                  ? "active"
                  : ""
              }`}
              onClick={() => {
                navigate(modulo.ruta);
                setAbierto(false);
              }}
            >
              <img
                src={modulo.icono}
                alt=""
              />

              <span>
                {modulo.nombre}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}