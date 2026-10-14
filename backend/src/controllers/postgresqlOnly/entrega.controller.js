import {
  prisma, idCompatibilidad, numero, texto, resolverCompat, usuarioIdReq,
  registrarAuditoriaPostgreSQL, responderError, salidaCliente, salidaEmpleado,
  salidaProducto, salidaPresentacion, crearMovimientoInventarioTx, cajaAbierta,
  codigoCartera, sincronizarEntregaDesdePedidoTx
} from "./_transactional.js";

const includeEntrega = {
  pedido: true, cliente: true, zonaDespacho: true, ruta: true,
  empacador: true, repartidor: true, confirmadoPor: true, actualizadoPor: true,
  items: {
    include: {
      producto: { include: { reglasPrecio: { orderBy: [{ desde: "asc" }, { orden: "asc" }] } } },
      presentacion: { include: { reglasPrecio: { orderBy: [{ desde: "asc" }, { orden: "asc" }] } } },
      pedidoItem: true,
    },
    orderBy: { orden: "asc" },
  },
};

function cantidadRealItem(i) {
  if (i.tipoVenta === "Peso") return numero(i.pesoReal);
  return numero(i.cantidadReal ?? i.cantidadSolicitada);
}

function reglasPrecioItem(i) {
  const reglas = i.presentacion?.reglasPrecio || i.producto?.reglasPrecio || [];
  return reglas.map((r) => ({
    desde: numero(r.desde),
    precio: numero(r.precio),
  }));
}

function salidaItem(i) {
  const precioNormal = numero(i.presentacion?.precioVenta ?? i.producto?.precioVenta);
  const reglasPrecio = reglasPrecioItem(i);
  const peso = i.pesoReal === null ? null : numero(i.pesoReal);
  let reglaAplicadaDesde = null;
  if (i.tipoVenta === "Peso" && peso !== null) {
    for (const regla of reglasPrecio) {
      if (peso >= regla.desde) reglaAplicadaDesde = regla.desde;
    }
  }

  return {
    _id: idCompatibilidad(i), id: idCompatibilidad(i), postgresId: i.id,
    pedidoItemId: i.pedidoItemId ? idCompatibilidad(i.pedidoItem || { id: i.pedidoItemId }) : null,
    producto: salidaProducto(i.producto), presentacion: salidaPresentacion(i.presentacion),
    codigoProducto: i.codigoProducto, nombre: i.nombre, presentacionNombre: i.presentacionNombre,
    tipoVenta: i.tipoVenta, unidad: i.unidad, cantidadSolicitada: i.cantidadSolicitada,
    cantidadReal: i.cantidadReal === null ? null : numero(i.cantidadReal),
    precioNormal, precioUnitario: numero(i.precioUnitario), reglasPrecio, reglaAplicadaDesde,
    pesoReal: peso, subtotal: numero(i.subtotal), origen: i.origen || "Pedido",
  };
}

function salidaEntrega(e) {
  if (!e) return null;
  return {
    _id: idCompatibilidad(e), id: idCompatibilidad(e), postgresId: e.id, legacyMongoId: e.legacyMongoId || null,
    pedido: e.pedido ? { _id: idCompatibilidad(e.pedido), id: idCompatibilidad(e.pedido), postgresId: e.pedido.id, codigo: e.pedido.codigo, estado: e.pedido.estado } : null,
    pedidoCodigo: e.pedidoCodigo, cliente: salidaCliente(e.cliente), clienteCodigo: e.clienteCodigo, clienteNombre: e.clienteNombre,
    clienteTelefono: e.clienteTelefono, clienteDireccion: e.clienteDireccion, clienteBarrio: e.clienteBarrio, clienteCiudad: e.clienteCiudad,
    zonaDespacho: e.zonaDespacho ? { _id: idCompatibilidad(e.zonaDespacho), id: idCompatibilidad(e.zonaDespacho), postgresId: e.zonaDespacho.id, codigo: e.zonaDespacho.codigo, nombre: e.zonaDespacho.nombre } : null,
    zonaDespachoNombre: e.zonaDespachoNombre || e.zonaDespacho?.nombre || e.pedido?.zonaDespachoNombre || "",
    zonaDespachoCodigo: e.zonaDespacho?.codigo || e.pedido?.zonaDespachoCodigo || "",
    ruta: e.ruta ? { _id: idCompatibilidad(e.ruta), id: idCompatibilidad(e.ruta), postgresId: e.ruta.id, codigo: e.ruta.codigo, nombre: e.ruta.nombre, diasAtencion: e.ruta.diasAtencion } : null,
    rutaNombre: e.rutaNombre || e.ruta?.nombre || e.pedido?.rutaNombre || "",
    rutaDiasAtencion: (e.rutaDiasAtencion?.length ? e.rutaDiasAtencion : (e.ruta?.diasAtencion || e.pedido?.rutaDiasAtencion || [])),
    fechaProgramada: e.fechaProgramada,
    empacador: salidaEmpleado(e.empacador), repartidor: salidaEmpleado(e.repartidor),
    items: (e.items || []).map(salidaItem), subtotal: numero(e.subtotal), descuento: numero(e.descuento), total: numero(e.total),
    metodoPago: e.metodoPago, confirmada: e.confirmada, preparacionGuardada: e.preparacionGuardada,
    inventarioPesoReservado: e.inventarioPesoReservado, inventarioDescontado: e.inventarioDescontado,
    estado: e.estado, motivoCancelacion: e.motivoCancelacion, motivoNoEntrega: e.motivoNoEntrega,
    observaciones: e.observaciones, fechaSalida: e.fechaSalida, fechaEntregaReal: e.fechaEntregaReal,
    fechaPreparacion: e.fechaPreparacion, fechaConfirmacion: e.fechaConfirmacion,
    fechaReservaInventario: e.fechaReservaInventario, fechaSalidaInventario: e.fechaSalidaInventario,
    createdAt: e.createdAt, updatedAt: e.updatedAt,
  };
}

