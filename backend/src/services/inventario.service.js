import Producto from "../models/Producto.js";
import MovimientoInventario from "../models/MovimientoInventario.js";


/* =========================================
   UTILIDADES
========================================= */

function numeroSeguro(
  valor,
  fallback = 0
) {
  const numero =
    Number(valor);

  return Number.isFinite(numero)
    ? numero
    : fallback;
}


function redondear(
  valor
) {
  return Number(
    numeroSeguro(valor)
      .toFixed(4)
  );
}


function normalizarFechaMovimiento(
  valor
) {
  if (!valor) {
    return new Date();
  }

  if (
    valor instanceof Date
  ) {
    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      throw new Error(
        "La fecha del movimiento no es válida."
      );
    }

    return valor;
  }

  const texto =
    String(valor).trim();

  /*
   * Los controles de fecha del frontend envían YYYY-MM-DD.
   * new Date("YYYY-MM-DD") se interpreta como UTC y en Colombia
   * puede mostrarse como el día anterior. Guardamos la medianoche
   * de Colombia (-05:00) para conservar exactamente el día elegido.
   */
  const esFechaSinHora =
    /^\d{4}-\d{2}-\d{2}$/.test(
      texto
    );

  const fecha =
    esFechaSinHora
      ? new Date(
          `${texto}T00:00:00.000-05:00`
        )
      : new Date(texto);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    throw new Error(
      "La fecha del movimiento no es válida."
    );
  }

  return fecha;
}


function validarCantidadPositiva(
  cantidad,
  tipoVenta = "Unidad"
) {
  const numero =
    Number(cantidad);

  if (
    !Number.isFinite(numero) ||
    numero <= 0
  ) {
    throw new Error(
      "La cantidad debe ser mayor que cero."
    );
  }

  if (
    tipoVenta === "Unidad" &&
    !Number.isInteger(numero)
  ) {
    throw new Error(
      "La cantidad de un producto por unidad debe ser un número entero."
    );
  }

  return redondear(numero);
}


function obtenerValoresInventario(
  objetivo
) {
  return {
    stock:
      redondear(
        objetivo?.stock || 0
      ),

    stockReservado:
      redondear(
        objetivo?.stockReservado || 0
      ),

    stockMinimo:
      redondear(
        objetivo?.stockMinimo || 0
      ),

    costoPromedio:
      redondear(
        objetivo?.costoPromedio || 0
      ),

    controlInventario:
      objetivo?.controlInventario !== false,
  };
}


function construirDatosBaseMovimiento({
  producto,
  objetivo,
  presentacionId = null,
  tipo,
  cantidad,
  stockAnterior,
  stockNuevo,
  reservadoAnterior,
  reservadoNuevo,
  costoPromedioAnterior,
  costoPromedioNuevo,
  costoUnitario = 0,
  origen = "Manual",
  pedidoId = null,
  pedidoCodigo = "",
  entregaId = null,
  entregaCodigo = "",
  proveedor = "",
  documentoReferencia = "",
  fechaMovimiento = null,
  motivo = "",
  observaciones = "",
  usuarioId = null,
}) {
  return {
    producto:
      producto._id,

    codigoProducto:
      producto.codigo || "",

    nombreProducto:
      producto.nombre || "",

    presentacionId:
      presentacionId || null,

    presentacionNombre:
      presentacionId
        ? objetivo?.nombre || ""
        : "",

    tipo,

    cantidad:
      redondear(cantidad),

    unidad:
      objetivo?.unidad ||
      producto.unidad ||
      "",

    tipoVenta:
      objetivo?.tipoVenta ||
      producto.tipoVenta ||
      "Unidad",

    stockAnterior:
      redondear(stockAnterior),

    stockNuevo:
      redondear(stockNuevo),

    reservadoAnterior:
      redondear(reservadoAnterior),

    reservadoNuevo:
      redondear(reservadoNuevo),

    costoUnitario:
      redondear(costoUnitario),

    costoPromedioAnterior:
      redondear(
        costoPromedioAnterior
      ),

    costoPromedioNuevo:
      redondear(
        costoPromedioNuevo
      ),

    valorTotal:
      redondear(
        cantidad *
        numeroSeguro(
          costoUnitario
        )
      ),

    origen,

    pedido:
      pedidoId || null,

    pedidoCodigo:
      String(
        pedidoCodigo || ""
      ).trim(),

    entrega:
      entregaId || null,

    entregaCodigo:
      String(
        entregaCodigo || ""
      ).trim(),

    proveedor:
      String(
        proveedor || ""
      ).trim(),

    documentoReferencia:
      String(
        documentoReferencia || ""
      ).trim(),

    fechaMovimiento:
      normalizarFechaMovimiento(
        fechaMovimiento
      ),

    motivo:
      String(
        motivo || ""
      ).trim(),

    observaciones:
      String(
        observaciones || ""
      ).trim(),

    usuario:
      usuarioId || null,
  };
}


