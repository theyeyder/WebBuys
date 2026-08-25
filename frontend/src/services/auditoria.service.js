import api from "./api.js";

/* =========================================
   LISTAR AUDITORÍA
========================================= */

export const listarAuditoria = async (
  params = {}
) => {
  const response = await api.get(
    "/auditoria",
    {
      params,
    }
  );

  return response.data;
};


/* =========================================
   OBTENER REGISTRO
========================================= */

export const obtenerAuditoriaPorId = async (
  id
) => {
  const response = await api.get(
    `/auditoria/${id}`
  );

  return response.data;
};