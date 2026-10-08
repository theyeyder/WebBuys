import {
  prisma,
} from "../config/postgresql.js";

import {
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
} from "../services/inventarioManualPostgresql.service.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";


/* =========================================
   UTILIDADES
========================================= */

function numero(
  valor,
  fallback = 0
) {
  const resultado =
    Number(valor);

  return Number.isFinite(
    resultado
  )
    ? resultado
    : fallback;
}


function redondear(
  valor
) {
  return Number(
    numero(valor)
      .toFixed(4)
  );
}


function pareceObjectIdMongo(
  valor
) {
  return /^[a-f\d]{24}$/i.test(
    String(valor || "")
  );
}


function valorId(
  valor
) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return "";
  }

  if (
    typeof valor === "object"
  ) {
    return String(
      valor.postgresId ||
      valor.legacyMongoId ||
      valor._id ||
      valor.id ||
      ""
    );
  }

  return String(valor);
}


function idCompatibilidad(
  registro
) {
  if (!registro) {
    return null;
  }

  return (
    registro.legacyMongoId ||
    registro.id ||
    null
  );
}


function estadoInventario({
  controlInventario,
  disponible,
  stockMinimo,
}) {
  if (
    controlInventario === false
  ) {
    return "Sin control de stock";
  }

  if (
    disponible <= 0
  ) {
    return "Agotado";
  }

  if (
    disponible <=
    stockMinimo
  ) {
    return "Stock bajo";
  }

  return "Disponible";
}


function construirFila({
  producto,
  presentacion = null,
}) {
  const objetivo =
    presentacion ||
    producto;

  const stock =
    redondear(
      objetivo.stock || 0
    );

  const stockReservado =
    redondear(
      objetivo.stockReservado || 0
    );

  const stockDisponible =
    redondear(
      stock -
      stockReservado
    );

  const stockMinimo =
    redondear(
      objetivo.stockMinimo || 0
    );

  const controlInventario =
    objetivo.controlInventario !== false;

  const costoPromedio =
    redondear(
      objetivo.costoPromedio ||
      objetivo.precioCompra ||
      0
    );

  const valorInventario =
    redondear(
      stock *
      costoPromedio
    );

  const productoCompatId =
    idCompatibilidad(
      producto
    );

  const presentacionCompatId =
    idCompatibilidad(
      presentacion
    );

  return {
    id:
      presentacion
        ? `${productoCompatId}:${presentacionCompatId}`
        : String(
            productoCompatId
          ),

    productoId:
      productoCompatId,

    productoPostgresId:
      producto.id,

    presentacionId:
      presentacionCompatId,

    presentacionPostgresId:
      presentacion?.id ||
      null,

    esPresentacion:
      Boolean(
        presentacion
      ),

    codigo:
      producto.codigo ||
      "",

    producto:
      producto.nombre ||
      "",

    presentacion:
      presentacion?.nombre ||
      "",

    nombre:
      presentacion
        ? `${producto.nombre} - ${presentacion.nombre}`
        : producto.nombre,

    marca:
      producto.marca ||
      "",

    categoria:
      producto.categoria
        ? {
            _id:
              idCompatibilidad(
                producto.categoria
              ),

            id:
              idCompatibilidad(
                producto.categoria
              ),

            postgresId:
              producto.categoria.id,

            codigo:
              producto.categoria.codigo ||
              "",

            nombre:
              producto.categoria.nombre ||
              "",
          }
        : null,

    tipoVenta:
      objetivo.tipoVenta ||
      producto.tipoVenta ||
      "Unidad",

    unidad:
      objetivo.unidad ||
      producto.unidad ||
      "",

    precioCompra:
      redondear(
        objetivo.precioCompra ||
        0
      ),

    stock,

    stockReservado,

    stockDisponible,

    stockMinimo,

    controlInventario,

    costoPromedio,

    valorInventario,

    estado:
      estadoInventario({
        controlInventario,
        disponible:
          stockDisponible,
        stockMinimo,
      }),

    productoEstado:
      producto.estado,

    presentacionEstado:
      presentacion?.estado ||
      null,
  };
}


async function buscarProductoPostgreSQL(
  id
) {
  const valor =
    valorId(id);

  if (!valor) {
    return null;
  }

  return prisma.producto.findUnique({
    where:
      pareceObjectIdMongo(
        valor
      )
        ? {
            legacyMongoId:
              valor,
          }
        : {
            id:
              valor,
          },

    include: {
      categoria:
        true,

      presentaciones:
        true,
    },
  });
}


function buscarPresentacionEnProducto(
  producto,
  presentacionId
) {
  const valor =
    valorId(
      presentacionId
    );

  if (!valor) {
    return null;
  }

  return (
    producto.presentaciones ||
    []
  ).find(
    (presentacion) =>
      presentacion.id === valor ||
      presentacion.legacyMongoId === valor
  ) || null;
}


