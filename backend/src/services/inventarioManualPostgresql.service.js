import {
  prisma,
} from "../config/postgresql.js";

import {
  validarPeriodoInventarioAbierto,
} from "./cierreInventario.service.js";

/*
  WEBBUYS - INVENTARIO POSTGRESQL-ONLY

  Este servicio reemplaza el puente temporal de inventario.
  No importa modelos Mongoose ni el servicio histórico MongoDB.
*/

function numero(valor, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

function redondear(valor) {
  return Number(numero(valor).toFixed(4));
}

function pareceObjectIdMongo(valor) {
  return /^[a-f\d]{24}$/i.test(String(valor || ""));
}

function valorId(valor) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") {
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

function compatId(registro) {
  return registro?.legacyMongoId || registro?.id || null;
}

function fechaMovimiento(valor) {
  if (!valor) return new Date();

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      throw new Error("La fecha del movimiento no es válida.");
    }
    return valor;
  }

  const texto = String(valor).trim();

  const fecha =
    /^\d{4}-\d{2}-\d{2}$/.test(texto)
      ? new Date(`${texto}T00:00:00.000-05:00`)
      : new Date(texto);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error("La fecha del movimiento no es válida.");
  }

  return fecha;
}

function validarCantidadPositiva(cantidad, tipoVenta = "Unidad") {
  const n = Number(cantidad);

  if (!Number.isFinite(n) || n <= 0) {
    throw new Error("La cantidad debe ser mayor que cero.");
  }

  if (tipoVenta === "Unidad" && !Number.isInteger(n)) {
    throw new Error(
      "La cantidad de un producto por unidad debe ser un número entero."
    );
  }

  return redondear(n);
}

async function resolverCompat(delegate, valor, etiqueta, obligatorio = false) {
  const id = valorId(valor);

  if (!id) {
    if (obligatorio) throw new Error(`${etiqueta} es obligatorio.`);
    return null;
  }

  const row = pareceObjectIdMongo(id)
    ? await delegate.findUnique({ where: { legacyMongoId: id } })
    : await delegate.findUnique({ where: { id } });

  if (!row && obligatorio) {
    throw new Error(`${etiqueta} no existe.`);
  }

  return row;
}

async function resolverObjetivo(tx, productoId, presentacionId = null) {
  const producto = await resolverCompat(
    tx.producto,
    productoId,
    "Producto",
    true
  );

  let presentacion = null;

  if (presentacionId) {
    presentacion = await resolverCompat(
      tx.productoPresentacion,
      presentacionId,
      "Presentación",
      true
    );

    if (presentacion.productoId !== producto.id) {
      throw new Error(
        "La presentación seleccionada no corresponde al producto."
      );
    }
  }

  return {
    producto,
    presentacion,
    objetivo: presentacion || producto,
  };
}

async function resolverRelaciones(tx, {
  usuarioId = null,
  pedidoId = null,
  entregaId = null,
}) {
  const [usuario, pedido, entrega] = await Promise.all([
    resolverCompat(tx.usuario, usuarioId, "Usuario"),
    resolverCompat(tx.pedido, pedidoId, "Pedido"),
    resolverCompat(tx.entrega, entregaId, "Entrega"),
  ]);

  return {
    usuarioId: usuario?.id || null,
    pedidoId: pedido?.id || null,
    entregaId: entrega?.id || null,
  };
}

function salidaProducto(producto) {
  return {
    ...producto,
    _id: compatId(producto),
    postgresId: producto.id,
  };
}

function salidaMovimiento(movimiento) {
  return {
    ...movimiento,
    _id: compatId(movimiento),
    postgresId: movimiento.id,
  };
}

