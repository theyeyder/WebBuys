import api from "./api.js";

export async function obtenerInforme({
  tipo,
  desde,
  hasta,
  repartidorId = "",
  cajaId = "",
  carteraEstado = "",
  carteraPeriodo = "entrega",
}) {
  const response = await api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato: "json",
        ...(tipo === "repartidores" && repartidorId ? { repartidorId } : {}),
        ...(tipo === "caja" && cajaId ? { cajaId } : {}),
        ...(tipo === "cartera" ? { carteraEstado, carteraPeriodo } : {}),
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
  cajaId = "",
  carteraEstado = "",
  carteraPeriodo = "entrega",
}) {
  return api.get(
    `/informes/${tipo}`,
    {
      params: {
        desde,
        hasta,
        formato,
        ...(tipo === "repartidores" && repartidorId ? { repartidorId } : {}),
        ...(tipo === "caja" && cajaId ? { cajaId } : {}),
        ...(tipo === "cartera" ? { carteraEstado, carteraPeriodo } : {}),
      },
      responseType: "blob",
    }
  );
}
export async function obtenerOpcionesRepartidoresInforme() {
  const response = await api.get("/informes/repartidores-opciones");
  return response.data;
}

export async function obtenerOpcionesCajasInforme() {
  const response = await api.get("/informes/cajas-opciones");
  return response.data;
}
