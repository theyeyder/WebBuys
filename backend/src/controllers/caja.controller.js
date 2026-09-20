import mongoose
  from "mongoose";

import Caja
  from "../models/Caja.js";

import MovimientoCaja
  from "../models/MovimientoCaja.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


function usuarioActual(req) {

  return (
    req.usuario?._id ||
    req.user?._id ||
    null
  );

}


/* =========================================
   CALCULAR TOTALES REALES DE CAJA

   - Pedido Entregado = venta
   - Efectivo sí afecta dinero físico
   - Transferencia / Crédito no afectan
     el efectivo esperado
   - Movimientos manuales sí afectan caja
========================================= */

async function calcularTotales(
  cajaId
) {

  const id =
    new mongoose.Types.ObjectId(
      cajaId
    );


  const movimientos =
    await MovimientoCaja
      .find({
        caja:
          id,

        estado:
          "Activo",
      })
      .populate(
        "factura",
        "codigo pedido estado"
      )
      .lean();


  /*
    Pedidos que ya tienen movimiento nuevo.
    Sirve para no duplicar movimientos antiguos
    cuyo origen era "Factura".
  */
  const pedidosNuevos =
    new Set(
      movimientos

        .filter(
          (movimiento) =>
            movimiento.origen ===
            "Pedido" &&
            movimiento.pedido
        )

        .map(
          (movimiento) =>
            String(
              movimiento.pedido
            )
        )
    );


  let cantidadPedidosEntregados =
    0;

  let totalVentasEntregadas =
    0;

  let totalEfectivoPedidos =
    0;

  let totalTransferencias =
    0;

  let totalCredito =
    0;

  let totalIngresosManuales =
    0;

  let totalIngresos =
    0;

  let totalEgresos =
    0;


  for (
    const movimiento
    of movimientos
  ) {

    const valor =
      Number(
        movimiento.valor ||
        0
      );


    if (
      !Number.isFinite(
        valor
      ) ||
      valor <= 0
    ) {
      continue;
    }


    /* =====================================
       NUEVA LÓGICA: PEDIDOS ENTREGADOS
    ===================================== */

    if (
      movimiento.origen ===
      "Pedido" &&
      movimiento.tipo ===
      "Ingreso"
    ) {

      cantidadPedidosEntregados +=
        1;

      totalVentasEntregadas +=
        valor;


      const metodoPago =
        movimiento.metodoPago ||
        "Efectivo";


      if (
        metodoPago ===
        "Efectivo"
      ) {

        totalEfectivoPedidos +=
          valor;

      } else if (
        metodoPago ===
        "Transferencia"
      ) {

        totalTransferencias +=
          valor;

      } else if (
        metodoPago ===
        "Crédito"
      ) {

        totalCredito +=
          valor;

      }


      if (
        movimiento.afectaEfectivo !==
        false
      ) {

        totalIngresos +=
          valor;

      }


      continue;

    }


    /* =====================================
       COMPATIBILIDAD:
       MOVIMIENTOS ANTIGUOS DE FACTURA
       Antes solo se registraban facturas
       pagadas en efectivo.
    ===================================== */

    if (
      movimiento.origen ===
        "Factura" &&
      movimiento.tipo ===
        "Ingreso"
    ) {

      const pedidoFactura =
        movimiento.factura
          ?.pedido
          ? String(
              movimiento.factura.pedido
            )
          : "";


      if (
        pedidoFactura &&
        pedidosNuevos.has(
          pedidoFactura
        )
      ) {

        /*
          Ya existe el movimiento nuevo del pedido.
          No se suma dos veces.
        */
        continue;

      }


      cantidadPedidosEntregados +=
        1;

      totalVentasEntregadas +=
        valor;

      totalEfectivoPedidos +=
        valor;

      totalIngresos +=
        valor;


      continue;

    }


    /* =====================================
       INGRESOS / EGRESOS MANUALES,
       AJUSTES Y REVERSOS HISTÓRICOS
    ===================================== */

    const afectaEfectivo =
      movimiento.afectaEfectivo !==
      false;


    if (
      !afectaEfectivo
    ) {
      continue;
    }


    if (
      movimiento.tipo ===
      "Ingreso"
    ) {

      totalIngresos +=
        valor;


      if (
        movimiento.origen ===
          "Manual" ||
        movimiento.origen ===
          "Ajuste"
      ) {

        totalIngresosManuales +=
          valor;

      }

    }


    if (
      movimiento.tipo ===
      "Egreso"
    ) {

      totalEgresos +=
        valor;

    }

  }


  const totalMediosPago =
    totalEfectivoPedidos +
    totalTransferencias +
    totalCredito;


  const diferenciaConciliacion =
    Number(
      (
        totalVentasEntregadas -
        totalMediosPago
      ).toFixed(
        2
      )
    );


  return {
    cantidadPedidosEntregados,

    totalVentasEntregadas,

    totalEfectivoPedidos,

    totalTransferencias,

    totalCredito,

    totalMediosPago,

    diferenciaConciliacion,

    totalIngresosManuales,

    totalIngresos,

    totalEgresos,
  };

}