async function getEntrega(id) {
  return resolverCompat(prisma.entrega, id, true, "Entrega").then(async (e) =>
    prisma.entrega.findUnique({ where: { id: e.id }, include: includeEntrega })
  );
}

async function fuenteActualTx(tx, item) {
  const producto = await tx.producto.findUnique({ where: { id: item.productoId } });
  if (!producto) throw new Error(`No existe el producto ${item.nombre}.`);
  let presentacion = null;
  if (item.presentacionId) {
    presentacion = await tx.productoPresentacion.findUnique({ where: { id: item.presentacionId } });
    if (!presentacion) throw new Error(`No existe la presentación de ${item.nombre}.`);
  }
  return { producto, presentacion, fuente: presentacion || producto };
}

async function liberarReservaOriginalUnidadPedidoTx(tx, pedido, usuarioId, entrega = null) {
  const items = await tx.pedidoItem.findMany({
    where: { pedidoId: pedido.id, tipoVenta: { not: "Peso" } },
    include: { producto: true, presentacion: true },
  });

  for (const item of items) {
    const fuente = item.presentacion || item.producto;
    if (fuente.controlInventario === false) continue;
    const cantidad = numero(item.cantidad);
    if (cantidad <= 0) continue;

    const actual = item.presentacion
      ? await tx.productoPresentacion.findUnique({ where: { id: item.presentacion.id } })
      : await tx.producto.findUnique({ where: { id: item.producto.id } });

    const reservado = numero(actual.stockReservado);
    const nuevoReservado = Math.max(0, reservado - cantidad);

    if (item.presentacion) {
      await tx.productoPresentacion.update({ where: { id: item.presentacion.id }, data: { stockReservado: nuevoReservado } });
    } else {
      await tx.producto.update({ where: { id: item.producto.id }, data: { stockReservado: nuevoReservado } });
    }

    await crearMovimientoInventarioTx(tx, {
      producto: item.producto, presentacion: item.presentacion, tipo: "Liberación",
      cantidad, stockAnterior: numero(actual.stock), stockNuevo: numero(actual.stock),
      reservadoAnterior: reservado, reservadoNuevo: nuevoReservado,
      pedido, entrega, usuarioId, motivo: "Liberación de reserva original para editar/confirmar entrega",
    });
  }
}

async function reservarInventarioEntregaTx(tx, e, uid) {
  for (const item of e.items) {
    const cantidad = cantidadRealItem(item);
    if (cantidad <= 0) throw new Error(`Debe indicar una cantidad válida para ${item.nombre}.`);

    const { producto, presentacion, fuente } = await fuenteActualTx(tx, item);
    if (fuente.controlInventario === false) continue;

    const stock = numero(fuente.stock);
    const reservado = numero(fuente.stockReservado);

    if (stock - reservado < cantidad) {
      throw new Error(`Stock insuficiente para ${item.nombre}. Disponible: ${Math.max(0, stock - reservado)}.`);
    }

    const nuevoReservado = reservado + cantidad;

    if (presentacion) {
      await tx.productoPresentacion.update({ where: { id: presentacion.id }, data: { stockReservado: nuevoReservado } });
    } else {
      await tx.producto.update({ where: { id: producto.id }, data: { stockReservado: nuevoReservado } });
    }

    await crearMovimientoInventarioTx(tx, {
      producto, presentacion, tipo: "Reserva",
      cantidad, stockAnterior: stock, stockNuevo: stock,
      reservadoAnterior: reservado, reservadoNuevo: nuevoReservado,
      pedido: e.pedido, entrega: e, usuarioId: uid,
      motivo: "Reserva de inventario al confirmar entrega",
    });
  }
}

