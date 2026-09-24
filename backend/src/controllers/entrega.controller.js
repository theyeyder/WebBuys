import Entrega
  from "../models/Entrega.js";

import Pedido
  from "../models/Pedido.js";

import Empleado
  from "../models/Empleado.js";

import Caja
  from "../models/Caja.js";

import MovimientoCaja
  from "../models/MovimientoCaja.js";

import Cartera
  from "../models/Cartera.js";


function usuarioActual(req) {
  return (
    req.usuario?._id ||
    req.user?._id ||
    null
  );
}


function nombreClientePedido(
  pedido
) {

  return (
    pedido.clienteNombre ||
    pedido.clienteRazonSocial ||
    pedido.cliente?.nombre ||
    pedido.cliente?.razonSocial ||
    "Cliente"
  );

}


async function obtenerCajaAbiertaEntrega() {

  return Caja.findOne({
    estado:
      "Abierta",
  })
    .sort({
      fechaApertura: -1,
    });

}


function nombreClienteEntrega(
  entrega
) {

  return (
    entrega?.clienteNombre ||
    entrega?.cliente?.nombre ||
    entrega?.cliente?.razonSocial ||
    "Cliente"
  );

}


function codigoCarteraEntrega(
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

    return `CAR-${pedidoCodigo.replace(
      /^PED-/,
      ""
    )}`;

  }


  return `CAR-${String(
    entrega?._id ||
    Date.now()
  ).slice(-6).toUpperCase()}`;

}


