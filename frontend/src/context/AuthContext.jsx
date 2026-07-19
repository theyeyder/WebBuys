import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarSesionGuardada();
  }, []);

  function cargarSesionGuardada() {
    try {
      const token = localStorage.getItem("token");
      const usuarioGuardado = localStorage.getItem("user");

      if (token && usuarioGuardado) {
        setUsuario(JSON.parse(usuarioGuardado));
      }
    } catch (error) {
      console.error("Error recuperando la sesión:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setCargando(false);
    }
  }

  async function login({ usuario, password }) {
    const nombreUsuario = usuario?.trim().toLowerCase();

    if (!nombreUsuario || !password) {
      throw new Error("Usuario y contraseña son obligatorios.");
    }

    const response = await api.post("/auth/login", {
      usuario: nombreUsuario,
      password,
    });

    const { token, user } = response.data;

    if (!token || !user) {
      throw new Error("La respuesta del servidor no es válida.");
    }

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    /* Elimina el almacenamiento antiguo del modo demo */
    localStorage.removeItem("webbuys_user");

    setUsuario(user);

    return user;
  }

  function logout() {
    setUsuario(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("webbuys_user");

    window.location.href = "/login";
  }

  const value = useMemo(
    () => ({
      usuario,

      /* Alias temporal para componentes que todavía usan user */
      user: usuario,

      login,
      logout,
      cargando,
      isAuthenticated: Boolean(usuario),
      esAdministrador: usuario?.rol === "Administrador",
    }),
    [usuario, cargando]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return context;
}