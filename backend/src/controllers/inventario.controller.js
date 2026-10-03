import Producto
  from "../models/Producto.js";

import MovimientoInventario
  from "../models/MovimientoInventario.js";

import {
  obtenerStockDisponible,
  registrarEntrada,
  registrarSalida,
  registrarAjuste,
} from "../services/inventario.service.js";

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

  return {
    id:
      presentacion
        ? `${producto._id}:${presentacion._id}`
        : String(
            producto._id
          ),

    productoId:
      producto._id,

    presentacionId:
      presentacion?._id ||
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
              producto.categoria._id ||
              producto.categoria,

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


/* =========================================
   LISTAR INVENTARIO
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
        await Producto
          .find()
          .populate(
            "categoria",
            "codigo nombre estado"
          )
          .sort({
            nombre: 1,
            codigo: 1,
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
            producto
              .presentacionesAdicionales ||
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


      if (
        categoria
      ) {

        filas =
          filas.filter(
            (fila) =>
              String(
                fila.categoria?._id ||
                ""
              ) ===
              String(
                categoria
              )
          );

      }


      if (
        estado
      ) {

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
        "Error listando inventario:",
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
========================================= */

export const consultarStock =
  async (req, res) => {

    try {

      const resultado =
        await obtenerStockDisponible({
          productoId:
            req.params.productoId,

          presentacionId:
            req.query.presentacionId ||
            null,
        });


      return res.json(
        resultado
      );


    } catch (error) {

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


      const filtro = {};


      if (productoId) {
        filtro.producto =
          productoId;
      }


      if (presentacionId) {
        filtro.presentacionId =
          presentacionId;
      }


      if (tipo) {
        filtro.tipo =
          tipo;
      }


      if (
        desde ||
        hasta
      ) {

        filtro.fechaMovimiento = {};

        if (desde) {
          filtro
            .fechaMovimiento
            .$gte =
              new Date(
                desde
              );
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

          filtro
            .fechaMovimiento
            .$lte =
              fechaHasta;
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
        await MovimientoInventario
          .find(
            filtro
          )
          .populate(
            "usuario",
            "codigo nombres apellidos usuario"
          )
          .sort({
            fechaMovimiento: -1,
            createdAt: -1,
          })
          .limit(
            limiteSeguro
          );


      return res.json({
        movimientos,
      });


    } catch (error) {

      console.error(
        "Error listando movimientos de inventario:",
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
   ENTRADA
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
