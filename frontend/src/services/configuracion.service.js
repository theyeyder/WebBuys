import api from "./api.js";

export async function obtenerConfiguracion() {
  const response = await api.get("/configuracion");
  return response.data;
}

export async function actualizarConfiguracion(datos) {
  const response = await api.put("/configuracion", datos);
  return response.data;
}
