import Auditoria
  from "../models/Auditoria.js";


/* =========================================================
   REGISTRAR AUDITORÍA
========================================================= */

export async function registrarAuditoria({
  req,
  modulo,
  accion,
  registroId = null,
  codigoRegistro = "",
  descripcion = "",
  datosAnteriores = null,
  datosNuevos = null,
}) {

  try {

    const usuario =
      req?.usuario ||
      req?.user ||
      null;


    const usuarioId =
      usuario?._id ||
      usuario?.id ||
      null;


    const codigoUsuario =
      usuario?.codigo ||
      "";


    const nombreUsuario =
      [
        usuario?.nombres,
        usuario?.apellidos,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      usuario?.usuario ||
      "";


    /* =========================================
       OBTENER IP
    ========================================= */

    const forwarded =
      req?.headers?.[
        "x-forwarded-for"
      ];


    const ip =
      forwarded
        ? String(forwarded)
            .split(",")[0]
            .trim()
        : req?.ip ||
          req?.socket
            ?.remoteAddress ||
          "";


    /* =========================================
       CREAR REGISTRO
    ========================================= */

    await Auditoria.create({

      usuario:
        usuarioId,

      codigoUsuario,

      nombreUsuario,

      modulo,

      accion,

      registroId,

      codigoRegistro,

      descripcion,

      datosAnteriores,

      datosNuevos,

      ip,

    });


  } catch (error) {

    /*
      IMPORTANTE:

      Un error de auditoría NO debe impedir
      que se complete la operación principal.
    */

    console.error(
      "Error registrando auditoría:",
      error.message
    );

  }

}