async function liberarInventarioEntregaTx(tx, e, uid, motivo = "Liberación de reserva de entrega") {
  for (const item of e.items) {
    const cantidad = cantidadRealItem(item);
    if (cantidad <= 0) continue;

    const { producto, presentacion, fuente } = await fuenteActualTx(tx, item);
    if (fuente.controlInventario === false) continue;

    const reservado = numero(fuente.stockReservado);
    const nuevoReservado = Math.max(0, reservado - cantidad);

    if (presentacion) {
      await tx.productoPresentacion.update({ where: { id: presentacion.id }, data: { stockReservado: nuevoReservado } });
    } else {
      await tx.producto.update({ where: { id: producto.id }, data: { stockReservado: nuevoReservado } });
    }

    await crearMovimientoInventarioTx(tx, {
      producto, presentacion, tipo: "Liberación",
      cantidad, stockAnterior: numero(fuente.stock), stockNuevo: numero(fuente.stock),
      reservadoAnterior: reservado, reservadoNuevo: nuevoReservado,
      pedido: e.pedido, entrega: e, usuarioId: uid, motivo,
    });
  }
}

async function descontarInventarioTx(tx, e, uid) {
  for (const item of e.items) {
    const cantidad = cantidadRealItem(item);
    const { producto, presentacion, fuente } = await fuenteActualTx(tx, item);
    if (fuente.controlInventario === false) continue;

    const stock = numero(fuente.stock);
    const reservado = numero(fuente.stockReservado);
    if (stock < cantidad) throw new Error(`Stock insuficiente para finalizar ${item.nombre}.`);

    const nuevoStock = stock - cantidad;
    const nuevoReservado = Math.max(0, reservado - cantidad);

    if (presentacion) {
      await tx.productoPresentacion.update({
        where: { id: presentacion.id },
        data: { stock: nuevoStock, stockReservado: nuevoReservado },
      });
    } else {
      await tx.producto.update({
        where: { id: producto.id },
        data: { stock: nuevoStock, stockReservado: nuevoReservado },
      });
    }

    await crearMovimientoInventarioTx(tx, {
      producto, presentacion, tipo: "Salida",
      cantidad, stockAnterior: stock, stockNuevo: nuevoStock,
      reservadoAnterior: reservado, reservadoNuevo: nuevoReservado,
      pedido: e.pedido, entrega: e, usuarioId: uid, motivo: "Salida por entrega finalizada",
    });
  }
}

async function devolverInventarioEntregadoTx(tx, e, uid) {
  for (const item of e.items) {
    const cantidad = cantidadRealItem(item);
    if (cantidad <= 0) continue;

    const { producto, presentacion, fuente } = await fuenteActualTx(tx, item);
    if (fuente.controlInventario === false) continue;

    const stock = numero(fuente.stock);
    const reservado = numero(fuente.stockReservado);
    const nuevoStock = stock + cantidad;

    if (presentacion) {
      await tx.productoPresentacion.update({ where: { id: presentacion.id }, data: { stock: nuevoStock } });
    } else {
      await tx.producto.update({ where: { id: producto.id }, data: { stock: nuevoStock } });
    }

    await crearMovimientoInventarioTx(tx, {
      producto, presentacion, tipo: "Reversión",
      cantidad, stockAnterior: stock, stockNuevo: nuevoStock,
      reservadoAnterior: reservado, reservadoNuevo: reservado,
      pedido: e.pedido, entrega: e, usuarioId: uid,
      motivo: "Reversión de entrega finalizada",
    });
  }
}

async function precioPesoSegunReglaTx(tx, item, pesoReal) {
  const { producto, presentacion, fuente } = await fuenteActualTx(tx, item);
  const reglas = await tx.reglaPrecio.findMany({
    where: presentacion ? { presentacionId: presentacion.id } : { productoId: producto.id },
    orderBy: [{ desde: "asc" }, { orden: "asc" }],
  });

  let precio = numero(fuente.precioVenta);
  let reglaDesde = null;
  for (const regla of reglas) {
    if (numero(pesoReal) >= numero(regla.desde)) {
      precio = numero(regla.precio);
      reglaDesde = numero(regla.desde);
    }
  }
  return { precio, reglaDesde, producto, presentacion, fuente };
}