function normalizarUsuarioMovimiento(
  usuario
) {
  if (!usuario) {
    return null;
  }

  return {
    _id:
      idCompatibilidad(
        usuario
      ),

    id:
      idCompatibilidad(
        usuario
      ),

    postgresId:
      usuario.id,

    codigo:
      usuario.codigo,

    nombres:
      usuario.nombres,

    apellidos:
      usuario.apellidos,

    usuario:
      usuario.usuario,
  };
}


function normalizarMovimientoSalida(
  movimiento
) {
  return {
    _id:
      idCompatibilidad(
        movimiento
      ),

    id:
      idCompatibilidad(
        movimiento
      ),

    postgresId:
      movimiento.id,

    producto:
      idCompatibilidad(
        movimiento.producto
      ),

    codigoProducto:
      movimiento.codigoProducto,

    nombreProducto:
      movimiento.nombreProducto,

    presentacionId:
      idCompatibilidad(
        movimiento.presentacion
      ),

    presentacionNombre:
      movimiento.presentacionNombre,

    tipo:
      movimiento.tipo,

    cantidad:
      redondear(
        movimiento.cantidad
      ),

    unidad:
      movimiento.unidad,

    tipoVenta:
      movimiento.tipoVenta,

    stockAnterior:
      redondear(
        movimiento.stockAnterior
      ),

    stockNuevo:
      redondear(
        movimiento.stockNuevo
      ),

    reservadoAnterior:
      redondear(
        movimiento.reservadoAnterior
      ),

    reservadoNuevo:
      redondear(
        movimiento.reservadoNuevo
      ),

    costoUnitario:
      redondear(
        movimiento.costoUnitario
      ),

    costoPromedioAnterior:
      redondear(
        movimiento.costoPromedioAnterior
      ),

    costoPromedioNuevo:
      redondear(
        movimiento.costoPromedioNuevo
      ),

    valorTotal:
      redondear(
        movimiento.valorTotal
      ),

    origen:
      movimiento.origen,

    pedido:
      idCompatibilidad(
        movimiento.pedido
      ),

    pedidoCodigo:
      movimiento.pedidoCodigo,

    entrega:
      idCompatibilidad(
        movimiento.entrega
      ),

    entregaCodigo:
      movimiento.entregaCodigo,

    proveedor:
      movimiento.proveedor,

    documentoReferencia:
      movimiento.documentoReferencia,

    fechaMovimiento:
      movimiento.fechaMovimiento,

    motivo:
      movimiento.motivo,

    observaciones:
      movimiento.observaciones,

    usuario:
      normalizarUsuarioMovimiento(
        movimiento.usuario
      ),

    createdAt:
      movimiento.createdAt,

    updatedAt:
      movimiento.updatedAt,
  };
}


/* =========================================
   LISTAR INVENTARIO
   FUENTE DE LECTURA: POSTGRESQL
========================================= */

export const listarInventario =
  async (req, res) => {

    try {
      const {
        buscar = "",
        estado = "",
        categoria = "",
      } = req.query;


      const productos =
        await prisma.producto.findMany({
          include: {
            categoria:
              true,

            presentaciones: {
              orderBy: {
                orden:
                  "asc",
              },
            },
          },

          orderBy: [
            {
              nombre:
                "asc",
            },
            {
              codigo:
                "asc",
            },
          ],
        });


      let filas = [];


      for (
        const producto
        of productos
      ) {
        filas.push(
          construirFila({
            producto,
          })
        );


        for (
          const presentacion
          of (
            producto.presentaciones ||
            []
          )
        ) {
          filas.push(
            construirFila({
              producto,
              presentacion,
            })
          );
        }
      }


      const texto =
        String(
          buscar || ""
        )
          .trim()
          .toLowerCase();


      if (texto) {
        filas =
          filas.filter(
            (fila) =>
              [
                fila.codigo,
                fila.producto,
                fila.presentacion,
                fila.nombre,
                fila.marca,
                fila.categoria?.codigo,
                fila.categoria?.nombre,
                fila.unidad,
              ].some(
                (valor) =>
                  String(
                    valor || ""
                  )
                    .toLowerCase()
                    .includes(
                      texto
                    )
              )
          );
      }


      if (categoria) {
        filas =
          filas.filter(
            (fila) =>
              String(
                fila.categoria?._id ||
                ""
              ) ===
              String(
                categoria
              ) ||
              String(
                fila.categoria?.postgresId ||
                ""
              ) ===
              String(
                categoria
              )
          );
      }


      if (estado) {
        filas =
          filas.filter(
            (fila) =>
              fila.estado ===
              estado
          );
      }


      const resumen = {
        productosEnInventario:
          filas.filter(
            (fila) =>
              fila.controlInventario &&
              fila.stock > 0
          ).length,

        stockBajo:
          filas.filter(
            (fila) =>
              fila.estado ===
              "Stock bajo"
          ).length,

        agotados:
          filas.filter(
            (fila) =>
              fila.estado ===
              "Agotado"
          ).length,

        sinControl:
          filas.filter(
            (fila) =>
              fila.estado ===
              "Sin control de stock"
          ).length,

        valorTotalInventario:
          redondear(
            filas.reduce(
              (
                total,
                fila
              ) =>
                total +
                numero(
                  fila.valorInventario
                ),
              0
            )
          ),

        totalRegistros:
          filas.length,
      };


      return res.json({
        resumen,
        inventario:
          filas,
      });

    } catch (error) {
      console.error(
        "Error listando inventario PostgreSQL:",
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            error.message ||
            "No fue posible cargar el inventario.",
        });
    }
  };


