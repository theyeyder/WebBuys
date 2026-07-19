import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext.jsx";

import PrivateRoute from "./routes/PrivateRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import Clientes from "./pages/Clientes.jsx";
import Productos from "./pages/Productos.jsx";
import Categorias from "./pages/Categorias.jsx";
import Pedidos from "./pages/Pedidos.jsx";
import Facturacion from "./pages/Facturacion.jsx";
import Empleados from "./pages/Empleados.jsx";

import Configuracion from "./pages/Configuracion.jsx";
import Usuarios from "./pages/Usuarios.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>

        <Routes>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route element={<PrivateRoute />}>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/clientes"
              element={<Clientes />}
            />

            <Route
              path="/productos"
              element={<Productos />}
            />

            <Route
              path="/categorias"
              element={<Categorias />}
            />

            <Route
              path="/pedidos"
              element={<Pedidos />}
            />

            <Route
              path="/facturacion"
              element={<Facturacion />}
            />

            <Route
              path="/empleados"
              element={<Empleados />}
            />

            <Route
              path="/configuracion"
              element={<Configuracion />}
            />

            {/* SOLO ADMINISTRADOR */}

            <Route
              path="/configuracion/usuarios"
              element={
                <RoleRoute
                  roles={["Administrador"]}
                >
                  <Usuarios />
                </RoleRoute>
              }
            />

          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}