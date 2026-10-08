import { useNavigate } from "react-router-dom";

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

const opciones = [
  {
    nombre: "Usuarios",
    descripcion: "Usuarios, roles, acceso y contraseñas.",
    ruta: "/configuracion/usuarios",
    icono: usuariosIcon,
  },
  {
    nombre: "Empresa",
    descripcion: "Datos generales, facturación, logo e impresión.",
    ruta: "/configuracion/empresa",
    icono: empresaIcon,
  },
  {
    nombre: "Rutas",
    descripcion: "Rutas operativas y zonas asignadas.",
    ruta: "/configuracion/rutas",
    icono: rutasIcon,
  },
  {
    nombre: "Zonas de despacho",
    descripcion: "Cobertura y organización de las entregas.",
    ruta: "/configuracion/zonas-despacho",
    icono: zonasDespachoIcon,
  },
  {
    nombre: "Numeración",
    descripcion: "Consecutivos usados por los módulos del sistema.",
    ruta: "/configuracion/numeracion",
    icono: numeracionIcon,
  },
  {
    nombre: "Auditoría",
    descripcion: "Historial de acciones y cambios realizados.",
    ruta: "/configuracion/auditoria",
    icono: auditoriaIcon,
  },
  {
    nombre: "Preferencias",
    descripcion: "Opciones generales de funcionamiento y visualización.",
    ruta: "/configuracion/preferencias",
    icono: preferenciasIcon,
  },
];

export default function Configuracion() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <section className="configuracion-page">
        <header className="configuracion-topbar">
          <div className="configuracion-topbar-left">
            <ModulosMenu />

            <div className="configuracion-topbar-copy">
              <h1>Configuración</h1>
              <p>Administra los parámetros generales de WebBuys.</p>
            </div>
          </div>
        </header>

        <main className="configuracion-content">
          <SpatialCard className="configuracion-module">
            <div className="configuracion-header">
              <span className="eyebrow">Panel de configuración</span>

              <h2>Administración del sistema</h2>

              <p>
                Selecciona una opción para gestionar usuarios, empresa,
                rutas, numeración, auditoría y preferencias.
              </p>
            </div>

            <nav
              className="configuracion-nav"
              aria-label="Módulos de configuración"
            >
              {opciones.map((opcion) => (
                <button
                  key={opcion.ruta}
                  className="configuracion-nav-button"
                  type="button"
                  onClick={() => navigate(opcion.ruta)}
                >
                  <span className="configuracion-nav-icon-wrap">
                    <img
                      src={opcion.icono}
                      alt=""
                      className="configuracion-nav-icon"
                    />
                  </span>

                  <span className="configuracion-nav-copy">
                    <strong>{opcion.nombre}</strong>
                    <small>{opcion.descripcion}</small>
                  </span>

                  <span
                    className="configuracion-nav-arrow"
                    aria-hidden="true"
                  >
                    ›
                  </span>
                </button>
              ))}
            </nav>
          </SpatialCard>
        </main>
      </section>
    </AppLayout>
  );
}