async function registrarEntregaCreditoEnCartera({
  entrega,
  usuarioId = null,
}) {

  if (
    !entrega ||
    entrega.metodoPago !==
      "Crédito"
  ) {

    return {
      cartera: null,
      creada: false,
    };

  }


  const existente =
    await Cartera.findOne({
      entrega:
        entrega._id,
    });


  if (existente) {

    return {
      cartera:
        existente,
      creada:
        false,
    };

  }


  const pedidoId =
    entrega.pedido?._id ||
    entrega.pedido;


  const valor =
    Number(
      entrega.total ||
      0
    );


  if (
    !pedidoId ||
    !Number.isFinite(
      valor
    ) ||
    valor <= 0
  ) {

    const error =
      new Error(
        "La entrega a crédito no tiene datos válidos para crear la cuenta de cartera."
      );

    error.statusCode =
      400;

    throw error;

  }


  try {

    const cartera =
      await Cartera.create({
        codigo:
          codigoCarteraEntrega(
            entrega
          ),

        entrega:
          entrega._id,

        pedido:
          pedidoId,

        pedidoCodigo:
          entrega.pedidoCodigo ||
          "",

        cliente:
          entrega.cliente?._id ||
          entrega.cliente ||
          null,

        clienteCodigo:
          entrega.clienteCodigo ||
          "",

        clienteNombre:
          nombreClienteEntrega(
            entrega
          ),

        clienteTelefono:
          entrega.clienteTelefono ||
          "",

        fechaEntrega:
          entrega.fechaEntregaReal ||
          new Date(),

        valorOriginal:
          valor,

        totalAbonado:
          0,

        saldoPendiente:
          valor,

        metodoPagoOriginal:
          "Crédito",

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


    return {
      cartera,
      creada:
        true,
    };

  } catch (error) {

    if (
      error?.code ===
      11000
    ) {

      const cartera =
        await Cartera.findOne({
          entrega:
            entrega._id,
        });


      if (cartera) {

        return {
          cartera,
          creada:
            false,
        };

      }

    }


    throw error;

  }

}


async function registrarEntregaEntregadaEnCaja({
  entrega,
  caja,
  usuarioId = null,
}) {

  if (
    !entrega ||
    !caja
  ) {

    const error =
      new Error(
        "No fue posible identificar la entrega o la caja abierta."
      );

    error.statusCode =
      400;

    throw error;

  }


  const pedidoId =
    entrega.pedido?._id ||
    entrega.pedido ||
    null;


  if (!pedidoId) {

    const error =
      new Error(
        "La entrega no tiene un pedido de origen válido."
      );

    error.statusCode =
      400;

    throw error;

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

    const error =
      new Error(
        `La entrega del pedido ${entrega.pedidoCodigo} no tiene un total válido para ingresar a Caja.`
      );

    error.statusCode =
      400;

    throw error;

  }


  /*
    Conservamos PEDIDO:<id> como clave única para
    compatibilidad con Facturación y registros históricos.
    El origen funcional nuevo sí es "Entrega".
  */
  const claveUnica =
    `PEDIDO:${pedidoId}`;


  const existente =
    await MovimientoCaja
      .findOne({
        $or: [
          {
            pedido:
              pedidoId,
          },
          {
            claveUnica,
          },
        ],
      })
      .populate(
        "caja",
        "codigo estado"
      );


  if (
    existente &&
    existente.estado ===
      "Activo" &&
    String(
      existente.caja?._id ||
      existente.caja
    ) !==
    String(
      caja._id
    )
  ) {

    return existente;

  }


  if (
    existente &&
    existente.estado ===
      "Anulado" &&
    existente.caja?.estado ===
      "Cerrada" &&
    String(
      existente.caja?._id ||
      existente.caja
    ) !==
    String(
      caja._id
    )
  ) {

    const error =
      new Error(
        `La venta del pedido ${entrega.pedidoCodigo} ya tuvo movimiento en la caja ${existente.caja.codigo}. No puede reingresarse automáticamente porque esa caja está cerrada.`
      );

    error.statusCode =
      400;

    throw error;

  }


  const metodoPago =
    entrega.metodoPago ||
    "Efectivo";


  return MovimientoCaja
    .findOneAndUpdate(
      {
        $or: [
          {
            pedido:
              pedidoId,
          },
          {
            claveUnica,
          },
        ],
      },

      {
        $set: {
          caja:
            caja._id,

          tipo:
            "Ingreso",

          origen:
            "Entrega",

          concepto:
            `Entrega finalizada - ${entrega.pedidoCodigo}`,

          valor,

          pedido:
            pedidoId,

          pedidoCodigo:
            entrega.pedidoCodigo ||
            "",

          entrega:
            entrega._id,

          entregaCodigo:
            entrega.pedidoCodigo ||
            "",

          cliente:
            entrega.cliente?._id ||
            entrega.cliente ||
            null,

          clienteNombre:
            nombreClienteEntrega(
              entrega
            ),

          metodoPago,

          afectaEfectivo:
            metodoPago ===
            "Efectivo",

          factura:
            existente?.factura ||
            null,

          facturaCodigo:
            existente?.facturaCodigo ||
            "",

          observacion:
            existente?.facturaCodigo
              ? "Factura generada"
              : "Sin factura",

          usuario:
            usuarioId,

          estado:
            "Activo",

          claveUnica,
        },
      },

      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

}


function normalizarItemPedido(
  item
) {

  const tipoVenta =
    item.tipoVenta;

  const precioUnitario =
    Number(
      item.precioAplicado ??
      item.precioNormal ??
      0
    );

  const esPeso =
    tipoVenta ===
    "Peso";

  return {
    pedidoItemId:
      item._id,

    producto:
      item.producto?._id ||
      item.producto,

    codigoProducto:
      item.codigoProducto ||
      item.producto?.codigo ||
      "",

    nombre:
      item.nombre ||
      item.producto?.nombre ||
      "Producto",

    presentacionId:
      item.presentacionId ||
      null,

    presentacionNombre:
      item.presentacionNombre ||
      "",

    tipoVenta,

    unidad:
      item.unidad ||
      "",

    cantidadSolicitada:
      Math.max(
        1,
        Number(
          item.cantidad ||
          1
        )
      ),

    precioUnitario,

    pesoReal:
      null,

    subtotal:
      esPeso
        ? 0
        : Number(
            item.subtotal ||
            0
          ),
  };

}


function recalcularTotales(
  entrega
) {

  let subtotal = 0;

  for (
    const item
    of entrega.items
  ) {

    if (
      item.tipoVenta ===
      "Peso"
    ) {

      const peso =
        Number(
          item.pesoReal ||
          0
        );

      item.subtotal =
        Number(
          (
            peso *
            Number(
              item.precioUnitario ||
              0
            )
          ).toFixed(
            2
          )
        );

    }

    subtotal +=
      Number(
        item.subtotal ||
        0
      );

  }

  entrega.subtotal =
    Number(
      subtotal.toFixed(
        2
      )
    );

  entrega.total =
    Number(
      Math.max(
        0,
        entrega.subtotal -
        Number(
          entrega.descuento ||
          0
        )
      ).toFixed(
        2
      )
    );

}


function faltanPesos(
  entrega
) {

  return entrega.items.some(
    (item) =>
      item.tipoVenta ===
        "Peso" &&
      (
        !Number.isFinite(
          Number(
            item.pesoReal
          )
        ) ||
        Number(
          item.pesoReal
        ) <= 0
      )
  );

}


async function validarRepartidor(
  repartidorId
) {

  if (!repartidorId) {
    return null;
  }

  const repartidor =
    await Empleado.findById(
      repartidorId
    );

  if (!repartidor) {

    const error =
      new Error(
        "El repartidor seleccionado no existe."
      );

    error.statusCode =
      404;

    throw error;

  }

  if (
    String(
      repartidor.estado ||
      ""
    )
      .trim()
      .toLowerCase() !==
    "activo"
  ) {

    const error =
      new Error(
        "El repartidor seleccionado no está activo."
      );

    error.statusCode =
      400;

    throw error;

  }

  if (
    String(
      repartidor.cargo ||
      ""
    )
      .trim()
      .toLowerCase() !==
    "repartidor"
  ) {

    const error =
      new Error(
        "El empleado seleccionado debe tener el cargo Repartidor."
      );

    error.statusCode =
      400;

    throw error;

  }

  return repartidor;

}


async function normalizarEntregasLegacy() {

  await Entrega.updateMany(
    {
      estado:
        "Pendiente de entrega",
    },
    {
      $set: {
        estado:
          "Por preparar",
        confirmada:
          false,
        preparacionGuardada:
          false,
      },
    }
  );


  await Entrega.updateMany(
    {
      estado:
        "No entregado",
    },
    {
      $set: {
        estado:
          "Cancelado",
        confirmada:
          true,
        preparacionGuardada:
          true,
      },
    }
  );


  await Entrega.updateMany(
    {
      estado: {
        $in: [
          "En ruta",
          "Entregado",
        ],
      },
      confirmada: {
        $ne: true,
      },
    },
    {
      $set: {
        confirmada:
          true,
        preparacionGuardada:
          true,
      },
    }
  );

}


async function sincronizarEntregasDesdePedidos() {

  const pedidos =
    await Pedido.find({
      estado:
        "Listo para entrega",
    })
      .populate(
        "cliente",
        "codigo nombre razonSocial telefono direccion barrio ciudad"
      )
      .populate(
        "items.producto",
        "codigo nombre"
      );

  for (
    const pedido
    of pedidos
  ) {

    const existente =
      await Entrega.findOne({
        pedido:
          pedido._id,
      });

    if (existente) {
      continue;
    }

    const entrega =
      new Entrega({
        pedido:
          pedido._id,

        pedidoCodigo:
          pedido.codigo,

        cliente:
          pedido.cliente?._id ||
          pedido.cliente ||
          null,

        clienteCodigo:
          pedido.clienteCodigo ||
          pedido.cliente?.codigo ||
          "",

        clienteNombre:
          nombreClientePedido(
            pedido
          ),

        clienteTelefono:
          pedido.clienteTelefono ||
          pedido.cliente?.telefono ||
          "",

        clienteDireccion:
          pedido.clienteDireccion ||
          pedido.cliente?.direccion ||
          "",

        clienteBarrio:
          pedido.clienteBarrio ||
          pedido.cliente?.barrio ||
          "",

        clienteCiudad:
          pedido.clienteCiudad ||
          pedido.cliente?.ciudad ||
          "",

        zonaDespacho:
          pedido.zonaDespacho ||
          null,

        zonaDespachoNombre:
          pedido.zonaDespachoNombre ||
          "",

        ruta:
          pedido.ruta ||
          null,

        rutaNombre:
          pedido.rutaNombre ||
          "",

        fechaProgramada:
          pedido.fechaEntrega ||
          null,

        empacador:
          pedido.empacador ||
          null,

        items:
          (
            pedido.items ||
            []
          ).map(
            normalizarItemPedido
          ),

        descuento:
          Number(
            pedido.descuento ||
            0
          ),

        confirmada:
          false,

        preparacionGuardada:
          false,

        estado:
          "Por preparar",
      });

    recalcularTotales(
      entrega
    );

    await entrega.save();

  }

}


async function pedidoSigueListoParaEntrega(
  entrega
) {

  const pedidoId =
    entrega?.pedido?._id ||
    entrega?.pedido ||
    null;


  if (!pedidoId) {
    return false;
  }


  const pedido =
    await Pedido.findById(
      pedidoId
    )
      .select(
        "_id estado"
      )
      .lean();


  return (
    pedido?.estado ===
    "Listo para entrega"
  );

}


async function idsPedidosListosParaEntrega() {

  const pedidos =
    await Pedido.find({
      estado:
        "Listo para entrega",
    })
      .select(
        "_id"
      )
      .lean();


  return pedidos.map(
    (pedido) =>
      pedido._id
  );

}


function responderPedidoFueraDeEntrega(
  res
) {

  return res
    .status(409)
    .json({
      mensaje:
        "Este pedido ya no está en estado Listo para entrega y por eso ya no pertenece al módulo Entrega.",
    });

}


function populateEntrega(
  query
) {

  return query
    .populate(
      "pedido",
      "codigo estado fechaEntrega observaciones"
    )
    .populate(
      "cliente",
      "codigo nombre razonSocial telefono direccion barrio ciudad"
    )
    .populate(
      "empacador",
      "codigo nombres apellidos cargo estado"
    )
    .populate(
      "repartidor",
      "codigo nombres apellidos telefono cargo estado"
    )
    .populate(
      "items.producto",
      "codigo nombre marca"
    );

}


export const listarEntregas =
  async (req, res) => {

    try {

      await sincronizarEntregasDesdePedidos();
      await normalizarEntregasLegacy();

      const pedidosListos =
        await idsPedidosListosParaEntrega();


      const entregas =
        await populateEntrega(
          Entrega.find({
            pedido: {
              $in:
                pedidosListos,
            },
          })
            .sort({
              fechaProgramada: 1,
              createdAt: -1,
            })
        );

      return res.json(
        entregas
      );

    } catch (error) {

      console.error(
        "Error listando entregas:",
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            error.message ||
            "No fue posible cargar las entregas.",
        });

    }

  };


export const obtenerEntrega =
  async (req, res) => {

    try {

      await sincronizarEntregasDesdePedidos();
      await normalizarEntregasLegacy();

      const entrega =
        await populateEntrega(
          Entrega.findById(
            req.params.id
          )
        );

      if (!entrega) {

        return res
          .status(404)
          .json({
            mensaje:
              "Entrega no encontrada.",
          });

      }

      if (
        entrega.pedido?.estado !==
        "Listo para entrega"
      ) {

        return responderPedidoFueraDeEntrega(
          res
        );

      }


      return res.json(
        entrega
      );

    } catch (error) {

      return res
        .status(500)
        .json({
          mensaje:
            error.message ||
            "No fue posible consultar la entrega.",
        });

    }

  };


export const actualizarPreparacionEntrega =
  async (req, res) => {

    try {

      const entrega =
        await Entrega.findById(
          req.params.id
        );

      if (!entrega) {

        return res
          .status(404)
          .json({
            mensaje:
              "Entrega no encontrada.",
          });

      }


      if (
        !await pedidoSigueListoParaEntrega(
          entrega
        )
      ) {

        return responderPedidoFueraDeEntrega(
          res
        );

      }

      if (
        entrega.confirmada
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "La entrega ya fue confirmada. La preparación ya no puede modificarse.",
          });

      }

      const {
        repartidor,
        metodoPago = "",
        items = [],
        observaciones = "",
      } = req.body;


      if (repartidor) {

        const repartidorExiste =
          await validarRepartidor(
            repartidor
          );

        entrega.repartidor =
          repartidorExiste._id;

      } else {

        entrega.repartidor =
          null;

      }


      const metodosValidos = [
        "",
        "Efectivo",
        "Transferencia",
        "Crédito",
      ];

      if (
        !metodosValidos.includes(
          metodoPago
        )
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "El tipo de pago seleccionado no es válido.",
          });

      }

      entrega.metodoPago =
        metodoPago;


      const pesosPorItem =
        new Map(
          (
            Array.isArray(
              items
            )
              ? items
              : []
          ).map(
            (item) => [
              String(
                item.itemId ||
                item._id ||
                ""
              ),
              item.pesoReal,
            ]
          )
        );


      for (
        const item
        of entrega.items
      ) {

        if (
          item.tipoVenta !==
          "Peso"
        ) {
          continue;
        }

        const clave =
          String(
            item._id
          );

        if (
          !pesosPorItem.has(
            clave
          )
        ) {
          continue;
        }

        const valor =
          pesosPorItem.get(
            clave
          );

        if (
          valor === "" ||
          valor === null ||
          valor === undefined
        ) {

          item.pesoReal =
            null;

          item.subtotal =
            0;

          continue;

        }

        const peso =
          Number(
            valor
          );

        if (
          !Number.isFinite(
            peso
          ) ||
          peso <= 0
        ) {

          return res
            .status(400)
            .json({
              mensaje:
                `El peso de "${item.nombre}" debe ser mayor que cero.`,
            });

        }

        item.pesoReal =
          peso;

      }


      entrega.observaciones =
        String(
          observaciones ||
          ""
        ).trim();

      entrega.actualizadoPor =
        usuarioActual(
          req
        );

      entrega.preparacionGuardada =
        true;

      entrega.fechaPreparacion =
        new Date();

      entrega.estado =
        "Por preparar";


      recalcularTotales(
        entrega
      );


      await entrega.save();


      const actualizada =
        await populateEntrega(
          Entrega.findById(
            entrega._id
          )
        );


      return res.json({
        mensaje:
          "Preparación guardada. Ya puede confirmar la entrega.",

        entrega:
          actualizada,
      });


    } catch (error) {

      console.error(
        "Error guardando preparación:",
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
            "No fue posible guardar la preparación.",
        });

    }

  };


