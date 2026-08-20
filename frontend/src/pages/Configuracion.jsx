import { useNavigate } from "react-router-dom";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";

import usuariosIcon from "../assets/icons/usuarios.png";
import empresaIcon from "../assets/icons/empresa.png";
import rutasIcon from "../assets/icons/rutas.png";
import numeracionIcon from "../assets/icons/numeracion.png";
import auditoriaIcon from "../assets/icons/auditoria.png";
import preferenciasIcon from "../assets/icons/preferencias.png";
import zonasDespachoIcon from "../assets/icons/zonas-despacho.png";

import "../styles/configuracion.css";

const opciones = [
  {
    nombre: "Usuarios",
    ruta: "/configuracion/usuarios",
    icono: usuariosIcon,
  },
  {
    nombre: "Empresa",
    ruta: "/configuracion/empresa",
    icono: empresaIcon,
  },
  {
    nombre: "Rutas",
    ruta: "/configuracion/rutas",
    icono: rutasIcon,
  },
  {
    nombre: "Zonas de despacho",
    ruta: "/configuracion/zonas-despacho",
    icono: zonasDespachoIcon,
  },
  {
    nombre: "Numeración",
    ruta: "/configuracion/numeracion",
    icono: numeracionIcon,
  },
  {
    nombre: "Auditoría",
    ruta: "/configuracion/auditoria",
    icono: auditoriaIcon,
  },
  {
    nombre: "Preferencias",
    ruta: "/configuracion/preferencias",
    icono: preferenciasIcon,
  },
];
export default function Configuracion() {
  const navigate = useNavigate();

  return (
    <AppLayout title="Configuración">
      <SpatialCard className="configuracion-module">
        <div className="configuracion-header">
          <span className="eyebrow">Panel de configuración</span>
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
    </AppLayout>
  );
}