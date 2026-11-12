import api from "./api.js";

export async function consultarReporteUsuarios() {
  const response = await api.get("/usuarios/reporte", { timeout: 30000 });
  return response.data;
}

export async function descargarReporteUsuariosExcel(filtros = {}) {
  const response = await api.get("/usuarios/reporte/excel", {
    params: filtros,
    responseType: "blob",
    timeout: 60000,
  });
  return response.data;
}
