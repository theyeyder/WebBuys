import Consecutivo from "../models/Consecutivo.js";

/* =========================================================
   CONFIGURACIÓN VISUAL DE NUMERACIÓN
========================================================= */

const CONFIG_NUMERACION = {
  clientes: {
    modulo: "Clientes",
    prefijo: "CTE",
    longitud: 4,
  },

  usuarios: {
    modulo: "Usuarios",
    prefijo: "USER",
    longitud: 4,
  },

  rutas: {
    modulo: "Rutas",
    prefijo: "RUTA",
    longitud: 2,
  },

  "zonas-despacho": {
    modulo: "Zonas de despacho",
    prefijo: "ZN",
    longitud: 4,
  },
};


/* =========================================================
   LISTAR NUMERACIONES
========================================================= */

export const listarNumeraciones = async (
  req,
  res
) => {
  try {
    const consecutivos =
      await Consecutivo.find()
        .sort({
          clave: 1,
        });

    const resultado =
      Object.entries(
        CONFIG_NUMERACION
      ).map(
        ([
          clave,
          configuracion,
        ]) => {
          const registro =
            consecutivos.find(
              (item) =>
                item.clave === clave
            );

          const ultimoNumero =
            registro?.ultimoNumero || 0;

          const siguienteNumero =
            ultimoNumero + 1;

          const ultimoFormateado =
            String(
              ultimoNumero
            ).padStart(
              configuracion.longitud,
              "0"
            );

          const siguienteCodigo =
            `${configuracion.prefijo}-${String(
              siguienteNumero
            ).padStart(
              configuracion.longitud,
              "0"
            )}`;

          return {
            clave,

            modulo:
              configuracion.modulo,

            prefijo:
              configuracion.prefijo,

            longitud:
              configuracion.longitud,

            ultimoNumero,

            ultimoFormateado,

            siguienteNumero,

            siguienteCodigo,

            actualizadoEn:
              registro?.updatedAt ||
              null,
          };
        }
      );

    return res.json(
      resultado
    );
  } catch (error) {
    console.error(
      "Error listando numeraciones:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible cargar la numeración.",
    });
  }
};  