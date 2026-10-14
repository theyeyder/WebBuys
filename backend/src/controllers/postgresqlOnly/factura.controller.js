
import {
  prisma, idCompatibilidad, numero, texto, resolverCompat, usuarioIdReq,
  incrementarConsecutivoTx, registrarAuditoriaPostgreSQL, responderError,
  salidaCliente, salidaEmpleado, salidaProducto
} from "./_transactional.js";

const includeFactura = {
  pedido: true, entrega: true, cliente: true, empleado: true, repartidor: true, empacador: true, creadoPor: true,
  items: { include: { producto: true }, orderBy: { orden: "asc" } },
};

function salidaItem(i) {
  return {
    _id: i.id, id: i.id, postgresId: i.id, producto: salidaProducto(i.producto),
    nombre: i.nombre, presentacionNombre: i.presentacionNombre, unidad: i.unidad, tipoVenta: i.tipoVenta,
    cantidadSolicitada: i.cantidadSolicitada, pesoReal: i.pesoReal === null ? null : numero(i.pesoReal),
    cantidad: numero(i.cantidad), precioAplicado: numero(i.precioAplicado), subtotal: numero(i.subtotal),
  };
}
function salidaFactura(f) {
  if (!f) return null;
  return {
    _id: idCompatibilidad(f), id: idCompatibilidad(f), postgresId: f.id, legacyMongoId: f.legacyMongoId || null,
    consecutivo: f.consecutivo, codigo: f.codigo,
    pedido: f.pedido ? { _id: idCompatibilidad(f.pedido), id: idCompatibilidad(f.pedido), postgresId: f.pedido.id, codigo: f.pedido.codigo, estado: f.pedido.estado } : null,
    pedidoCodigo: f.pedidoCodigo,
    entrega: f.entrega ? { _id: idCompatibilidad(f.entrega), id: idCompatibilidad(f.entrega), postgresId: f.entrega.id, pedidoCodigo: f.entrega.pedidoCodigo, estado: f.entrega.estado } : null,
    entregaCodigo: f.entregaCodigo, cliente: salidaCliente(f.cliente), clienteNombre: f.clienteNombre,
    clienteDocumento: f.clienteDocumento, clienteTelefono: f.clienteTelefono,
    empleado: salidaEmpleado(f.empleado), empleadoNombre: f.empleadoNombre,
    repartidor: salidaEmpleado(f.repartidor), repartidorNombre: f.repartidorNombre,
    empacador: salidaEmpleado(f.empacador), empacadorNombre: f.empacadorNombre,
    items: (f.items || []).map(salidaItem),
    subtotal: numero(f.subtotal), descuento: numero(f.descuento), iva: numero(f.iva), total: numero(f.total),
    metodoPago: f.metodoPago, estado: f.estado, motivoAnulacion: f.motivoAnulacion,
    fechaAnulacion: f.fechaAnulacion, fechaReversion: f.fechaReversion, observaciones: f.observaciones,
    createdAt: f.createdAt, updatedAt: f.updatedAt,
  };
}

async function getFactura(id) {
  const base = await resolverCompat(prisma.factura, id, true, "Factura");
  return prisma.factura.findUnique({ where: { id: base.id }, include: includeFactura });
}

async function listar(_req, res) {
  try {
    const rows = await prisma.factura.findMany({ include: includeFactura, orderBy: { createdAt: "desc" } });
    return res.json(rows.map(salidaFactura));
  } catch (e) { return responderError(res, e, "Error al listar las facturas."); }
}

async function listarDisponibles(_req, res) {
  try {
    const entregas = await prisma.entrega.findMany({
      where: { estado: "Entregado", metodoPago: { not: "Crédito" } },
      include: {
        pedido: true, cliente: true, ruta: true, empacador: true, repartidor: true,
        items: { include: { producto: true, presentacion: true }, orderBy: { orden: "asc" } },
        facturas: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ fechaEntregaReal: "desc" }, { updatedAt: "desc" }],
    });
    const disponibles = entregas.filter((e) => {
      const ultima = e.facturas?.[0];
      return !ultima || (ultima.estado === "Anulada" && Boolean(ultima.fechaReversion));
    });
    return res.json(disponibles.map((e) => ({
      _id: idCompatibilidad(e), id: idCompatibilidad(e), postgresId: e.id, pedidoCodigo: e.pedidoCodigo,
      estado: e.estado, metodoPago: e.metodoPago, total: numero(e.total), clienteNombre: e.clienteNombre,
      fechaEntregaReal: e.fechaEntregaReal,
    })));
  } catch (e) { return responderError(res, e, "No fue posible cargar las entregas finalizadas para facturación."); }
}

