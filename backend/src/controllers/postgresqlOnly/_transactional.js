
import {
  prisma,
  valorId,
  pareceObjectIdMongo,
  idCompatibilidad,
  numero,
  texto,
  buscarPorIdOlegacy,
  incrementarConsecutivoTx,
  registrarAuditoriaPostgreSQL,
  responderError,
} from "./_shared.js";

export {
  prisma,
  valorId,
  pareceObjectIdMongo,
  idCompatibilidad,
  numero,
  texto,
  buscarPorIdOlegacy,
  incrementarConsecutivoTx,
  registrarAuditoriaPostgreSQL,
  responderError,
};

export function fecha(valor) {
  if (!valor) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function resolverCompat(delegate, valor, obligatorio = false, etiqueta = "Registro") {
  const id = valorId(valor);
  if (!id) {
    if (obligatorio) throw new Error(`${etiqueta} es obligatorio.`);
    return null;
  }
  const row = pareceObjectIdMongo(id)
    ? await delegate.findUnique({ where: { legacyMongoId: id } })
    : await delegate.findUnique({ where: { id } });
  if (!row && obligatorio) throw new Error(`${etiqueta} no existe.`);
  return row;
}

export async function usuarioIdReq(req) {
  const u = req?.usuario || req?.user || null;
  if (!u) return null;
  if (u.postgresId) return u.postgresId;
  const id = valorId(u);
  if (!id) return null;
  if (pareceObjectIdMongo(id)) {
    const row = await prisma.usuario.findUnique({ where: { legacyMongoId: id }, select: { id: true } });
    return row?.id || null;
  }
  const row = await prisma.usuario.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
  return row?.id || null;
}

export function nombreEmpleado(e) {
  return [e?.nombres, e?.apellidos].filter(Boolean).join(" ").trim();
}

export function salidaEmpleado(e) {
  if (!e) return null;
  return {
    _id: idCompatibilidad(e),
    id: idCompatibilidad(e),
    postgresId: e.id,
    legacyMongoId: e.legacyMongoId || null,
    codigo: e.codigo,
    nombres: e.nombres,
    apellidos: e.apellidos,
    nombreCompleto: nombreEmpleado(e),
    cargo: e.cargo,
    estado: e.estado,
  };
}

export function salidaCliente(c) {
  if (!c) return null;
  return {
    _id: idCompatibilidad(c),
    id: idCompatibilidad(c),
    postgresId: c.id,
    legacyMongoId: c.legacyMongoId || null,
    codigo: c.codigo,
    documento: c.documento,
    nombre: c.nombre,
    razonSocial: c.razonSocial,
    telefono: c.telefono,
    direccion: c.direccion,
    barrio: c.barrio,
    ciudad: c.ciudad,
    tipoCliente: c.tipoCliente,
  };
}

export function salidaProducto(p) {
  if (!p) return null;
  return {
    _id: idCompatibilidad(p),
    id: idCompatibilidad(p),
    postgresId: p.id,
    legacyMongoId: p.legacyMongoId || null,
    codigo: p.codigo,
    nombre: p.nombre,
    marca: p.marca,
    tipoVenta: p.tipoVenta,
    unidad: p.unidad,
    precioVenta: numero(p.precioVenta),
    estado: p.estado,
  };
}

export function salidaPresentacion(p) {
  if (!p) return null;
  return {
    _id: idCompatibilidad(p),
    id: idCompatibilidad(p),
    postgresId: p.id,
    legacyMongoId: p.legacyMongoId || null,
    nombre: p.nombre,
    tipoVenta: p.tipoVenta,
    unidad: p.unidad,
    precioVenta: numero(p.precioVenta),
    estado: p.estado,
  };
}

export async function rutaActivaPorZona(zonaId) {
  if (!zonaId) return null;
  const rz = await prisma.rutaZona.findFirst({
    where: { zonaId, ruta: { estado: "Activa" } },
    include: { ruta: true },
    orderBy: { ruta: { codigo: "asc" } },
  });
  return rz?.ruta || null;
}

export async function calcularItemPedidoPg(item) {
  const producto = await resolverCompat(prisma.producto, item?.producto, true, "Producto");
  if (producto.estado !== "Activo") throw new Error(`El producto "${producto.nombre}" está inactivo.`);

  let presentacion = null;
  if (item?.presentacion) {
    presentacion = await resolverCompat(prisma.productoPresentacion, item.presentacion, true, "Presentación");
    if (presentacion.productoId !== producto.id) throw new Error("La presentación no corresponde al producto seleccionado.");
    if (presentacion.estado !== "Activa") throw new Error("La presentación seleccionada está inactiva.");
  }

  const fuente = presentacion || producto;
  const tipoVenta = fuente.tipoVenta || producto.tipoVenta || "Unidad";
  const cantidad = Number(item?.cantidad);

  if (!Number.isInteger(cantidad) || cantidad < 0 || (tipoVenta !== "Peso" && cantidad === 0)) {
    throw new Error(
      tipoVenta === "Peso"
        ? "La cantidad de referencia debe ser un entero igual o mayor que cero."
        : "La cantidad debe ser un entero mayor que cero."
    );
  }

  const reglas = await prisma.reglaPrecio.findMany({
    where: presentacion ? { presentacionId: presentacion.id } : { productoId: producto.id },
    orderBy: [{ desde: "asc" }, { orden: "asc" }],
  });

  const precioNormal = numero(fuente.precioVenta);
  let precioAplicado = precioNormal;
  let reglaDesde = null;

  // Para productos por unidad la regla se define en Pedidos por cantidad.
  // Para productos por peso el precio definitivo se calcula en Entregas,
  // cuando ya existe un peso real en kg.
  if (tipoVenta !== "Peso") {
    for (const r of reglas) {
      if (cantidad >= numero(r.desde)) {
        precioAplicado = numero(r.precio);
        reglaDesde = numero(r.desde);
      }
    }
  }

  const subtotal = tipoVenta === "Peso"
    ? 0
    : Number((cantidad * precioAplicado).toFixed(2));

  return {
    producto,
    presentacion,
    cantidad,
    codigoProducto: producto.codigo || "",
    nombre: producto.nombre,
    marca: producto.marca || "",
    tipoVenta,
    unidad: fuente.unidad || producto.unidad || "",
    presentacionNombre: presentacion?.nombre || "",
    precioNormal,
    precioAplicado,
    aplicoPrecioCantidad: tipoVenta !== "Peso" && precioAplicado !== precioNormal,
    reglaAplicadaDesde: tipoVenta === "Peso" ? null : reglaDesde,
    subtotal,
  };
}

export async function sincronizarEntregaDesdePedidoTx(tx, pedidoId, opciones = {}) {
  const pedido = await tx.pedido.findUnique({
    where: { id: pedidoId },
    include: { items: { orderBy: { orden: "asc" } } },
  });
  if (!pedido) throw new Error("Pedido no encontrado para sincronizar entrega.");

  const existente = await tx.entrega.findUnique({
    where: { pedidoId },
    include: { items: true },
  });

  const itemsData = pedido.items.map((it, orden) => ({
    pedidoItemId: it.id,
    productoId: it.productoId,
    codigoProducto: it.codigoProducto,
    nombre: it.nombre,
    presentacionId: it.presentacionId,
    presentacionNombre: it.presentacionNombre,
    tipoVenta: it.tipoVenta,
    unidad: it.unidad,
    cantidadSolicitada: it.cantidad,
    cantidadReal: it.tipoVenta === "Peso" ? null : it.cantidad,
    precioUnitario: it.precioAplicado,
    pesoReal: null,
    subtotal: it.tipoVenta === "Peso" ? 0 : it.subtotal,
    origen: "Pedido",
    orden,
  }));

  const datosBase = {
    pedidoCodigo: pedido.codigo,
    clienteId: pedido.clienteId,
    clienteCodigo: pedido.clienteCodigo,
    clienteNombre: pedido.clienteNombre,
    clienteTelefono: pedido.clienteTelefono,
    clienteDireccion: pedido.clienteDireccion,
    clienteBarrio: pedido.clienteBarrio,
    clienteCiudad: pedido.clienteCiudad,
    zonaDespachoId: pedido.zonaDespachoId,
    zonaDespachoNombre: pedido.zonaDespachoNombre,
    rutaId: pedido.rutaId,
    rutaNombre: pedido.rutaNombre,
    rutaDiasAtencion: pedido.rutaDiasAtencion,
    fechaProgramada: pedido.fechaEntrega,
    empacadorId: pedido.empacadorId,
    subtotal: pedido.subtotal,
    descuento: pedido.descuento,
    total: pedido.total,
  };

  if (!existente) {
    return tx.entrega.create({
      data: {
        pedidoId: pedido.id,
        ...datosBase,
        estado: "Por preparar",
        items: { create: itemsData },
      },
    });
  }

  if (existente.confirmada || ["Pendiente", "En ruta", "Entregado"].includes(existente.estado)) {
    if (!opciones.permitirConfirmada) {
      throw new Error("La entrega debe revertirse antes de sincronizar cambios del pedido.");
    }
  }

  await tx.entregaItem.deleteMany({ where: { entregaId: existente.id } });

  return tx.entrega.update({
    where: { id: existente.id },
    data: {
      ...datosBase,
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
      motivoCancelacion: "",
      motivoNoEntrega: "",
      items: { create: itemsData },
    },
  });
}

export async function crearEntregaDesdePedidoTx(tx, pedidoId) {
  return sincronizarEntregaDesdePedidoTx(tx, pedidoId);
}

export async function crearMovimientoInventarioTx(tx, {
  producto,
  presentacion = null,
  tipo,
  cantidad,
  stockAnterior,
  stockNuevo,
  reservadoAnterior,
  reservadoNuevo,
  pedido = null,
  entrega = null,
  usuarioId = null,
  motivo = "",
}) {
  return tx.movimientoInventario.create({
    data: {
      productoId: producto.id,
      codigoProducto: producto.codigo || "",
      nombreProducto: producto.nombre || "",
      presentacionId: presentacion?.id || null,
      presentacionNombre: presentacion?.nombre || "",
      tipo,
      cantidad,
      unidad: presentacion?.unidad || producto.unidad || "",
      tipoVenta: presentacion?.tipoVenta || producto.tipoVenta || "Unidad",
      stockAnterior,
      stockNuevo,
      reservadoAnterior,
      reservadoNuevo,
      costoUnitario: numero(presentacion?.precioCompra ?? producto.precioCompra),
      costoPromedioAnterior: numero(presentacion?.costoPromedio ?? producto.costoPromedio),
      costoPromedioNuevo: numero(presentacion?.costoPromedio ?? producto.costoPromedio),
      valorTotal: 0,
      origen: "Pedido",
      pedidoId: pedido?.id || null,
      pedidoCodigo: pedido?.codigo || "",
      entregaId: entrega?.id || null,
      entregaCodigo: entrega?.pedidoCodigo || "",
      motivo,
      usuarioId,
    },
  });
}

export async function reservarItemsUnidadTx(tx, pedido, usuarioId) {
  const items = await tx.pedidoItem.findMany({
    where: { pedidoId: pedido.id },
    include: { producto: true, presentacion: true },
  });

  for (const item of items) {
    if (item.tipoVenta === "Peso") continue;
    const fuente = item.presentacion || item.producto;
    if (fuente.controlInventario === false) continue;
    const stock = numero(fuente.stock);
    const reservado = numero(fuente.stockReservado);
    const cantidad = numero(item.cantidad);
    if (stock - reservado < cantidad) {
      throw new Error(`Stock insuficiente para ${item.nombre}.`);
    }
    if (item.presentacion) {
      await tx.productoPresentacion.update({
        where: { id: item.presentacion.id },
        data: { stockReservado: reservado + cantidad },
      });
    } else {
      await tx.producto.update({
        where: { id: item.producto.id },
        data: { stockReservado: reservado + cantidad },
      });
    }
    await crearMovimientoInventarioTx(tx, {
      producto: item.producto,
      presentacion: item.presentacion,
      tipo: "Reserva",
      cantidad,
      stockAnterior: stock,
      stockNuevo: stock,
      reservadoAnterior: reservado,
      reservadoNuevo: reservado + cantidad,
      pedido,
      usuarioId,
      motivo: "Reserva por pedido listo para entrega",
    });
  }
}

export async function liberarReservasPedidoTx(tx, pedido, usuarioId) {
  const items = await tx.pedidoItem.findMany({
    where: { pedidoId: pedido.id },
    include: { producto: true, presentacion: true },
  });

  for (const item of items) {
    // En Pedidos solo se reserva inventario por unidad. Los productos por peso
    // se reservan después, al confirmar Entrega con el peso real registrado.
    if (item.tipoVenta === "Peso") continue;

    const fuente = item.presentacion || item.producto;
    if (fuente.controlInventario === false) continue;

    const reservado = numero(fuente.stockReservado);
    const cantidad = numero(item.cantidad);
    if (cantidad <= 0) continue;

    const nuevo = Math.max(0, reservado - cantidad);
    if (item.presentacion) {
      await tx.productoPresentacion.update({ where: { id: item.presentacion.id }, data: { stockReservado: nuevo } });
    } else {
      await tx.producto.update({ where: { id: item.producto.id }, data: { stockReservado: nuevo } });
    }

    await crearMovimientoInventarioTx(tx, {
      producto: item.producto,
      presentacion: item.presentacion,
      tipo: "Liberación",
      cantidad,
      stockAnterior: numero(fuente.stock),
      stockNuevo: numero(fuente.stock),
      reservadoAnterior: reservado,
      reservadoNuevo: nuevo,
      pedido,
      usuarioId,
      motivo: "Liberación de reserva del pedido",
    });
  }
}

export async function cajaAbierta() {
  return prisma.caja.findFirst({
    where: { estado: "Abierta" },
    orderBy: { fechaApertura: "desc" },
  });
}

export function codigoCartera(pedidoCodigo) {
  const limpio = String(pedidoCodigo || "").trim().toUpperCase().replace(/^PED-/, "");
  return `CAR-${limpio || Date.now().toString().slice(-6)}`;
}
