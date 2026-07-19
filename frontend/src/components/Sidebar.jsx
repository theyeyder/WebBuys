import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Boxes,
  Tags,
  ClipboardList,
  ReceiptText,
  UserCog,
  Settings,
  ChevronDown,
  Building2,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";


import { useAuth } from "../context/AuthContext";

const itemClass = ({ isActive }) =>
  isActive ? "side-link active" : "side-link";

const subItemClass = ({ isActive }) =>
  isActive ? "side-sublink active" : "side-sublink";

export default function Sidebar() {
  const { usuario } = useAuth();
  const location = useLocation();

  const esAdministrador = usuario?.rol === "Administrador";

  const [productosAbierto, setProductosAbierto] = useState(false);
  const [configuracionAbierta, setConfiguracionAbierta] = useState(false);

  useEffect(() => {
    if (
      location.pathname.startsWith("/productos") ||
      location.pathname.startsWith("/categorias")
    ) {
      setProductosAbierto(true);
    }

    if (location.pathname.startsWith("/configuracion")) {
      setConfiguracionAbierta(true);
    }
  }, [location.pathname]);

  return (
    <aside className="sidebar">
      <div className="brand-card">
        <div className="brand-orb">W</div>

        <div>
          <h2>WebBuys</h2>
          <p>Pedidos lácteos</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink className={itemClass} to="/">
          <LayoutDashboard size={19} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink className={itemClass} to="/clientes">
          <Users size={19} />
          <span>Clientes</span>
        </NavLink>

        <button
          type="button"
          className={`side-link side-menu-button ${
            productosAbierto ? "expanded" : ""
          }`}
          onClick={() => setProductosAbierto((estado) => !estado)}
        >
          <Boxes size={19} />

          <span>Productos</span>

          <ChevronDown
            size={17}
            className={`submenu-chevron ${
              productosAbierto ? "rotated" : ""
            }`}
          />
        </button>

        <div
          className={`sidebar-submenu ${
            productosAbierto ? "open" : ""
          }`}
        >
          <NavLink className={subItemClass} to="/productos">
            <Boxes size={17} />
            <span>Lista de productos</span>
          </NavLink>

          <NavLink className={subItemClass} to="/categorias">
            <Tags size={17} />
            <span>Categorías</span>
          </NavLink>
        </div>

        <NavLink className={itemClass} to="/pedidos">
          <ClipboardList size={19} />
          <span>Pedidos</span>
        </NavLink>

        <NavLink className={itemClass} to="/facturacion">
          <ReceiptText size={19} />
          <span>Facturación</span>
        </NavLink>

        {esAdministrador && (
          <NavLink className={itemClass} to="/empleados">
            <UserCog size={19} />
            <span>Empleados</span>
          </NavLink>
        )}

        {esAdministrador && (
          <>
            <button
              type="button"
              className={`side-link side-menu-button ${
                configuracionAbierta ? "expanded" : ""
              }`}
              onClick={() =>
                setConfiguracionAbierta((estado) => !estado)
              }
            >
              <Settings size={19} />

              <span>Configuración</span>

              <ChevronDown
                size={17}
                className={`submenu-chevron ${
                  configuracionAbierta ? "rotated" : ""
                }`}
              />
            </button>

            <div
              className={`sidebar-submenu ${
                configuracionAbierta ? "open" : ""
              }`}
            >
              <NavLink
                className={subItemClass}
                to="/configuracion/usuarios"
              >
                <ShieldCheck size={17} />
                <span>Usuarios</span>
              </NavLink>

              <NavLink
                className={subItemClass}
                to="/configuracion"
              >
                <Building2 size={17} />
                <span>Empresa</span>
              </NavLink>

              <button
                type="button"
                className="side-sublink disabled"
                disabled
              >
                <SlidersHorizontal size={17} />
                <span>Preferencias</span>
              </button>
            </div>
          </>
        )}
      </nav>

      <div className="side-glow-card">
        <strong>Spatial UI</strong>
        <span>Bento Grid + 3D</span>
      </div>
    </aside>
  );
}