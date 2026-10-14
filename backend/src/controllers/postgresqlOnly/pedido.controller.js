
import {
  prisma, idCompatibilidad, numero, texto, fecha, resolverCompat, usuarioIdReq,
  calcularItemPedidoPg, rutaActivaPorZona, incrementarConsecutivoTx,
  registrarAuditoriaPostgreSQL, responderError, salidaCliente, salidaEmpleado,
  salidaProducto, salidaPresentacion, reservarItemsUnidadTx, liberarReservasPedidoTx,
  crearEntregaDesdePedidoTx, sincronizarEntregaDesdePedidoTx
} from "./_transactional.js";

const includePedido = {
  cliente: true, zonaDespacho: true, ruta: true, empleado: true, empacador: true, creadoPor: true,
  items: { include: { producto: { include: { categoria: true } }, presentacion: true }, orderBy: { orden: "asc" } },
  entrega: true,
};

function salidaItem(i) {
  return {
    _id: idCompatibilidad(i), id: idCompatibilidad(i), postgresId: i.id,
    producto: salidaProducto(i.producto), presentacion: salidaPresentacion(i.presentacion),
    codigoProducto: i.codigoProducto, nombre: i.nombre, marca: i.marca,
    tipoVenta: i.tipoVenta, unidad: i.unidad, presentacionNombre: i.presentacionNombre,
    cantidad: i.cantidad, precioNormal: numero(i.precioNormal), precioAplicado: numero(i.precioAplicado),
    aplicoPrecioCantidad: i.aplicoPrecioCantidad, reglaAplicadaDesde: i.reglaAplicadaDesde === null ? null : numero(i.reglaAplicadaDesde),
    subtotal: numero(i.subtotal),
  };
}
function salidaPedido(p) {
  if (!p) return null;
  return {
    _id: idCompatibilidad(p), id: idCompatibilidad(p), postgresId: p.id, legacyMongoId: p.legacyMongoId || null,
    codigo: p.codigo, cliente: salidaCliente(p.cliente), clienteCodigo: p.clienteCodigo, clienteNombre: p.clienteNombre,
    clienteRazonSocial: p.clienteRazonSocial, clienteTelefono: p.clienteTelefono, clienteDireccion: p.clienteDireccion,
    clienteBarrio: p.clienteBarrio, clienteCiudad: p.clienteCiudad, clienteTipo: p.clienteTipo,
    zonaDespacho: p.zonaDespacho ? { _id: idCompatibilidad(p.zonaDespacho), id: idCompatibilidad(p.zonaDespacho), postgresId: p.zonaDespacho.id, codigo: p.zonaDespacho.codigo, nombre: p.zonaDespacho.nombre } : null,
    zonaDespachoCodigo: p.zonaDespachoCodigo, zonaDespachoNombre: p.zonaDespachoNombre,
    ruta: p.ruta ? { _id: idCompatibilidad(p.ruta), id: idCompatibilidad(p.ruta), postgresId: p.ruta.id, codigo: p.ruta.codigo, nombre: p.ruta.nombre, diasAtencion: p.ruta.diasAtencion } : null,
    rutaCodigo: p.rutaCodigo, rutaNombre: p.rutaNombre, rutaDiasAtencion: p.rutaDiasAtencion,
    empleado: salidaEmpleado(p.empleado), empacador: salidaEmpleado(p.empacador),
    items: (p.items || []).map(salidaItem), subtotal: numero(p.subtotal), descuento: numero(p.descuento), total: numero(p.total),
    estado: p.estado, inventarioReservado: p.inventarioReservado, fechaReservaInventario: p.fechaReservaInventario,
    fechaEntrega: p.fechaEntrega, observaciones: p.observaciones, createdAt: p.createdAt, updatedAt: p.updatedAt,
  };
}

async function datosDespacho(cliente) {
  if (!cliente) return { zona: null, ruta: null };
  const zona = cliente.zonaDespachoId ? await prisma.zonaDespacho.findUnique({ where: { id: cliente.zonaDespachoId } }) : null;
  const ruta = zona ? await rutaActivaPorZona(zona.id) : null;
  return { zona, ruta };
}

export const listarPedidos = async (_req, res) => {
  try {
    const rows = await prisma.pedido.findMany({ include: includePedido, orderBy: { createdAt: "desc" } });
    return res.json(rows.map(salidaPedido));
  } catch (e) { return responderError(res, e, "No fue posible cargar los pedidos."); }
};