async function obtenerObjetivoInventario({
  productoId,
  presentacionId = null,
}) {
  const producto =
    await Producto.findById(
      productoId
    );

  if (!producto) {
    throw new Error(
      "Producto no encontrado."
    );
  }

  if (!presentacionId) {
    return {
      producto,
      objetivo: producto,
      presentacionId: null,
    };
  }

  const presentacion =
    producto.presentacionesAdicionales
      .id(
        presentacionId
      );

  if (!presentacion) {
    throw new Error(
      "La presentación seleccionada no existe."
    );
  }

  return {
    producto,
    objetivo: presentacion,
    presentacionId:
      presentacion._id,
  };
}


async function guardarOperacion({
  producto,
  objetivo,
  valoresAnteriores,
  movimiento,
}) {
  try {
    await producto.save();

    const movimientoCreado =
      await MovimientoInventario.create(
        movimiento
      );

    return movimientoCreado;

  } catch (error) {

    /*
      Si el movimiento falla después de modificar
      el producto, intentamos devolver el inventario
      a sus valores anteriores.
    */
    try {
      objetivo.stock =
        valoresAnteriores.stock;

      objetivo.stockReservado =
        valoresAnteriores.stockReservado;

      objetivo.costoPromedio =
        valoresAnteriores.costoPromedio;

      await producto.save();

    } catch (errorRollback) {
      console.error(
        "Error restaurando inventario:",
        errorRollback.message
      );
    }

    throw error;
  }
}


/* =========================================
   CONSULTAR STOCK
========================================= */

