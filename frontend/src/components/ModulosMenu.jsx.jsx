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
import cerrarIcon from "../assets/icons/cerrar.png";

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
  const [abierto, setAbierto] = useState(false);

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

  function irModulo(ruta) {
    navigate(ruta);
    setAbierto(false);
  }

  return (
    <>
      {/* BOTÓN DE MÓDULOS */}

      <button
        type="button"
        className="modulos-menu-trigger"
        onClick={() =>
          setAbierto((actual) => !actual)
        }
        onMouseEnter={() =>
          setAbierto(true)
        }
        aria-label="Abrir módulos"
        data-tooltip="Módulos"
      >
        <img
          src={modulosIcon}
          alt=""
        />
      </button>


      {/* CAJA CENTRAL */}

      {abierto && (
        <div
          className="modulos-menu-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setAbierto(false);
            }
          }}
        >

          <div
            className="modulos-menu-modal"
            onMouseLeave={() =>
              setAbierto(false)
            }
          >

            <div className="modulos-menu-header">

              <h3>
                Módulos
              </h3>

              <button
                type="button"
                className="modulos-menu-close"
                onClick={() =>
                  setAbierto(false)
                }
                aria-label="Cerrar módulos"
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>


            <div className="modulos-menu-grid">

              {MODULOS.map((modulo) => {

                const activo =
                  estaActivo(modulo);

                return (

                  <button
                    key={modulo.ruta}
                    type="button"
                    className={`modulos-menu-item ${
                      activo ? "active" : ""
                    }`}
                    onClick={() =>
                      irModulo(modulo.ruta)
                    }
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

        </div>
      )}
    </>
  );
}