async function construirResumen(
  caja
) {

  if (!caja) {

    return {
      caja: null,

      abierta: false,

      resumen: {
        saldoInicial: 0,

        cantidadPedidosEntregados:
          0,

        totalVentasEntregadas:
          0,

        totalEfectivoPedidos:
          0,

        totalTransferencias:
          0,

        totalCredito:
          0,

        totalMediosPago:
          0,

        diferenciaConciliacion:
          0,

        totalIngresosManuales:
          0,

        totalIngresos:
          0,

        totalEgresos:
          0,

        saldoActual:
          0,

        saldoEsperado:
          0,

        efectivoContado:
          null,

        diferencia:
          null,
      },
    };

  }


  const totales =
    await calcularTotales(
      caja._id
    );


  const saldoInicial =
    Number(
      caja.saldoInicial ||
      0
    );


  /*
    Solo efectivo + ingresos manuales - egresos
    forman el dinero físico esperado.
  */
  const saldoActual =
    saldoInicial +
    totales.totalIngresos -
    totales.totalEgresos;


  return {
    caja,

    abierta:
      caja.estado ===
      "Abierta",

    resumen: {
      saldoInicial,

      ...totales,

      saldoActual,

      saldoEsperado:
        saldoActual,

      efectivoContado:
        caja.efectivoContado,

      diferencia:
        caja.diferencia,
    },
  };

}


/* =========================================
   RESUMEN DE CAJA
========================================= */

async function resumen(
  req,
  res
) {

  try {

    let caja =
      await Caja.findOne({
        estado:
          "Abierta",
      })
        .populate(
          "abiertoPor",
          "nombres apellidos usuario"
        )
        .populate(
          "cerradoPor",
          "nombres apellidos usuario"
        );


    if (!caja) {

      caja =
        await Caja.findOne()
          .sort({
            fechaApertura: -1,
          })
          .populate(
            "abiertoPor",
            "nombres apellidos usuario"
          )
          .populate(
            "cerradoPor",
            "nombres apellidos usuario"
          );

    }


    return res.json(
      await construirResumen(
        caja
      )
    );


  } catch (error) {

    console.error(
      "Error obteniendo resumen de caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "No fue posible cargar el resumen de caja.",
      });

  }

}


/* =========================================
   ABRIR CAJA
========================================= */

async function abrir(
  req,
  res
) {

  try {

    const existente =
      await Caja.findOne({
        estado:
          "Abierta",
      });


    if (existente) {

      return res
        .status(400)
        .json({
          mensaje:
            `La caja ${existente.codigo} ya se encuentra abierta.`,
        });

    }


    const saldoInicial =
      Number(
        req.body.saldoInicial ||
        0
      );


    if (
      !Number.isFinite(
        saldoInicial
      ) ||
      saldoInicial < 0
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "El saldo inicial no es válido.",
        });

    }


    const codigo =
      await generarConsecutivo(
        "cajas",
        "CAJ"
      );


    const caja =
      await Caja.create({

        codigo,

        fechaApertura:
          new Date(),

        saldoInicial,

        estado:
          "Abierta",

        observacionesApertura:
          String(
            req.body
              .observaciones ||
            ""
          ).trim(),

        abiertoPor:
          usuarioActual(
            req
          ),

      });


    return res
      .status(201)
      .json(
        await construirResumen(
          caja
        )
      );


  } catch (error) {

    console.error(
      "Error abriendo caja:",
      error
    );


    if (
      error?.code ===
      11000
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Ya existe una caja abierta.",
        });

    }


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible abrir la caja.",
      });

  }

}


/* =========================================
   LISTAR MOVIMIENTOS
========================================= */