async function ejecutarCambio({
  productoId,
  presentacionId = null,
  tipo,
  cantidad,
  usuarioId = null,
  pedidoId = null,
  pedidoCodigo = "",
  entregaId = null,
  entregaCodigo = "",
  proveedor = "",
  documentoReferencia = "",
  fecha = null,
  motivo = "",
  observaciones = "",
  origen = "Manual",
  calcular,
}) {
  await validarPeriodoInventarioAbierto(
    fecha || new Date()
  );

  return prisma.$transaction(async (tx) => {
    const {
      producto,
      presentacion,
      objetivo,
    } = await resolverObjetivo(
      tx,
      productoId,
      presentacionId
    );

    const relaciones = await resolverRelaciones(tx, {
      usuarioId,
      pedidoId,
      entregaId,
    });

    const anterior = {
      stock: redondear(objetivo.stock),
      stockReservado: redondear(objetivo.stockReservado),
      costoPromedio: redondear(objetivo.costoPromedio),
      controlInventario: objetivo.controlInventario !== false,
      tipoVenta: objetivo.tipoVenta || producto.tipoVenta || "Unidad",
      unidad: objetivo.unidad || producto.unidad || "",
      precioCompra: redondear(objetivo.precioCompra),
    };

    const resultado = await calcular({
      anterior,
      producto,
      presentacion,
      objetivo,
    });

    if (resultado?.omitido || resultado?.sinCambios) {
      return {
        ...resultado,
        producto: salidaProducto(producto),
      };
    }

    const dataInventario = {
      stock: redondear(resultado.stockNuevo),
      stockReservado: redondear(resultado.reservadoNuevo),
      costoPromedio: redondear(resultado.costoPromedioNuevo),
    };

    if (presentacion) {
      await tx.productoPresentacion.update({
        where: { id: presentacion.id },
        data: dataInventario,
      });
    } else {
      await tx.producto.update({
        where: { id: producto.id },
        data: dataInventario,
      });
    }

    const movimiento = await tx.movimientoInventario.create({
      data: {
        productoId: producto.id,
        codigoProducto: producto.codigo || "",
        nombreProducto: producto.nombre || "",
        presentacionId: presentacion?.id || null,
        presentacionNombre: presentacion?.nombre || "",
        tipo,
        cantidad: redondear(cantidad),
        unidad: anterior.unidad,
        tipoVenta: anterior.tipoVenta,
        stockAnterior: anterior.stock,
        stockNuevo: redondear(resultado.stockNuevo),
        reservadoAnterior: anterior.stockReservado,
        reservadoNuevo: redondear(resultado.reservadoNuevo),
        costoUnitario: redondear(resultado.costoUnitario),
        costoPromedioAnterior: anterior.costoPromedio,
        costoPromedioNuevo: redondear(resultado.costoPromedioNuevo),
        valorTotal: redondear(
          numero(cantidad) * numero(resultado.costoUnitario)
        ),
        origen,
        pedidoId: relaciones.pedidoId,
        pedidoCodigo: String(pedidoCodigo || ""),
        entregaId: relaciones.entregaId,
        entregaCodigo: String(entregaCodigo || ""),
        proveedor: String(proveedor || "").trim(),
        documentoReferencia: String(documentoReferencia || "").trim(),
        fechaMovimiento: fechaMovimiento(fecha),
        motivo: String(motivo || "").trim(),
        observaciones: String(observaciones || "").trim(),
        usuarioId: relaciones.usuarioId,
      },
    });

    const actualizado = presentacion
      ? await tx.productoPresentacion.findUnique({
          where: { id: presentacion.id },
        })
      : await tx.producto.findUnique({
          where: { id: producto.id },
        });

    return {
      producto: salidaProducto(producto),
      movimiento: salidaMovimiento(movimiento),
      stock: redondear(actualizado.stock),
      stockReservado: redondear(actualizado.stockReservado),
      stockDisponible: redondear(
        numero(actualizado.stock) -
        numero(actualizado.stockReservado)
      ),
      costoPromedio: redondear(actualizado.costoPromedio),
    };
  });
}

export async function registrarEntrada({
  productoId,
  presentacionId = null,
  cantidad,
  costoUnitario = 0,
  proveedor = "",
  documentoReferencia = "",
  fechaMovimiento: fecha = null,
  motivo = "Entrada de inventario",
  observaciones = "",
  usuarioId = null,
}) {
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "ENTRADA",
    cantidad,
    usuarioId,
    proveedor,
    documentoReferencia,
    fecha,
    motivo,
    observaciones,
    origen: "Manual",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      const costoEntrada = numero(costoUnitario);

      if (costoEntrada < 0) {
        throw new Error(
          "El costo unitario no puede ser negativo."
        );
      }

      const stockNuevo = redondear(
        anterior.stock + cantidadNumero
      );

      const costoBase =
        anterior.costoPromedio > 0
          ? anterior.costoPromedio
          : anterior.precioCompra;

      const costoPromedioNuevo =
        stockNuevo > 0
          ? redondear(
              (
                anterior.stock * costoBase +
                cantidadNumero * costoEntrada
              ) /
              stockNuevo
            )
          : costoEntrada;

      return {
        stockNuevo,
        reservadoNuevo: anterior.stockReservado,
        costoPromedioNuevo,
        costoUnitario: costoEntrada,
      };
    },
  });
}

