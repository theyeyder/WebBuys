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
  numero,
} from "./_shared.js";

function reglaSalida(r) {
  return {
    _id: idCompatibilidad(r), id: idCompatibilidad(r), postgresId: r.id,
    desde: numero(r.desde), precio: numero(r.precio),
  };
}

function presentacionSalida(p) {
  return {
    _id: idCompatibilidad(p), id: idCompatibilidad(p), postgresId: p.id,
    legacyMongoId: p.legacyMongoId || null,
    nombre: p.nombre, tipoVenta: p.tipoVenta, unidad: p.unidad,
    precioCompra: numero(p.precioCompra), precioVenta: numero(p.precioVenta),
    stock: numero(p.stock), stockReservado: numero(p.stockReservado),
    stockMinimo: numero(p.stockMinimo),
    controlInventario: p.controlInventario !== false,
    costoPromedio: numero(p.costoPromedio),
    reglasPrecio: (p.reglasPrecio || []).map(reglaSalida),
    estado: p.estado, createdAt: p.createdAt, updatedAt: p.updatedAt,
  };
}

function salida(p) {
  if (!p) return null;
  return {
    _id: idCompatibilidad(p), id: idCompatibilidad(p), postgresId: p.id,
    legacyMongoId: p.legacyMongoId || null, codigo: p.codigo, nombre: p.nombre,
    categoria: p.categoria ? {
      _id: idCompatibilidad(p.categoria), id: idCompatibilidad(p.categoria),
      postgresId: p.categoria.id, legacyMongoId: p.categoria.legacyMongoId || null,
      codigo: p.categoria.codigo, nombre: p.categoria.nombre, estado: p.categoria.estado,
    } : null,
    marca: p.marca, descripcion: p.descripcion, tipoVenta: p.tipoVenta, unidad: p.unidad,
    precioCompra: numero(p.precioCompra), precioVenta: numero(p.precioVenta),
    stock: numero(p.stock), stockReservado: numero(p.stockReservado),
    stockMinimo: numero(p.stockMinimo),
    controlInventario: p.controlInventario !== false,
    costoPromedio: numero(p.costoPromedio),
    reglasPrecio: (p.reglasPrecio || []).map(reglaSalida),
    presentacionesAdicionales: (p.presentaciones || []).map(presentacionSalida),
    sabores: p.sabores || [], imagen: p.imagen, estado: p.estado,
    creadoPor: p.creadoPor ? idCompatibilidad(p.creadoPor) : null,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  };
}

const includeProducto = {
  categoria: true,
  creadoPor: true,
  reglasPrecio: { orderBy: [{ orden: "asc" }, { desde: "asc" }] },
  presentaciones: {
    include: { reglasPrecio: { orderBy: [{ orden: "asc" }, { desde: "asc" }] } },
    orderBy: [{ orden: "asc" }],
  },
};

function normalizarReglas(reglas = []) {
  if (!Array.isArray(reglas)) throw new Error("Las reglas de precio no son válidas.");
  const vistos = new Set();
  return reglas.map((r, orden) => {
    const desde = Number(r.desde);
    const precio = Number(r.precio);
    if (!Number.isFinite(desde) || desde <= 0) throw new Error("La cantidad mínima de una regla debe ser mayor que cero.");
    if (!Number.isFinite(precio) || precio < 0) throw new Error("El precio de una regla no es válido.");
    if (vistos.has(desde)) throw new Error(`Ya existe una regla desde ${desde}.`);
    vistos.add(desde);
    return { desde, precio, orden };
  }).sort((a, b) => a.desde - b.desde).map((x, orden) => ({ ...x, orden }));
}

