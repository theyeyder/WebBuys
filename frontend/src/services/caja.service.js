import api
  from "./api.js";


const url =
  "/caja";


export async function obtenerResumenCaja() {

  const response =
    await api.get(
      `${url}/resumen`
    );

  return response.data;

}


export async function listarMovimientosCaja(
  params = {}
) {

  const response =
    await api.get(
      `${url}/movimientos`,
      {
        params,
      }
    );

  return response.data;

}


export async function abrirCaja(
  data
) {

  const response =
    await api.post(
      `${url}/abrir`,
      data
    );

  return response.data;

}


export async function registrarMovimientoCaja(
  data
) {

  const response =
    await api.post(
      `${url}/movimientos`,
      data
    );

  return response.data;

}


export async function cerrarCaja(
  data
) {

  const response =
    await api.post(
      `${url}/cerrar`,
      data
    );

  return response.data;

}


export async function listarHistorialCaja(
  params = {}
) {

  const response =
    await api.get(
      `${url}/historial`,
      {
        params,
      }
    );

  return response.data;

}


export async function obtenerDetalleCaja(
  id
) {

  const response =
    await api.get(
      `${url}/historial/${id}`
    );

  return response.data;

}