async function ajustarReservaPesoTx(tx, item, pesoAnterior, pesoNuevo, e, uid) {
  const anterior = numero(pesoAnterior);
  const nuevo = numero(pesoNuevo);
  const diferencia = Number((nuevo - anterior).toFixed(4));
  if (Math.abs(diferencia) < 0.00005) return;

  const { producto, presentacion } = await fuenteActualTx(tx, item);
  const actual = presentacion
    ? await tx.productoPresentacion.findUnique({ where: { id: presentacion.id } })
    : await tx.producto.findUnique({ where: { id: producto.id } });

  if (actual.controlInventario === false) return;

  const stock = numero(actual.stock);
  const reservado = numero(actual.stockReservado);

  if (diferencia > 0 && stock - reservado < diferencia) {
    throw new Error(`Stock insuficiente para aumentar el peso de ${item.nombre}. Disponible: ${Math.max(0, stock - reservado)}.`);
  }

  const nuevoReservado = Math.max(0, Number((reservado + diferencia).toFixed(4)));

  if (presentacion) {
    await tx.productoPresentacion.update({ where: { id: presentacion.id }, data: { stockReservado: nuevoReservado } });
  } else {
    await tx.producto.update({ where: { id: producto.id }, data: { stockReservado: nuevoReservado } });
  }

  await crearMovimientoInventarioTx(tx, {
    producto,
    presentacion,
    tipo: diferencia > 0 ? "Reserva" : "Liberación",
    cantidad: Math.abs(diferencia),
    stockAnterior: stock,
    stockNuevo: stock,
    reservadoAnterior: reservado,
    reservadoNuevo: nuevoReservado,
    pedido: e.pedido,
    entrega: e,
    usuarioId: uid,
    motivo: diferencia > 0
      ? "Ajuste de reserva por cambio de peso real"
      : "Liberación por reducción de peso real",
  });
}

export const listarEntregas = async (_req, res) => {
  try {
    const rows = await prisma.entrega.findMany({
      include: includeEntrega,
      orderBy: [{ createdAt: "desc" }],
    });
    return res.json(rows.map(salidaEntrega));
  } catch (e) { return responderError(res, e, "No fue posible cargar las entregas."); }
};

export const obtenerEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    return res.json(salidaEntrega(e));
  } catch (e) { return responderError(res, e, "No fue posible consultar la entrega."); }
};

