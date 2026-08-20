import api from "./api.js";

/* ===========================
   LISTAR ZONAS
=========================== */

export async function listarZonasDespacho() {
  const response = await api.get(
    "/zonas-despacho"
  );

  return response.data;
}

/* ===========================
   CREAR ZONA
=========================== */

export async function crearZonaDespacho(datos) {
  const response = await api.post(
    "/zonas-despacho",
    datos
  );

  return response.data;
}

/* ===========================
   ACTUALIZAR ZONA
=========================== */

export async function actualizarZonaDespacho(
  id,
  datos
) {
  const response = await api.put(
    `/zonas-despacho/${id}`,
    datos
  );

  return response.data;
}

/* ===========================
   CAMBIAR ESTADO
=========================== */

export async function cambiarEstadoZonaDespacho(id) {
  const response = await api.patch(
    `/zonas-despacho/${id}/estado`
  );

  return response.data;
}

/* ===========================
   ELIMINAR ZONA
=========================== */

export async function eliminarZonaDespacho(id) {
  const response = await api.delete(
    `/zonas-despacho/${id}`
  );

  return response.data;
}   