import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RoleRoute({
  children,
  roles,
}) {
  const {
    usuario,
    cargando,
    isAuthenticated,
  } = useAuth();

  // Esperar a que AuthContext recupere la sesión
  if (cargando) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "700",
        }}
      >
        Cargando WebBuys...
      </div>
    );
  }

  // Solo enviar al login cuando realmente
  // terminó la carga y no existe sesión
  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permisos
  if (!roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />;
  }

  return children;
}