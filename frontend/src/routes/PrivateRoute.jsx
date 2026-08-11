import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute() {
  const {
    isAuthenticated,
    cargando,
  } = useAuth();

  /*
    Mientras AuthContext recupera la sesión
    NO redirigir al login.
  */
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

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}