export const obtenerSiguienteCodigoPedido = async (_req, res) => {
  try {
    const c = await prisma.consecutivo.findUnique({ where: { clave: "pedidos" } });
    return res.json({ codigo: `PED-${String(numero(c?.ultimoNumero) + 1).padStart(4, "0")}` });
  } catch (e) { return responderError(res, e, "No fue posible obtener el siguiente código."); }
};

async function prepararDatos(req, actual = null) {
  const body = req.body || {};
  const cliente = body.cliente ? await resolverCompat(prisma.cliente, body.cliente, true, "Cliente") : null;
  const empleado = await resolverCompat(prisma.empleado, body.empleado ?? actual?.empleadoId, true, "Empleado");
  const empacador = body.empacador ? await resolverCompat(prisma.empleado, body.empacador, true, "Empacador") : null;
  if (empleado.estado !== "Activo") throw new Error("El empleado seleccionado no está activo.");
  if (empacador && empacador.estado !== "Activo") throw new Error("El empacador seleccionado no está activo.");
  const items = body.items || [];
  if (!Array.isArray(items) || !items.length) throw new Error("El pedido debe tener al menos un producto.");

  const calculados = [];
  for (const it of items) calculados.push(await calcularItemPedidoPg(it));
  const subtotal = Number(calculados.reduce((a, x) => a + numero(x.subtotal), 0).toFixed(2));
  let descuento = Number(body.descuento || 0);

  const esEmpleado =
    String(
      req.usuario?.rol ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "empleado";

  /*
    REGLA DE SEGURIDAD:
    los usuarios con rol Empleado no pueden aplicar ni modificar descuentos.

    - Pedido nuevo: el descuento debe ser 0.
    - Pedido existente: se conserva exactamente el descuento que ya tenía
      (por ejemplo, uno autorizado previamente por un Administrador).
  */
  if (esEmpleado) {
    if (!actual) {
      if (
        Number.isFinite(descuento) &&
        Math.abs(descuento) > 0.0001
      ) {
        throw new Error(
          "Los usuarios empleados no tienen autorización para aplicar descuentos."
        );
      }

      descuento = 0;
    } else {
      const descuentoActual =
        numero(
          actual.descuento
        );

      if (
        !Number.isFinite(descuento) ||
        Math.abs(
          descuento -
          descuentoActual
        ) > 0.0001
      ) {
        throw new Error(
          "Los usuarios empleados no tienen autorización para modificar descuentos."
        );
      }

      descuento =
        descuentoActual;
    }
  }

  if (!Number.isFinite(descuento) || descuento < 0 || descuento > subtotal) {
    throw new Error("El descuento no es válido para el subtotal calculado.");
  }

  const total = Number((subtotal - descuento).toFixed(2));
  const despacho = await datosDespacho(cliente);
  return { body, cliente, empleado, empacador, calculados, subtotal, descuento, total, ...despacho };
}

export const crearPedido = async (req, res) => {
  try {
    const d = await prepararDatos(req);
    const usuarioId = await usuarioIdReq(req);
    const pedido = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "pedidos");
      const codigo = `PED-${String(c.ultimoNumero).padStart(4, "0")}`;
      return tx.pedido.create({
        data: {
          codigo, clienteId: d.cliente?.id || null, clienteCodigo: d.cliente?.codigo || "", clienteNombre: d.cliente?.nombre || "",
          clienteRazonSocial: d.cliente?.razonSocial || "", clienteTelefono: d.cliente?.telefono || "", clienteDireccion: d.cliente?.direccion || "",
          clienteBarrio: d.cliente?.barrio || "", clienteCiudad: d.cliente?.ciudad || "", clienteTipo: d.cliente?.tipoCliente || "",
          zonaDespachoId: d.zona?.id || null, zonaDespachoCodigo: d.zona?.codigo || "", zonaDespachoNombre: d.zona?.nombre || "",
          rutaId: d.ruta?.id || null, rutaCodigo: d.ruta?.codigo || "", rutaNombre: d.ruta?.nombre || "", rutaDiasAtencion: d.ruta?.diasAtencion || [],
          empleadoId: d.empleado.id, empacadorId: d.empacador?.id || null,
          subtotal: d.subtotal, descuento: d.descuento, total: d.total, estado: "Borrador",
          fechaEntrega: fecha(d.body.fechaEntrega), observaciones: texto(d.body.observaciones), creadoPorId: usuarioId,
          items: { create: d.calculados.map((it, orden) => ({
            productoId: it.producto.id, codigoProducto: it.codigoProducto, nombre: it.nombre, marca: it.marca,
            tipoVenta: it.tipoVenta, unidad: it.unidad, presentacionId: it.presentacion?.id || null,
            presentacionNombre: it.presentacionNombre, cantidad: it.cantidad, precioNormal: it.precioNormal,
            precioAplicado: it.precioAplicado, aplicoPrecioCantidad: it.aplicoPrecioCantidad,
            reglaAplicadaDesde: it.reglaAplicadaDesde, subtotal: it.subtotal, orden,
          })) },
        },
        include: includePedido,
      });
    });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Pedidos", accion: "CREAR", registroId: pedido.id, codigoRegistro: pedido.codigo, descripcion: `Se creó el pedido ${pedido.codigo}.`, datosNuevos: salidaPedido(pedido) });
    return res.status(201).json({ mensaje: "Pedido creado correctamente.", pedido: salidaPedido(pedido) });
  } catch (e) { return responderError(res, e, "No fue posible crear el pedido."); }
};