async function obtenerPorId(req, res) {
  try { return res.json(salidaFactura(await getFactura(req.params?.id))); }
  catch (e) { return responderError(res, e, "Error al obtener la factura."); }
}

async function crear(req, res) {
  try {
    const entrega = await resolverCompat(prisma.entrega, req.body?.entrega, true, "Entrega");
    const e = await prisma.entrega.findUnique({
      where: { id: entrega.id },
      include: { pedido: { include: { empleado: true } }, cliente: true, empacador: true, repartidor: true, items: { include: { producto: true }, orderBy: { orden: "asc" } }, facturas: { orderBy: { createdAt: "desc" } } },
    });
    if (e.estado !== "Entregado") return res.status(400).json({ mensaje: "Solo se pueden facturar entregas con estado Entregado." });
    if (e.metodoPago === "Crédito") return res.status(400).json({ mensaje: "Las entregas a Crédito se gestionan en Cartera y no se envían a Facturación." });
    if (!e.clienteId) return res.status(400).json({ mensaje: "La entrega no tiene un cliente válido para facturar." });
    const ultima = e.facturas?.[0];
    if (ultima && !(ultima.estado === "Anulada" && ultima.fechaReversion)) return res.status(400).json({ mensaje: "La entrega ya tiene una factura vigente." });

    const uid = await usuarioIdReq(req);
    const f = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "facturas");
      const consecutivo = c.ultimoNumero;
      const codigo = `FAC-${String(consecutivo).padStart(4, "0")}`;
      const creada = await tx.factura.create({
        data: {
          consecutivo, codigo, pedidoId: e.pedidoId, pedidoCodigo: e.pedidoCodigo, entregaId: e.id, entregaCodigo: e.pedidoCodigo,
          clienteId: e.clienteId, clienteNombre: e.clienteNombre || e.cliente?.nombre || "Cliente",
          clienteDocumento: e.cliente?.documento || "", clienteTelefono: e.clienteTelefono || e.cliente?.telefono || "",
          empleadoId: e.pedido?.empleadoId || null, empleadoNombre: [e.pedido?.empleado?.nombres, e.pedido?.empleado?.apellidos].filter(Boolean).join(" "),
          repartidorId: e.repartidorId, repartidorNombre: [e.repartidor?.nombres, e.repartidor?.apellidos].filter(Boolean).join(" "),
          empacadorId: e.empacadorId, empacadorNombre: [e.empacador?.nombres, e.empacador?.apellidos].filter(Boolean).join(" "),
          subtotal: numero(e.subtotal), descuento: numero(e.descuento), iva: 0, total: numero(e.total),
          metodoPago: e.metodoPago || "Efectivo", estado: "Emitida", observaciones: texto(req.body?.observaciones), creadoPorId: uid,
          items: { create: e.items.map((it, orden) => ({
            productoId: it.productoId, nombre: it.nombre, presentacionNombre: it.presentacionNombre, unidad: it.unidad,
            tipoVenta: it.tipoVenta, cantidadSolicitada: it.cantidadSolicitada, pesoReal: it.pesoReal,
            cantidad: it.tipoVenta === "Peso" ? numero(it.pesoReal) : numero(it.cantidadReal ?? it.cantidadSolicitada),
            precioAplicado: numero(it.precioUnitario), subtotal: numero(it.subtotal), orden,
          })) },
        },
        include: includeFactura,
      });
      await tx.movimientoCaja.updateMany({
        where: { pedidoId: e.pedidoId, estado: "Activo" },
        data: { facturaId: creada.id, facturaCodigo: creada.codigo, observacion: "Factura generada" },
      });
      return creada;
    });

    await registrarAuditoriaPostgreSQL({ req, modulo: "Facturación", accion: "CREAR", registroId: f.id, codigoRegistro: f.codigo, descripcion: `Se creó la factura ${f.codigo}.`, datosNuevos: salidaFactura(f) });
    return res.status(201).json({ mensaje: "Factura creada correctamente.", factura: salidaFactura(f) });
  } catch (e) { return responderError(res, e, "Error al crear la factura."); }
}

