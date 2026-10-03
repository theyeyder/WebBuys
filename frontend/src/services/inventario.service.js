import api
  from "./api.js";


const url =
  "/inventario";


/* =========================================
   LISTAR INVENTARIO
========================================= */

export async function listarInventario(
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


/* =========================================
   CONSULTAR STOCK
========================================= */

export async function consultarStockInventario(
  productoId,
  presentacionId = null
) {

  const params = {};

  if (presentacionId) {
    params.presentacionId =
      presentacionId;
  }

  const respuesta =
    await api.get(
      `${url}/stock/${productoId}`,
      {
        params,
      }
    );

  return respuesta.data;
}


/* =========================================
   LISTAR MOVIMIENTOS
========================================= */

export async function listarMovimientosInventario(
  params = {}
) {

  const respuesta =
    await api.get(
      `${url}/movimientos`,
      {
        params,
      }
    );

  return respuesta.data;
}


/* =========================================
   REGISTRAR ENTRADA
========================================= */

export async function registrarEntradaInventario(
  datos
) {

  const respuesta =
    await api.post(
      `${url}/entrada`,
      datos
    );

  return respuesta.data;
}


/* =========================================
   REGISTRAR SALIDA
========================================= */

export async function registrarSalidaInventario(
  datos
) {

  const respuesta =
    await api.post(
      `${url}/salida`,
      datos
    );

  return respuesta.data;
}


/* =========================================
   REGISTRAR AJUSTE
========================================= */

export async function registrarAjusteInventario(
  datos
) {

  const respuesta =
    await api.post(
      `${url}/ajuste`,
      datos
    );

  return respuesta.data;
}