export async function registrarSalida({
  productoId,
  presentacionId = null,
  cantidad,
  motivo = "Salida de inventario",
  observaciones = "",
  fechaMovimiento: fecha = null,
  usuarioId = null,
}) {
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "SALIDA",
    cantidad,
    usuarioId,
    fecha,
    motivo,
    observaciones,
    origen: "Manual",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      if (!anterior.controlInventario) {
        return {
          omitido: true,
          motivo: "El producto no controla inventario.",
        };
      }

      const disponible = redondear(
        anterior.stock - anterior.stockReservado
      );

      if (cantidadNumero > disponible) {
        throw new Error(
          `Stock disponible insuficiente. Disponible: ${disponible}.`
        );
      }

      return {
        stockNuevo: redondear(
          anterior.stock - cantidadNumero
        ),
        reservadoNuevo: anterior.stockReservado,
        costoPromedioNuevo: anterior.costoPromedio,
        costoUnitario: anterior.costoPromedio,
      };
    },
  });
}

export async function registrarAjuste({
  productoId,
  presentacionId = null,
  stockFisico,
  motivo = "Ajuste de inventario",
  observaciones = "",
  fechaMovimiento: fecha = null,
  usuarioId = null,
}) {
  await validarPeriodoInventarioAbierto(
    fecha || new Date()
  );

  return prisma.$transaction(async (tx) => {
    const {
      producto,
      presentacion,
      objetivo,
    } = await resolverObjetivo(
      tx,
      productoId,
      presentacionId
    );

    const contado = Number(stockFisico);

    if (!Number.isFinite(contado) || contado < 0) {
      throw new Error(
        "El stock físico contado no es válido."
      );
    }

    const tipoVenta =
      objetivo.tipoVenta ||
      producto.tipoVenta ||
      "Unidad";

    if (
      tipoVenta === "Unidad" &&
      !Number.isInteger(contado)
    ) {
      throw new Error(
        "El stock físico de un producto por unidad debe ser entero."
      );
    }

    const anterior = {
      stock: redondear(objetivo.stock),
      stockReservado: redondear(objetivo.stockReservado),
      costoPromedio: redondear(objetivo.costoPromedio),
      unidad: objetivo.unidad || producto.unidad || "",
      tipoVenta,
    };

    const stockNuevo = redondear(contado);

    if (stockNuevo < anterior.stockReservado) {
      throw new Error(
        `El stock físico no puede quedar por debajo del stock reservado (${anterior.stockReservado}).`
      );
    }

    const diferencia = redondear(
      stockNuevo - anterior.stock
    );

    if (diferencia === 0) {
      return {
        sinCambios: true,
        producto: salidaProducto(producto),
        stock: anterior.stock,
        stockReservado: anterior.stockReservado,
        stockDisponible: redondear(
          anterior.stock - anterior.stockReservado
        ),
      };
    }

    const relaciones = await resolverRelaciones(tx, {
      usuarioId,
    });

    if (presentacion) {
      await tx.productoPresentacion.update({
        where: { id: presentacion.id },
        data: { stock: stockNuevo },
      });
    } else {
      await tx.producto.update({
        where: { id: producto.id },
        data: { stock: stockNuevo },
      });
    }

    const movimiento = await tx.movimientoInventario.create({
      data: {
        productoId: producto.id,
        codigoProducto: producto.codigo || "",
        nombreProducto: producto.nombre || "",
        presentacionId: presentacion?.id || null,
        presentacionNombre: presentacion?.nombre || "",
        tipo:
          diferencia > 0
            ? "AJUSTE_POSITIVO"
            : "AJUSTE_NEGATIVO",
        cantidad: Math.abs(diferencia),
        unidad: anterior.unidad,
        tipoVenta: anterior.tipoVenta,
        stockAnterior: anterior.stock,
        stockNuevo,
        reservadoAnterior: anterior.stockReservado,
        reservadoNuevo: anterior.stockReservado,
        costoUnitario: anterior.costoPromedio,
        costoPromedioAnterior: anterior.costoPromedio,
        costoPromedioNuevo: anterior.costoPromedio,
        valorTotal: redondear(
          Math.abs(diferencia) *
          anterior.costoPromedio
        ),
        origen: "Ajuste",
        fechaMovimiento: fechaMovimiento(fecha),
        motivo: String(motivo || "").trim(),
        observaciones: String(observaciones || "").trim(),
        usuarioId: relaciones.usuarioId,
      },
    });

    return {
      producto: salidaProducto(producto),
      movimiento: salidaMovimiento(movimiento),
      stock: stockNuevo,
      stockReservado: anterior.stockReservado,
      stockDisponible: redondear(
        stockNuevo - anterior.stockReservado
      ),
    };
  });
}

