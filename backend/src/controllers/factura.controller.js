import Factura from "../models/Factura.js";
import Pedido from "../models/Pedido.js";
import Entrega from "../models/Entrega.js";
import Consecutivo from "../models/Consecutivo.js";
import Caja from "../models/Caja.js";
import MovimientoCaja from "../models/MovimientoCaja.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


/* =========================================
   UTILIDADES GENERALES
========================================= */

function usuarioActualFactura(
  req
) {

  return (
    req.usuario?._id ||
    req.user?._id ||
    null
  );

}


function obtenerNombrePersonal(
  persona
) {

  if (!persona) {
    return "";
  }


  if (
    typeof persona ===
    "string"
  ) {
    return "";
  }


  return (
    [
      persona.nombres,
      persona.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    persona.nombre ||
    persona.nombreCompleto ||
    ""
  );

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


/* =========================================
   POPULATE DE ENTREGA PARA FACTURACIÓN
========================================= */

function populateEntregaFacturacion(
  query
) {

  return query

    .populate({
      path:
        "pedido",

      select:
        "codigo estado fechaEntrega observaciones empleado",

      populate: {
        path:
          "empleado",

        select:
          "codigo nombres apellidos documento cargo estado",
      },
    })

    .populate(
      "cliente",
      "codigo nombre razonSocial documento telefono direccion ciudad"
    )

    .populate(
      "empacador",
      "codigo nombres apellidos documento cargo estado"
    )

    .populate(
      "repartidor",
      "codigo nombres apellidos documento telefono cargo estado"
    )

    .populate(
      "items.producto",
      "codigo nombre marca"
    );

}


/* =========================================
   POPULATE DE FACTURA
========================================= */

function populateFactura(
  query
) {

  return query

    .populate(
      "pedido",
      "codigo estado fechaEntrega metodoPago"
    )

    .populate(
      "entrega",
      "pedidoCodigo estado fechaProgramada fechaEntregaReal metodoPago total"
    )

    .populate(
      "cliente",
      "codigo nombre razonSocial documento telefono"
    )

    .populate(
      "empleado",
      "codigo nombres apellidos documento cargo"
    )

    .populate(
      "repartidor",
      "codigo nombres apellidos documento cargo"
    )

    .populate(
      "empacador",
      "codigo nombres apellidos documento cargo"
    )

    .populate(
      "creadoPor",
      "nombres apellidos"
    );

}


/* =========================================
   CAJA - COMPATIBILIDAD
   La venta debe nacer de Entrega.
   Caja se termina de actualizar en el siguiente módulo.
========================================= */

async function obtenerMovimientoPedidoCaja(
  pedidoId
) {

  if (!pedidoId) {
    return null;
  }


  return MovimientoCaja
    .findOne({
      $or: [
        {
          pedido:
            pedidoId,
        },
        {
          claveUnica:
            `PEDIDO:${pedidoId}`,
        },
      ],
    })
    .populate(
      "caja",
      "codigo estado"
    );

}


async function sincronizarFacturaMovimientoCaja({
  factura,
  entrega,
  pedido,
  usuarioId = null,
}) {

  if (
    !factura ||
    !entrega ||
    !pedido
  ) {
    return null;
  }


  let movimiento =
    await obtenerMovimientoPedidoCaja(
      pedido._id
    );


  /*
    Si Caja ya creó el movimiento al entregar,
    aquí únicamente anexamos el número de factura.
  */
  if (movimiento) {

    movimiento.factura =
      factura._id;

    movimiento.facturaCodigo =
      factura.codigo ||
      "";

    movimiento.observacion =
      "Factura generada";


    if (
      usuarioId &&
      !movimiento.usuario
    ) {

      movimiento.usuario =
        usuarioId;

    }


    await movimiento.save();


    return movimiento;

  }


  /*
    Compatibilidad temporal:
    mientras terminamos el módulo Caja, si hay caja abierta
    y todavía no existe el movimiento, lo creamos usando
    LOS VALORES FINALES DE ENTREGA.
  */
  if (
    entrega.estado !==
    "Entregado"
  ) {
    return null;
  }


  const caja =
    await Caja.findOne({
      estado:
        "Abierta",
    });


  if (!caja) {
    return null;
  }


  const valor =
    Number(
      entrega.total ||
      factura.total ||
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


  const metodoPago =
    entrega.metodoPago ||
    factura.metodoPago ||
    "Efectivo";


  const claveUnica =
    `PEDIDO:${pedido._id}`;


  movimiento =
    await MovimientoCaja
      .findOneAndUpdate(
        {
          claveUnica,
        },
        {
          $set: {
            caja:
              caja._id,

            tipo:
              "Ingreso",

            origen:
              "Pedido",

            concepto:
              `Entrega finalizada - ${entrega.pedidoCodigo}`,

            valor,

            pedido:
              pedido._id,

            pedidoCodigo:
              entrega.pedidoCodigo ||
              pedido.codigo ||
              "",

            cliente:
              entrega.cliente?._id ||
              entrega.cliente ||
              pedido.cliente?._id ||
              pedido.cliente ||
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
              factura._id,

            facturaCodigo:
              factura.codigo ||
              "",

            observacion:
              "Factura generada",

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


  return movimiento;

}


async function quitarFacturaMovimientoCaja(
  factura
) {

  if (
    !factura?.pedido
  ) {
    return null;
  }


  const movimiento =
    await obtenerMovimientoPedidoCaja(
      factura.pedido
    );


  if (!movimiento) {
    return null;
  }


  if (
    movimiento.factura &&
    String(
      movimiento.factura
    ) !==
    String(
      factura._id
    )
  ) {
    return movimiento;
  }


  movimiento.factura =
    null;

  movimiento.facturaCodigo =
    "";

  movimiento.observacion =
    "Entrega sin factura generada";


  await movimiento.save();


  return movimiento;

}


async function sincronizarMetodoPagoCaja({
  factura,
  metodoPago,
}) {

  const metodosValidos = [
    "Efectivo",
    "Transferencia",
    "Crédito",
  ];


  if (
    !metodosValidos.includes(
      metodoPago
    )
  ) {

    const error =
      new Error(
        "El tipo de pago seleccionado no es válido."
      );

    error.statusCode =
      400;

    throw error;

  }


  const movimiento =
    await obtenerMovimientoPedidoCaja(
      factura.pedido
    );


  if (
    movimiento?.caja?.estado ===
      "Cerrada" &&
    movimiento.metodoPago !==
      metodoPago
  ) {

    const error =
      new Error(
        `No puede cambiar el tipo de pago porque la venta ya pertenece a la caja cerrada ${movimiento.caja.codigo}.`
      );

    error.statusCode =
      400;

    throw error;

  }


  if (
    factura.entrega
  ) {

    const entrega =
      await Entrega.findById(
        factura.entrega
      );


    if (entrega) {

      entrega.metodoPago =
        metodoPago;

      await entrega.save();

    }

  } else {

    /* Compatibilidad con facturas antiguas */
    const pedido =
      await Pedido.findById(
        factura.pedido
      );


    if (pedido) {

      pedido.metodoPago =
        metodoPago;

      await pedido.save();

    }

  }


  if (movimiento) {

    movimiento.metodoPago =
      metodoPago;

    movimiento.afectaEfectivo =
      metodoPago ===
      "Efectivo";

    await movimiento.save();

  }

}


/* =========================================
   CONSECUTIVO
========================================= */

async function generarConsecutivoFactura() {

  const contador =
    await Consecutivo.findOne({
      clave:
        "facturas",
    });


  if (!contador) {

    const ultimaFactura =
      await Factura.findOne()
        .sort({
          consecutivo: -1,
        })
        .select(
          "consecutivo"
        )
        .lean();


    await Consecutivo.create({
      clave:
        "facturas",

      ultimoNumero:
        Number(
          ultimaFactura?.consecutivo ||
          0
        ),
    });

  }


  const codigo =
    await generarConsecutivo(
      "facturas",
      "FAC"
    );


  const consecutivo =
    Number(
      codigo.replace(
        "FAC-",
        ""
      )
    );


  return {
    consecutivo,
    codigo,
  };

}


/* =========================================
   LISTAR FACTURAS
========================================= */

async function listar(
  req,
  res
) {

  try {

    const facturas =
      await populateFactura(
        Factura.find()
      )
        .sort({
          createdAt: -1,
        });


    return res.json(
      facturas
    );


  } catch (error) {

    console.error(
      "Error listando facturas:",
      error
    );


    return res.status(
      500
    ).json({
      mensaje:
        "Error al listar las facturas.",
    });

  }

}


/* =========================================
   LISTAR ENTREGAS FINALIZADAS
   FUENTE DE FACTURACIÓN
========================================= */

async function listarDisponibles(
  req,
  res
) {

  try {

    const entregas =
      await populateEntregaFacturacion(
        Entrega.find({
          estado:
            "Entregado",

          metodoPago: {
            $ne:
              "Crédito",
          },
        })
      )
        .sort({
          fechaEntregaReal: -1,
          updatedAt: -1,
        });


    return res.json(
      entregas
    );


  } catch (error) {

    console.error(
      "Error listando entregas facturables:",
      error
    );


    return res.status(
      500
    ).json({
      mensaje:
        "No fue posible cargar las entregas finalizadas para facturación.",
    });

  }

}


/* =========================================
   OBTENER FACTURA
========================================= */

async function obtenerPorId(
  req,
  res
) {

  try {

    const factura =
      await populateFactura(
        Factura.findById(
          req.params.id
        )
      );


    if (!factura) {

      return res.status(
        404
      ).json({
        mensaje:
          "Factura no encontrada.",
      });

    }


    return res.json(
      factura
    );


  } catch (error) {

    console.error(
      "Error obteniendo factura:",
      error
    );


    return res.status(
      500
    ).json({
      mensaje:
        "Error al obtener la factura.",
    });

  }

}


/* =========================================
   CREAR FACTURA DESDE ENTREGA
========================================= */

async function crear(
  req,
  res
) {

  try {

    const {
      entrega:
        entregaId,
    } =
      req.body;


    if (!entregaId) {

      return res.status(
        400
      ).json({
        mensaje:
          "Debe seleccionar una entrega finalizada.",
      });

    }


    const entrega =
      await populateEntregaFacturacion(
        Entrega.findById(
          entregaId
        )
      );


    if (!entrega) {

      return res.status(
        404
      ).json({
        mensaje:
          "La entrega seleccionada no existe.",
      });

    }


    if (
      entrega.estado !==
      "Entregado"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Solo se pueden facturar entregas con estado Entregado.",
      });

    }


    if (
      entrega.metodoPago ===
      "Crédito"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Las entregas a Crédito se gestionan en Cartera y no se envían a Facturación.",
      });

    }


    const pedido =
      entrega.pedido;


    if (!pedido) {

      return res.status(
        400
      ).json({
        mensaje:
          "La entrega no tiene un pedido de origen válido.",
      });

    }


    const pedidoId =
      pedido._id ||
      pedido;


    /* -----------------------------------------
       VALIDAR FACTURA ANTERIOR
    ----------------------------------------- */

    const ultimaFactura =
      await Factura.findOne({
        $or: [
          {
            entrega:
              entrega._id,
          },
          {
            pedido:
              pedidoId,
          },
        ],
      })
        .sort({
          createdAt: -1,
        });


    if (
      ultimaFactura
    ) {

      if (
        ultimaFactura.estado !==
        "Anulada"
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              `La entrega del pedido ${entrega.pedidoCodigo} ya tiene una factura activa (${ultimaFactura.codigo}).`,
          });

      }


      if (
        ultimaFactura.estado ===
          "Anulada" &&
        !ultimaFactura.fechaReversion
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              `La factura ${ultimaFactura.codigo} está anulada. Debe revertirla para volver a facturar esta entrega.`,
          });

      }

    }


    /* -----------------------------------------
       VALIDAR CLIENTE
    ----------------------------------------- */

    const clienteId =
      entrega.cliente?._id ||
      entrega.cliente;


    if (!clienteId) {

      return res.status(
        400
      ).json({
        mensaje:
          "La entrega no tiene un cliente válido.",
      });

    }


    if (
      !Array.isArray(
        entrega.items
      ) ||
      entrega.items.length ===
        0
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "La entrega no tiene productos para facturar.",
      });

    }


    /* -----------------------------------------
       ITEMS FINALES DE ENTREGA
    ----------------------------------------- */

    const items =
      entrega.items.map(
        (item) => {

          const esPeso =
            item.tipoVenta ===
            "Peso";


          const cantidadSolicitada =
            Number(
              item.cantidadSolicitada ||
              0
            );


          const pesoReal =
            esPeso
              ? Number(
                  item.pesoReal ||
                  0
                )
              : null;


          const cantidadFacturada =
            esPeso
              ? pesoReal
              : cantidadSolicitada;


          return {

            producto:
              item.producto?._id ||
              item.producto ||
              null,

            nombre:
              item.nombre,

            presentacionNombre:
              item.presentacionNombre ||
              "",

            unidad:
              esPeso
                ? "KG"
                : (
                    item.unidad ||
                    ""
                  ),

            tipoVenta:
              item.tipoVenta ||
              "Unidad",

            cantidadSolicitada,

            pesoReal,

            cantidad:
              cantidadFacturada,

            precioAplicado:
              Number(
                item.precioUnitario ||
                0
              ),

            subtotal:
              Number(
                item.subtotal ||
                0
              ),

          };

        }
      );


    const {
      consecutivo,
      codigo,
    } =
      await generarConsecutivoFactura();


    const empleado =
      pedido.empleado ||
      null;


    const factura =
      await Factura.create({

        consecutivo,

        codigo,

        pedido:
          pedidoId,

        pedidoCodigo:
          entrega.pedidoCodigo ||
          pedido.codigo ||
          "",

        entrega:
          entrega._id,

        entregaCodigo:
          entrega.pedidoCodigo ||
          pedido.codigo ||
          "",

        cliente:
          clienteId,

        clienteNombre:
          nombreClienteEntrega(
            entrega
          ),

        clienteDocumento:
          entrega.cliente
            ?.documento ||
          "",

        clienteTelefono:
          entrega.clienteTelefono ||
          entrega.cliente
            ?.telefono ||
          "",


        empleado:
          empleado?._id ||
          empleado ||
          null,

        empleadoNombre:
          obtenerNombrePersonal(
            empleado
          ),


        repartidor:
          entrega.repartidor?._id ||
          entrega.repartidor ||
          null,

        repartidorNombre:
          obtenerNombrePersonal(
            entrega.repartidor
          ),


        empacador:
          entrega.empacador?._id ||
          entrega.empacador ||
          null,

        empacadorNombre:
          obtenerNombrePersonal(
            entrega.empacador
          ),


        items,


        subtotal:
          Number(
            entrega.subtotal ||
            0
          ),

        descuento:
          Number(
            entrega.descuento ||
            0
          ),

        iva:
          0,

        total:
          Number(
            entrega.total ||
            0
          ),


        metodoPago:
          entrega.metodoPago ||
          "Efectivo",


        estado:
          "Emitida",


        observaciones:
          entrega.observaciones ||
          pedido.observaciones ||
          "",


        creadoPor:
          usuarioActualFactura(
            req
          ),

      });


    /* -----------------------------------------
       ASOCIAR FACTURA AL MISMO MOVIMIENTO DE CAJA
       SIN DUPLICAR LA VENTA
    ----------------------------------------- */

    try {

      await sincronizarFacturaMovimientoCaja({
        factura,
        entrega,
        pedido,
        usuarioId:
          usuarioActualFactura(
            req
          ),
      });


    } catch (errorCaja) {

      await Factura.findByIdAndDelete(
        factura._id
      );

      throw errorCaja;

    }


    const facturaCreada =
      await populateFactura(
        Factura.findById(
          factura._id
        )
      );


    return res.status(
      201
    ).json(
      facturaCreada
    );


  } catch (error) {

    console.error(
      "Error creando factura:",
      error
    );


    if (
      error?.code ===
      11000
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "La entrega ya fue facturada o el consecutivo de factura ya existe.",
      });

    }


    return res.status(
      error?.statusCode ||
      500
    ).json({
      mensaje:
        error.message ||
        "Error al generar la factura.",
    });

  }

}