async function actualizar(req, res) {
  try {
    const f = await getFactura(req.params?.id);
    if (f.estado === "Anulada") return res.status(400).json({ mensaje: "No se puede modificar una factura anulada." });
    const metodoPago = req.body?.metodoPago !== undefined ? texto(req.body.metodoPago) : f.metodoPago;
    if (!["Efectivo","Transferencia","Crédito"].includes(metodoPago)) return res.status(400).json({ mensaje: "El tipo de pago seleccionado no es válido." });
    const mov = await prisma.movimientoCaja.findFirst({ where: { pedidoId: f.pedidoId, estado: "Activo" }, include: { caja: true } });
    if (mov?.caja?.estado === "Cerrada" && mov.metodoPago !== metodoPago) return res.status(400).json({ mensaje: `No puede cambiar el tipo de pago porque la venta ya pertenece a la caja cerrada ${mov.caja.codigo}.` });

    const nuevo = await prisma.$transaction(async (tx) => {
      if (f.entregaId) await tx.entrega.update({ where: { id: f.entregaId }, data: { metodoPago } });
      await tx.movimientoCaja.updateMany({ where: { pedidoId: f.pedidoId, estado: "Activo" }, data: { metodoPago, afectaEfectivo: metodoPago === "Efectivo" } });
      return tx.factura.update({
        where: { id: f.id },
        data: { metodoPago, observaciones: req.body?.observaciones !== undefined ? texto(req.body.observaciones) : f.observaciones },
        include: includeFactura,
      });
    });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Facturación", accion: "ACTUALIZAR", registroId: nuevo.id, codigoRegistro: nuevo.codigo, descripcion: `Se actualizó la factura ${nuevo.codigo}.` });
    return res.json(salidaFactura(nuevo));
  } catch (e) { return responderError(res, e, "Error al actualizar la factura."); }
}

async function anular(req, res) {
  try {
    const f = await getFactura(req.params?.id);
    const motivo = texto(req.body?.motivoAnulacion);
    if (!motivo) return res.status(400).json({ mensaje: "Debe indicar el motivo de anulación." });
    if (f.estado === "Anulada") return res.status(400).json({ mensaje: "La factura ya se encuentra anulada." });
    const nuevo = await prisma.$transaction(async (tx) => {
      await tx.movimientoCaja.updateMany({ where: { facturaId: f.id }, data: { facturaId: null, facturaCodigo: "", observacion: "Entrega sin factura generada" } });
      return tx.factura.update({ where: { id: f.id }, data: { estado: "Anulada", motivoAnulacion: motivo, fechaAnulacion: new Date(), fechaReversion: null }, include: includeFactura });
    });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Facturación", accion: "ANULAR", registroId: nuevo.id, codigoRegistro: nuevo.codigo, descripcion: `Se anuló la factura ${nuevo.codigo}.` });
    return res.json({ mensaje: `Factura ${nuevo.codigo} anulada.`, factura: salidaFactura(nuevo) });
  } catch (e) { return responderError(res, e, "Error al anular la factura."); }
}

async function revertir(req, res) {
  try {
    const f = await getFactura(req.params?.id);
    if (f.estado !== "Anulada") return res.status(400).json({ mensaje: "Solo se puede revertir una factura anulada." });
    if (f.fechaReversion) return res.status(400).json({ mensaje: "Esta factura ya fue revertida." });
    const nuevo = await prisma.factura.update({ where: { id: f.id }, data: { fechaReversion: new Date() }, include: includeFactura });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Facturación", accion: "REVERTIR", registroId: nuevo.id, codigoRegistro: nuevo.codigo, descripcion: `Se revirtió la factura ${nuevo.codigo}.` });
    return res.json({ mensaje: `Factura ${nuevo.codigo} revertida. La entrega puede facturarse nuevamente.`, factura: salidaFactura(nuevo) });
  } catch (e) { return responderError(res, e, "Error al revertir la factura."); }
}

async function eliminar(req, res) {
  try {
    const f = await getFactura(req.params?.id);
    if (!(f.estado === "Anulada" && f.fechaReversion)) return res.status(400).json({ mensaje: "Solo puede eliminarse una factura anulada y revertida." });
    await prisma.$transaction(async (tx) => {
      await tx.movimientoCaja.updateMany({ where: { facturaId: f.id }, data: { facturaId: null, facturaCodigo: "" } });
      await tx.factura.delete({ where: { id: f.id } });
    });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Facturación", accion: "ELIMINAR", registroId: f.id, codigoRegistro: f.codigo, descripcion: `Se eliminó la factura ${f.codigo}.` });
    return res.json({ mensaje: "Factura eliminada correctamente." });
  } catch (e) { return responderError(res, e, "Error al eliminar la factura."); }
}

export const facturaController = { listar, listarDisponibles, obtenerPorId, crear, actualizar, anular, revertir, eliminar };
