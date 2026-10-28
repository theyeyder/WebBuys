import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext.jsx";

import PrivateRoute from "./routes/PrivateRoute.jsx";
import PermissionRoute from "./components/PermissionRoute.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Clientes from "./pages/Clientes.jsx";
import Productos from "./pages/Productos.jsx";
import Inventario from "./pages/Inventario.jsx";
import Categorias from "./pages/Categorias.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Entregas from "./pages/Entregas.jsx";
import Facturacion from "./pages/Facturacion.jsx";
import Caja from "./pages/Caja.jsx";
import Cartera from "./pages/Cartera.jsx";
import Empleados from "./pages/Empleados.jsx";
import Empresa from "./pages/Empresa.jsx";
import Rutas from "./pages/Rutas.jsx";
import Numeracion from "./pages/Numeracion.jsx";
import Auditoria from "./pages/Auditoria.jsx";
import Preferencias from "./pages/Preferencias.jsx";
import Configuracion from "./pages/Configuracion.jsx";
import Usuarios from "./pages/Usuarios.jsx";
import ZonasDespacho from "./pages/ZonasDespacho.jsx";
import Informes from "./pages/Informes.jsx";
import AccesoDenegado from "./pages/AccesoDenegado.jsx";


import UserFooter from "./components/UserFooter.jsx";
import ModuleSearch from "./components/ModuleSearch.jsx";
import Notificaciones from "./components/Notificaciones.jsx";


function ConPermiso({ modulo, children }) {
  return (
    <PermissionRoute modulo={modulo}>
      {children}
    </PermissionRoute>
  );
}

function AppContent() {
  const location = useLocation();

  const {
    isAuthenticated,
    cargando,
  } = useAuth();

  const mostrarFooter =
    !cargando &&
    isAuthenticated &&
    location.pathname !== "/login" &&
    location.pathname !== "/sin-acceso";

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoute />}>
          <Route
            path="/"
            element={
              <ConPermiso modulo="dashboard">
                <Dashboard />
              </ConPermiso>
            }
          />

          <Route
            path="/clientes"
            element={
              <ConPermiso modulo="clientes">
                <Clientes />
              </ConPermiso>
            }
          />

          <Route
            path="/productos"
            element={
              <ConPermiso modulo="productos">
                <Productos />
              </ConPermiso>
            }
          />

          <Route
            path="/categorias"
            element={
              <ConPermiso modulo="categorias">
                <Categorias />
              </ConPermiso>
            }
          />

          <Route
            path="/inventario"
            element={
              <ConPermiso modulo="inventario">
                <Inventario />
              </ConPermiso>
            }
          />

          <Route
            path="/pedidos"
            element={
              <ConPermiso modulo="pedidos">
                <Pedidos />
              </ConPermiso>
            }
          />

          <Route
            path="/entregas"
            element={
              <ConPermiso modulo="entregas">
                <Entregas />
              </ConPermiso>
            }
          />

          <Route
            path="/facturacion"
            element={
              <ConPermiso modulo="facturacion">
                <Facturacion />
              </ConPermiso>
            }
          />

          <Route
            path="/caja"
            element={
              <ConPermiso modulo="caja">
                <Caja />
              </ConPermiso>
            }
          />

          <Route
            path="/cartera"
            element={
              <ConPermiso modulo="cartera">
                <Cartera />
              </ConPermiso>
            }
          />

          <Route
            path="/empleados"
            element={
              <ConPermiso modulo="empleados">
                <Empleados />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion"
            element={
              <ConPermiso modulo="configuracion">
                <Configuracion />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/usuarios"
            element={
              <ConPermiso modulo="usuarios">
                <Usuarios />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/empresa"
            element={
              <ConPermiso modulo="empresa">
                <Empresa />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/rutas"
            element={
              <ConPermiso modulo="rutas">
                <Rutas />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/zonas-despacho"
            element={
              <ConPermiso modulo="zonas_despacho">
                <ZonasDespacho />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/numeracion"
            element={
              <ConPermiso modulo="numeracion">
                <Numeracion />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/auditoria"
            element={
              <ConPermiso modulo="auditoria">
                <Auditoria />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/preferencias"
            element={
              <ConPermiso modulo="preferencias">
                <Preferencias />
              </ConPermiso>
            }
          />

          <Route
            path="/configuracion/informes"
            element={
              <ConPermiso modulo="configuracion">
                <Informes />
              </ConPermiso>
            }
          />

          <Route
            path="/sin-acceso"
            element={<AccesoDenegado />}
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>

        {mostrarFooter && (
    <>
      <ModuleSearch />
      <UserFooter />
      <Notificaciones />
    </>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}