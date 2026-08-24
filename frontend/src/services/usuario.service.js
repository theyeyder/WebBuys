import api from "./api";

/* Listar usuarios */
export const listarUsuarios = async () => {
  const response = await api.get("/usuarios");
  return response.data;
};

/* Crear usuario */
export const crearUsuario = async (datos) => {
  const response = await api.post("/usuarios", datos);
  return response.data;
};

/* Actualizar usuario */
export const actualizarUsuario = async (id, datos) => {
  const response = await api.put(`/usuarios/${id}`, datos);
  return response.data;
};

/* Resetear contraseña a 123456 */
export const resetearPassword = async (id) => {
  const response = await api.patch(
    `/usuarios/${id}/reset-password`
  );

  return response.data;
};

/* Cambiar contraseña */
export const cambiarPassword = async (id, datos) => {
  const response = await api.patch(
    `/usuarios/${id}/cambiar-password`,
    datos
  );

  return response.data;
};

/* Bloquear o desbloquear usuario */
export const cambiarEstadoUsuario = async (id) => {
  const response = await api.patch(
    `/usuarios/${id}/estado`
  );

  return response.data;
};

/* Obtener siguiente código de usuario */
export const obtenerSiguienteCodigoUsuario = async () => {
  const response = await api.get(
    "/usuarios/siguiente-codigo"
  );

  return response.data;
};