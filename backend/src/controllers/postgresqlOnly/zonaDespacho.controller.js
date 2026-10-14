import {
  prisma,
  idCompatibilidad,
  buscarPorIdOlegacy,
  siguienteCodigoLectura,
  incrementarConsecutivoTx,
  registrarAuditoriaPostgreSQL,
  responderError,
  texto,
} from "./_shared.js";

function salida(z) {
  if (!z) return null;
  return {
    _id: idCompatibilidad(z),
    id: idCompatibilidad(z),
    postgresId: z.id,
    legacyMongoId: z.legacyMongoId || null,
    codigo: z.codigo,
    nombre: z.nombre,
    descripcion: z.descripcion,
    estado: z.estado,
    createdAt: z.createdAt,
    updatedAt: z.updatedAt,
  };
}

export const listarZonasDespacho = async (_req, res) => {
  try {
    const rows = await prisma.zonaDespacho.findMany({ orderBy: [{ nombre: "asc" }] });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar las zonas.");
  }
};

export const obtenerSiguienteCodigoZona = async (_req, res) => {
  try {
    const codigo = await siguienteCodigoLectura("zonas-despacho", "ZN-", 4);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
};

export const crearZonaDespacho = async (req, res) => {
  try {
    const nombre = texto(req.body?.nombre);
    const descripcion = texto(req.body?.descripcion);
    const estado = req.body?.estado === "Inactiva" ? "Inactiva" : "Activa";
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la zona es obligatorio." });

    const existe = await prisma.zonaDespacho.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existe) return res.status(400).json({ mensaje: "Ya existe una zona con ese nombre." });

    const creada = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "zonas-despacho");
      const codigo = `ZN-${String(c.ultimoNumero).padStart(4, "0")}`;
      return tx.zonaDespacho.create({ data: { codigo, nombre, descripcion, estado } });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Zonas de despacho", accion: "Crear",
      registroId: creada.id, codigoRegistro: creada.codigo || "",
      descripcion: `Se creó la zona ${creada.nombre}.`, datosNuevos: salida(creada),
    });

    return res.status(201).json({ mensaje: "Zona creada correctamente.", zona: salida(creada) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear la zona.");
  }
};

export const actualizarZonaDespacho = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.zonaDespacho, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La zona no existe." });

    const nombre = req.body?.nombre !== undefined ? texto(req.body.nombre) : actual.nombre;
    const descripcion = req.body?.descripcion !== undefined ? texto(req.body.descripcion) : actual.descripcion;
    const estado = req.body?.estado === "Activa" || req.body?.estado === "Inactiva" ? req.body.estado : actual.estado;
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la zona es obligatorio." });

    const duplicada = await prisma.zonaDespacho.findFirst({
      where: { id: { not: actual.id }, nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (duplicada) return res.status(400).json({ mensaje: "Ya existe una zona con ese nombre." });

    const nueva = await prisma.zonaDespacho.update({
      where: { id: actual.id }, data: { nombre, descripcion, estado },
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Zonas de despacho", accion: "Actualizar",
      registroId: nueva.id, codigoRegistro: nueva.codigo || "",
      descripcion: `Se actualizó la zona ${nueva.nombre}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });

    return res.json({ mensaje: "Zona actualizada correctamente.", zona: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar la zona.");
  }
};

export const cambiarEstadoZonaDespacho = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.zonaDespacho, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La zona no existe." });
    const estado = req.body?.estado === "Activa" || req.body?.estado === "Inactiva"
      ? req.body.estado
      : actual.estado === "Activa" ? "Inactiva" : "Activa";
    const nueva = await prisma.zonaDespacho.update({ where: { id: actual.id }, data: { estado } });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Zonas de despacho", accion: "Estado",
      registroId: nueva.id, codigoRegistro: nueva.codigo || "",
      descripcion: `La zona ${nueva.nombre} quedó ${estado}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });

    return res.json({ mensaje: "Estado actualizado correctamente.", zona: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible cambiar el estado de la zona.");
  }
};

export const eliminarZonaDespacho = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.zonaDespacho, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La zona no existe." });

    const [clientes, rutas, pedidos, entregas] = await Promise.all([
      prisma.cliente.count({ where: { zonaDespachoId: actual.id } }),
      prisma.rutaZona.count({ where: { zonaId: actual.id } }),
      prisma.pedido.count({ where: { zonaDespachoId: actual.id } }),
      prisma.entrega.count({ where: { zonaDespachoId: actual.id } }),
    ]);

    if (clientes + rutas + pedidos + entregas > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar la zona porque tiene relaciones o historial. Puedes dejarla Inactiva.",
      });
    }

    await prisma.zonaDespacho.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Zonas de despacho", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo || "",
      descripcion: `Se eliminó la zona ${actual.nombre}.`, datosAnteriores: salida(actual),
    });

    return res.json({ mensaje: "Zona eliminada correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar la zona.");
  }
};
