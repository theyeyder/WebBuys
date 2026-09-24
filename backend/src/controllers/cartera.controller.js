import Cartera
  from "../models/Cartera.js";

import PagoCartera
  from "../models/PagoCartera.js";

import Entrega
  from "../models/Entrega.js";

import Caja
  from "../models/Caja.js";

import MovimientoCaja
  from "../models/MovimientoCaja.js";


function usuarioActual(
  req
) {

  return (
    req.usuario?._id ||
    req.user?._id ||
    null
  );

}


function idReferencia(
  valor
) {

  if (!valor) {
    return null;
  }


  if (
    typeof valor ===
    "string"
  ) {
    return valor;
  }


  return (
    valor._id ||
    valor
  );

}


function codigoCarteraDesdeEntrega(
  entrega
) {

  const pedidoCodigo =
    String(
      entrega?.pedidoCodigo ||
      ""
    )
      .trim()
      .toUpperCase();


  if (pedidoCodigo) {

    const limpio =
      pedidoCodigo.replace(
        /^PED-/,
        ""
      );


    return `CAR-${limpio}`;

  }


  const sufijo =
    String(
      entrega?._id ||
      Date.now()
    )
      .slice(-6)
      .toUpperCase();


  return `CAR-${sufijo}`;

}


function estadoDesdeSaldo({
  valorOriginal,
  totalAbonado,
  saldoPendiente,
}) {

  if (
    Number(
      saldoPendiente
    ) <= 0
  ) {
    return "Pagada";
  }


  if (
    Number(
      totalAbonado
    ) > 0 &&
    Number(
      totalAbonado
    ) <
      Number(
        valorOriginal
      )
  ) {
    return "Abonada";
  }


  return "Pendiente";

}


async function crearCarteraDesdeEntrega(
  entrega,
  usuarioId = null
) {

  if (
    !entrega ||
    entrega.estado !==
      "Entregado" ||
    entrega.metodoPago !==
      "Crédito"
  ) {
    return null;
  }


  const entregaId =
    idReferencia(
      entrega
    );


  const pedidoId =
    idReferencia(
      entrega.pedido
    );


  if (
    !entregaId ||
    !pedidoId
  ) {
    return null;
  }


  const valor =
    Number(
      entrega.total ||
      0
    );


  if (
    !Number.isFinite(
      valor
    ) ||
    valor <= 0
  ) {
    return null;
  }


  const clienteId =
    idReferencia(
      entrega.cliente
    );


  const clienteNombre =
    entrega.clienteNombre ||
    entrega.cliente?.nombre ||
    entrega.cliente?.razonSocial ||
    "Cliente";


  const datosBase = {
    pedido:
      pedidoId,

    pedidoCodigo:
      entrega.pedidoCodigo ||
      entrega.pedido?.codigo ||
      "",

    cliente:
      clienteId,

    clienteCodigo:
      entrega.clienteCodigo ||
      entrega.cliente?.codigo ||
      "",

    clienteNombre,

    clienteDocumento:
      entrega.cliente?.documento ||
      "",

    clienteTelefono:
      entrega.clienteTelefono ||
      entrega.cliente?.telefono ||
      "",

    fechaEntrega:
      entrega.fechaEntregaReal ||
      entrega.updatedAt ||
      new Date(),

    metodoPagoOriginal:
      "Crédito",
  };


  const existente =
    await Cartera.findOne({
      entrega:
        entregaId,
    });


  if (existente) {

    Object.assign(
      existente,
      datosBase
    );


    if (usuarioId) {
      existente.actualizadoPor =
        usuarioId;
    }


    await existente.save();


    return existente;

  }


  return Cartera.create({
    codigo:
      codigoCarteraDesdeEntrega(
        entrega
      ),

    entrega:
      entregaId,

    ...datosBase,

    valorOriginal:
      valor,

    totalAbonado:
      0,

    saldoPendiente:
      valor,

    estado:
      "Pendiente",

    observaciones:
      entrega.observaciones ||
      "",

    creadoPor:
      usuarioId,

    actualizadoPor:
      usuarioId,
  });

}


async function sincronizarCreditosEntregados() {

  const entregas =
    await Entrega.find({
      estado:
        "Entregado",

      metodoPago:
        "Crédito",
    })
      .populate(
        "cliente",
        "codigo nombre razonSocial documento telefono"
      )
      .populate(
        "pedido",
        "codigo"
      )
      .sort({
        fechaEntregaReal: 1,
        createdAt: 1,
      });


  for (
    const entrega
    of entregas
  ) {

    try {

      await crearCarteraDesdeEntrega(
        entrega,
        null
      );

    } catch (error) {

      if (
        error?.code !==
        11000
      ) {
        throw error;
      }

    }

  }

}