export const actualizarPedido = async (req, res) => {
  try {
    const actual = await resolverCompat(prisma.pedido, req.params?.id, true, "Pedido");
    if (["Listo para entrega","En ruta","Entregado","Cancelado"].includes(actual.estado)) {
      return res.status(400).json({ mensaje: "Para cambiar cliente, productos o cantidades, el pedido debe estar en Borrador o En preparación." });
    }

    const d = await prepararDatos(req, actual);
    const anterior = await prisma.pedido.findUnique({ where: { id: actual.id }, include: includePedido });

    const nuevoId = await prisma.$transaction(async (tx) => {
      const entrega = await tx.entrega.findUnique({ where: { pedidoId: actual.id } });

      if (entrega) {
        if (entrega.confirmada || entrega.estado !== "Por preparar") {
          throw new Error("La entrega debe revertirse antes de modificar los productos del pedido.");
        }
        // Los EntregaItem apuntan a PedidoItem. Se eliminan primero y luego
        // se reconstruyen desde el pedido actualizado, sin crear otra entrega.
        await tx.entregaItem.deleteMany({ where: { entregaId: entrega.id } });
      }

      await tx.pedidoItem.deleteMany({ where: { pedidoId: actual.id } });

      await tx.pedido.update({
        where: { id: actual.id },
        data: {
          clienteId: d.cliente?.id || null, clienteCodigo: d.cliente?.codigo || "", clienteNombre: d.cliente?.nombre || "",
          clienteRazonSocial: d.cliente?.razonSocial || "", clienteTelefono: d.cliente?.telefono || "", clienteDireccion: d.cliente?.direccion || "",
          clienteBarrio: d.cliente?.barrio || "", clienteCiudad: d.cliente?.ciudad || "", clienteTipo: d.cliente?.tipoCliente || "",
          zonaDespachoId: d.zona?.id || null, zonaDespachoCodigo: d.zona?.codigo || "", zonaDespachoNombre: d.zona?.nombre || "",
          rutaId: d.ruta?.id || null, rutaCodigo: d.ruta?.codigo || "", rutaNombre: d.ruta?.nombre || "", rutaDiasAtencion: d.ruta?.diasAtencion || [],
          empleadoId: d.empleado.id, empacadorId: d.empacador?.id || null, subtotal: d.subtotal, descuento: d.descuento, total: d.total,
          fechaEntrega: fecha(d.body.fechaEntrega), observaciones: texto(d.body.observaciones),
          items: { create: d.calculados.map((it, orden) => ({
            productoId: it.producto.id, codigoProducto: it.codigoProducto, nombre: it.nombre, marca: it.marca,
            tipoVenta: it.tipoVenta, unidad: it.unidad, presentacionId: it.presentacion?.id || null, presentacionNombre: it.presentacionNombre,
            cantidad: it.cantidad, precioNormal: it.precioNormal, precioAplicado: it.precioAplicado,
            aplicoPrecioCantidad: it.aplicoPrecioCantidad, reglaAplicadaDesde: it.reglaAplicadaDesde, subtotal: it.subtotal, orden,
          })) },
        },
      });

      if (entrega) {
        await sincronizarEntregaDesdePedidoTx(tx, actual.id);
      }

      return actual.id;
    });

    const nuevo = await prisma.pedido.findUnique({ where: { id: nuevoId }, include: includePedido });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Pedidos", accion: "ACTUALIZAR", registroId: nuevo.id, codigoRegistro: nuevo.codigo,
      descripcion: `Se actualizó el pedido ${nuevo.codigo}. La entrega relacionada fue sincronizada automáticamente.`,
      datosAnteriores: salidaPedido(anterior), datosNuevos: salidaPedido(nuevo),
    });
    return res.json({ mensaje: "Pedido actualizado correctamente. La entrega relacionada quedó sincronizada.", pedido: salidaPedido(nuevo) });
  } catch (e) { return responderError(res, e, "No fue posible actualizar el pedido."); }
};

