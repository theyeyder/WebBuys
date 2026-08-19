import api from "./api.js";

/* Listar rutas */
export async function listarRutas() {
  const response = await api.get("/rutas");
  return response.data;
}

/* Crear ruta */
export async function crearRuta(datos) {
  const response = await api.post("/rutas", datos);
  return response.data;
}

/* Actualizar ruta */
export async function actualizarRuta(id, datos) {
  const response = await api.put(`/rutas/${id}`, datos);
  return response.data;
}

/* Cambiar estado */
export async function cambiarEstadoRuta(id) {
  const response = await api.patch(`/rutas/${id}/estado`);
  return response.data;
}

/* Eliminar ruta */
export async function eliminarRuta(id) {
  const response = await api.delete(`/rutas/${id}`);
  return response.data;
}

/* Obtener siguiente código de ruta */

export async function obtenerSiguienteCodigoRuta() {
  const response = await api.get(
    "/rutas/siguiente-codigo"
  );

  return response.data;
}