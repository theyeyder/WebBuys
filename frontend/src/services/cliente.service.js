import api from "./api.js";

export async function listarClientes() {
  const response = await api.get("/clientes");
  return response.data;
}

export async function crearCliente(datos) {
  const response = await api.post(
    "/clientes",
    datos
  );

  return response.data;
}

export async function actualizarCliente(
  id,
  datos
) {
  const response = await api.put(
    `/clientes/${id}`,
    datos
  );

  return response.data;
}

export async function eliminarCliente(id) {
  const response = await api.delete(
    `/clientes/${id}`
  );

  return response.data;
}

export async function obtenerSiguienteCodigoCliente() {
  const response = await api.get(
    "/clientes/siguiente-codigo"
  );

  return response.data;
}