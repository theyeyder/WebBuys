import api
  from "./api.js";


const url =
  "/cartera";


export async function listarCartera(
  params = {}
) {

  const response =
    await api.get(
      url,
      {
        params,
      }
    );

  return response.data;

}


export async function obtenerResumenCartera() {

  const response =
    await api.get(
      `${url}/resumen`
    );

  return response.data;

}


export async function obtenerCartera(
  id
) {

  const response =
    await api.get(
      `${url}/${id}`
    );

  return response.data;

}


export async function actualizarCartera(
  id,
  data
) {

  const response =
    await api.put(
      `${url}/${id}`,
      data
    );

  return response.data;

}


export async function registrarPagoCartera(
  id,
  data
) {

  const response =
    await api.post(
      `${url}/${id}/pagos`,
      data
    );

  return response.data;

}
