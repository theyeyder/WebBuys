import usuariosIcon from "../assets/icons/usuarios.png";
import empresaIcon from "../assets/icons/empresa.png";
import rutasIcon from "../assets/icons/rutas.png";
import numeracionIcon from "../assets/icons/numeracion.png";
import auditoriaIcon from "../assets/icons/auditoria.png";
import preferenciasIcon from "../assets/icons/preferencias.png";

const opciones = [
  {
    id: "usuarios",
    nombre: "Usuarios",
    icono: usuariosIcon,
  },
  {
    id: "empresa",
    nombre: "Empresa",
    icono: empresaIcon,
  },
  {
    id: "rutas",
    nombre: "Rutas",
    icono: rutasIcon,
  },
  {
    id: "numeracion",
    nombre: "Numeración",
    icono: numeracionIcon,
  },
  {
    id: "auditoria",
    nombre: "Auditoría",
    icono: auditoriaIcon,
  },
  {
    id: "preferencias",
    nombre: "Preferencias",
    icono: preferenciasIcon,
  },
];

export default function ConfiguracionTabs({
  moduloActivo,
  onCambiarModulo,
}) {
  return (
    <nav
      className="config-tabs"
      aria-label="Módulos de configuración"
    >
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          type="button"
          className={
            moduloActivo === opcion.id
              ? "config-tab active"
              : "config-tab"
          }
          onClick={() => onCambiarModulo(opcion.id)}
        >
          <img
            src={opcion.icono}
            alt=""
            className="config-tab-icon"
          />

          <span>{opcion.nombre}</span>
        </button>
      ))}
    </nav>
  );
}