export const actualizarPreparacionEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);

    if (["Entregado", "Cancelado"].includes(e.estado)) {
      return res.status(400).json({ mensaje: "Una entrega finalizada no puede modificarse directamente. Primero debe revertirse." });
    }
    if (!["Por preparar", "Pendiente", "En ruta"].includes(e.estado)) {
      return res.status(409).json({ mensaje: "El estado actual de la entrega no permite modificar sus datos operativos." });
    }
    if (e.estado === "Por preparar" && e.pedido?.estado !== "Listo para entrega") {
      return res.status(409).json({ mensaje: "El pedido está en edición. Finalice los cambios en Pedidos y vuelva a marcarlo como Listo para entrega." });
    }

    const repartidor = req.body?.repartidor
      ? await resolverCompat(prisma.empleado, req.body.repartidor, true, "Repartidor")
      : null;
    if (repartidor && repartidor.estado !== "Activo") throw new Error("El repartidor seleccionado no está activo.");

    const metodoPago = texto(req.body?.metodoPago);
    if (metodoPago && !["Efectivo", "Transferencia", "Crédito"].includes(metodoPago)) {
      throw new Error("El tipo de pago seleccionado no es válido.");
    }
    if (e.confirmada && !repartidor) {
      return res.status(400).json({ mensaje: "La entrega confirmada debe conservar un repartidor." });
    }
    if (e.confirmada && !metodoPago) {
      return res.status(400).json({ mensaje: "La entrega confirmada debe conservar un tipo de pago." });
    }

    const itemsEntrada = Array.isArray(req.body?.items) ? req.body.items : [];
    const mapaEntrada = new Map(
      itemsEntrada
        .map((x) => [String(x?.itemId || x?._id || x?.id || ""), x])
        .filter(([id]) => id)
    );

    const idsValidos = new Set(e.items.map((it) => String(it.id)));
    for (const id of mapaEntrada.keys()) {
      if (!idsValidos.has(id) && !e.items.some((it) => String(idCompatibilidad(it)) === id)) {
        return res.status(400).json({ mensaje: "Los productos y cantidades deben modificarse desde el módulo Pedidos." });
      }
    }

    const uid = await usuarioIdReq(req);

    const updated = await prisma.$transaction(async (tx) => {
      const actual = await tx.entrega.findUnique({ where: { id: e.id }, include: includeEntrega });

      for (const item of actual.items) {
        if (item.tipoVenta !== "Peso") {
          const cantidad = numero(item.cantidadSolicitada);
          await tx.entregaItem.update({
            where: { id: item.id },
            data: {
              cantidadReal: cantidad,
              pesoReal: null,
              subtotal: Number((cantidad * numero(item.precioUnitario)).toFixed(2)),
              origen: "Pedido",
            },
          });
          continue;
        }

        const entrada = mapaEntrada.get(String(item.id)) || mapaEntrada.get(String(idCompatibilidad(item))) || {};
        const pesoNuevo = entrada.pesoReal === "" || entrada.pesoReal == null ? null : Number(entrada.pesoReal);

        if (pesoNuevo !== null && (!Number.isFinite(pesoNuevo) || pesoNuevo <= 0)) {
          throw new Error(`Debe registrar un peso válido para ${item.nombre}.`);
        }
        if (actual.confirmada && (pesoNuevo === null || pesoNuevo <= 0)) {
          throw new Error(`La entrega ya está confirmada y debe conservar un peso real válido para ${item.nombre}.`);
        }

        const pesoAnterior = item.pesoReal === null ? 0 : numero(item.pesoReal);
        const precioInfo = await precioPesoSegunReglaTx(tx, item, pesoNuevo || 0);

        if (actual.confirmada && actual.inventarioPesoReservado) {
          await ajustarReservaPesoTx(tx, item, pesoAnterior, pesoNuevo || 0, actual, uid);
        }

        await tx.entregaItem.update({
          where: { id: item.id },
          data: {
            cantidadReal: null,
            pesoReal: pesoNuevo,
            precioUnitario: precioInfo.precio,
            subtotal: Number(((pesoNuevo || 0) * precioInfo.precio).toFixed(2)),
            origen: "Pedido",
          },
        });
      }

      const itemsActuales = await tx.entregaItem.findMany({ where: { entregaId: actual.id } });
      const subtotal = Number(itemsActuales.reduce((suma, item) => suma + numero(item.subtotal), 0).toFixed(2));
      const total = Number(Math.max(0, subtotal - numero(actual.descuento)).toFixed(2));

      await tx.entrega.update({
        where: { id: actual.id },
        data: {
          repartidorId: repartidor?.id || null,
          metodoPago,
          observaciones: texto(req.body?.observaciones),
          subtotal,
          total,
          preparacionGuardada: true,
          fechaPreparacion: actual.fechaPreparacion || new Date(),
          actualizadoPorId: uid,
        },
      });

      return tx.entrega.findUnique({ where: { id: actual.id }, include: includeEntrega });
    });

    await registrarAuditoriaPostgreSQL({
      req,
      modulo: "Entregas",
      accion: updated.confirmada ? "ACTUALIZAR_DATOS_OPERATIVOS" : "PREPARAR",
      registroId: updated.id,
      codigoRegistro: updated.pedidoCodigo,
      descripcion: `Se actualizaron repartidor, tipo de pago y/o peso real de ${updated.pedidoCodigo}.`,
      datosNuevos: salidaEntrega(updated),
    });

    return res.json({
      mensaje: updated.confirmada
        ? "Datos de entrega actualizados correctamente."
        : "Preparación guardada. Ya puede confirmar la entrega.",
      entrega: salidaEntrega(updated),
    });
  } catch (e) { return responderError(res, e, "No fue posible actualizar la entrega."); }
};

export const cambiarMetodoPagoEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    if (["Entregado","Cancelado"].includes(e.estado)) {
      return res.status(400).json({ mensaje: "Una entrega finalizada no puede cambiar el tipo de pago directamente. Primero debe revertirse." });
    }
    const metodoPago = texto(req.body?.metodoPago);
    if (!["Efectivo","Transferencia","Crédito"].includes(metodoPago)) {
      return res.status(400).json({ mensaje: "El tipo de pago seleccionado no es válido." });
    }
    const uid = await usuarioIdReq(req);
    const anterior = e.metodoPago || "";
    await prisma.entrega.update({
      where: { id: e.id },
      data: { metodoPago, actualizadoPorId: uid },
    });
    const out = await getEntrega(e.id);
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Entregas", accion: "CAMBIAR_PAGO", registroId: out.id,
      codigoRegistro: out.pedidoCodigo,
      descripcion: `Entrega ${out.pedidoCodigo}: tipo de pago cambió de ${anterior || "Sin definir"} a ${metodoPago}.`,
    });
    return res.json({ mensaje: "Tipo de pago actualizado correctamente.", entrega: salidaEntrega(out) });
  } catch (e) { return responderError(res, e, "No fue posible cambiar el tipo de pago."); }
};