export const confirmarEntrega =
  async (req, res) => {

    try {

      const entrega =
        await Entrega.findById(
          req.params.id
        );


      if (!entrega) {

        return res
          .status(404)
          .json({
            mensaje:
              "Entrega no encontrada.",
          });

      }


      if (
        !await pedidoSigueListoParaEntrega(
          entrega
        )
      ) {

        return responderPedidoFueraDeEntrega(
          res
        );

      }


      if (
        entrega.confirmada
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Esta entrega ya fue confirmada.",
          });

      }


      if (
        !entrega.preparacionGuardada
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Primero debe guardar la preparación de la entrega.",
          });

      }


      if (
        !entrega.repartidor
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe seleccionar un repartidor antes de confirmar.",
          });

      }


      if (
        !entrega.metodoPago
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe seleccionar el tipo de pago antes de confirmar.",
          });

      }


      if (
        faltanPesos(
          entrega
        )
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Falta registrar el peso real de uno o más productos vendidos por KG.",
          });

      }


      recalcularTotales(
        entrega
      );


      entrega.confirmada =
        true;

      entrega.estado =
        "Pendiente";

      entrega.fechaConfirmacion =
        new Date();

      entrega.confirmadoPor =
        usuarioActual(
          req
        );

      entrega.actualizadoPor =
        usuarioActual(
          req
        );

      entrega.motivoCancelacion =
        "";

      entrega.motivoNoEntrega =
        "";


      await entrega.save();


      const actualizada =
        await populateEntrega(
          Entrega.findById(
            entrega._id
          )
        );


      return res.json({
        mensaje:
          "Entrega confirmada correctamente. Ahora está Pendiente.",

        entrega:
          actualizada,
      });


    } catch (error) {

      console.error(
        "Error confirmando entrega:",
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
            "No fue posible confirmar la entrega.",
        });

    }

  };