function normalizarPresentaciones(presentaciones = [], existentes = new Map()) {
  if (!Array.isArray(presentaciones)) throw new Error("Las presentaciones adicionales no son válidas.");
  return presentaciones.map((p, orden) => {
    const nombre = texto(p.nombre);
    const unidad = texto(p.unidad);
    if (!nombre) throw new Error("Toda presentación adicional debe tener nombre.");
    if (!unidad) throw new Error("Toda presentación adicional debe tener unidad.");
    const precioCompra = numero(p.precioCompra);
    const precioVenta = Number(p.precioVenta);
    const stockMinimo = numero(p.stockMinimo);
    if (precioCompra < 0) throw new Error("El valor unitario de una presentación no es válido.");
    if (!Number.isFinite(precioVenta) || precioVenta < 0) throw new Error("El precio de venta de una presentación no es válido.");
    if (stockMinimo < 0) throw new Error("El stock mínimo de una presentación no es válido.");

    const pid = valorId(p);
    const existente = pid ? existentes.get(pid) : null;
    return {
      idExistente: existente?.id || null,
      nombre,
      tipoVenta: p.tipoVenta === "Peso" ? "Peso" : "Unidad",
      unidad,
      precioCompra,
      precioVenta,
      stock: existente ? numero(existente.stock) : numero(p.stock),
      stockReservado: existente ? numero(existente.stockReservado) : 0,
      stockMinimo,
      controlInventario: existente ? existente.controlInventario !== false : true,
      costoPromedio: existente ? numero(existente.costoPromedio) : precioCompra,
      estado: p.estado === "Inactiva" ? "Inactiva" : "Activa",
      orden,
      reglas: normalizarReglas(p.reglasPrecio || []),
    };
  });
}

function normalizarSabores(sabores = []) {
  if (!Array.isArray(sabores)) return [];
  return [...new Set(sabores.map((x) => texto(x)).filter(Boolean))];
}

async function resolverCategoria(valor) {
  const id = valorId(valor);
  if (!id) throw new Error("Debes seleccionar una categoría.");
  const c = pareceObjectIdMongo(id)
    ? await prisma.categoria.findUnique({ where: { legacyMongoId: id } })
    : await prisma.categoria.findUnique({ where: { id } });
  if (!c) throw new Error("La categoría seleccionada no existe.");
  if (c.estado !== "Activa") throw new Error("La categoría seleccionada no está Activa.");
  return c;
}

async function creadorId(req) {
  const u = req?.usuario || req?.user || null;
  const id = valorId(u);
  if (!id) return null;
  const row = pareceObjectIdMongo(id)
    ? await prisma.usuario.findUnique({ where: { legacyMongoId: id }, select: { id: true } })
    : await prisma.usuario.findUnique({ where: { id }, select: { id: true } }).catch(() => null);
  return row?.id || u?.postgresId || null;
}

export const listarProductos = async (_req, res) => {
  try {
    const rows = await prisma.producto.findMany({
      include: includeProducto, orderBy: [{ nombre: "asc" }],
    });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar los productos.");
  }
};