/* =========================================
   CONSULTAR STOCK
   FUENTE DE LECTURA: POSTGRESQL
========================================= */

export const consultarStock =
  async (req, res) => {

    try {
      const producto =
        await buscarProductoPostgreSQL(
          req.params.productoId
        );


      if (!producto) {
        return res
          .status(404)
          .json({
            mensaje:
              "Producto no encontrado.",
          });
      }


      const presentacionId =
        req.query.presentacionId ||
        null;


      const presentacion =
        presentacionId
          ? buscarPresentacionEnProducto(
              producto,
              presentacionId
            )
          : null;


      if (
        presentacionId &&
        !presentacion
      ) {
        return res
          .status(404)
          .json({
            mensaje:
              "La presentación seleccionada no existe.",
          });
      }


      const objetivo =
        presentacion ||
        producto;


      const stock =
        redondear(
          objetivo.stock || 0
        );

      const stockReservado =
        redondear(
          objetivo.stockReservado || 0
        );


      return res.json({
        productoId:
          idCompatibilidad(
            producto
          ),

        productoPostgresId:
          producto.id,

        presentacionId:
          idCompatibilidad(
            presentacion
          ),

        presentacionPostgresId:
          presentacion?.id ||
          null,

        controlInventario:
          objetivo.controlInventario !== false,

        stock,

        stockReservado,

        stockDisponible:
          redondear(
            stock -
            stockReservado
          ),

        stockMinimo:
          redondear(
            objetivo.stockMinimo || 0
          ),

        costoPromedio:
          redondear(
            objetivo.costoPromedio || 0
          ),
      });

    } catch (error) {
      console.error(
        "Error consultando stock PostgreSQL:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible consultar el stock.",
        });
    }
  };


/* =========================================
   MOVIMIENTOS
   FUENTE DE LECTURA: POSTGRESQL
========================================= */

export const listarMovimientos =
  async (req, res) => {

    try {
      const {
        productoId,
        presentacionId,
        tipo,
        desde,
        hasta,
        limite = 200,
      } = req.query;


      const where = {};


      if (productoId) {
        const producto =
          await buscarProductoPostgreSQL(
            productoId
          );

        if (!producto) {
          return res.json({
            movimientos: [],
          });
        }

        where.productoId =
          producto.id;
      }


      if (presentacionId) {
        const valor =
          valorId(
            presentacionId
          );

        const presentacion =
          pareceObjectIdMongo(
            valor
          )
            ? await prisma.productoPresentacion.findUnique({
                where: {
                  legacyMongoId:
                    valor,
                },
              })
            : await prisma.productoPresentacion.findUnique({
                where: {
                  id:
                    valor,
                },
              });

        if (!presentacion) {
          return res.json({
            movimientos: [],
          });
        }

        where.presentacionId =
          presentacion.id;
      }


      if (tipo) {
        where.tipo =
          tipo;
      }


      if (
        desde ||
        hasta
      ) {
        where.fechaMovimiento = {};

        if (desde) {
          where.fechaMovimiento.gte =
            new Date(
              `${desde}T00:00:00.000Z`
            );
        }

        if (hasta) {
          where.fechaMovimiento.lte =
            new Date(
              `${hasta}T00:00:00.000Z`
            );
        }
      }


      const limiteSeguro =
        Math.min(
          Math.max(
            Number(
              limite
            ) || 200,
            1
          ),
          500
        );


      const movimientos =
        await prisma.movimientoInventario.findMany({
          where,

          include: {
            producto:
              true,

            presentacion:
              true,

            pedido:
              true,

            entrega:
              true,

            usuario:
              true,
          },

          orderBy: [
            {
              fechaMovimiento:
                "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],

          take:
            limiteSeguro,
        });


      return res.json({
        movimientos:
          movimientos.map(
            normalizarMovimientoSalida
          ),
      });

    } catch (error) {
      console.error(
        "Error listando movimientos de inventario PostgreSQL:",
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            error.message ||
            "No fue posible cargar los movimientos.",
        });
    }
  };


/* =========================================
   ESCRITURAS
   TRANSICIÓN: AÚN USAN EL SERVICIO MONGODB.
   NO CAMBIAR HASTA LA SIGUIENTE FASE.
========================================= */

export const crearEntradaInventario =
  async (req, res) => {

    try {

      const {
        productoId,
        presentacionId = null,
        cantidad,
        costoUnitario = 0,
        proveedor = "",
        documentoReferencia = "",
        fechaMovimiento = null,
        motivo = "Entrada de inventario",
        observaciones = "",
      } = req.body;


      if (!productoId) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe seleccionar un producto.",
          });

      }


      const resultado =
        await registrarEntrada({
          productoId,
          presentacionId,
          cantidad,
          costoUnitario,
          proveedor,
          documentoReferencia,
          fechaMovimiento,
          motivo,
          observaciones,

          usuarioId:
            req.usuario?._id ||
            null,
        });


      await registrarAuditoria({
        req,

        modulo:
          "Inventario",

        accion:
          "CREAR",

        registroId:
          resultado
            .movimiento?._id ||
          null,

        codigoRegistro:
          resultado
            .producto
            ?.codigo ||
          "",

        descripcion:
          "Entrada de inventario.",

        datosNuevos: {
          productoId,
          presentacionId,
          cantidad,
          costoUnitario,
          stock:
            resultado.stock,
          stockReservado:
            resultado.stockReservado,
          stockDisponible:
            resultado.stockDisponible,
        },
      });


      return res
        .status(201)
        .json({
          mensaje:
            "Entrada registrada correctamente.",

          ...resultado,
        });


    } catch (error) {

      console.error(
        "Error registrando entrada de inventario:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible registrar la entrada.",
        });

    }

  };


