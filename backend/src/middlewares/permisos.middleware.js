import { puede } from "../utils/permisos.js";

export function requierePermiso(modulo, accion = "ver") {
  return (req, res, next) => {
    if (req.usuario?.rol === "Administrador") {
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
