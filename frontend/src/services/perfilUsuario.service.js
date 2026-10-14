import api from "./api";

/* Listar perfiles disponibles */
export const listarPerfiles = async () => {
  const response = await api.get("/perfiles");
  return response.data;
};

/* Catálogo de módulos y acciones disponibles */
export const listarModulosPermisos = async () => {
  const response = await api.get("/perfiles/modulos");
  return response.data;
};

/* Consultar permisos efectivos de un usuario */
export const obtenerPermisosUsuario = async (usuarioId) => {
  const response = await api.get(`/perfiles/usuario/${usuarioId}`);
  return response.data;
};

/* Asignar uno o varios perfiles a un empleado */
export const asignarPerfilesUsuario = async (usuarioId, perfilIds) => {
  const response = await api.patch(
    `/perfiles/usuario/${usuarioId}/perfil`,
    { perfilIds: Array.isArray(perfilIds) ? perfilIds : [] }
  );

  return response.data;
};

/* Alias compatible con código anterior */
export const asignarPerfilUsuario = async (usuarioId, perfilId) =>
  asignarPerfilesUsuario(
    usuarioId,
    perfilId ? [perfilId] : []
  );

/* Guardar excepciones individuales de permisos */
export const actualizarPermisosPersonalizados = async (
  usuarioId,
  permisos
) => {
  const response = await api.put(
    `/perfiles/usuario/${usuarioId}/personalizados`,
    { permisos }
  );

  return response.data;
};