/* =========================================
   ACTUALIZAR FACTURA
========================================= */

async function actualizar(
  req,
  res
) {

  try {

    const factura =
      await Factura.findById(
        req.params.id
      );


    if (!factura) {

      return res.status(
        404
      ).json({
        mensaje:
          "Factura no encontrada.",
      });

    }


    if (
      req.body.metodoPago ===
      "Crédito"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Las ventas a Crédito se gestionan en Cartera y no deben convertirse desde una factura.",
      });

    }


    if (
      req.body.metodoPago !==
      undefined &&
      req.body.metodoPago !==
      factura.metodoPago
    ) {

      await sincronizarMetodoPagoCaja({
        factura,
        metodoPago:
          req.body.metodoPago,
      });


      factura.metodoPago =
        req.body.metodoPago;

    }


    if (
      req.body.estado !==
      undefined
    ) {

      if (
        req.body.estado ===
          "Anulada" &&
        factura.estado !==
          "Anulada"
      ) {

        return res.status(
          400
        ).json({
          mensaje:
            "Para anular una factura utilice la opción Anular.",
        });

      }


      factura.estado =
        req.body.estado;

    }


    if (
      req.body.observaciones !==
      undefined
    ) {

      factura.observaciones =
        req.body.observaciones;

    }


    await factura.save();


    if (
      factura.estado !==
      "Anulada"
    ) {

      const entrega =
        factura.entrega
          ? await populateEntregaFacturacion(
              Entrega.findById(
                factura.entrega
              )
            )
          : null;


      const pedido =
        entrega?.pedido ||
        await Pedido.findById(
          factura.pedido
        );


      if (
        entrega &&
        pedido
      ) {

        await sincronizarFacturaMovimientoCaja({
          factura,
          entrega,
          pedido,
          usuarioId:
            usuarioActualFactura(
              req
            ),
        });

      }

    }


    const facturaActualizada =
      await populateFactura(
        Factura.findById(
          factura._id
        )
      );


    return res.json(
      facturaActualizada
    );


  } catch (error) {

    console.error(
      "Error actualizando factura:",
      error
    );


    return res.status(
      error?.statusCode ||
      500
    ).json({
      mensaje:
        error.message ||
        "Error al actualizar la factura.",
    });

  }

}