export async function reservarStock({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "RESERVA",
    cantidad,
    usuarioId,
    pedidoId,
    pedidoCodigo,
    observaciones,
    origen: "Pedido",
    motivo: "Reserva de inventario por pedido",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      if (!anterior.controlInventario) {
        return {
          omitido: true,
          motivo: "El producto no controla inventario.",
        };
      }

      const disponible = redondear(
        anterior.stock - anterior.stockReservado
      );

      if (cantidadNumero > disponible) {
        throw new Error(
          `Stock disponible insuficiente. Disponible: ${disponible}.`
        );
      }

      return {
        stockNuevo: anterior.stock,
        reservadoNuevo: redondear(
          anterior.stockReservado + cantidadNumero
        ),
        costoPromedioNuevo: anterior.costoPromedio,
        costoUnitario: anterior.costoPromedio,
      };
    },
  });
}

export async function liberarReserva({
  productoId,
  presentacionId = null,
  cantidad,
  pedidoId = null,
  pedidoCodigo = "",
  observaciones = "",
  usuarioId = null,
}) {
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "LIBERACION_RESERVA",
    cantidad,
    usuarioId,
    pedidoId,
    pedidoCodigo,
    observaciones,
    origen: "Pedido",
    motivo: "Liberación de reserva de inventario",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      if (!anterior.controlInventario) {
        return {
          omitido: true,
          motivo: "El producto no controla inventario.",
        };
      }

      if (cantidadNumero > anterior.stockReservado) {
        throw new Error(
          `No se puede liberar ${cantidadNumero}; solo hay ${anterior.stockReservado} reservado.`
        );
      }

      return {
        stockNuevo: anterior.stock,
        reservadoNuevo: redondear(
          anterior.stockReservado - cantidadNumero
        ),
        costoPromedioNuevo: anterior.costoPromedio,
        costoUnitario: anterior.costoPromedio,
      };
    },
  });
}

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
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "ENTREGA",
    cantidad,
    usuarioId,
    pedidoId,
    pedidoCodigo,
    entregaId,
    entregaCodigo,
    observaciones,
    origen: "Entrega",
    motivo: "Salida de inventario por entrega",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      if (!anterior.controlInventario) {
        return {
          omitido: true,
          motivo: "El producto no controla inventario.",
        };
      }

      if (cantidadNumero > anterior.stock) {
        throw new Error(
          `Stock físico insuficiente. Existencia: ${anterior.stock}.`
        );
      }

      const reservaConsumida = Math.min(
        cantidadNumero,
        anterior.stockReservado
      );

      return {
        stockNuevo: redondear(
          anterior.stock - cantidadNumero
        ),
        reservadoNuevo: redondear(
          anterior.stockReservado - reservaConsumida
        ),
        costoPromedioNuevo: anterior.costoPromedio,
        costoUnitario: anterior.costoPromedio,
      };
    },
  });
}

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
  return ejecutarCambio({
    productoId,
    presentacionId,
    tipo: "REVERSION_ENTREGA",
    cantidad,
    usuarioId,
    pedidoId,
    pedidoCodigo,
    entregaId,
    entregaCodigo,
    observaciones,
    origen: "Entrega",
    motivo: "Reversión de salida de inventario por entrega",
    calcular: async ({ anterior }) => {
      const cantidadNumero = validarCantidadPositiva(
        cantidad,
        anterior.tipoVenta
      );

      if (!anterior.controlInventario) {
        return {
          omitido: true,
          motivo: "El producto no controla inventario.",
        };
      }

      return {
        stockNuevo: redondear(
          anterior.stock + cantidadNumero
        ),
        reservadoNuevo: redondear(
          anterior.stockReservado + cantidadNumero
        ),
        costoPromedioNuevo: anterior.costoPromedio,
        costoUnitario: anterior.costoPromedio,
      };
    },
  });
}

export async function sincronizarInventarioPedidoPostgreSQL(
  pedidoId
) {
  const pedido = await resolverCompat(
    prisma.pedido,
    pedidoId,
    "Pedido",
    true
  );

  const movimientos =
    await prisma.movimientoInventario.findMany({
      where: {
        pedidoId: pedido.id,
      },
      select: {
        productoId: true,
        presentacionId: true,
      },
    });

  const referencias =
    new Set(
      movimientos.map(
        (m) =>
          `${m.productoId}:${m.presentacionId || ""}`
      )
    );

  return {
    movimientos: movimientos.length,
    productos: referencias.size,
  };
}
