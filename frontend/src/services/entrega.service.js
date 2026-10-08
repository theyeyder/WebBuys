import api
  from "./api.js";


const url =
  "/entregas";


export async function listarEntregas(
  params = {}
) {

  const respuesta =
    await api.get(
      url,
      {
        params,
      }
    );

  return respuesta.data;

}


export async function obtenerEntrega(
  id
) {

  const respuesta =
    await api.get(
      `${url}/${id}`
    );

  return respuesta.data;

}


export async function actualizarPreparacionEntrega(
  id,
  datos
) {

  const respuesta =
    await api.put(
      `${url}/${id}/preparacion`,
      datos
    );

  return respuesta.data;

}


export async function confirmarEntrega(
  id
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/confirmar`
    );

  return respuesta.data;

}


export async function cambiarEstadoEntrega(
  id,
  estado,
  motivoCancelacion = ""
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/estado`,
      {
        estado,
        motivoCancelacion,
      }
    );

  return respuesta.data;

}


export async function cambiarMetodoPagoEntrega(
  id,
  metodoPago
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/metodo-pago`,
      {
        metodoPago,
      }
    );

  return respuesta.data;

}


export async function reabrirPreparacionEntrega(
  id
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/reabrir-preparacion`
    );

  return respuesta.data;

}


export async function revertirEntregaFinalizada(
  id,
  motivo
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/revertir`,
      {
        motivo,
      }
    );

  return respuesta.data;

}
