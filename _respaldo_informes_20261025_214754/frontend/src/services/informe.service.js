import api from "./api.js";

export async function obtenerInforme({
  tipo,
  desde,
  hasta,
}) {
  const response = await api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato: "json",
      },
    }
  );

  return response.data;
}

export async function obtenerArchivoInforme({
  tipo,
  desde,
  hasta,
  formato,
}) {
  return api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato,
      },
      responseType: "blob",
    }
  );
}