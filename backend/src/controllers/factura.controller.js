import Factura from "../models/Factura.js";
import Pedido from "../models/Pedido.js";
import Consecutivo from "../models/Consecutivo.js";
import Caja from "../models/Caja.js";
import MovimientoCaja from "../models/MovimientoCaja.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


/* =========================================
   NOMBRE DEL PERSONAL
========================================= */

function obtenerNombrePersonal(
  persona
) {

  if (!persona) {
    return "";
  }


  if (
    typeof persona === "string"
  ) {
    return "";
  }


  return [
    persona.nombres,
    persona.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

}



/* =========================================
   UTILIDADES DE CAJA
   LA VENTA NACE DEL PEDIDO ENTREGADO.
   LA FACTURA SOLO COMPLEMENTA EL REGISTRO.
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


function nombreClientePedidoCaja(
  pedido
) {

  return (
    pedido?.clienteNombre ||
    pedido?.clienteRazonSocial ||
    pedido?.cliente?.nombre ||
    pedido?.cliente?.razonSocial ||
    "Cliente"
  );

}


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
  pedido,
  usuarioId = null,
}) {

  if (
    !factura ||
    !pedido
  ) {
    return null;
  }


  let movimiento =
    await obtenerMovimientoPedidoCaja(
      pedido._id
    );


  /*
    Flujo normal:
    el pedido ya entró a Caja cuando se marcó
    como Entregado. Solo agregamos el consecutivo
    de la factura al mismo movimiento.
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
    Compatibilidad con pedidos antiguos que ya estaban
    Entregados antes de instalar esta nueva Caja.
    Solo se crea el movimiento si actualmente hay una
    caja abierta. La factura NO exige abrir caja.
  */
  if (
    pedido.estado !==
    "Entregado"
  ) {
    return null;
  }


  const caja =
    await Caja.findOne({
      estado: "Abierta",
    });


  if (!caja) {
    return null;
  }


  const valor =
    Number(
      pedido.total ||
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
              `Pedido entregado - ${pedido.codigo}`,

            valor,

            pedido:
              pedido._id,

            pedidoCodigo:
              pedido.codigo ||
              "",

            cliente:
              pedido.cliente?._id ||
              pedido.cliente ||
              null,

            clienteNombre:
              nombreClientePedidoCaja(
                pedido
              ),

            metodoPago:
              pedido.metodoPago ||
              factura.metodoPago ||
              "Efectivo",

            afectaEfectivo:
              (
                pedido.metodoPago ||
                factura.metodoPago ||
                "Efectivo"
              ) ===
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
    "Pedido sin factura generada";


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


  const pedido =
    await Pedido.findById(
      factura.pedido
    );


  if (!pedido) {

    const error =
      new Error(
        "No fue posible encontrar el pedido relacionado con la factura."
      );

    error.statusCode =
      404;

    throw error;

  }


  const movimiento =
    await obtenerMovimientoPedidoCaja(
      pedido._id
    );


  /*
    No permitimos modificar el medio de pago si
    ya forma parte de una caja cerrada.
  */
  if (
    movimiento?.caja?.estado ===
      "Cerrada" &&
    movimiento.metodoPago !==
      metodoPago
  ) {

    const error =
      new Error(
        `No puede cambiar el tipo de pago porque el pedido ${pedido.codigo} ya pertenece a la caja cerrada ${movimiento.caja.codigo}.`
      );

    error.statusCode =
      400;

    throw error;

  }


  pedido.metodoPago =
    metodoPago;


  await pedido.save();


  if (movimiento) {

    movimiento.metodoPago =
      metodoPago;

    movimiento.afectaEfectivo =
      metodoPago ===
      "Efectivo";


    await movimiento.save();

  }


  return pedido;

}


/* =========================================
   GENERAR SIGUIENTE CONSECUTIVO
========================================= */

async function generarConsecutivoFactura() {

  /* =====================================
     SINCRONIZAR CONTADOR INICIAL
  ===================================== */

  const contador =
    await Consecutivo.findOne({
      clave: "facturas",
    });


  /*
    Solo hacemos esta sincronización
    cuando todavía no existe el contador.
  */

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


  /* =====================================
     GENERAR NUEVO CONSECUTIVO
  ===================================== */

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
          "codigo nombres apellidos documento cargo"
        )

        .populate(
          "repartidor",
          "codigo nombres apellidos documento cargo"
        )

        .populate(
          "empacador",
          "codigo nombres apellidos documento cargo"
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
       VALIDAR FACTURACIÓN ANTERIOR
    ----------------------------------------- */

    const ultimaFactura =
      await Factura.findOne({
        pedido:
          pedido._id,
      })

        .sort({
          createdAt: -1,
        });


    /*
      CASO 1:
      Nunca se ha facturado este pedido.
      Puede continuar normalmente.

      CASO 2:
      Tiene una factura activa.
      No puede generar otra.

      CASO 3:
      Tiene una factura anulada,
      pero todavía no se ha revertido.
      Debe usar "Revertir".

      CASO 4:
      Tiene una factura anulada
      y ya fue revertida.
      Puede generar una nueva factura.
    */

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
              `El pedido ${pedido.codigo} ya tiene una factura activa (${ultimaFactura.codigo}).`,

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
              `La factura ${ultimaFactura.codigo} está anulada. Debe revertirla para volver a facturar este pedido.`,

          });

      }

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
       PERSONAL DEL PEDIDO
    ----------------------------------------- */

    const empleadoNombre =
      obtenerNombrePersonal(
        pedido.empleado
      );


    const repartidorNombre =
      obtenerNombrePersonal(
        pedido.repartidor
      );


    const empacadorNombre =
      obtenerNombrePersonal(
        pedido.empacador
      );


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


        repartidor:
          pedido.repartidor
            ?._id ||
          null,

        repartidorNombre,


        empacador:
          pedido.empacador
            ?._id ||
          null,

        empacadorNombre,


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


        metodoPago:
          pedido.metodoPago ||
          "Efectivo",


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
       ACTUALIZAR EL MISMO REGISTRO DE CAJA
       DEL PEDIDO. NO SUMA LA VENTA OTRA VEZ.
    ----------------------------------------- */

    try {

      await sincronizarFacturaMovimientoCaja({

        factura,

        pedido,

        usuarioId:
          usuarioActualFactura(
            req
          ),

      });


    } catch (
      errorCaja
    ) {

      /*
        Si falla la asociación con Caja,
        eliminamos la factura recién creada
        para mantener consistencia.
      */

      await Factura.findByIdAndDelete(
        factura._id
      );

      throw errorCaja;

    }





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

      /*
        La anulación debe hacerse por el endpoint
        específico para que Caja y Facturación
        siempre queden sincronizadas.
      */
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

      const pedido =
        await Pedido.findById(
          factura.pedido
        )
          .populate(
            "cliente",
            "codigo nombre razonSocial documento telefono"
          );


      if (pedido) {

        await sincronizarFacturaMovimientoCaja({

          factura,

          pedido,

          usuarioId:
            usuarioActualFactura(
              req
            ),

        });

      }

    }


    const facturaActualizada =
      await Factura.findById(
        factura._id
      )

        .populate(
          "pedido",
          "codigo estado fechaEntrega metodoPago"
        )

        .populate(
          "cliente",
          "codigo nombre documento telefono"
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


    /*
      La venta del pedido permanece en Caja.
      Solo retiramos la referencia a la factura.
    */
    await quitarFacturaMovimientoCaja(
      factura
    );


    await factura.deleteOne();


    return res.json({
      mensaje:
        "Factura eliminada correctamente. El pedido continúa registrado en Caja.",
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


    /*
      IMPORTANTE:
      La factura es opcional.

      Anularla NO revierte la venta de Caja,
      porque la venta corresponde al pedido
      que ya fue Entregado.
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
        "Factura anulada correctamente. El pedido continúa registrado en Caja sin factura activa.",

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
   HABILITA PEDIDO PARA REFACTURAR
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


    if (
      !factura
    ) {

      return res
        .status(404)
        .json({

          mensaje:
            "Factura no encontrada.",

        });

    }


    /* -----------------------------------------
       SOLO FACTURAS ANULADAS
    ----------------------------------------- */

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


    /* -----------------------------------------
       EVITAR REVERTIR DOS VECES
    ----------------------------------------- */

    if (
      factura.fechaReversion
    ) {

      return res
        .status(400)
        .json({

          mensaje:
            "Esta factura ya fue revertida y el pedido ya está habilitado para facturar nuevamente.",

        });

    }


    /*
      IMPORTANTE:

      La factura NO vuelve a Emitida.

      Sigue siendo ANULADA para conservar
      correctamente el historial.

      fechaReversion indica que el pedido
      puede volver a facturarse.
    */

    factura.fechaReversion =
      new Date();


    await factura.save();


    return res.json({

      mensaje:
        `Factura ${factura.codigo} revertida. El pedido ${factura.pedidoCodigo} puede facturarse nuevamente.`,

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

  obtenerPorId,

  crear,

  actualizar,

  anular,

  revertir,

  eliminar,

};