export const reabrirPreparacionEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    if (!e.confirmada || !["Pendiente", "En ruta"].includes(e.estado)) {
      return res.status(400).json({ mensaje: "Solo puede revertirse para edición un pedido cuya entrega esté Pendiente o En ruta." });
    }

    const uid = await usuarioIdReq(req);
    await prisma.$transaction(async (tx) => {
      await liberarInventarioEntregaTx(tx, e, uid, "Liberación para editar nuevamente el pedido");

      await tx.pedido.update({
        where: { id: e.pedidoId },
        data: { estado: "Borrador", inventarioReservado: false, fechaReservaInventario: null },
      });

      await tx.entrega.update({
        where: { id: e.id },
        data: {
          confirmada: false,
          preparacionGuardada: false,
          inventarioPesoReservado: false,
          inventarioDescontado: false,
          estado: "Por preparar",
          fechaPreparacion: null,
          fechaConfirmacion: null,
          fechaReservaInventario: null,
          fechaSalidaInventario: null,
          fechaSalida: null,
          confirmadoPorId: null,
          actualizadoPorId: uid,
        },
      });

      await sincronizarEntregaDesdePedidoTx(tx, e.pedidoId);
    });

    const out = await getEntrega(e.id);
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Entregas", accion: "REVERTIR_PARA_EDITAR_PEDIDO", registroId: out.id,
      codigoRegistro: out.pedidoCodigo,
      descripcion: `Se revirtió la preparación de ${out.pedidoCodigo}. El pedido volvió a Borrador para editar cliente, productos o cantidades desde Pedidos.`,
    });
    return res.json({
      mensaje: "Pedido devuelto a Borrador. Modifique cliente, productos o cantidades desde Pedidos; la entrega se sincronizará al guardar.",
      entrega: salidaEntrega(out),
      pedidoEstado: "Borrador",
    });
  } catch (e) { return responderError(res, e, "No fue posible devolver el pedido a edición."); }
};

export const confirmarEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    if (e.confirmada) return res.status(400).json({ mensaje: "Esta entrega ya fue confirmada." });
    if (e.estado !== "Por preparar") return res.status(400).json({ mensaje: "La entrega debe estar Por preparar para confirmarse." });
    if (!e.preparacionGuardada) return res.status(400).json({ mensaje: "Primero debe guardar la preparación de la entrega." });
    if (!e.repartidorId) return res.status(400).json({ mensaje: "Debe seleccionar un repartidor antes de confirmar." });
    if (!e.metodoPago) return res.status(400).json({ mensaje: "Debe seleccionar el tipo de pago antes de confirmar." });

    for (const item of e.items) {
      if (item.tipoVenta === "Peso" && cantidadRealItem(item) <= 0) {
        return res.status(400).json({ mensaje: `Debe registrar el peso real de ${item.nombre}.` });
      }
      if (item.tipoVenta !== "Peso" && cantidadRealItem(item) <= 0) {
        return res.status(400).json({ mensaje: `Debe registrar la cantidad real de ${item.nombre}.` });
      }
    }

    const uid = await usuarioIdReq(req);

    await prisma.$transaction(async (tx) => {
      // Los pedidos recién pasados a "Listo para entrega" conservan la reserva
      // original por unidad. Se libera y se vuelve a reservar según lo realmente
      // preparado, incluyendo productos agregados o cantidades modificadas.
      if (e.pedido?.inventarioReservado && !e.inventarioPesoReservado) {
        await liberarReservaOriginalUnidadPedidoTx(tx, e.pedido, uid, e);
        await tx.pedido.update({
          where: { id: e.pedidoId },
          data: { inventarioReservado: false, fechaReservaInventario: null },
        });
      }

      const fresca = await tx.entrega.findUnique({
        where: { id: e.id },
        include: includeEntrega,
      });

      await reservarInventarioEntregaTx(tx, fresca, uid);

      await tx.pedido.update({
        where: { id: e.pedidoId },
        data: { estado: "Listo para entrega", inventarioReservado: true, fechaReservaInventario: new Date() },
      });

      await tx.entrega.update({
        where: { id: e.id },
        data: {
          confirmada: true,
          inventarioPesoReservado: true,
          fechaReservaInventario: new Date(),
          fechaConfirmacion: new Date(),
          confirmadoPorId: uid,
          estado: "Pendiente",
          actualizadoPorId: uid,
        },
      });
    });

    const out = await getEntrega(e.id);
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Entregas", accion: "CONFIRMAR", registroId: out.id,
      codigoRegistro: out.pedidoCodigo, descripcion: `Se confirmó la entrega ${out.pedidoCodigo}.`,
    });
    return res.json({ mensaje: "Entrega confirmada correctamente. Ahora está Pendiente.", entrega: salidaEntrega(out) });
  } catch (e) { return responderError(res, e, "No fue posible confirmar la entrega."); }
};

