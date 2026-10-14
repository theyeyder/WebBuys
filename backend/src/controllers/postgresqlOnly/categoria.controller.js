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

function salida(c) {
  if (!c) return null;
  return {
    _id: idCompatibilidad(c),
    id: idCompatibilidad(c),
    postgresId: c.id,
    legacyMongoId: c.legacyMongoId || null,
    codigo: c.codigo,
    nombre: c.nombre,
    descripcion: c.descripcion,
    estado: c.estado,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export const listarCategorias = async (_req, res) => {
  try {
    const rows = await prisma.categoria.findMany({ orderBy: [{ nombre: "asc" }] });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar las categorías.");
  }
};

export const obtenerSiguienteCodigoCategoria = async (_req, res) => {
  try {
    const codigo = await siguienteCodigoLectura("categorias", "CAT-", 4);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
};

export const crearCategoria = async (req, res) => {
  try {
    const nombre = texto(req.body?.nombre);
    const descripcion = texto(req.body?.descripcion);
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la categoría es obligatorio." });

    const existe = await prisma.categoria.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existe) return res.status(400).json({ mensaje: "Ya existe una categoría con ese nombre." });

    const creada = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "categorias");
      const codigo = `CAT-${String(c.ultimoNumero).padStart(4, "0")}`;
      return tx.categoria.create({
        data: { codigo, nombre, descripcion, estado: "Activa" },
      });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Categorías", accion: "Crear",
      registroId: creada.id, codigoRegistro: creada.codigo,
      descripcion: `Se creó la categoría ${creada.nombre}.`,
      datosNuevos: salida(creada),
    });

    return res.status(201).json({ mensaje: "Categoría creada correctamente.", categoria: salida(creada) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear la categoría.");
  }
};

export const actualizarCategoria = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.categoria, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La categoría no existe." });

    const nombre = req.body?.nombre !== undefined ? texto(req.body.nombre) : actual.nombre;
    const descripcion = req.body?.descripcion !== undefined ? texto(req.body.descripcion) : actual.descripcion;
    if (!nombre) return res.status(400).json({ mensaje: "El nombre de la categoría es obligatorio." });

    const duplicada = await prisma.categoria.findFirst({
      where: {
        id: { not: actual.id },
        nombre: { equals: nombre, mode: "insensitive" },
      },
    });
    if (duplicada) return res.status(400).json({ mensaje: "Ya existe una categoría con ese nombre." });

    const nueva = await prisma.categoria.update({
      where: { id: actual.id },
      data: { nombre, descripcion },
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Categorías", accion: "Actualizar",
      registroId: nueva.id, codigoRegistro: nueva.codigo,
      descripcion: `Se actualizó la categoría ${nueva.nombre}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });

    return res.json({ mensaje: "Categoría actualizada correctamente.", categoria: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar la categoría.");
  }
};

export const cambiarEstadoCategoria = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.categoria, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La categoría no existe." });

    const estado = req.body?.estado === "Activa" || req.body?.estado === "Inactiva"
      ? req.body.estado
      : actual.estado === "Activa" ? "Inactiva" : "Activa";

    const nueva = await prisma.categoria.update({ where: { id: actual.id }, data: { estado } });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Categorías", accion: "Estado",
      registroId: nueva.id, codigoRegistro: nueva.codigo,
      descripcion: `La categoría ${nueva.nombre} quedó ${estado}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nueva),
    });

    return res.json({ mensaje: "Estado actualizado correctamente.", categoria: salida(nueva) });
  } catch (e) {
    return responderError(res, e, "No fue posible cambiar el estado de la categoría.");
  }
};

export const eliminarCategoria = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.categoria, req.params?.id);
    if (!actual) return res.status(404).json({ mensaje: "La categoría no existe." });

    const productos = await prisma.producto.count({ where: { categoriaId: actual.id } });
    if (productos > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar la categoría porque tiene productos asociados. Puedes dejarla Inactiva.",
      });
    }

    await prisma.categoria.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Categorías", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo,
      descripcion: `Se eliminó la categoría ${actual.nombre}.`,
      datosAnteriores: salida(actual),
    });

    return res.json({ mensaje: "Categoría eliminada correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar la categoría.");
  }
};
