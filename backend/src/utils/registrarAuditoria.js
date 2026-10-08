import {
  prisma,
} from "../config/postgresql.js";

function obtenerIp(
  req
) {
  const forwarded =
    req?.headers?.[
      "x-forwarded-for"
    ];

  return forwarded
    ? String(
        forwarded
      )
        .split(
          ","
        )[0]
        .trim()
    : req?.ip ||
      req?.socket
        ?.remoteAddress ||
      "";
}

function pareceObjectIdMongo(
  valor
) {
  return /^[a-f\d]{24}$/i.test(
    String(
      valor ||
      ""
    )
  );
}

function pareceUuid(
  valor
) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(
      valor ||
      ""
    )
  );
}

async function resolverUsuarioId(
  usuario
) {
  const postgresId =
    usuario?.postgresId ||
    null;

  if (
    postgresId &&
    pareceUuid(
      postgresId
    )
  ) {
    return postgresId;
  }

  const candidato =
    usuario?.id ||
    usuario?._id ||
    usuario?.legacyMongoId ||
    null;

  if (!candidato) {
    return null;
  }

  const valor =
    String(
      candidato
    );

  if (
    pareceUuid(
      valor
    )
  ) {
    const existe =
      await prisma.usuario.findUnique({
        where: {
          id: valor,
        },

        select: {
          id: true,
        },
      });

    return existe?.id || null;
  }

  if (
    pareceObjectIdMongo(
      valor
    )
  ) {
    const existe =
      await prisma.usuario.findUnique({
        where: {
          legacyMongoId:
            valor,
        },

        select: {
          id: true,
        },
      });

    return existe?.id || null;
  }

  return null;
}

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
  const usuario =
    req?.usuario ||
    req?.user ||
    null;

  const codigoUsuario =
    usuario?.codigo ||
    "";

  const nombreUsuario =
    [
      usuario?.nombres,
      usuario?.apellidos,
    ]
      .filter(
        Boolean
      )
      .join(
        " "
      )
      .trim() ||
    usuario?.usuario ||
    "";

  const ip =
    obtenerIp(
      req
    );

  /*
    La auditoría no debe bloquear la operación principal.
    Desde Fase 60 se registra únicamente en PostgreSQL.
  */
  try {
    const usuarioId =
      await resolverUsuarioId(
        usuario
      );

    await prisma.auditoria.create({
      data: {
        usuarioId,

        codigoUsuario,

        nombreUsuario,

        modulo,

        accion,

        registroId:
          registroId
            ? String(
                registroId
              )
            : null,

        codigoRegistro,

        descripcion,

        datosAnteriores,

        datosNuevos,

        ip,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Error registrando auditoría en PostgreSQL:",
      error?.message ||
      error
    );
  }
}