async function listarMovimientos(
  req,
  res
) {

  try {

    let cajaId =
      req.query.caja ||
      "";


    if (!cajaId) {

      const cajaActual =
        await Caja.findOne({
          estado:
            "Abierta",
        })
          .sort({
            fechaApertura: -1,
          });


      const cajaReferencia =
        cajaActual ||
        await Caja.findOne()
          .sort({
            fechaApertura: -1,
          });


      cajaId =
        cajaReferencia?._id ||
        null;

    }


    if (!cajaId) {

      return res.json(
        []
      );

    }


    const filtro = {
      caja:
        cajaId,
    };


    if (
      req.query.tipo ===
        "Ingreso" ||
      req.query.tipo ===
        "Egreso"
    ) {

      filtro.tipo =
        req.query.tipo;

    }


    if (
      [
        "Efectivo",
        "Transferencia",
        "Crédito",
      ].includes(
        req.query.metodoPago
      )
    ) {

      filtro.metodoPago =
        req.query.metodoPago;

    }


    const movimientos =
      await MovimientoCaja
        .find(
          filtro
        )
        .populate(
          "usuario",
          "nombres apellidos usuario"
        )
        .populate(
          "pedido",
          "codigo total metodoPago estado"
        )
        .populate(
          "cliente",
          "codigo nombre razonSocial documento"
        )
        .populate(
          "factura",
          "codigo total estado"
        )
        .sort({
          createdAt: -1,
        })
        .limit(500);


    return res.json(
      movimientos
    );


  } catch (error) {

    console.error(
      "Error listando movimientos de caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "No fue posible cargar los movimientos de caja.",
      });

  }

}


/* =========================================
   REGISTRAR MOVIMIENTO MANUAL
========================================= */

async function crearMovimiento(
  req,
  res
) {

  try {

    const caja =
      await Caja.findOne({
        estado:
          "Abierta",
      });


    if (!caja) {

      return res
        .status(400)
        .json({
          mensaje:
            "Debe abrir la caja antes de registrar movimientos.",
        });

    }


    const {
      tipo,
      concepto,
    } = req.body;


    const valor =
      Number(
        req.body.valor
      );


    if (
      tipo !==
        "Ingreso" &&
      tipo !==
        "Egreso"
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Seleccione un tipo de movimiento válido.",
        });

    }


    if (
      !String(
        concepto ||
        ""
      ).trim()
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Debe indicar el concepto del movimiento.",
        });

    }


    if (
      !Number.isFinite(
        valor
      ) ||
      valor <= 0
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "El valor del movimiento debe ser mayor que cero.",
        });

    }


    if (
      tipo ===
      "Egreso"
    ) {

      const totales =
        await calcularTotales(
          caja._id
        );


      const saldoActual =
        Number(
          caja.saldoInicial ||
          0
        ) +
        totales.totalIngresos -
        totales.totalEgresos;


      if (
        valor >
        saldoActual
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "El egreso supera el efectivo disponible en caja.",
          });

      }

    }


    const movimiento =
      await MovimientoCaja
        .create({

          caja:
            caja._id,

          tipo,

          origen:
            "Manual",

          concepto:
            String(
              concepto
            ).trim(),

          valor,

          metodoPago:
            "",

          afectaEfectivo:
            true,

          observacion:
            String(
              req.body
                .observacion ||
              ""
            ).trim(),

          usuario:
            usuarioActual(
              req
            ),

        });


    const movimientoCompleto =
      await MovimientoCaja
        .findById(
          movimiento._id
        )
        .populate(
          "usuario",
          "nombres apellidos usuario"
        );


    return res
      .status(201)
      .json(
        movimientoCompleto
      );


  } catch (error) {

    console.error(
      "Error registrando movimiento de caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible registrar el movimiento.",
      });

  }

}


/* =========================================
   CERRAR CAJA
========================================= */

async function cerrar(
  req,
  res
) {

  try {

    const caja =
      await Caja.findOne({
        estado:
          "Abierta",
      });


    if (!caja) {

      return res
        .status(400)
        .json({
          mensaje:
            "No hay una caja abierta para cerrar.",
        });

    }


    const efectivoContado =
      Number(
        req.body
          .efectivoContado
      );


    if (
      !Number.isFinite(
        efectivoContado
      ) ||
      efectivoContado < 0
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Debe indicar el efectivo contado al cerrar la caja.",
        });

    }


    const totales =
      await calcularTotales(
        caja._id
      );


    const saldoEsperado =
      Number(
        caja.saldoInicial ||
        0
      ) +
      totales.totalIngresos -
      totales.totalEgresos;


    caja.cantidadPedidosEntregados =
      totales.cantidadPedidosEntregados;

    caja.totalVentasEntregadas =
      totales.totalVentasEntregadas;

    caja.totalEfectivoPedidos =
      totales.totalEfectivoPedidos;

    caja.totalTransferencias =
      totales.totalTransferencias;

    caja.totalCredito =
      totales.totalCredito;

    caja.totalIngresosManuales =
      totales.totalIngresosManuales;

    caja.totalIngresos =
      totales.totalIngresos;

    caja.totalEgresos =
      totales.totalEgresos;

    caja.saldoEsperado =
      saldoEsperado;

    caja.efectivoContado =
      efectivoContado;

    caja.diferencia =
      efectivoContado -
      saldoEsperado;

    caja.fechaCierre =
      new Date();

    caja.estado =
      "Cerrada";

    caja.observacionesCierre =
      String(
        req.body
          .observaciones ||
        ""
      ).trim();

    caja.cerradoPor =
      usuarioActual(
        req
      );


    await caja.save();


    return res.json(
      await construirResumen(
        caja
      )
    );


  } catch (error) {

    console.error(
      "Error cerrando caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible cerrar la caja.",
      });

  }

}