export const cambiarEstadoEntrega = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    if (!e.confirmada) return res.status(400).json({ mensaje: "Primero debe confirmar la entrega antes de cambiar su estado." });
    if (["Entregado","Cancelado"].includes(e.estado)) return res.status(400).json({ mensaje: "Una entrega finalizada no puede cambiar nuevamente de estado." });

    const estado = texto(req.body?.estado);
    if (!["Pendiente","En ruta","Entregado","Cancelado"].includes(estado)) {
      return res.status(400).json({ mensaje: "El estado indicado no es válido." });
    }
    if (estado === e.estado) return res.json({ mensaje: "La entrega ya se encuentra en ese estado.", entrega: salidaEntrega(e) });
    if (estado === "Cancelado" && !texto(req.body?.motivoCancelacion)) {
      return res.status(400).json({ mensaje: "Debe indicar el motivo de cancelación." });
    }

    const uid = await usuarioIdReq(req);

    if (estado === "Entregado" && ["Efectivo","Transferencia"].includes(e.metodoPago)) {
      const caja = await cajaAbierta();
      if (!caja) return res.status(400).json({ mensaje: "Debe abrir la caja antes de finalizar una entrega pagada." });
    }

    await prisma.$transaction(async (tx) => {
      if (estado === "Entregado") {
        await descontarInventarioTx(tx, e, uid);

        if (["Efectivo","Transferencia"].includes(e.metodoPago)) {
          const caja = await tx.caja.findFirst({ where: { estado: "Abierta" }, orderBy: { fechaApertura: "desc" } });
          await tx.movimientoCaja.upsert({
            where: { claveUnica: `PEDIDO:${e.pedidoId}` },
            update: {
              cajaId: caja.id, tipo: "Ingreso", origen: "Pedido", concepto: `Entrega finalizada - ${e.pedidoCodigo}`,
              valor: numero(e.total), pedidoId: e.pedidoId, pedidoCodigo: e.pedidoCodigo, entregaId: e.id, entregaCodigo: e.pedidoCodigo,
              clienteId: e.clienteId, clienteNombre: e.clienteNombre, metodoPago: e.metodoPago,
              afectaEfectivo: e.metodoPago === "Efectivo", usuarioId: uid, estado: "Activo",
            },
            create: {
              cajaId: caja.id, tipo: "Ingreso", origen: "Pedido", concepto: `Entrega finalizada - ${e.pedidoCodigo}`,
              valor: numero(e.total), pedidoId: e.pedidoId, pedidoCodigo: e.pedidoCodigo, entregaId: e.id, entregaCodigo: e.pedidoCodigo,
              clienteId: e.clienteId, clienteNombre: e.clienteNombre, metodoPago: e.metodoPago,
              afectaEfectivo: e.metodoPago === "Efectivo", claveUnica: `PEDIDO:${e.pedidoId}`, usuarioId: uid, estado: "Activo",
            },
          });
        } else if (e.metodoPago === "Crédito") {
          const codigo = codigoCartera(e.pedidoCodigo);
          await tx.cartera.upsert({
            where: { entregaId: e.id },
            update: {
              pedidoId: e.pedidoId, pedidoCodigo: e.pedidoCodigo, clienteId: e.clienteId, clienteCodigo: e.clienteCodigo,
              clienteNombre: e.clienteNombre || "Cliente", clienteTelefono: e.clienteTelefono || "",
              fechaEntrega: new Date(), valorOriginal: numero(e.total), totalAbonado: 0, saldoPendiente: numero(e.total),
              metodoPagoOriginal: "Crédito", estado: "Pendiente", actualizadoPorId: uid,
            },
            create: {
              codigo, entregaId: e.id, pedidoId: e.pedidoId, pedidoCodigo: e.pedidoCodigo, clienteId: e.clienteId,
              clienteCodigo: e.clienteCodigo, clienteNombre: e.clienteNombre || "Cliente",
              clienteDocumento: e.cliente?.documento || "", clienteTelefono: e.clienteTelefono || "",
              fechaEntrega: new Date(), valorOriginal: numero(e.total), totalAbonado: 0, saldoPendiente: numero(e.total),
              metodoPagoOriginal: "Crédito", estado: "Pendiente", observaciones: e.observaciones || "",
              creadoPorId: uid, actualizadoPorId: uid,
            },
          });
        }

        await tx.pedido.update({
          where: { id: e.pedidoId },
          data: { estado: "Entregado", inventarioReservado: false, fechaReservaInventario: null },
        });
        await tx.entrega.update({
          where: { id: e.id },
          data: {
            estado, inventarioDescontado: true, inventarioPesoReservado: false,
            fechaEntregaReal: new Date(), fechaSalidaInventario: new Date(), actualizadoPorId: uid,
          },
        });
      } else if (estado === "Cancelado") {
        await liberarInventarioEntregaTx(tx, e, uid, "Liberación por cancelación de entrega");
        await tx.pedido.update({
          where: { id: e.pedidoId },
          data: { estado: "Cancelado", inventarioReservado: false, fechaReservaInventario: null },
        });
        await tx.entrega.update({
          where: { id: e.id },
          data: {
            estado, motivoCancelacion: texto(req.body?.motivoCancelacion),
            inventarioPesoReservado: false, actualizadoPorId: uid,
          },
        });
      } else {
        await tx.entrega.update({
          where: { id: e.id },
          data: {
            estado,
            fechaSalida: estado === "En ruta" ? new Date() : e.fechaSalida,
            actualizadoPorId: uid,
          },
        });
      }
    });

    const out = await getEntrega(e.id);
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Entregas", accion: "ESTADO", registroId: out.id,
      codigoRegistro: out.pedidoCodigo, descripcion: `Entrega ${out.pedidoCodigo} cambió a ${estado}.`,
    });
    return res.json({ mensaje: "Estado de entrega actualizado correctamente.", entrega: salidaEntrega(out) });
  } catch (e) { return responderError(res, e, "No fue posible cambiar el estado de la entrega."); }
};

