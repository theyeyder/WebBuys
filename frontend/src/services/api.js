import axios from "axios";

import {
  notificarCambioDatos,
} from "../utils/dataSync.js";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5000/api",
  timeout: 10000,
});

/* ===========================
   TOKEN JWT
=========================== */

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ===========================
   RESPUESTAS
=========================== */

api.interceptors.response.use(
  (response) => {
    const metodo =
      String(
        response?.config?.method ||
        ""
      ).toLowerCase();

    if (
      [
        "post",
        "put",
        "patch",
        "delete",
      ].includes(
        metodo
      )
    ) {
      notificarCambioDatos({
        metodo,
        url:
          response?.config?.url ||
          "",
      });
    }

    return response;
  },

  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;