/* =========================================
   ELIMINAR FACTURA
========================================= */

async function eliminar(
  req,
  res
) {

  try {

    const factura =
      await Factura.findById(
        req.params.id
      );


    if (!factura) {

      return res.status(
        404
      ).json({
        mensaje:
          "Factura no encontrada.",
      });

    }


    await quitarFacturaMovimientoCaja(
      factura
    );


    await factura.deleteOne();


    return res.json({
      mensaje:
        "Factura eliminada correctamente. La entrega continúa registrada en Caja sin factura.",
    });


  } catch (error) {

    console.error(
      "Error eliminando factura:",
      error
    );


    return res.status(
      500
    ).json({
      mensaje:
        error.message ||
        "Error al eliminar la factura.",
    });

  }

}


/* =========================================
   ANULAR FACTURA
========================================= */

async function anular(
  req,
  res
) {

  try {

    const {
      motivo,
    } =
      req.body;


    if (
      !motivo ||
      !motivo.trim()
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Debe indicar el motivo de anulación.",
      });

    }


    const factura =
      await Factura.findById(
        req.params.id
      );


    if (!factura) {

      return res.status(
        404
      ).json({
        mensaje:
          "Factura no encontrada.",
      });

    }


    if (
      factura.estado ===
      "Anulada"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "La factura ya se encuentra anulada.",
      });

    }


    /*
      Anular la factura NO anula la venta.
      La Entrega permanece Entregada y Caja conserva el ingreso.
    */
    factura.estado =
      "Anulada";

    factura.motivoAnulacion =
      motivo.trim();

    factura.fechaAnulacion =
      new Date();

    factura.fechaReversion =
      null;


    await factura.save();


    await quitarFacturaMovimientoCaja(
      factura
    );


    return res.json({
      mensaje:
        "Factura anulada correctamente. La entrega continúa registrada en Caja sin factura activa.",

      factura,
    });


  } catch (error) {

    console.error(
      "Error anulando factura:",
      error
    );


    return res.status(
      500
    ).json({
      mensaje:
        error.message ||
        "Error al anular la factura.",
    });

  }

}


