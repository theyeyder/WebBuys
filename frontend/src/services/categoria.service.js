import api from "./api.js";


const url =
  "/categorias";


/* =========================================
   LISTAR
========================================= */

export async function listarCategorias() {

  const respuesta =
    await api.get(url);

  return respuesta.data;
}


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export async function obtenerSiguienteCodigoCategoria() {

  const respuesta =
    await api.get(
      `${url}/siguiente-codigo`
    );

  return respuesta.data;
}


/* =========================================
   CREAR
========================================= */

export async function crearCategoria(
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

export async function actualizarCategoria(
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

export async function cambiarEstadoCategoria(
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

export async function eliminarCategoria(
  id
) {

  const respuesta =
    await api.delete(
      `${url}/${id}`
    );

  return respuesta.data;
}