export const revertirEntregaFinalizada = async (req, res) => {
  try {
    const e = await getEntrega(req.params?.id);
    if (e.estado !== "Entregado") {
      return res.status(400).json({ mensaje: "Solo se puede revertir una entrega que esté Entregada." });
    }

    const motivo = texto(req.body?.motivo);
    if (motivo.length < 5) {
      return res.status(400).json({ mensaje: "Debe indicar un motivo de reversión de al menos 5 caracteres." });
    }

    const facturas = await prisma.factura.findMany({
      where: { entregaId: e.id },
      select: { codigo: true, estado: true, fechaReversion: true },
    });
    const facturaBloqueante = facturas.find((f) => !(f.estado === "Anulada" && Boolean(f.fechaReversion)));
    if (facturaBloqueante) {
      return res.status(409).json({
        mensaje: `La entrega tiene la factura ${facturaBloqueante.codigo}. Debe anularla y revertirla primero en Facturación.`,
      });
    }

    const cartera = await prisma.cartera.findUnique({
      where: { entregaId: e.id },
      include: { pagos: true },
    });
    if (cartera?.pagos?.length) {
      return res.status(409).json({
        mensaje: `La entrega tiene movimientos en Cartera (${cartera.codigo}). Debe revertir esos pagos antes de revertir la entrega.`,
      });
    }

    const movCaja = await prisma.movimientoCaja.findFirst({
      where: { entregaId: e.id, origen: "Pedido", estado: "Activo" },
      include: { caja: true },
      orderBy: { createdAt: "desc" },
    });
    if (movCaja?.caja?.estado === "Cerrada") {
      return res.status(409).json({
        mensaje: `La venta pertenece a la caja cerrada ${movCaja.caja.codigo}. Debe revertir el cierre de esa caja primero.`,
      });
    }

    const uid = await usuarioIdReq(req);

    await prisma.$transaction(async (tx) => {
      await devolverInventarioEntregadoTx(tx, e, uid);

      if (movCaja) {
        await tx.movimientoCaja.update({
          where: { id: movCaja.id },
          data: {
            estado: "Anulado",
            observacion: `Movimiento anulado por reversión de entrega. Motivo: ${motivo}`,
            usuarioId: uid,
          },
        });
      }

      if (cartera) {
        await tx.cartera.delete({ where: { id: cartera.id } });
      }

      await tx.pedido.update({
        where: { id: e.pedidoId },
        data: { estado: "Borrador", inventarioReservado: false, fechaReservaInventario: null },
      });

      await tx.entrega.update({
        where: { id: e.id },
        data: {
          estado: "Por preparar",
          confirmada: false,
          preparacionGuardada: false,
          inventarioPesoReservado: false,
          inventarioDescontado: false,
          fechaReservaInventario: null,
          fechaSalidaInventario: null,
          fechaPreparacion: null,
          fechaConfirmacion: null,
          fechaSalida: null,
          fechaEntregaReal: null,
          confirmadoPorId: null,
          motivoNoEntrega: "",
          actualizadoPorId: uid,
        },
      });

      await sincronizarEntregaDesdePedidoTx(tx, e.pedidoId);
    });

    const out = await getEntrega(e.id);
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Entregas", accion: "REVERTIR_ENTREGA", registroId: out.id,
      codigoRegistro: out.pedidoCodigo,
      descripcion: `Se revirtió la entrega finalizada ${out.pedidoCodigo}. Motivo: ${motivo}`,
      datosAnteriores: salidaEntrega(e),
      datosNuevos: salidaEntrega(out),
    });

    return res.json({
      mensaje: "Entrega revertida. El pedido volvió a Borrador para editar cliente, productos o cantidades desde Pedidos.",
      entrega: salidaEntrega(out),
    });
  } catch (e) { return responderError(res, e, "No fue posible revertir la entrega."); }
};