/* =========================================
   SALIDA MANUAL
========================================= */

export const crearSalidaInventario =
  async (req, res) => {

    try {

      const {
        productoId,
        presentacionId = null,
        cantidad,
        motivo = "Salida de inventario",
        observaciones = "",
        fechaMovimiento = null,
      } = req.body;


      if (!productoId) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe seleccionar un producto.",
          });

      }


      const resultado =
        await registrarSalida({
          productoId,
          presentacionId,
          cantidad,
          motivo,
          observaciones,
          fechaMovimiento,

          usuarioId:
            req.usuario?._id ||
            null,
        });


      await registrarAuditoria({
        req,

        modulo:
          "Inventario",

        accion:
          "CREAR",

        registroId:
          resultado
            .movimiento?._id ||
          null,

        codigoRegistro:
          resultado
            .producto
            ?.codigo ||
          "",

        descripcion:
          "Salida manual de inventario.",

        datosNuevos: {
          productoId,
          presentacionId,
          cantidad,
          motivo,
          stock:
            resultado.stock,
          stockReservado:
            resultado.stockReservado,
          stockDisponible:
            resultado.stockDisponible,
        },
      });


      return res
        .status(201)
        .json({
          mensaje:
            resultado.omitido
              ? resultado.motivo
              : "Salida registrada correctamente.",

          ...resultado,
        });


    } catch (error) {

      console.error(
        "Error registrando salida de inventario:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible registrar la salida.",
        });

    }

  };


/* =========================================
   AJUSTE
========================================= */

export const crearAjusteInventario =
  async (req, res) => {

    try {

      const {
        productoId,
        presentacionId = null,
        stockFisico,
        motivo = "Ajuste de inventario",
        observaciones = "",
        fechaMovimiento = null,
      } = req.body;


      if (!productoId) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe seleccionar un producto.",
          });

      }


      const resultado =
        await registrarAjuste({
          productoId,
          presentacionId,
          stockFisico,
          motivo,
          observaciones,
          fechaMovimiento,

          usuarioId:
            req.usuario?._id ||
            null,
        });


      if (
        !resultado.sinCambios
      ) {

        await registrarAuditoria({
          req,

          modulo:
            "Inventario",

          accion:
            "ACTUALIZAR",

          registroId:
            resultado
              .movimiento?._id ||
            null,

          codigoRegistro:
            resultado
              .producto
              ?.codigo ||
            "",

          descripcion:
            "Ajuste de inventario.",

          datosNuevos: {
            productoId,
            presentacionId,
            stockFisico,
            motivo,
            stock:
              resultado.stock,
            stockReservado:
              resultado.stockReservado,
            stockDisponible:
              resultado.stockDisponible,
          },
        });

      }


      return res.json({
        mensaje:
          resultado.sinCambios
            ? "El conteo coincide con el stock actual. No fue necesario crear un ajuste."
            : "Ajuste registrado correctamente.",

        ...resultado,
      });


    } catch (error) {

      console.error(
        "Error registrando ajuste de inventario:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible registrar el ajuste.",
        });

    }

  };
