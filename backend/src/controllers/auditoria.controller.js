import Auditoria
  from "../models/Auditoria.js";


/* =========================================================
   LISTAR AUDITORÍA
========================================================= */

export const listarAuditoria =
  async (req, res) => {

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
      } = req.query;


      /* =========================================
         FILTRO
      ========================================= */

      const filtro = {};


      /* MÓDULO */

      if (modulo) {

        filtro.modulo = modulo;

      }


      /* ACCIÓN */

      if (accion) {

        filtro.accion = accion;

      }


      /* USUARIO */

      if (usuario) {

        filtro.$or = [
          {
            codigoUsuario: {
              $regex: usuario,
              $options: "i",
            },
          },
          {
            nombreUsuario: {
              $regex: usuario,
              $options: "i",
            },
          },
        ];

      }


      /* =========================================
         BÚSQUEDA GENERAL
      ========================================= */

      if (buscar) {

        const condicionesBusqueda = [
          {
            codigoUsuario: {
              $regex: buscar,
              $options: "i",
            },
          },

          {
            nombreUsuario: {
              $regex: buscar,
              $options: "i",
            },
          },

          {
            modulo: {
              $regex: buscar,
              $options: "i",
            },
          },

          {
            accion: {
              $regex: buscar,
              $options: "i",
            },
          },

          {
            codigoRegistro: {
              $regex: buscar,
              $options: "i",
            },
          },

          {
            descripcion: {
              $regex: buscar,
              $options: "i",
            },
          },
        ];


        /*
          Si ya existe $or por usuario,
          usamos $and para no sobrescribirlo.
        */

        if (filtro.$or) {

          const filtroUsuario =
            filtro.$or;

          delete filtro.$or;


          filtro.$and = [
            {
              $or:
                filtroUsuario,
            },
            {
              $or:
                condicionesBusqueda,
            },
          ];

        } else {

          filtro.$or =
            condicionesBusqueda;

        }

      }


      /* =========================================
         FECHAS
      ========================================= */

      if (
        desde ||
        hasta
      ) {

        filtro.createdAt = {};


        if (desde) {

          const fechaDesde =
            new Date(desde);

          fechaDesde.setHours(
            0,
            0,
            0,
            0
          );

          filtro.createdAt.$gte =
            fechaDesde;

        }


        if (hasta) {

          const fechaHasta =
            new Date(hasta);

          fechaHasta.setHours(
            23,
            59,
            59,
            999
          );

          filtro.createdAt.$lte =
            fechaHasta;

        }

      }


      /* =========================================
         PAGINACIÓN
      ========================================= */

      const numeroPagina =
        Math.max(
          Number(pagina) || 1,
          1
        );


      const numeroLimite =
        Math.min(
          Math.max(
            Number(limite) || 50,
            1
          ),
          100
        );


      const salto =
        (
          numeroPagina - 1
        ) *
        numeroLimite;


      /* =========================================
         CONSULTAR
      ========================================= */

      const [
        registros,
        total,
      ] =
        await Promise.all([

          Auditoria
            .find(filtro)
            .sort({
              createdAt: -1,
            })
            .skip(salto)
            .limit(
              numeroLimite
            )
            .lean(),

          Auditoria.countDocuments(
            filtro
          ),

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

        registros,

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
        "Error listando auditoría:",
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
   OBTENER UN REGISTRO DE AUDITORÍA
========================================================= */

export const obtenerAuditoriaPorId =
  async (req, res) => {

    try {

      const registro =
        await Auditoria
          .findById(
            req.params.id
          )
          .lean();


      if (!registro) {

        return res
          .status(404)
          .json({
            mensaje:
              "Registro de auditoría no encontrado.",
          });

      }


      return res.json(
        registro
      );


    } catch (error) {

      console.error(
        "Error consultando auditoría:",
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