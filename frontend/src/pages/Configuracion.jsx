import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { puedeVerModulo } from "../utils/permisosUsuario.js";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import usuariosIcon from "../assets/icons/usuarios.webp";
import empresaIcon from "../assets/icons/empresa.webp";
import rutasIcon from "../assets/icons/rutas.webp";
import numeracionIcon from "../assets/icons/numeracion.webp";
import auditoriaIcon from "../assets/icons/auditoria.webp";
import preferenciasIcon from "../assets/icons/preferencias.webp";
import zonasDespachoIcon from "../assets/icons/zonas-despacho.webp";

import "../styles/configuracion.css";
import "../styles/configuracion-cabecera.css";

const opciones = [
  { nombre: "Usuarios", ruta: "/configuracion/usuarios", modulo: "usuarios", icono: usuariosIcon },
  { nombre: "Empresa", ruta: "/configuracion/empresa", modulo: "empresa", icono: empresaIcon },
  { nombre: "Rutas", ruta: "/configuracion/rutas", modulo: "rutas", icono: rutasIcon },
  { nombre: "Zonas de despacho", ruta: "/configuracion/zonas-despacho", modulo: "zonas_despacho", icono: zonasDespachoIcon },
  { nombre: "Numeración", ruta: "/configuracion/numeracion", modulo: "numeracion", icono: numeracionIcon },
  { nombre: "Auditoría", ruta: "/configuracion/auditoria", modulo: "auditoria", icono: auditoriaIcon },
  { nombre: "Preferencias", ruta: "/configuracion/preferencias", modulo: "preferencias", icono: preferenciasIcon },
];

export default function Configuracion() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const opcionesVisibles = opciones.filter((opcion) =>
    puedeVerModulo(usuario, opcion.modulo)
  );

  return (
    <AppLayout title="Configuración">
      <section className="configuracion-page">
        <ModulosMenu />

        <header className="configuracion-topbar">
          <div className="configuracion-topbar-copy">
            <h1>Configuración</h1>
            <p>Administración general de WebBuys</p>
          </div>
        </header>

        <div className="configuracion-content">
          <SpatialCard className="configuracion-module">
            <div className="configuracion-header">
              <span className="eyebrow">Panel de configuración</span>
            </div>

            <nav
              className="configuracion-nav"
              aria-label="Módulos de configuración"
            >
              {opcionesVisibles.map((opcion) => (
                <button
                  key={opcion.ruta}
                  className="configuracion-nav-button"
                  type="button"
                  onClick={() => navigate(opcion.ruta)}
                >
                  <img
                    src={opcion.icono}
                    alt=""
                    className="configuracion-nav-icon"
                  />

                  <span>{opcion.nombre}</span>
                </button>
              ))}
            </nav>
          </SpatialCard>
        </div>
      </section>
    </AppLayout>
  );
}
