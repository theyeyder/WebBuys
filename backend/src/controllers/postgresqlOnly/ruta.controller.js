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

const DIAS_VALIDOS = new Set([
  "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
]);

function usuarioSalida(u) {
  if (!u) return null;
  return {
    _id: idCompatibilidad(u), id: idCompatibilidad(u), postgresId: u.id,
    legacyMongoId: u.legacyMongoId || null, codigo: u.codigo,
    nombres: u.nombres, apellidos: u.apellidos,
    nombre: [u.nombres, u.apellidos].filter(Boolean).join(" ").trim(),
    usuario: u.usuario, rol: u.rol, estado: u.estado,
  };
}

function zonaSalida(z) {
  if (!z) return null;
  return {
    _id: idCompatibilidad(z), id: idCompatibilidad(z), postgresId: z.id,
    legacyMongoId: z.legacyMongoId || null, codigo: z.codigo,
    nombre: z.nombre, estado: z.estado,
  };
}

function salida(r) {
  if (!r) return null;
  const zonas = Array.isArray(r.zonas) ? r.zonas.map((x) => x.zona).filter(Boolean) : [];
  return {
    _id: idCompatibilidad(r), id: idCompatibilidad(r), postgresId: r.id,
    legacyMongoId: r.legacyMongoId || null, codigo: r.codigo,
    nombre: r.nombre, descripcion: r.descripcion,
    empleado: usuarioSalida(r.usuarioResponsable),
    zonasDespacho: zonas.map(zonaSalida),
    diasAtencion: r.diasAtencion || [], estado: r.estado,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  };
}

const includeRuta = {
  usuarioResponsable: true,
  zonas: { include: { zona: true } },
};

async function resolverUsuario(valor) {
  const id = valorId(valor);
  if (!id) return null;
  const u = pareceObjectIdMongo(id)
    ? await prisma.usuario.findUnique({ where: { legacyMongoId: id } })
    : await prisma.usuario.findUnique({ where: { id } });
  if (!u) throw new Error("El usuario responsable seleccionado no existe.");
  return u;
}

async function resolverZonas(valores) {
  if (!Array.isArray(valores)) return [];
  const ids = [];
  for (const v of valores) {
    const id = valorId(v);
    if (!id) continue;
    const z = pareceObjectIdMongo(id)
      ? await prisma.zonaDespacho.findUnique({ where: { legacyMongoId: id } })
      : await prisma.zonaDespacho.findUnique({ where: { id } });
    if (!z) throw new Error("Una de las zonas seleccionadas no existe.");
    if (z.estado !== "Activa") throw new Error(`La zona ${z.nombre} no está Activa.`);
    ids.push(z.id);
  }
  return [...new Set(ids)];
}

function diasValidos(valor) {
  if (!Array.isArray(valor)) return [];
  const dias = [...new Set(valor.map((x) => texto(x)).filter(Boolean))];
  const invalido = dias.find((x) => !DIAS_VALIDOS.has(x));
  if (invalido) throw new Error(`Día de atención no válido: ${invalido}.`);
  return dias;
}

export const listarRutas = async (_req, res) => {
  try {
    const rows = await prisma.ruta.findMany({ include: includeRuta, orderBy: [{ nombre: "asc" }] });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar las rutas.");
  }
};

export const obtenerSiguienteCodigoRuta = async (_req, res) => {
  try {
    const codigo = await siguienteCodigoLectura("rutas", "RUTA-", 2);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
};

export const crearRuta = async (req, res) => {
  try {
    const nombre = texto(req.body?.nombre);
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la ruta es obligatorio." });
    const descripcion = texto(req.body?.descripcion);
    const responsable = await resolverUsuario(req.body?.empleado);
    const zonas = await resolverZonas(req.body?.zonasDespacho);
    const diasAtencion = diasValidos(req.body?.diasAtencion);
    const estado = req.body?.estado === "Inactiva" ? "Inactiva" : "Activa";

    const creada = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "rutas");
      const codigo = `RUTA-${String(c.ultimoNumero).padStart(2, "0")}`;
      const r = await tx.ruta.create({
        data: {
          codigo, nombre, descripcion,
          usuarioResponsableId: responsable?.id || null,
          diasAtencion, estado,
        },
      });
      if (zonas.length) {
        await tx.rutaZona.createMany({
          data: zonas.map((zonaId) => ({ rutaId: r.id, zonaId })),
          skipDuplicates: true,
        });
      }
      return tx.ruta.findUnique({ where: { id: r.id }, include: includeRuta });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Rutas", accion: "Crear",
      registroId: creada.id, codigoRegistro: creada.codigo,
      descripcion: `Se creó la ruta ${creada.nombre}.`, datosNuevos: salida(creada),
    });
    return res.status(201).json({ mensaje: "Ruta creada correctamente.", ruta: salida(creada) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear la ruta.");
  }
};

