import api from "./api.js";


/* =========================================================
   EMPLEADOS - SERVICIO
========================================================= */

export async function listarEmpleados(
  params = {}
) {

  const response =
    await api.get(
      "/empleados",
      {
        params,
      }
    );

  return response.data;

}


export async function listarEmpleadosPedidos() {

  const response =
    await api.get(
      "/empleados/pedidos"
    );

  return response.data;

}


export async function obtenerEmpleadoPorId(
  id
) {

  const response =
    await api.get(
      `/empleados/${id}`
    );

  return response.data;

}


export async function obtenerSiguienteCodigoEmpleado() {

  const response =
    await api.get(
      "/empleados/siguiente-codigo"
    );

  return response.data;

}


export async function crearEmpleado(
  datos
) {

  const response =
    await api.post(
      "/empleados",
      datos
    );

  return response.data;

}


export async function actualizarEmpleado(
  id,
  datos
) {

  const response =
    await api.put(
      `/empleados/${id}`,
      datos
    );

  return response.data;

}


export async function cambiarEstadoEmpleado(
  id
) {

  const response =
    await api.patch(
      `/empleados/${id}/estado`
    );

  return response.data;

}


export async function eliminarEmpleado(
  id
) {

  const response =
    await api.delete(
      `/empleados/${id}`
    );

  return response.data;

}


/* =========================================================
   ALIAS DE COMPATIBILIDAD
   Conserva los nombres que tenía el archivo inicial.
========================================================= */

export const listar =
  listarEmpleados;

export const crear =
  crearEmpleado;

export const actualizar =
  actualizarEmpleado;

export const eliminar =
  eliminarEmpleado;