/* =========================================
   HISTORIAL DE CAJAS
========================================= */

async function listarHistorial(
  req,
  res
) {

  try {

    const {
      desde = "",
      hasta = "",
      pagina = 1,
      limite = 20,
    } = req.query;


    const filtro = {};


    if (
      desde ||
      hasta
    ) {

      filtro.fechaApertura = {};


      if (desde) {

        const fechaDesde =
          new Date(
            `${desde}T00:00:00`
          );

        filtro.fechaApertura.$gte =
          fechaDesde;

      }


      if (hasta) {

        const fechaHasta =
          new Date(
            `${hasta}T23:59:59.999`
          );

        filtro.fechaApertura.$lte =
          fechaHasta;

      }

    }


    const numeroPagina =
      Math.max(
        Number(pagina) ||
        1,
        1
      );


    const numeroLimite =
      Math.min(
        Math.max(
          Number(limite) ||
          20,
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
      cajas,
      total,
    ] =
      await Promise.all([

        Caja.find(
          filtro
        )
          .populate(
            "abiertoPor",
            "nombres apellidos usuario"
          )
          .populate(
            "cerradoPor",
            "nombres apellidos usuario"
          )
          .sort({
            fechaApertura: -1,
          })
          .skip(
            salto
          )
          .limit(
            numeroLimite
          )
          .lean(),

        Caja.countDocuments(
          filtro
        ),

      ]);


    const cajasConTotales =
      await Promise.all(
        cajas.map(
          async (
            caja
          ) => {

            const totales =
              await calcularTotales(
                caja._id
              );


            const saldoEsperado =
              Number(
                caja.saldoInicial ||
                0
              ) +
              totales.totalIngresos -
              totales.totalEgresos;


            return {
              ...caja,

              ...totales,

              saldoEsperado,

              diferencia:
                caja.estado ===
                  "Cerrada" &&
                caja.efectivoContado !==
                  null &&
                caja.efectivoContado !==
                  undefined
                  ? Number(
                      caja.efectivoContado
                    ) -
                    saldoEsperado
                  : null,
            };

          }
        )
      );


    return res.json({

      cajas:
        cajasConTotales,

      paginacion: {
        pagina:
          numeroPagina,

        limite:
          numeroLimite,

        total,

        totalPaginas:
          Math.max(
            Math.ceil(
              total /
              numeroLimite
            ),
            1
          ),
      },

    });


  } catch (error) {

    console.error(
      "Error listando historial de caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "No fue posible cargar el historial de caja.",
      });

  }

}


/* =========================================
   DETALLE DE UNA CAJA
========================================= */

async function obtenerDetalle(
  req,
  res
) {

  try {

    const caja =
      await Caja.findById(
        req.params.id
      )
        .populate(
          "abiertoPor",
          "nombres apellidos usuario"
        )
        .populate(
          "cerradoPor",
          "nombres apellidos usuario"
        );


    if (!caja) {

      return res
        .status(404)
        .json({
          mensaje:
            "Caja no encontrada.",
        });

    }


    const movimientos =
      await MovimientoCaja
        .find({
          caja:
            caja._id,
        })
        .populate(
          "usuario",
          "nombres apellidos usuario"
        )
        .populate(
          "pedido",
          "codigo total metodoPago estado"
        )
        .populate(
          "cliente",
          "codigo nombre razonSocial documento"
        )
        .populate(
          "factura",
          "codigo total estado"
        )
        .sort({
          createdAt: 1,
        });


    const totales =
      await calcularTotales(
        caja._id
      );


    const saldoEsperado =
      Number(
        caja.saldoInicial ||
        0
      ) +
      totales.totalIngresos -
      totales.totalEgresos;


    const diferencia =
      caja.efectivoContado !==
        null &&
      caja.efectivoContado !==
        undefined
        ? Number(
            caja.efectivoContado
          ) -
          saldoEsperado
        : null;


    return res.json({

      caja,

      resumen: {
        saldoInicial:
          Number(
            caja.saldoInicial ||
            0
          ),

        ...totales,

        saldoActual:
          saldoEsperado,

        saldoEsperado,

        efectivoContado:
          caja.efectivoContado,

        diferencia,
      },

      movimientos,

    });


  } catch (error) {

    console.error(
      "Error consultando detalle de caja:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "No fue posible consultar el detalle de caja.",
      });

  }

}


export const cajaController = {

  resumen,

  abrir,

  listarMovimientos,

  crearMovimiento,

  cerrar,

  listarHistorial,

  obtenerDetalle,

};
