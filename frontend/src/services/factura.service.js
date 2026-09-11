import api from "./api.js";

const url = "/facturas";


/* =========================================
   LISTAR FACTURAS
========================================= */

export async function listarFacturas() {

  const response =
    await api.get(
      url
    );

  return response.data;

}


/* =========================================
   CREAR FACTURA
========================================= */

export async function crearFactura(
  data
) {

  const response =
    await api.post(
      url,
      data
    );

  return response.data;

}


/* =========================================
   ACTUALIZAR FACTURA
========================================= */

export async function actualizarFactura(
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
/* =========================================
   ANULAR FACTURA
========================================= */

export async function anularFactura(
  id,
  motivo
) {

  const response =
    await api.patch(
      `${url}/${id}/anular`,
      {
        motivo,
      }
    );

  return response.data;

}


/* =========================================
   REVERTIR FACTURA
========================================= */

export async function revertirFactura(
  id
) {

  const response =
    await api.patch(
      `${url}/${id}/revertir`
    );

  return response.data;

}

/* =========================================
   ELIMINAR FACTURA
========================================= */

export async function eliminarFactura(
  id
) {

  const response =
    await api.delete(
      `${url}/${id}`
    );

  return response.data;

}