function populateCartera(
  query
) {

  return query
    .populate(
      "entrega",
      "pedidoCodigo estado metodoPago total fechaEntregaReal fechaProgramada"
    )
    .populate(
      "pedido",
      "codigo estado fechaEntrega"
    )
    .populate(
      "cliente",
      "codigo nombre razonSocial documento telefono direccion ciudad"
    )
    .populate(
      "creadoPor",
      "nombres apellidos usuario"
    )
    .populate(
      "actualizadoPor",
      "nombres apellidos usuario"
    );

}


async function listar(
  req,
  res
) {

  try {

    await sincronizarCreditosEntregados();


    const filtro = {};


    if (
      [
        "Pendiente",
        "Abonada",
        "Pagada",
      ].includes(
        req.query.estado
      )
    ) {
      filtro.estado =
        req.query.estado;
    }


    if (
      req.query.cliente
    ) {
      filtro.cliente =
        req.query.cliente;
    }


    const cuentas =
      await populateCartera(
        Cartera.find(
          filtro
        )
      )
        .sort({
          saldoPendiente: -1,
          fechaEntrega: -1,
          createdAt: -1,
        });


    return res.json(
      cuentas
    );

  } catch (error) {

    console.error(
      "Error listando cartera:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible cargar la cartera.",
      });

  }

}


