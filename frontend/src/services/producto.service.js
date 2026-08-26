import api
  from "./api.js";


const url =
  "/productos";


/* =========================================
   LISTAR
========================================= */

export async function listarProductos() {

  const respuesta =
    await api.get(url);

  return respuesta.data;
}


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export async function obtenerSiguienteCodigoProducto() {

  const respuesta =
    await api.get(
      `${url}/siguiente-codigo`
    );

  return respuesta.data;
}


/* =========================================
   CREAR
========================================= */

export async function crearProducto(
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
   ACTUALIZAR
========================================= */

export async function actualizarProducto(
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

export async function cambiarEstadoProducto(
  id
) {

  const respuesta =
    await api.patch(
      `${url}/${id}/estado`
    );

  return respuesta.data;
}


/* =========================================
   ELIMINAR
========================================= */

export async function eliminarProducto(
  id
) {

  const respuesta =
    await api.delete(
      `${url}/${id}`
    );

  return respuesta.data;
}