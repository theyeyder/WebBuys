import { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { puedeVerModulo } from "../utils/permisosUsuario.js";

import dashboardIcon from "../assets/icons/dashboard.webp";
import clientesIcon from "../assets/icons/clientes.webp";
import categoriasIcon from "../assets/icons/categorias.webp";
import productosIcon from "../assets/icons/productos.webp";
import inventarioIcon from "../assets/icons/inventario.webp";
import pedidosIcon from "../assets/icons/pedidos.webp";
import entregaIcon from "../assets/icons/Entrega.webp";
import facturacionIcon from "../assets/icons/facturacion.webp";
import cajaIcon from "../assets/icons/caja.webp";
import carteraIcon from "../assets/icons/Cartera.webp";
import empleadosIcon from "../assets/icons/empleados.webp";
import configuracionIcon from "../assets/icons/configuracion.webp";
import modulosIcon from "../assets/icons/modulos.webp";
import cerrarIcon from "../assets/icons/cerrar.webp";

import "../styles/ModulosMenu.css";

const MODULOS = [
  { nombre: "Dashboard", ruta: "/", modulo: "dashboard", icono: dashboardIcon },
  { nombre: "Clientes", ruta: "/clientes", modulo: "clientes", icono: clientesIcon },
  { nombre: "Categorías", ruta: "/categorias", modulo: "categorias", icono: categoriasIcon },
  { nombre: "Productos", ruta: "/productos", modulo: "productos", icono: productosIcon },
  { nombre: "Inventario", ruta: "/inventario", modulo: "inventario", icono: inventarioIcon },
  { nombre: "Pedidos", ruta: "/pedidos", modulo: "pedidos", icono: pedidosIcon },
  { nombre: "Entrega", ruta: "/entregas", modulo: "entregas", icono: entregaIcon },
  { nombre: "Facturación", ruta: "/facturacion", modulo: "facturacion", icono: facturacionIcon },
  { nombre: "Caja", ruta: "/caja", modulo: "caja", icono: cajaIcon },
  { nombre: "Cartera", ruta: "/cartera", modulo: "cartera", icono: carteraIcon },
  { nombre: "Empleados", ruta: "/empleados", modulo: "empleados", icono: empleadosIcon },
  { nombre: "Configuración", ruta: "/configuracion", modulo: "configuracion", icono: configuracionIcon },
];

export default function ModulosMenu() {
  const [abierto, setAbierto] = useState(false);
  const { usuario } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const modulosVisibles = MODULOS.filter((modulo) =>
    puedeVerModulo(usuario, modulo.modulo)
  );

  function estaActivo(modulo) {
    if (modulo.ruta === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(modulo.ruta);
  }

  function irModulo(ruta) {
    navigate(ruta);
    setAbierto(false);
  }

  return (
    <>
      <button
        type="button"
        className="modulos-menu-trigger"
        onClick={() => setAbierto((actual) => !actual)}
        onMouseEnter={() => setAbierto(true)}
        aria-label="Abrir módulos"
        data-tooltip="Módulos"
      >
        <img src={modulosIcon} alt="" />
      </button>

      {abierto && (
        <div
          className="modulos-menu-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setAbierto(false);
            }
          }}
        >
          <div
            className="modulos-menu-modal"
            onMouseLeave={() => setAbierto(false)}
          >
            <div className="modulos-menu-header">
              <h3>Módulos</h3>

              <button
                type="button"
                className="modulos-menu-close"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar módulos"
              >
                <img src={cerrarIcon} alt="" />
              </button>
            </div>

            <div className="modulos-menu-grid">
              {modulosVisibles.map((modulo) => {
                const activo = estaActivo(modulo);

                return (
                  <button
                    key={modulo.ruta}
                    type="button"
                    className={`modulos-menu-item ${activo ? "active" : ""}`}
                    onClick={() => irModulo(modulo.ruta)}
                  >
                    <img src={modulo.icono} alt="" />
                    <span>{modulo.nombre}</span>
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