async function resumen(
  req,
  res
) {

  try {

    await sincronizarCreditosEntregados();


    const datos =
      await Cartera.aggregate([
        {
          $group: {
            _id: null,

            valorOriginal: {
              $sum:
                "$valorOriginal",
            },

            totalAbonado: {
              $sum:
                "$totalAbonado",
            },

            saldoPendiente: {
              $sum:
                "$saldoPendiente",
            },

            cuentas: {
              $sum: 1,
            },

            pendientes: {
              $sum: {
                $cond: [
                  {
                    $gt: [
                      "$saldoPendiente",
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },

            pagadas: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$saldoPendiente",
                      0,
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
      ]);


    const data =
      datos[0] ||
      {};


    return res.json({
      valorOriginal:
        Number(
          data.valorOriginal ||
          0
        ),

      totalAbonado:
        Number(
          data.totalAbonado ||
          0
        ),

      saldoPendiente:
        Number(
          data.saldoPendiente ||
          0
        ),

      cuentas:
        Number(
          data.cuentas ||
          0
        ),

      pendientes:
        Number(
          data.pendientes ||
          0
        ),

      pagadas:
        Number(
          data.pagadas ||
          0
        ),
    });

  } catch (error) {

    console.error(
      "Error obteniendo resumen de cartera:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "No fue posible obtener el resumen de cartera.",
      });

  }

}


async function obtenerPorId(
  req,
  res
) {

  try {

    await sincronizarCreditosEntregados();


    const cartera =
      await populateCartera(
        Cartera.findById(
          req.params.id
        )
      );


    if (!cartera) {

      return res
        .status(404)
        .json({
          mensaje:
            "Cuenta de cartera no encontrada.",
        });

    }


    const pagos =
      await PagoCartera.find({
        cartera:
          cartera._id,

        estado:
          "Activo",
      })
        .populate(
          "caja",
          "codigo estado fechaApertura fechaCierre"
        )
        .populate(
          "usuario",
          "nombres apellidos usuario"
        )
        .sort({
          fechaPago: -1,
          createdAt: -1,
        });


    return res.json({
      cartera,
      pagos,
    });

  } catch (error) {

    console.error(
      "Error consultando cartera:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible consultar la cuenta de cartera.",
      });

  }

}


async function actualizar(
  req,
  res
) {

  try {

    const cartera =
      await Cartera.findById(
        req.params.id
      );


    if (!cartera) {

      return res
        .status(404)
        .json({
          mensaje:
            "Cuenta de cartera no encontrada.",
        });

    }


    if (
      req.body.fechaVencimiento !==
      undefined
    ) {

      cartera.fechaVencimiento =
        req.body.fechaVencimiento
          ? new Date(
              req.body.fechaVencimiento
            )
          : null;

    }


    if (
      req.body.observaciones !==
      undefined
    ) {

      cartera.observaciones =
        String(
          req.body.observaciones ||
          ""
        ).trim();

    }


    cartera.actualizadoPor =
      usuarioActual(
        req
      );


    await cartera.save();


    const actualizada =
      await populateCartera(
        Cartera.findById(
          cartera._id
        )
      );


    return res.json(
      actualizada
    );

  } catch (error) {

    console.error(
      "Error actualizando cartera:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          error.message ||
          "No fue posible actualizar la cuenta de cartera.",
      });

  }

}


async function registrarPago(
  req,
  res
) {

  try {

    const cartera =
      await Cartera.findById(
        req.params.id
      );


    if (!cartera) {

      return res
        .status(404)
        .json({
          mensaje:
            "Cuenta de cartera no encontrada.",
        });

    }


    if (
      cartera.estado ===
        "Pagada" ||
      Number(
        cartera.saldoPendiente ||
        0
      ) <= 0
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Esta cuenta ya se encuentra pagada.",
        });

    }


    const valor =
      Number(
        req.body.valor
      );


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
            "El valor del abono debe ser mayor que cero.",
        });

    }


    if (
      valor >
      Number(
        cartera.saldoPendiente ||
        0
      )
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "El abono no puede superar el saldo pendiente.",
        });

    }


    const metodoPago =
      String(
        req.body.metodoPago ||
        ""
      ).trim();


    if (
      ![
        "Efectivo",
        "Transferencia",
      ].includes(
        metodoPago
      )
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Seleccione Efectivo o Transferencia para registrar el abono.",
        });

    }


    const caja =
      await Caja.findOne({
        estado:
          "Abierta",
      })
        .sort({
          fechaApertura: -1,
        });


    if (!caja) {

      return res
        .status(400)
        .json({
          mensaje:
            "Debe abrir la caja antes de registrar un abono de cartera.",
        });

    }


    const usuarioId =
      usuarioActual(
        req
      );


    const pago =
      await PagoCartera.create({
        cartera:
          cartera._id,

        entrega:
          cartera.entrega,

        pedido:
          cartera.pedido,

        cliente:
          cartera.cliente,

        caja:
          caja._id,

        valor,

        metodoPago,

        referencia:
          String(
            req.body.referencia ||
            ""
          ).trim(),

        observacion:
          String(
            req.body.observacion ||
            ""
          ).trim(),

        usuario:
          usuarioId,
      });


    let movimiento =
      null;


    try {

      movimiento =
        await MovimientoCaja.create({
          caja:
            caja._id,

          tipo:
            "Ingreso",

          origen:
            "Cartera",

          concepto:
            `Abono cartera ${cartera.codigo} - ${cartera.pedidoCodigo}`,

          valor,

          pedido:
            cartera.pedido,

          pedidoCodigo:
            cartera.pedidoCodigo,

          entrega:
            cartera.entrega,

          entregaCodigo:
            cartera.pedidoCodigo,

          cartera:
            cartera._id,

          pagoCartera:
            pago._id,

          cliente:
            cartera.cliente,

          clienteNombre:
            cartera.clienteNombre,

          metodoPago,

          afectaEfectivo:
            metodoPago ===
            "Efectivo",

          observacion:
            String(
              req.body.observacion ||
              "Abono de cartera"
            ).trim(),

          claveUnica:
            `CARTERA_PAGO:${pago._id}`,

          usuario:
            usuarioId,

          estado:
            "Activo",
        });


      pago.movimientoCaja =
        movimiento._id;

      await pago.save();


      cartera.totalAbonado =
        Number(
          (
            Number(
              cartera.totalAbonado ||
              0
            ) +
            valor
          ).toFixed(
            2
          )
        );


      cartera.saldoPendiente =
        Number(
          Math.max(
            0,
            Number(
              cartera.valorOriginal ||
              0
            ) -
            cartera.totalAbonado
          ).toFixed(
            2
          )
        );


      cartera.estado =
        estadoDesdeSaldo({
          valorOriginal:
            cartera.valorOriginal,

          totalAbonado:
            cartera.totalAbonado,

          saldoPendiente:
            cartera.saldoPendiente,
        });


      cartera.actualizadoPor =
        usuarioId;


      await cartera.save();


    } catch (errorProceso) {

      if (movimiento?._id) {
        await MovimientoCaja.findByIdAndDelete(
          movimiento._id
        );
      }


      await PagoCartera.findByIdAndDelete(
        pago._id
      );


      throw errorProceso;

    }


    const detalle =
      await obtenerDetalleCartera(
        cartera._id
      );


    return res
      .status(201)
      .json({
        mensaje:
          cartera.estado ===
            "Pagada"
            ? "Pago registrado. La cuenta quedó pagada completamente."
            : "Abono registrado correctamente.",

        ...detalle,
      });

  } catch (error) {

    console.error(
      "Error registrando pago de cartera:",
      error
    );


    return res
      .status(
        error.statusCode ||
        500
      )
      .json({
        mensaje:
          error.message ||
          "No fue posible registrar el abono de cartera.",
      });

  }

}


async function obtenerDetalleCartera(
  carteraId
) {

  const cartera =
    await populateCartera(
      Cartera.findById(
        carteraId
      )
    );


  const pagos =
    await PagoCartera.find({
      cartera:
        carteraId,

      estado:
        "Activo",
    })
      .populate(
        "caja",
        "codigo estado fechaApertura fechaCierre"
      )
      .populate(
        "usuario",
        "nombres apellidos usuario"
      )
      .sort({
        fechaPago: -1,
        createdAt: -1,
      });


  return {
    cartera,
    pagos,
  };

}


export const carteraController = {
  listar,
  resumen,
  obtenerPorId,
  actualizar,
  registrarPago,
};