export async function obtenerStockDisponible({
  productoId,
  presentacionId = null,
}) {
  const {
    producto,
    objetivo,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const valores =
    obtenerValoresInventario(
      objetivo
    );

  return {
    productoId:
      producto._id,

    presentacionId:
      presentacionId || null,

    controlInventario:
      valores.controlInventario,

    stock:
      valores.stock,

    stockReservado:
      valores.stockReservado,

    stockDisponible:
      redondear(
        valores.stock -
        valores.stockReservado
      ),

    stockMinimo:
      valores.stockMinimo,

    costoPromedio:
      valores.costoPromedio,
  };
}


/* =========================================
   ENTRADA DE INVENTARIO
========================================= */

export async function registrarEntrada({
  productoId,
  presentacionId = null,
  cantidad,
  costoUnitario = 0,
  proveedor = "",
  documentoReferencia = "",
  fechaMovimiento = null,
  motivo = "Entrada de inventario",
  observaciones = "",
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const costoEntrada =
    numeroSeguro(
      costoUnitario,
      0
    );

  if (costoEntrada < 0) {
    throw new Error(
      "El costo unitario no puede ser negativo."
    );
  }

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  const stockNuevo =
    redondear(
      anteriores.stock +
      cantidadNumero
    );

  /*
    Si aún no existe costo promedio,
    usamos como base el precio de compra actual.
  */
  const costoBaseAnterior =
    anteriores.costoPromedio > 0
      ? anteriores.costoPromedio
      : numeroSeguro(
          objetivo.precioCompra,
          0
        );

  const costoPromedioNuevo =
    stockNuevo > 0
      ? redondear(
          (
            anteriores.stock *
              costoBaseAnterior +
            cantidadNumero *
              costoEntrada
          ) /
          stockNuevo
        )
      : costoEntrada;

  objetivo.stock =
    stockNuevo;

  objetivo.costoPromedio =
    costoPromedioNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "ENTRADA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo:
        anteriores.stockReservado,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo,
      costoUnitario:
        costoEntrada,
      origen:
        "Manual",
      proveedor,
      documentoReferencia,
      fechaMovimiento,
      motivo,
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      stockNuevo,
    stockReservado:
      anteriores.stockReservado,
    stockDisponible:
      redondear(
        stockNuevo -
        anteriores.stockReservado
      ),
    costoPromedio:
      costoPromedioNuevo,
  };
}


/* =========================================
   SALIDA MANUAL
========================================= */

export async function registrarSalida({
  productoId,
  presentacionId = null,
  cantidad,
  motivo = "Salida de inventario",
  observaciones = "",
  fechaMovimiento = null,
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  if (
    !anteriores.controlInventario
  ) {
    return {
      omitido: true,
      motivo:
        "El producto no controla inventario.",
    };
  }

  const disponible =
    redondear(
      anteriores.stock -
      anteriores.stockReservado
    );

  if (
    cantidadNumero >
    disponible
  ) {
    throw new Error(
      `Stock disponible insuficiente. Disponible: ${disponible}.`
    );
  }

  const stockNuevo =
    redondear(
      anteriores.stock -
      cantidadNumero
    );

  objetivo.stock =
    stockNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "SALIDA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo:
        anteriores.stockReservado,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Manual",
      fechaMovimiento,
      motivo,
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      stockNuevo,
    stockReservado:
      anteriores.stockReservado,
    stockDisponible:
      redondear(
        stockNuevo -
        anteriores.stockReservado
      ),
  };
}


/* =========================================
   AJUSTE POR CONTEO FÍSICO
========================================= */

export async function registrarAjuste({
  productoId,
  presentacionId = null,
  stockFisico,
  motivo = "Ajuste de inventario",
  observaciones = "",
  fechaMovimiento = null,
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const stockContado =
    Number(
      stockFisico
    );

  if (
    !Number.isFinite(
      stockContado
    ) ||
    stockContado < 0
  ) {
    throw new Error(
      "El stock físico contado no es válido."
    );
  }

  if (
    objetivo.tipoVenta ===
      "Unidad" &&
    !Number.isInteger(
      stockContado
    )
  ) {
    throw new Error(
      "El stock físico de un producto por unidad debe ser entero."
    );
  }

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  const stockNuevo =
    redondear(
      stockContado
    );

  if (
    stockNuevo <
    anteriores.stockReservado
  ) {
    throw new Error(
      `El stock físico no puede quedar por debajo del stock reservado (${anteriores.stockReservado}).`
    );
  }

  const diferencia =
    redondear(
      stockNuevo -
      anteriores.stock
    );

  if (diferencia === 0) {
    return {
      sinCambios: true,
      producto,
      stock:
        anteriores.stock,
      stockReservado:
        anteriores.stockReservado,
      stockDisponible:
        redondear(
          anteriores.stock -
          anteriores.stockReservado
        ),
    };
  }

  objetivo.stock =
    stockNuevo;

  const tipo =
    diferencia > 0
      ? "AJUSTE_POSITIVO"
      : "AJUSTE_NEGATIVO";

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo,
      cantidad:
        Math.abs(
          diferencia
        ),
      stockAnterior:
        anteriores.stock,
      stockNuevo,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo:
        anteriores.stockReservado,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Ajuste",
      fechaMovimiento,
      motivo,
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      stockNuevo,
    stockReservado:
      anteriores.stockReservado,
    stockDisponible:
      redondear(
        stockNuevo -
        anteriores.stockReservado
      ),
  };
}


/* =========================================
   RESERVAR STOCK
========================================= */

export async function reservarStock({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  if (
    !anteriores.controlInventario
  ) {
    return {
      omitido: true,
      motivo:
        "El producto no controla inventario.",
    };
  }

  const disponible =
    redondear(
      anteriores.stock -
      anteriores.stockReservado
    );

  if (
    cantidadNumero >
    disponible
  ) {
    throw new Error(
      `Stock disponible insuficiente. Disponible: ${disponible}.`
    );
  }

  const reservadoNuevo =
    redondear(
      anteriores.stockReservado +
      cantidadNumero
    );

  objetivo.stockReservado =
    reservadoNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "RESERVA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo:
        anteriores.stock,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Pedido",
      pedidoId,
      pedidoCodigo,
      motivo:
        "Reserva de inventario por pedido",
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      anteriores.stock,
    stockReservado:
      reservadoNuevo,
    stockDisponible:
      redondear(
        anteriores.stock -
        reservadoNuevo
      ),
  };
}


/* =========================================
   LIBERAR RESERVA
========================================= */

export async function liberarReserva({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  if (
    !anteriores.controlInventario
  ) {
    return {
      omitido: true,
      motivo:
        "El producto no controla inventario.",
    };
  }

  if (
    cantidadNumero >
    anteriores.stockReservado
  ) {
    throw new Error(
      `No se puede liberar ${cantidadNumero}; solo hay ${anteriores.stockReservado} reservado.`
    );
  }

  const reservadoNuevo =
    redondear(
      anteriores.stockReservado -
      cantidadNumero
    );

  objetivo.stockReservado =
    reservadoNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "LIBERACION_RESERVA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo:
        anteriores.stock,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Pedido",
      pedidoId,
      pedidoCodigo,
      motivo:
        "Liberación de reserva de inventario",
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      anteriores.stock,
    stockReservado:
      reservadoNuevo,
    stockDisponible:
      redondear(
        anteriores.stock -
        reservadoNuevo
      ),
  };
}


/* =========================================
   CONFIRMAR SALIDA POR ENTREGA
========================================= */

export async function confirmarSalidaEntrega({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  entregaId = null,
  entregaCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  if (
    !anteriores.controlInventario
  ) {
    return {
      omitido: true,
      motivo:
        "El producto no controla inventario.",
    };
  }

  if (
    cantidadNumero >
    anteriores.stock
  ) {
    throw new Error(
      `Stock físico insuficiente. Existencia: ${anteriores.stock}.`
    );
  }

  /*
    La salida consume primero la reserva que exista.
    Si por alguna razón no existe reserva suficiente,
    solo libera la parte efectivamente reservada.
  */
  const reservaConsumida =
    Math.min(
      cantidadNumero,
      anteriores.stockReservado
    );

  const stockNuevo =
    redondear(
      anteriores.stock -
      cantidadNumero
    );

  const reservadoNuevo =
    redondear(
      anteriores.stockReservado -
      reservaConsumida
    );

  objetivo.stock =
    stockNuevo;

  objetivo.stockReservado =
    reservadoNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "ENTREGA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Entrega",
      pedidoId,
      pedidoCodigo,
      entregaId,
      entregaCodigo,
      motivo:
        "Salida de inventario por entrega",
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      stockNuevo,
    stockReservado:
      reservadoNuevo,
    stockDisponible:
      redondear(
        stockNuevo -
        reservadoNuevo
      ),
  };
}



/* =========================================
   REVERTIR SALIDA POR ENTREGA
   RESTAURA STOCK FÍSICO Y RESERVA
========================================= */

export async function revertirSalidaEntrega({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  entregaId = null,
  entregaCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });

  const cantidadNumero =
    validarCantidadPositiva(
      cantidad,
      objetivo.tipoVenta
    );

  const anteriores =
    obtenerValoresInventario(
      objetivo
    );

  if (
    !anteriores.controlInventario
  ) {
    return {
      omitido: true,
      motivo:
        "El producto no controla inventario.",
    };
  }

  const stockNuevo =
    redondear(
      anteriores.stock +
      cantidadNumero
    );

  const reservadoNuevo =
    redondear(
      anteriores.stockReservado +
      cantidadNumero
    );

  objetivo.stock =
    stockNuevo;

  objetivo.stockReservado =
    reservadoNuevo;

  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "REVERSION_ENTREGA",
      cantidad:
        cantidadNumero,
      stockAnterior:
        anteriores.stock,
      stockNuevo,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo,
      costoPromedioAnterior:
        anteriores.costoPromedio,
      costoPromedioNuevo:
        anteriores.costoPromedio,
      costoUnitario:
        anteriores.costoPromedio,
      origen:
        "Entrega",
      pedidoId,
      pedidoCodigo,
      entregaId,
      entregaCodigo,
      motivo:
        "Reversión de salida de inventario por entrega",
      observaciones,
      usuarioId,
    });

  const movimientoCreado =
    await guardarOperacion({
      producto,
      objetivo,
      valoresAnteriores:
        anteriores,
      movimiento,
    });

  return {
    producto,
    movimiento:
      movimientoCreado,
    stock:
      stockNuevo,
    stockReservado:
      reservadoNuevo,
    stockDisponible:
      redondear(
        stockNuevo -
        reservadoNuevo
      ),
  };
}