export const obtenerSiguienteCodigoProducto = async (_req, res) => {
  try {
    const codigo = await siguienteCodigoLectura("productos", "PROD-", 4);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
};

export const crearProducto = async (req, res) => {
  try {
    const nombre = texto(req.body?.nombre);
    const unidad = texto(req.body?.unidad);
    if (!nombre) return res.status(400).json({ mensaje: "El nombre del producto es obligatorio." });
    if (!unidad) return res.status(400).json({ mensaje: "Debes seleccionar una unidad." });

    const categoria = await resolverCategoria(req.body?.categoria);
    const precioCompra = numero(req.body?.precioCompra);
    const precioVenta = Number(req.body?.precioVenta);
    const stock = numero(req.body?.stock);
    const stockMinimo = numero(req.body?.stockMinimo);
    if (precioCompra < 0) return res.status(400).json({ mensaje: "El valor unitario no es válido." });
    if (!Number.isFinite(precioVenta) || precioVenta < 0) return res.status(400).json({ mensaje: "El precio de venta no es válido." });
    if (stock < 0) return res.status(400).json({ mensaje: "El stock no es válido." });
    if (stockMinimo < 0) return res.status(400).json({ mensaje: "El stock mínimo no es válido." });

    const existe = await prisma.producto.findFirst({
      where: { categoriaId: categoria.id, nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existe) return res.status(400).json({ mensaje: "Ya existe un producto con ese nombre dentro de esta categoría." });

    const reglas = normalizarReglas(req.body?.reglasPrecio || []);
    const presentaciones = normalizarPresentaciones(req.body?.presentacionesAdicionales || []);
    const creadoPorId = await creadorId(req);

    const creado = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "productos");
      const codigo = `PROD-${String(c.ultimoNumero).padStart(4, "0")}`;
      const p = await tx.producto.create({
        data: {
          codigo, nombre, categoriaId: categoria.id,
          marca: texto(req.body?.marca), descripcion: texto(req.body?.descripcion),
          tipoVenta: req.body?.tipoVenta === "Peso" ? "Peso" : "Unidad",
          unidad, precioCompra, precioVenta, stock, stockReservado: 0,
          stockMinimo, controlInventario: true,
          costoPromedio: stock > 0 ? precioCompra : 0,
          sabores: normalizarSabores(req.body?.sabores),
          imagen: String(req.body?.imagen || ""), estado: "Activo", creadoPorId,
        },
      });

      if (reglas.length) {
        await tx.reglaPrecio.createMany({
          data: reglas.map((r) => ({ productoId: p.id, desde: r.desde, precio: r.precio, orden: r.orden })),
        });
      }

      for (const pr of presentaciones) {
        const pp = await tx.productoPresentacion.create({
          data: {
            productoId: p.id, nombre: pr.nombre, tipoVenta: pr.tipoVenta, unidad: pr.unidad,
            precioCompra: pr.precioCompra, precioVenta: pr.precioVenta,
            stock: pr.stock, stockReservado: pr.stockReservado,
            stockMinimo: pr.stockMinimo, controlInventario: pr.controlInventario,
            costoPromedio: pr.stock > 0 ? pr.precioCompra : 0,
            estado: pr.estado, orden: pr.orden,
          },
        });
        if (pr.reglas.length) {
          await tx.reglaPrecio.createMany({
            data: pr.reglas.map((r) => ({ presentacionId: pp.id, desde: r.desde, precio: r.precio, orden: r.orden })),
          });
        }
      }

      return tx.producto.findUnique({ where: { id: p.id }, include: includeProducto });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Productos", accion: "Crear",
      registroId: creado.id, codigoRegistro: creado.codigo,
      descripcion: `Se creó el producto ${creado.nombre}.`, datosNuevos: salida(creado),
    });
    return res.status(201).json({ mensaje: "Producto creado correctamente.", producto: salida(creado) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear el producto.");
  }
};

export const actualizarProducto = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.producto, req.params?.id, { include: includeProducto });
    if (!actual) return res.status(404).json({ mensaje: "El producto no existe." });

    const nombre = texto(req.body?.nombre);
    const unidad = texto(req.body?.unidad);
    if (!nombre) return res.status(400).json({ mensaje: "El nombre del producto es obligatorio." });
    if (!unidad) return res.status(400).json({ mensaje: "Debes seleccionar una unidad." });

    const categoria = await resolverCategoria(req.body?.categoria);
    const precioCompra = numero(req.body?.precioCompra);
    const precioVenta = Number(req.body?.precioVenta);
    const stockMinimo = numero(req.body?.stockMinimo);
    if (precioCompra < 0 || !Number.isFinite(precioVenta) || precioVenta < 0 || stockMinimo < 0) {
      return res.status(400).json({ mensaje: "Los valores del producto no son válidos." });
    }

    const duplicado = await prisma.producto.findFirst({
      where: {
        id: { not: actual.id }, categoriaId: categoria.id,
        nombre: { equals: nombre, mode: "insensitive" },
      },
    });
    if (duplicado) return res.status(400).json({ mensaje: "Ya existe un producto con ese nombre dentro de esta categoría." });

    const reglas = normalizarReglas(req.body?.reglasPrecio || []);
    const existentes = new Map();
    for (const p of actual.presentaciones) {
      existentes.set(p.id, p);
      if (p.legacyMongoId) existentes.set(p.legacyMongoId, p);
    }
    const presentaciones = normalizarPresentaciones(req.body?.presentacionesAdicionales || [], existentes);
    const idsMantener = new Set(presentaciones.map((p) => p.idExistente).filter(Boolean));

    for (const p of actual.presentaciones) {
      if (!idsMantener.has(p.id)) {
        const [pi, ei, mi] = await Promise.all([
          prisma.pedidoItem.count({ where: { presentacionId: p.id } }),
          prisma.entregaItem.count({ where: { presentacionId: p.id } }),
          prisma.movimientoInventario.count({ where: { presentacionId: p.id } }),
        ]);
        if (pi + ei + mi > 0) {
          return res.status(400).json({
            mensaje: `No puedes eliminar la presentación "${p.nombre}" porque tiene historial en pedidos, entregas o inventario. Puedes dejarla Inactiva.`,
          });
        }
      }
    }

    const nuevo = await prisma.$transaction(async (tx) => {
      await tx.producto.update({
        where: { id: actual.id },
        data: {
          nombre, categoriaId: categoria.id,
          marca: texto(req.body?.marca), descripcion: texto(req.body?.descripcion),
          tipoVenta: req.body?.tipoVenta === "Peso" ? "Peso" : "Unidad",
          unidad, precioCompra, precioVenta, stockMinimo,
          sabores: normalizarSabores(req.body?.sabores),
          imagen: String(req.body?.imagen || ""),
        },
      });

      await tx.reglaPrecio.deleteMany({ where: { productoId: actual.id } });
      if (reglas.length) {
        await tx.reglaPrecio.createMany({
          data: reglas.map((r) => ({ productoId: actual.id, desde: r.desde, precio: r.precio, orden: r.orden })),
        });
      }

      for (const p of actual.presentaciones) {
        if (!idsMantener.has(p.id)) {
          await tx.productoPresentacion.delete({ where: { id: p.id } });
        }
      }

      for (const pr of presentaciones) {
        let pp;
        if (pr.idExistente) {
          pp = await tx.productoPresentacion.update({
            where: { id: pr.idExistente },
            data: {
              nombre: pr.nombre, tipoVenta: pr.tipoVenta, unidad: pr.unidad,
              precioCompra: pr.precioCompra, precioVenta: pr.precioVenta,
              stockMinimo: pr.stockMinimo, estado: pr.estado, orden: pr.orden,
            },
          });
          await tx.reglaPrecio.deleteMany({ where: { presentacionId: pp.id } });
        } else {
          pp = await tx.productoPresentacion.create({
            data: {
              productoId: actual.id, nombre: pr.nombre, tipoVenta: pr.tipoVenta, unidad: pr.unidad,
              precioCompra: pr.precioCompra, precioVenta: pr.precioVenta,
              stock: 0, stockReservado: 0, stockMinimo: pr.stockMinimo,
              controlInventario: true, costoPromedio: 0, estado: pr.estado, orden: pr.orden,
            },
          });
        }
        if (pr.reglas.length) {
          await tx.reglaPrecio.createMany({
            data: pr.reglas.map((r) => ({ presentacionId: pp.id, desde: r.desde, precio: r.precio, orden: r.orden })),
          });
        }
      }

      return tx.producto.findUnique({ where: { id: actual.id }, include: includeProducto });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Productos", accion: "Actualizar",
      registroId: nuevo.id, codigoRegistro: nuevo.codigo,
      descripcion: `Se actualizó el producto ${nuevo.nombre}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nuevo),
    });
    return res.json({ mensaje: "Producto actualizado correctamente.", producto: salida(nuevo) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar el producto.");
  }
};

export const cambiarEstadoProducto = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.producto, req.params?.id, { include: includeProducto });
    if (!actual) return res.status(404).json({ mensaje: "El producto no existe." });
    const estado = req.body?.estado === "Activo" || req.body?.estado === "Inactivo"
      ? req.body.estado
      : actual.estado === "Activo" ? "Inactivo" : "Activo";
    const nuevo = await prisma.producto.update({
      where: { id: actual.id }, data: { estado }, include: includeProducto,
    });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Productos", accion: "Estado",
      registroId: nuevo.id, codigoRegistro: nuevo.codigo,
      descripcion: `El producto ${nuevo.nombre} quedó ${estado}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nuevo),
    });
    return res.json({ mensaje: "Estado actualizado correctamente.", producto: salida(nuevo) });
  } catch (e) {
    return responderError(res, e, "No fue posible cambiar el estado del producto.");
  }
};

export const eliminarProducto = async (req, res) => {
  try {
    const actual = await buscarPorIdOlegacy(prisma.producto, req.params?.id, { include: includeProducto });
    if (!actual) return res.status(404).json({ mensaje: "El producto no existe." });

    const [pedidos, entregas, facturas, movs] = await Promise.all([
      prisma.pedidoItem.count({ where: { productoId: actual.id } }),
      prisma.entregaItem.count({ where: { productoId: actual.id } }),
      prisma.facturaItem.count({ where: { productoId: actual.id } }),
      prisma.movimientoInventario.count({ where: { productoId: actual.id } }),
    ]);
    if (pedidos + entregas + facturas + movs > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar el producto porque tiene historial. Puedes dejarlo Inactivo.",
      });
    }

    await prisma.producto.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Productos", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo,
      descripcion: `Se eliminó el producto ${actual.nombre}.`, datosAnteriores: salida(actual),
    });
    return res.json({ mensaje: "Producto eliminado correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar el producto.");
  }
};