/* =========================================
   REVERTIR ANULACIÓN
   HABILITA ENTREGA PARA REFACTURAR
========================================= */

async function revertir(
  req,
  res
) {

  try {

    const factura =
      await Factura.findById(
        req.params.id
      );


    if (!factura) {

      return res
        .status(404)
        .json({
          mensaje:
            "Factura no encontrada.",
        });

    }


    if (
      factura.estado !==
      "Anulada"
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Solo se pueden revertir facturas anuladas.",
        });

    }


    if (
      factura.fechaReversion
    ) {

      return res
        .status(400)
        .json({
          mensaje:
            "Esta factura ya fue revertida y la entrega ya está habilitada para facturar nuevamente.",
        });

    }


    /*
      La factura sigue ANULADA.
      fechaReversion habilita la Entrega para una nueva factura.
    */
    factura.fechaReversion =
      new Date();


    await factura.save();


    return res.json({
      mensaje:
        `Factura ${factura.codigo} revertida. La entrega del pedido ${factura.pedidoCodigo} puede facturarse nuevamente.`,

      factura,
    });


  } catch (error) {

    console.error(
      "Error revirtiendo factura:",
      error
    );


    return res
      .status(500)
      .json({
        mensaje:
          "Error al revertir la factura.",
      });

  }

}


/* =========================================
   EXPORTAR CONTROLADOR
========================================= */

export const facturaController = {
  listar,
  listarDisponibles,
  obtenerPorId,
  crear,
  actualizar,
  anular,
  revertir,
  eliminar,
};
