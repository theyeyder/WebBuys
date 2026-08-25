import api from "./api.js";

/* =========================================
   LISTAR NUMERACIONES
========================================= */

export const listarNumeraciones =
  async () => {

    const response =
      await api.get(
        "/numeracion"
      );

    return response.data;
  };