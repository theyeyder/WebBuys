import api from "./api.js";

export async function obtenerInforme({
  tipo,
  desde,
  hasta,
  repartidorId = "",
}) {
  const response = await api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato: "json",
        ...(tipo === "repartidores" && repartidorId ? { repartidorId } : {}),
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
  repartidorId = "",
}) {
  return api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato,
        ...(tipo === "repartidores" && repartidorId ? { repartidorId } : {}),
      },
      responseType: "blob",
    }
  );
}
export async function obtenerOpcionesRepartidoresInforme() {
  const response = await api.get("/informes/repartidores-opciones");
  return response.data;
}