export const cambiarEstadoEntrega =
  async (req, res) => {

    try {

      const entrega =
        await Entrega.findById(
          req.params.id
        );


      if (!entrega) {

        return res
          .status(404)
          .json({
            mensaje:
              "Entrega no encontrada.",
          });

      }


      if (
        !await pedidoSigueListoParaEntrega(
          entrega
        )
      ) {

        return responderPedidoFueraDeEntrega(
          res
        );

      }


      if (
        !entrega.confirmada
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Primero debe confirmar la entrega antes de cambiar su estado.",
          });

      }


      if (
        [
          "Entregado",
          "Cancelado",
        ].includes(
          entrega.estado
        )
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Una entrega finalizada no puede cambiar nuevamente de estado.",
          });

      }


      const {
        estado,
        motivoCancelacion = "",
      } = req.body;


      const estadoAnterior =
        entrega.estado;

      const fechaEntregaRealAnterior =
        entrega.fechaEntregaReal;

      const motivoCancelacionAnterior =
        entrega.motivoCancelacion;

      const motivoNoEntregaAnterior =
        entrega.motivoNoEntrega;


      let cajaEntrega =
        null;


      if (
        estado ===
        "Entregado"
      ) {

        cajaEntrega =
          await obtenerCajaAbiertaEntrega();


        if (!cajaEntrega) {

          return res
            .status(400)
            .json({
              mensaje:
                "Debe abrir la caja antes de marcar una entrega como Entregado.",
            });

        }

      }


      const estadosValidos = [
        "Pendiente",
        "En ruta",
        "Entregado",
        "Cancelado",
      ];


      if (
        !estadosValidos.includes(
          estado
        )
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "El estado de entrega indicado no es válido.",
          });

      }


      if (
        entrega.estado ===
        estado
      ) {

        const actual =
          await populateEntrega(
            Entrega.findById(
              entrega._id
            )
          );

        return res.json({
          mensaje:
            "La entrega ya se encuentra en ese estado.",

          entrega:
            actual,
        });

      }


      if (
        estado ===
        "Pendiente"
      ) {

        entrega.fechaSalida =
          null;

        entrega.fechaEntregaReal =
          null;

        entrega.motivoCancelacion =
          "";

        entrega.motivoNoEntrega =
          "";

      }


      if (
        estado ===
        "En ruta"
      ) {

        entrega.fechaSalida =
          entrega.fechaSalida ||
          new Date();

        entrega.fechaEntregaReal =
          null;

        entrega.motivoCancelacion =
          "";

        entrega.motivoNoEntrega =
          "";

      }


      if (
        estado ===
        "Entregado"
      ) {

        recalcularTotales(
          entrega
        );

        entrega.fechaEntregaReal =
          new Date();

        entrega.motivoCancelacion =
          "";

        entrega.motivoNoEntrega =
          "";

      }


      if (
        estado ===
        "Cancelado"
      ) {

        const motivo =
          String(
            motivoCancelacion ||
            ""
          ).trim();


        if (!motivo) {

          return res
            .status(400)
            .json({
              mensaje:
                "Debe indicar el motivo de cancelación.",
            });

        }


        entrega.motivoCancelacion =
          motivo;

        /* Compatibilidad */
        entrega.motivoNoEntrega =
          motivo;

        entrega.fechaEntregaReal =
          null;

      }


      entrega.estado =
        estado;

      entrega.actualizadoPor =
        usuarioActual(
          req
        );


      await entrega.save();


      if (
        estado ===
        "Entregado"
      ) {

        let carteraResultado =
          null;


        try {

          if (
            entrega.metodoPago ===
            "Crédito"
          ) {

            carteraResultado =
              await registrarEntregaCreditoEnCartera({
                entrega,
                usuarioId:
                  usuarioActual(
                    req
                  ),
              });

          }


          await registrarEntregaEntregadaEnCaja({
            entrega,
            caja:
              cajaEntrega,
            usuarioId:
              usuarioActual(
                req
              ),
          });


        } catch (
          errorProceso
        ) {

          if (
            carteraResultado?.creada &&
            carteraResultado?.cartera?._id
          ) {

            await Cartera.findByIdAndDelete(
              carteraResultado.cartera._id
            );

          }


          entrega.estado =
            estadoAnterior;

          entrega.fechaEntregaReal =
            fechaEntregaRealAnterior;

          entrega.motivoCancelacion =
            motivoCancelacionAnterior;

          entrega.motivoNoEntrega =
            motivoNoEntregaAnterior;


          await entrega.save();


          throw errorProceso;

        }

      }


      const actualizada =
        await populateEntrega(
          Entrega.findById(
            entrega._id
          )
        );


      return res.json({
        mensaje:
          estado ===
            "Entregado"
            ? entrega.metodoPago ===
                "Crédito"
              ? "Entrega marcada como Entregado y registrada en Caja y Cartera correctamente."
              : "Entrega marcada como Entregado y registrada en Caja correctamente."
            : `Estado actualizado a "${estado}".`,

        entrega:
          actualizada,
      });


    } catch (error) {

      console.error(
        "Error cambiando estado de entrega:",
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
            "No fue posible cambiar el estado de la entrega.",
        });

    }

  };
