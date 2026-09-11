import Factura from "../models/Factura.js";
import Pedido from "../models/Pedido.js";


/* =========================================
   GENERAR SIGUIENTE CONSECUTIVO
========================================= */

async function generarConsecutivoFactura() {

  const ultimaFactura =
    await Factura.findOne()
      .sort({
        consecutivo: -1,
      })
      .select(
        "consecutivo"
      )
      .lean();


  const consecutivo =
    Number(
      ultimaFactura?.consecutivo ||
      0
    ) + 1;


  const codigo =
    `FAC-${String(
      consecutivo
    ).padStart(
      4,
      "0"
    )}`;


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
      await Factura.find()

        .populate(
          "pedido",
          "codigo estado fechaEntrega"
        )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
        )

        .populate(
          "empleado",
          "codigo nombres apellidos documento"
        )

        .populate(
          "creadoPor",
          "nombres apellidos"
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
   OBTENER FACTURA
========================================= */

async function obtenerPorId(
  req,
  res
) {

  try {

    const factura =
      await Factura.findById(
        req.params.id
      )

        .populate(
          "pedido",
          "codigo estado fechaEntrega"
        )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
        )

        .populate(
          "empleado",
          "codigo nombres apellidos documento"
        )

        .populate(
          "creadoPor",
          "nombres apellidos"
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
   CREAR FACTURA DESDE PEDIDO
========================================= */

async function crear(
  req,
  res
) {

  try {

    const {
      pedido:
        pedidoId,
    } = req.body;


    /* -----------------------------------------
       VALIDAR PEDIDO
    ----------------------------------------- */

    if (!pedidoId) {

      return res.status(
        400
      ).json({
        mensaje:
          "Debe seleccionar un pedido.",
      });

    }


    const pedido =
      await Pedido.findById(
        pedidoId
      )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
        )

        .populate(
          "empleado",
          "codigo nombres apellidos documento"
        );


    if (!pedido) {

      return res.status(
        404
      ).json({
        mensaje:
          "El pedido seleccionado no existe.",
      });

    }


    /* -----------------------------------------
       SOLO PEDIDOS ENTREGADOS
    ----------------------------------------- */

    if (
      pedido.estado !==
      "Entregado"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Solo se pueden facturar pedidos entregados.",
      });

    }


    /* -----------------------------------------
       EVITAR FACTURA DUPLICADA
    ----------------------------------------- */

    const facturaExistente =
      await Factura.findOne({
        pedido:
          pedido._id,
      });


    if (
      facturaExistente
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          `El pedido ${pedido.codigo} ya tiene una factura generada.`,
      });

    }


    /* -----------------------------------------
       VALIDAR CLIENTE
    ----------------------------------------- */

    if (
      !pedido.cliente
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "El pedido no tiene un cliente válido.",
      });

    }


    /* -----------------------------------------
       VALIDAR PRODUCTOS
    ----------------------------------------- */

    if (
      !pedido.items ||
      pedido.items.length === 0
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "El pedido no tiene productos para facturar.",
      });

    }


    /* -----------------------------------------
       GENERAR CONSECUTIVO
    ----------------------------------------- */

    const {
      consecutivo,
      codigo,
    } =
      await generarConsecutivoFactura();


    /* -----------------------------------------
       NOMBRE CLIENTE
    ----------------------------------------- */

    const clienteNombre =
      pedido.cliente
        ?.nombre ||
      pedido.cliente
        ?.razonSocial ||
      "Cliente";


    /* -----------------------------------------
       NOMBRE EMPLEADO
    ----------------------------------------- */

    let empleadoNombre =
      "";


    if (
      pedido.empleado
    ) {

      empleadoNombre =
        `${pedido.empleado.nombres || ""} ${
          pedido.empleado.apellidos || ""
        }`.trim();

    }


    /* -----------------------------------------
       COPIAR PRODUCTOS DEL PEDIDO
    ----------------------------------------- */

    const items =
      pedido.items.map(
        (item) => ({

          producto:
            item.producto ||
            null,

          nombre:
            item.nombre,

          presentacionNombre:
            item.presentacionNombre ||
            "",

          unidad:
            item.unidad ||
            "",

          cantidad:
            Number(
              item.cantidad ||
              0
            ),

          precioAplicado:
            Number(
              item.precioAplicado ||
              0
            ),

          subtotal:
            Number(
              item.subtotal ||
              0
            ),

        })
      );


    /* -----------------------------------------
       CREAR FACTURA
    ----------------------------------------- */

    const factura =
      await Factura.create({

        consecutivo,

        codigo,

        pedido:
          pedido._id,

        pedidoCodigo:
          pedido.codigo,

        cliente:
          pedido.cliente._id,

        clienteNombre,

        clienteDocumento:
          pedido.cliente
            ?.documento ||
          "",

        clienteTelefono:
          pedido.cliente
            ?.telefono ||
          "",


        empleado:
          pedido.empleado
            ?._id ||
          null,

        empleadoNombre,


        items,


        subtotal:
          Number(
            pedido.subtotal ||
            0
          ),

        descuento:
          Number(
            pedido.descuento ||
            0
          ),

        iva: 0,

        total:
          Number(
            pedido.total ||
            0
          ),


        estado:
          "Emitida",


        observaciones:
          pedido.observaciones ||
          "",


        creadoPor:
          req.usuario?._id ||
          req.user?._id ||
          null,

      });


    /* -----------------------------------------
       DEVOLVER FACTURA COMPLETA
    ----------------------------------------- */

    const facturaCreada =
      await Factura.findById(
        factura._id
      )

        .populate(
          "pedido",
          "codigo estado fechaEntrega"
        )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
        )

        .populate(
          "empleado",
          "codigo nombres apellidos documento"
        )

        .populate(
          "creadoPor",
          "nombres apellidos"
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


    /* DUPLICADO */

    if (
      error?.code ===
      11000
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "El pedido ya fue facturado o el consecutivo de factura ya existe.",
      });

    }


    return res.status(
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


    /*
      No permitimos cambiar:
      - pedido
      - cliente
      - productos
      - valores

      porque son la copia histórica
      del pedido facturado.
    */


    if (
      req.body.metodoPago !==
      undefined
    ) {

      factura.metodoPago =
        req.body.metodoPago;

    }


    if (
      req.body.estado !==
      undefined
    ) {

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


    const facturaActualizada =
      await Factura.findById(
        factura._id
      )

        .populate(
          "pedido",
          "codigo estado fechaEntrega"
        )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
        )

        .populate(
          "empleado",
          "codigo nombres apellidos documento"
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


    await factura.deleteOne();


    return res.json({
      mensaje:
        "Factura eliminada correctamente.",
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
    } = req.body;


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


    factura.estado =
      "Anulada";


    factura.motivoAnulacion =
      motivo.trim();


    factura.fechaAnulacion =
      new Date();


    factura.fechaReversion =
      null;


    await factura.save();


    return res.json({
      mensaje:
        "Factura anulada correctamente.",

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
        "Error al anular la factura.",
    });

  }

}


/* =========================================
   REVERTIR ANULACIÓN
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

      return res.status(
        404
      ).json({
        mensaje:
          "Factura no encontrada.",
      });

    }


    if (
      factura.estado !==
      "Anulada"
    ) {

      return res.status(
        400
      ).json({
        mensaje:
          "Solo se pueden revertir facturas anuladas.",
      });

    }


    factura.estado =
      "Emitida";


    factura.fechaReversion =
      new Date();


    await factura.save();


    return res.json({
      mensaje:
        "Factura revertida correctamente.",

      factura,
    });


  } catch (error) {

    console.error(
      "Error revirtiendo factura:",
      error
    );


    return res.status(
      500
    ).json({
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

  obtenerPorId,

  crear,

  actualizar,

  anular,

  revertir,

  eliminar,

};