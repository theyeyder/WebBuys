import {
  prisma,
} from "../config/postgresql.js";


/* =========================================================
   NORMALIZAR SALIDA
   Mantiene compatibilidad con el frontend existente.
========================================================= */

function normalizarAuditoria(
  registro
) {

  if (!registro) {
    return null;
  }


  return {
    _id:
      registro.legacyMongoId ||
      registro.id,

    id:
      registro.id,

    legacyMongoId:
      registro.legacyMongoId ||
      null,

    usuario:
      registro.usuarioId ||
      null,

    codigoUsuario:
      registro.codigoUsuario,

    nombreUsuario:
      registro.nombreUsuario,

    modulo:
      registro.modulo,

    accion:
      registro.accion,

    registroId:
      registro.registroId,

    codigoRegistro:
      registro.codigoRegistro,

    descripcion:
      registro.descripcion,

    datosAnteriores:
      registro.datosAnteriores,

    datosNuevos:
      registro.datosNuevos,

    ip:
      registro.ip,

    createdAt:
      registro.createdAt,

    updatedAt:
      registro.updatedAt,
  };

}


/* =========================================================
   LISTAR AUDITORÍA
   FUENTE: POSTGRESQL
========================================================= */

export const listarAuditoria =
  async (
    req,
    res
  ) => {

    try {

      const {
        buscar = "",
        modulo = "",
        accion = "",
        usuario = "",
        desde = "",
        hasta = "",
        pagina = 1,
        limite = 50,
      } =
        req.query;


      const and =
        [];


      if (modulo) {

        and.push({
          modulo,
        });

      }


      if (accion) {

        and.push({
          accion,
        });

      }


      if (usuario) {

        and.push({
          OR: [
            {
              codigoUsuario: {
                contains:
                  usuario,

                mode:
                  "insensitive",
              },
            },
            {
              nombreUsuario: {
                contains:
                  usuario,

                mode:
                  "insensitive",
              },
            },
          ],
        });

      }


      if (buscar) {

        and.push({
          OR: [
            {
              codigoUsuario: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
            {
              nombreUsuario: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
            {
              modulo: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
            {
              accion: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
            {
              codigoRegistro: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
            {
              descripcion: {
                contains:
                  buscar,

                mode:
                  "insensitive",
              },
            },
          ],
        });

      }


      if (
        desde ||
        hasta
      ) {

        const rango =
          {};


        if (desde) {

          const fechaDesde =
            new Date(
              desde
            );

          fechaDesde.setHours(
            0,
            0,
            0,
            0
          );

          rango.gte =
            fechaDesde;

        }


        if (hasta) {

          const fechaHasta =
            new Date(
              hasta
            );

          fechaHasta.setHours(
            23,
            59,
            59,
            999
          );

          rango.lte =
            fechaHasta;

        }


        and.push({
          createdAt:
            rango,
        });

      }


      const where =
        and.length
          ? {
              AND:
                and,
            }
          : {};


      const numeroPagina =
        Math.max(
          Number(
            pagina
          ) ||
          1,
          1
        );


      const numeroLimite =
        Math.min(
          Math.max(
            Number(
              limite
            ) ||
            50,
            1
          ),
          100
        );


      const salto =
        (
          numeroPagina -
          1
        ) *
        numeroLimite;


      const [
        registros,
        total,
      ] =
        await Promise.all([

          prisma.auditoria.findMany({
            where,

            orderBy: {
              createdAt:
                "desc",
            },

            skip:
              salto,

            take:
              numeroLimite,
          }),

          prisma.auditoria.count({
            where,
          }),

        ]);


      const totalPaginas =
        Math.max(
          Math.ceil(
            total /
            numeroLimite
          ),
          1
        );


      return res.json({
        registros:
          registros.map(
            normalizarAuditoria
          ),

        paginacion: {
          pagina:
            numeroPagina,

          limite:
            numeroLimite,

          total,

          totalPaginas,
        },
      });

    } catch (error) {

      console.error(
        "Error listando auditoría PostgreSQL:",
        error
      );


      return res
        .status(500)
        .json({
          mensaje:
            "No fue posible cargar la auditoría.",
        });

    }

  };


/* =========================================================
   OBTENER UN REGISTRO
   Acepta UUID PostgreSQL u ObjectId histórico MongoDB.
========================================================= */

export const obtenerAuditoriaPorId =
  async (
    req,
    res
  ) => {

    try {

      const valor =
        String(
          req.params.id ||
          ""
        );


      const pareceObjectId =
        /^[a-f\d]{24}$/i.test(
          valor
        );


      const registro =
        pareceObjectId
          ? await prisma.auditoria.findUnique({
              where: {
                legacyMongoId:
                  valor,
              },
            })
          : await prisma.auditoria.findUnique({
              where: {
                id:
                  valor,
              },
            });


      if (!registro) {

        return res
          .status(404)
          .json({
            mensaje:
              "Registro de auditoría no encontrado.",
          });

      }


      return res.json(
        normalizarAuditoria(
          registro
        )
      );

    } catch (error) {

      console.error(
        "Error consultando auditoría PostgreSQL:",
        error
      );


      return res
        .status(500)
        .json({
          mensaje:
            "No fue posible consultar el registro de auditoría.",
        });

    }

  };