export const actualizarRuta = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.ruta, req.params?.id, { include: includeRuta });
    if (!actual) return res.status(404).json({ mensaje: "La ruta no existe." });

    const nombre = req.body?.nombre !== undefined ? texto(req.body.nombre) : actual.nombre;
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la ruta es obligatorio." });

    const responsable = req.body?.empleado !== undefined
      ? await resolverUsuario(req.body.empleado)
      : actual.usuarioResponsable;
    const zonas = req.body?.zonasDespacho !== undefined
      ? await resolverZonas(req.body.zonasDespacho)
      : actual.zonas.map((x) => x.zonaId);
    const diasAtencion = req.body?.diasAtencion !== undefined
      ? diasValidos(req.body.diasAtencion)
      : actual.diasAtencion;
    const descripcion = req.body?.descripcion !== undefined ? texto(req.body.descripcion) : actual.descripcion;
    const estado = req.body?.estado === "Activa" || req.body?.estado === "Inactiva" ? req.body.estado : actual.estado;

    const nueva = await prisma.$transaction(async (tx) => {
      await tx.ruta.update({
        where: { id: actual.id },
        data: {
          nombre, descripcion, usuarioResponsableId: responsable?.id || null,
          diasAtencion, estado,
        },
      });
      await tx.rutaZona.deleteMany({ where: { rutaId: actual.id } });
      if (zonas.length) {
        await tx.rutaZona.createMany({
          data: zonas.map((zonaId) => ({ rutaId: actual.id, zonaId })),
          skipDuplicates: true,
        });
      }
      return tx.ruta.findUnique({ where: { id: actual.id }, include: includeRuta });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Rutas", accion: "Actualizar",
      registroId: nueva.id, codigoRegistro: nueva.codigo,
      descripcion: `Se actualizó la ruta ${nueva.nombre}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });
    return res.json({ mensaje: "Ruta actualizada correctamente.", ruta: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar la ruta.");
  }
};

export const cambiarEstadoRuta = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.ruta, req.params?.id, { include: includeRuta });
    if (!actual) return res.status(404).json({ mensaje: "La ruta no existe." });
    const estado = req.body?.estado === "Activa" || req.body?.estado === "Inactiva"
      ? req.body.estado
      : actual.estado === "Activa" ? "Inactiva" : "Activa";

    const nueva = await prisma.ruta.update({ where: { id: actual.id }, data: { estado }, include: includeRuta });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Rutas", accion: "Estado",
      registroId: nueva.id, codigoRegistro: nueva.codigo,
      descripcion: `La ruta ${nueva.nombre} quedó ${estado}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });
    return res.json({ mensaje: "Estado actualizado correctamente.", ruta: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible cambiar el estado de la ruta.");
  }
};

export const eliminarRuta = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.ruta, req.params?.id, { include: includeRuta });
    if (!actual) return res.status(404).json({ mensaje: "La ruta no existe." });

    const [empleados, pedidos, entregas] = await Promise.all([
      prisma.empleado.count({ where: { rutaAsignadaId: actual.id } }),
      prisma.pedido.count({ where: { rutaId: actual.id } }),
      prisma.entrega.count({ where: { rutaId: actual.id } }),
    ]);
    if (empleados + pedidos + entregas > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar la ruta porque tiene empleados o historial operativo. Puedes dejarla Inactiva.",
      });
    }

    await prisma.ruta.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Rutas", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo,
      descripcion: `Se eliminó la ruta ${actual.nombre}.`, datosAnteriores: salida(actual),
    });
    return res.json({ mensaje: "Ruta eliminada correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar la ruta.");
  }
};
