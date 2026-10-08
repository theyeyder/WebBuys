import jwt from "jsonwebtoken";

import {
  prisma,
} from "../config/postgresql.js";


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


export const proteger =
  async (
    req,
    res,
    next
  ) => {

    try {

      const header =
        req.headers.authorization;


      if (
        !header ||
        !header.startsWith(
          "Bearer "
        )
      ) {

        return res
          .status(401)
          .json({
            mensaje:
              "No autorizado, token no enviado",
          });

      }


      const token =
        header.split(
          " "
        )[1];


      const decoded =
        jwt.verify(
          token,
          process.env.JWT_SECRET
        );


      let user =
        null;


      /*
        TOKENS NUEVOS:
        decoded.id = UUID PostgreSQL.

        TOKENS ANTERIORES:
        decoded.id = ObjectId MongoDB.

        Esto permite cambiar la autenticación sin obligar
        a cerrar inmediatamente todas las sesiones.
      */
      if (
        pareceObjectIdMongo(
          decoded.id
        )
      ) {

        user =
          await prisma.usuario.findUnique({
            where: {
              legacyMongoId:
                String(
                  decoded.id
                ),
            },
          });

      } else {

        user =
          await prisma.usuario.findUnique({
            where: {
              id:
                String(
                  decoded.id
                ),
            },
          });

      }


      if (!user) {

        return res
          .status(401)
          .json({
            mensaje:
              "Usuario no encontrado",
          });

      }


      if (
        user.estado !==
        "Activo"
      ) {

        return res
          .status(401)
          .json({
            mensaje:
              "El usuario se encuentra bloqueado.",
          });

      }


      /*
        PUENTE TEMPORAL DE COMPATIBILIDAD

        postgresId / id:
          UUID de PostgreSQL.

        _id:
          ObjectId histórico de MongoDB cuando existe.

        Los controladores que todavía trabajan con Mongoose
        continúan leyendo req.usuario._id sin romperse.
        Los nuevos controladores Prisma deben usar
        req.usuario.postgresId o req.usuario.id.
      */
      req.usuario = {
        id:
          user.id,

        postgresId:
          user.id,

        _id:
          user.legacyMongoId ||
          user.id,

        legacyMongoId:
          user.legacyMongoId,

        codigo:
          user.codigo,

        nombres:
          user.nombres,

        apellidos:
          user.apellidos,

        usuario:
          user.usuario,

        rol:
          user.rol,

        estado:
          user.estado,

        debeCambiarPassword:
          user.debeCambiarPassword,

        ultimoIngreso:
          user.ultimoIngreso,

        createdAt:
          user.createdAt,

        updatedAt:
          user.updatedAt,
      };


      next();

    } catch (error) {

      console.error(
        "Error autenticación PostgreSQL:",
        error?.message ||
        error
      );


      return res
        .status(401)
        .json({
          mensaje:
            "Token inválido",
        });

    }

  };