export const cambiarEstadoPedido = async (req, res) => {
  try {
    const estado = texto(req.body?.estado);
    if (!["Borrador","En preparación","Listo para entrega","Cancelado"].includes(estado)) return res.status(400).json({ mensaje: "El estado indicado no es válido." });
    const pedido = await resolverCompat(prisma.pedido, req.params?.id, true, "Pedido");
    if (estado === "Listo para entrega" && !pedido.clienteId) return res.status(400).json({ mensaje: "Debes asignar un cliente antes de marcar el pedido como Listo para entrega." });
    if (pedido.estado === estado) return res.json({ mensaje: "El pedido ya se encuentra en ese estado.", estado, inventarioReservado: pedido.inventarioReservado });
    const usuarioId = await usuarioIdReq(req);

    await prisma.$transaction(async (tx) => {
      const actual = await tx.pedido.findUnique({ where: { id: pedido.id } });
      if (estado === "Listo para entrega" && !actual.inventarioReservado) {
        await reservarItemsUnidadTx(tx, actual, usuarioId);
        await tx.pedido.update({ where: { id: actual.id }, data: { inventarioReservado: true, fechaReservaInventario: new Date() } });
        await crearEntregaDesdePedidoTx(tx, actual.id);
      } else if (actual.estado === "Listo para entrega" && estado !== "Listo para entrega" && actual.inventarioReservado) {
        const entrega = await tx.entrega.findUnique({ where: { pedidoId: actual.id } });
        if (entrega?.confirmada && !["Cancelado","Entregado"].includes(entrega.estado)) throw new Error("El pedido ya tiene una entrega confirmada. Finaliza o cancela la entrega antes de cambiar el estado.");
        await liberarReservasPedidoTx(tx, actual, usuarioId);
        if (entrega && !entrega.confirmada) {
          await tx.entrega.update({
            where: { id: entrega.id },
            data: {
              estado: "Por preparar",
              preparacionGuardada: false,
              inventarioPesoReservado: false,
              fechaReservaInventario: null,
              fechaPreparacion: null,
              fechaConfirmacion: null,
              fechaSalida: null,
              confirmadoPorId: null,
            },
          });
        }
        await tx.pedido.update({ where: { id: actual.id }, data: { inventarioReservado: false, fechaReservaInventario: null } });
      }
      await tx.pedido.update({ where: { id: actual.id }, data: { estado } });
    });

    const nuevo = await prisma.pedido.findUnique({ where: { id: pedido.id }, include: includePedido });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Pedidos", accion: "ESTADO", registroId: nuevo.id, codigoRegistro: nuevo.codigo, descripcion: `Pedido ${nuevo.codigo} cambió a ${estado}.` });
    return res.json({ mensaje: estado === "Listo para entrega" ? "Estado actualizado y stock por unidad reservado correctamente." : "Estado del pedido actualizado correctamente.", estado: nuevo.estado, inventarioReservado: nuevo.inventarioReservado });
  } catch (e) { return responderError(res, e, "No fue posible cambiar el estado del pedido."); }
};

export const eliminarPedido = async (req, res) => {
  try {
    const pedido = await resolverCompat(prisma.pedido, req.params?.id, true, "Pedido");
    const deps = await prisma.pedido.findUnique({
      where: { id: pedido.id },
      include: { entrega: true, facturas: true, movimientosInventario: true, movimientosCaja: true, carteras: true, pagosCartera: true },
    });
    if (deps.entrega || deps.facturas.length || deps.movimientosInventario.length || deps.movimientosCaja.length || deps.carteras.length || deps.pagosCartera.length) {
      return res.status(400).json({ mensaje: "No se puede eliminar el pedido porque ya tiene movimientos o documentos relacionados." });
    }
    await prisma.pedido.delete({ where: { id: pedido.id } });
    await registrarAuditoriaPostgreSQL({ req, modulo: "Pedidos", accion: "ELIMINAR", registroId: pedido.id, codigoRegistro: pedido.codigo, descripcion: `Se eliminó el pedido ${pedido.codigo}.` });
    return res.json({ mensaje: "Pedido eliminado correctamente." });
  } catch (e) { return responderError(res, e, "No fue posible eliminar el pedido."); }
};
