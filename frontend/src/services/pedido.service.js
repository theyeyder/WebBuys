import api
  from "./api.js";


const url =
  "/pedidos";


export async function listarPedidos() {

  const respuesta =
    await api.get(url);

  return respuesta.data;
}


export async function obtenerSiguienteCodigoPedido() {

  const respuesta =
    await api.get(
      `${url}/siguiente-codigo`
    );

  return respuesta.data;
}


export async function crearPedido(
  datos
) {

  const respuesta =
    await api.post(
      url,
      datos
    );

  return respuesta.data;
}


export async function actualizarPedido(
  id,
  datos
) {

  const respuesta =
    await api.put(
      `${url}/${id}`,
      datos
    );

  return respuesta.data;
}


export async function cambiarEstadoPedido(
  id,
  estado
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/estado`,
      {
        estado,
      }
    );

  return respuesta.data;
}


export async function eliminarPedido(
  id
) {

  const respuesta =
    await api.delete(
      `${url}/${id}`
    );

  return respuesta.data;
}