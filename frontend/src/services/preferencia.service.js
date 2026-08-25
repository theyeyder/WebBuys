import api from "./api.js";

/* =========================================
   OBTENER PREFERENCIAS
========================================= */

export const obtenerPreferencias = async () => {
  const response = await api.get(
    "/preferencias"
  );

  return response.data;
};


/* =========================================
   ACTUALIZAR PREFERENCIAS
========================================= */

export const actualizarPreferencias = async (
  datos
) => {
  const response = await api.put(
    "/preferencias",
    datos
  );

  return response.data;
};