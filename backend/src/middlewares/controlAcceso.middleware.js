import { puede } from "../utils/permisos.js";

function textoRuta(req) {
  return `${req.baseUrl || ""}${req.path || ""}`.toLowerCase();
}

function accionDesdePeticion(req, modulo) {
  const metodo = String(req.method || "GET").toUpperCase();
  const ruta = textoRuta(req);

  if (metodo === "GET" || metodo === "HEAD" || metodo === "OPTIONS") {
    return null;
  }

  if (metodo === "DELETE") {
    return "eliminar";
  }

  if (
    ruta.includes("anular") ||
    ruta.includes("revertir") ||
    ruta.includes("reversion")
  ) {
    return "anular";
  }

  if (
    ruta.includes("movimiento") ||
    ruta.includes("entrada") ||
    ruta.includes("salida") ||
    ruta.includes("ajuste") ||
    ruta.includes("pago")
  ) {
    return "registrarMovimientos";
  }

  if (
    ruta.includes("estado") ||
    ruta.includes("bloquear") ||
    ruta.includes("desbloquear") ||
    ruta.includes("cerrar") ||
    ruta.includes("abrir")
  ) {
    return "cambiarEstado";
  }

  if (metodo === "POST") {
    return "crear";
  }

  if (metodo === "PUT" || metodo === "PATCH") {
    return "editar";
  }

  return modulo ? "editar" : null;
}

export function controlarAccesoModulo(modulo) {
  return (req, res, next) => {
    if (req.usuario?.rol === "Administrador") {
      return next();
    }

    const accion = accionDesdePeticion(req, modulo);

    /*
      En esta primera capa de Fase 3, los GET continúan disponibles
      para usuarios autenticados porque varios módulos consumen datos
      auxiliares de otros módulos (clientes, productos, empleados, etc.).
      Las modificaciones sí quedan protegidas por permiso real.
    */
    if (!accion) {
      return next();
    }

    if (!puede(req.usuario, modulo, accion)) {
      return res.status(403).json({
        mensaje: "No tienes permiso para realizar esta acción.",
        modulo,
        accion,
      });
    }

    return next();
  };
}
