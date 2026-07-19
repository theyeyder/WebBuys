import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function PrivateRoute() {
  const { isAuthenticated, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="route-loader">
        Cargando WebBuys...
      </div>
    );
  }

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}