import api from "./api.js";


const url = "/pedidos";


/* =========================================
   LISTAR PEDIDOS
========================================= */

export async function listarPedidos() {
  const respuesta =
    await api.get(url);

  return respuesta.data;
}


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export async function obtenerSiguienteCodigoPedido() {
  const respuesta =
    await api.get(
      `${url}/siguiente-codigo`
    );

  return respuesta.data;
}


/* =========================================
   CREAR PEDIDO
========================================= */

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


/* =========================================
   ACTUALIZAR PEDIDO
========================================= */

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


/* =========================================
   CAMBIAR ESTADO
========================================= */

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


/* =========================================
   ELIMINAR PEDIDO
========================================= */

export async function eliminarPedido(
  id
) {
  const respuesta =
    await api.delete(
      `${url}/${id}`
    );

  return respuesta.data;
}
