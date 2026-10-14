import {
  prisma,
  idCompatibilidad,
  valorId,
  pareceObjectIdMongo,
  buscarPorIdOlegacy,
  siguienteCodigoLectura,
  incrementarConsecutivoTx,
  registrarAuditoriaPostgreSQL,
  responderError,
  texto,
} from "./_shared.js";

const TIPOS_DOCUMENTO = new Set(["CC", "NIT"]);
const TIPOS_CLIENTE = new Set(["Tienda", "Restaurante", "Supermercado", "Persona Natural", "Otro"]);

function zonaSalida(z) {
  if (!z) return null;
  return {
    _id: idCompatibilidad(z), id: idCompatibilidad(z), postgresId: z.id,
    legacyMongoId: z.legacyMongoId || null, codigo: z.codigo,
    nombre: z.nombre, descripcion: z.descripcion, estado: z.estado,
  };
}

function salida(c) {
  if (!c) return null;
  return {
    _id: idCompatibilidad(c), id: idCompatibilidad(c), postgresId: c.id,
    legacyMongoId: c.legacyMongoId || null, codigo: c.codigo,
    tipoDocumento: c.tipoDocumento, documento: c.documento,
    nombre: c.nombre, razonSocial: c.razonSocial, telefono: c.telefono,
    direccion: c.direccion, barrio: c.barrio, zonaDespacho: zonaSalida(c.zonaDespacho),
    ciudad: c.ciudad, tipoCliente: c.tipoCliente, estado: c.estado,
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

async function resolverZona(valor) {
  const id = valorId(valor);
  if (!id) return null;
  const z = pareceObjectIdMongo(id)
    ? await prisma.zonaDespacho.findUnique({ where: { legacyMongoId: id } })
    : await prisma.zonaDespacho.findUnique({ where: { id } });
  if (!z) throw new Error("La zona de despacho seleccionada no existe.");
  return z;
}

function datosEntrada(body = {}, actual = {}) {
  const tipoDocumento = body.tipoDocumento !== undefined ? texto(body.tipoDocumento) : actual.tipoDocumento || "CC";
  const tipoCliente = body.tipoCliente !== undefined ? texto(body.tipoCliente) : actual.tipoCliente || "Tienda";
  if (!TIPOS_DOCUMENTO.has(tipoDocumento)) throw new Error("El tipo de documento no es válido.");
  if (!TIPOS_CLIENTE.has(tipoCliente)) throw new Error("El tipo de cliente no es válido.");

  const documento = body.documento !== undefined ? texto(body.documento) : actual.documento || "";
  const nombre = body.nombre !== undefined ? texto(body.nombre) : actual.nombre || "";
  if (!documento) throw new Error("El documento del cliente es obligatorio.");
  if (!nombre) throw new Error("El nombre del cliente es obligatorio.");

  return {
    tipoDocumento, documento, nombre,
    razonSocial: body.razonSocial !== undefined ? texto(body.razonSocial) : actual.razonSocial || "",
    telefono: body.telefono !== undefined ? texto(body.telefono) : actual.telefono || "",
    direccion: body.direccion !== undefined ? texto(body.direccion) : actual.direccion || "",
    barrio: body.barrio !== undefined ? texto(body.barrio) : actual.barrio || "",
    ciudad: body.ciudad !== undefined ? texto(body.ciudad) : actual.ciudad || "",
    tipoCliente,
    estado: body.estado !== undefined ? Boolean(body.estado) : actual.estado !== undefined ? Boolean(actual.estado) : true,
  };
}

async function listar(req, res) {
  try {
    const rows = await prisma.cliente.findMany({
      include: { zonaDespacho: true },
      orderBy: [{ nombre: "asc" }],
    });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar los clientes.");
  }
}

async function obtener(req, res) {
  try {
    const c = await buscarPorIdOlegacy(prisma.cliente, req.params?.id, { include: { zonaDespacho: true } });
    if (!c) return res.status(404).json({ mensaje: "El cliente no existe." });
    return res.json(salida(c));
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el cliente.");
  }
}

export async function obtenerSiguienteCodigoCliente(_req, res) {
  try {
    const codigo = await siguienteCodigoLectura("clientes", "CTE-", 4);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
}

async function crear(req, res) {
  try {
    const data = datosEntrada(req.body);
    const zona = await resolverZona(req.body?.zonaDespacho);

    const existe = await prisma.cliente.findUnique({ where: { documento: data.documento } });
    if (existe) return res.status(400).json({ mensaje: "Ya existe un cliente con ese documento." });

    const creado = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "clientes");
      const codigo = `CTE-${String(c.ultimoNumero).padStart(4, "0")}`;
      return tx.cliente.create({
        data: { ...data, codigo, zonaDespachoId: zona?.id || null },
        include: { zonaDespacho: true },
      });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Clientes", accion: "Crear",
      registroId: creado.id, codigoRegistro: creado.codigo || "",
      descripcion: `Se creó el cliente ${creado.nombre}.`, datosNuevos: salida(creado),
    });

    return res.status(201).json({ mensaje: "Cliente creado correctamente.", cliente: salida(creado) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear el cliente.");
  }
}

async function actualizar(req, res) {
  try {
    const actual = await buscarPorIdOlegacy(prisma.cliente, req.params?.id, { include: { zonaDespacho: true } });
    if (!actual) return res.status(404).json({ mensaje: "El cliente no existe." });

    const data = datosEntrada(req.body, actual);
    const zona = req.body?.zonaDespacho !== undefined
      ? await resolverZona(req.body.zonaDespacho)
      : actual.zonaDespacho;

    const duplicado = await prisma.cliente.findFirst({
      where: { id: { not: actual.id }, documento: data.documento },
    });
    if (duplicado) return res.status(400).json({ mensaje: "Ya existe un cliente con ese documento." });

    const nuevo = await prisma.cliente.update({
      where: { id: actual.id },
      data: { ...data, zonaDespachoId: zona?.id || null },
      include: { zonaDespacho: true },
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Clientes", accion: "Actualizar",
      registroId: nuevo.id, codigoRegistro: nuevo.codigo || "",
      descripcion: `Se actualizó el cliente ${nuevo.nombre}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nuevo),
    });

    return res.json({ mensaje: "Cliente actualizado correctamente.", cliente: salida(nuevo) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar el cliente.");
  }
}

async function eliminar(req, res) {
  try {
    const actual = await buscarPorIdOlegacy(prisma.cliente, req.params?.id, { include: { zonaDespacho: true } });
    if (!actual) return res.status(404).json({ mensaje: "El cliente no existe." });

    const [pedidos, entregas, facturas, movimientos, carteras, pagos] = await Promise.all([
      prisma.pedido.count({ where: { clienteId: actual.id } }),
      prisma.entrega.count({ where: { clienteId: actual.id } }),
      prisma.factura.count({ where: { clienteId: actual.id } }),
      prisma.movimientoCaja.count({ where: { clienteId: actual.id } }),
      prisma.cartera.count({ where: { clienteId: actual.id } }),
      prisma.pagoCartera.count({ where: { clienteId: actual.id } }),
    ]);

    if (pedidos + entregas + facturas + movimientos + carteras + pagos > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar el cliente porque tiene historial operativo. Puedes dejarlo inactivo.",
      });
    }

    await prisma.cliente.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Clientes", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo || "",
      descripcion: `Se eliminó el cliente ${actual.nombre}.`, datosAnteriores: salida(actual),
    });
    return res.json({ mensaje: "Cliente eliminado correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar el cliente.");
  }
}

export const clienteController = { listar, obtener, crear, actualizar, eliminar };