/* =========================================
   REGISTRAR STOCK INICIAL EXISTENTE

   - NO aumenta ni disminuye el stock actual.
   - Crea el movimiento de apertura solo cuando
     ese producto/presentación aún no tiene
     movimientos de inventario.
   - Si hay stock y costoPromedio está en 0, usa
     precioCompra como costo promedio inicial.
   - Es idempotente: se puede ejecutar varias
     veces sin duplicar el movimiento inicial.
========================================= */

export async function registrarStockInicialExistente({
  productoId,
  presentacionId = null,
  usuarioId = null,
  fechaMovimiento = null,
}) {

  const {
    producto,
    objetivo,
    presentacionId:
      presentacionRealId,
  } =
    await obtenerObjetivoInventario({
      productoId,
      presentacionId,
    });


  const anteriores =
    obtenerValoresInventario(
      objetivo
    );


  const costoReferencia =
    anteriores.costoPromedio > 0
      ? anteriores.costoPromedio
      : redondear(
          objetivo?.precioCompra ||
          0
        );


  let costoActualizado =
    false;


  if (
    anteriores.stock > 0 &&
    anteriores.costoPromedio <= 0 &&
    costoReferencia > 0
  ) {

    objetivo.costoPromedio =
      costoReferencia;

    await producto.save();

    costoActualizado =
      true;

  }


  if (
    !anteriores.controlInventario ||
    anteriores.stock <= 0
  ) {

    return {
      producto,
      movimiento: null,
      movimientoCreado: false,
      costoActualizado,
      motivo:
        !anteriores.controlInventario
          ? "El producto no controla inventario."
          : "No hay stock inicial para registrar.",
    };

  }


  const existeMovimiento =
    await MovimientoInventario.exists({
      producto:
        producto._id,

      presentacionId:
        presentacionRealId ||
        null,
    });


  if (existeMovimiento) {

    return {
      producto,
      movimiento: null,
      movimientoCreado: false,
      costoActualizado,
      motivo:
        "El producto o presentación ya tiene historial de inventario.",
    };

  }


  const costoPromedioNuevo =
    costoReferencia > 0
      ? costoReferencia
      : anteriores.costoPromedio;


  const movimiento =
    construirDatosBaseMovimiento({
      producto,
      objetivo,
      presentacionId:
        presentacionRealId,
      tipo:
        "ENTRADA",
      cantidad:
        anteriores.stock,
      stockAnterior:
        0,
      stockNuevo:
        anteriores.stock,
      reservadoAnterior:
        anteriores.stockReservado,
      reservadoNuevo:
        anteriores.stockReservado,
      costoPromedioAnterior:
        0,
      costoPromedioNuevo,
      costoUnitario:
        costoPromedioNuevo,
      origen:
        "Inicial",
      fechaMovimiento,
      motivo:
        presentacionRealId
          ? "Stock inicial de la presentación"
          : "Stock inicial del producto",
      observaciones:
        "Registro de apertura del inventario.",
      usuarioId,
    });


  const movimientoCreado =
    await MovimientoInventario.create(
      movimiento
    );


  return {
    producto,
    movimiento:
      movimientoCreado,
    movimientoCreado: true,
    costoActualizado,
    stock:
      anteriores.stock,
    stockReservado:
      anteriores.stockReservado,
    stockDisponible:
      redondear(
        anteriores.stock -
        anteriores.stockReservado
      ),
    costoPromedio:
      costoPromedioNuevo,
  };
}

