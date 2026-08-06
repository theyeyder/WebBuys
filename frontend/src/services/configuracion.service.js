import api from "./api.js";

export async function obtenerConfiguracion() {
  const response = await api.get("/configuracion");
  return response.data;
}

export async function actualizarConfiguracion(datos) {
  const response = await api.put("/configuracion", datos);
  return response.data;
}
export async function subirLogoEmpresa(archivo) {
  const formData = new FormData();

  formData.append("logo", archivo);

  const response = await api.post(
    "/configuracion/logo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}