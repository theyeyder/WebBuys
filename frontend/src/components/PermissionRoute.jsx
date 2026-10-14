import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import {
  puedeVerModulo,
  rutaInicialPermitida,
} from "../utils/permisosUsuario.js";

export default function PermissionRoute({
  modulo,
  children,
}) {
  const {
    usuario,
    cargando,
    isAuthenticated,
  } = useAuth();

  if (cargando) {
    return null;
  }

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!puedeVerModulo(usuario, modulo)) {
    return (
      <Navigate
        to={rutaInicialPermitida(usuario)}
        replace
      />
    );
  }

  return children;
}
