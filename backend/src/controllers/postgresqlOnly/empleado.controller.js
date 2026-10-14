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

function rutaSalida(r) {
  if (!r) return null;
  return {
    _id: idCompatibilidad(r), id: idCompatibilidad(r), postgresId: r.id,
    legacyMongoId: r.legacyMongoId || null, codigo: r.codigo, nombre: r.nombre, estado: r.estado,
  };
}

function usuarioSalida(u) {
  if (!u) return null;
  return {
    _id: idCompatibilidad(u), id: idCompatibilidad(u), postgresId: u.id,
    legacyMongoId: u.legacyMongoId || null, codigo: u.codigo, usuario: u.usuario,
    nombres: u.nombres, apellidos: u.apellidos,
    nombre: [u.nombres, u.apellidos].filter(Boolean).join(" ").trim(),
    rol: u.rol, estado: u.estado,
  };
}

function salida(e) {
  if (!e) return null;
  return {
    _id: idCompatibilidad(e), id: idCompatibilidad(e), postgresId: e.id,
    legacyMongoId: e.legacyMongoId || null, codigo: e.codigo,
    tipoDocumento: e.tipoDocumento, documento: e.documento,
    nombres: e.nombres, apellidos: e.apellidos,
    nombreCompleto: [e.nombres, e.apellidos].filter(Boolean).join(" ").trim(),
    telefono: e.telefono, direccion: e.direccion, ciudad: e.ciudad,
    cargo: e.cargo, fechaIngreso: e.fechaIngreso, salario: numero(e.salario),
    rutaAsignada: rutaSalida(e.rutaAsignada), usuario: usuarioSalida(e.usuario),
    estado: e.estado, observaciones: e.observaciones,
    createdAt: e.createdAt, updatedAt: e.updatedAt,
  };
}

const includeEmpleado = { rutaAsignada: true, usuario: true };

async function resolverRuta(valor) {
  const id = valorId(valor);
  if (!id) return null;
  const r = pareceObjectIdMongo(id)
    ? await prisma.ruta.findUnique({ where: { legacyMongoId: id } })
    : await prisma.ruta.findUnique({ where: { id } });
  if (!r) throw new Error("La ruta asignada no existe.");
  return r;
}

async function resolverUsuario(valor) {
  const id = valorId(valor);
  if (!id) return null;
  const u = pareceObjectIdMongo(id)
    ? await prisma.usuario.findUnique({ where: { legacyMongoId: id } })
    : await prisma.usuario.findUnique({ where: { id } });
  if (!u) throw new Error("El usuario seleccionado no existe.");
  return u;
}

function fecha(valor, fallback = new Date()) {
  if (!valor) return fallback;
  const f = new Date(valor);
  if (Number.isNaN(f.getTime())) throw new Error("La fecha de ingreso no es válida.");
  return f;
}

export async function listarEmpleados(_req, res) {
  try {
    const rows = await prisma.empleado.findMany({
      include: includeEmpleado, orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
    });
    return res.json(rows.map(salida));
  } catch (e) {
    return responderError(res, e, "No fue posible listar los empleados.");
  }
}

export async function listarEmpleadosPedidos(_req, res) {
  try {
    const rows = await prisma.empleado.findMany({
      where: { estado: "Activo" },
      select: {
        id: true, legacyMongoId: true, codigo: true, nombres: true, apellidos: true,
        cargo: true, estado: true,
      },
      orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
    });
    return res.json(rows.map((e) => ({
      _id: idCompatibilidad(e), id: idCompatibilidad(e), postgresId: e.id,
      legacyMongoId: e.legacyMongoId || null, codigo: e.codigo,
      nombres: e.nombres, apellidos: e.apellidos,
      nombreCompleto: [e.nombres, e.apellidos].filter(Boolean).join(" ").trim(),
      cargo: e.cargo, estado: e.estado,
    })));
  } catch (e) {
    return responderError(res, e, "No fue posible listar el personal disponible.");
  }
}

export async function obtenerEmpleadoPorId(req, res) {
  try {
    const e = await buscarPorIdOlegacy(prisma.empleado, req.params?.id, { include: includeEmpleado });
    if (!e) return res.status(404).json({ mensaje: "El empleado no existe." });
    return res.json(salida(e));
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el empleado.");
  }
}

export async function obtenerSiguienteCodigoEmpleado(_req, res) {
  try {
    const codigo = await siguienteCodigoLectura("empleados", "EMP-", 4);
    return res.json({ codigo });
  } catch (e) {
    return responderError(res, e, "No fue posible obtener el siguiente código.");
  }
}

export async function crearEmpleado(req, res) {
  try {
    const documento = texto(req.body?.documento);
    const nombres = texto(req.body?.nombres);
    const apellidos = texto(req.body?.apellidos);
    const cargo = texto(req.body?.cargo);
    if (!documento) return res.status(400).json({ mensaje: "El documento del empleado es obligatorio." });
    if (!nombres) return res.status(400).json({ mensaje: "Los nombres del empleado son obligatorios." });
    if (!apellidos) return res.status(400).json({ mensaje: "Los apellidos del empleado son obligatorios." });
    if (!cargo) return res.status(400).json({ mensaje: "El cargo del empleado es obligatorio." });

    const existe = await prisma.empleado.findUnique({ where: { documento } });
    if (existe) return res.status(400).json({ mensaje: "Ya existe un empleado con ese documento." });

    const ruta = await resolverRuta(req.body?.rutaAsignada);
    const usuario = await resolverUsuario(req.body?.usuario);
    const salario = numero(req.body?.salario);
    if (salario < 0) return res.status(400).json({ mensaje: "El salario no es válido." });

    const creado = await prisma.$transaction(async (tx) => {
      const c = await incrementarConsecutivoTx(tx, "empleados");
      const codigo = `EMP-${String(c.ultimoNumero).padStart(4, "0")}`;
      return tx.empleado.create({
        data: {
          codigo,
          tipoDocumento: texto(req.body?.tipoDocumento) || "CC",
          documento, nombres, apellidos,
          telefono: texto(req.body?.telefono),
          direccion: texto(req.body?.direccion),
          ciudad: texto(req.body?.ciudad) || "Ibagué",
          cargo,
          fechaIngreso: fecha(req.body?.fechaIngreso),
          salario,
          rutaAsignadaId: ruta?.id || null,
          usuarioId: usuario?.id || null,
          estado: req.body?.estado === "Inactivo" ? "Inactivo" : "Activo",
          observaciones: texto(req.body?.observaciones),
        },
        include: includeEmpleado,
      });
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Empleados", accion: "Crear",
      registroId: creado.id, codigoRegistro: creado.codigo,
      descripcion: `Se creó el empleado ${creado.nombres} ${creado.apellidos}.`,
      datosNuevos: salida(creado),
    });
    return res.status(201).json({ mensaje: "Empleado creado correctamente.", empleado: salida(creado) });
  } catch (e) {
    return responderError(res, e, "No fue posible crear el empleado.");
  }
}

export async function actualizarEmpleado(req, res) {
  try {
    const actual = await buscarPorIdOlegacy(prisma.empleado, req.params?.id, { include: includeEmpleado });
    if (!actual) return res.status(404).json({ mensaje: "El empleado no existe." });

    const documento = req.body?.documento !== undefined ? texto(req.body.documento) : actual.documento;
    const nombres = req.body?.nombres !== undefined ? texto(req.body.nombres) : actual.nombres;
    const apellidos = req.body?.apellidos !== undefined ? texto(req.body.apellidos) : actual.apellidos;
    const cargo = req.body?.cargo !== undefined ? texto(req.body.cargo) : actual.cargo;
    if (!documento || !nombres || !apellidos || !cargo) {
      return res.status(400).json({ mensaje: "Documento, nombres, apellidos y cargo son obligatorios." });
    }

    const duplicado = await prisma.empleado.findFirst({
      where: { id: { not: actual.id }, documento },
    });
    if (duplicado) return res.status(400).json({ mensaje: "Ya existe un empleado con ese documento." });

    const ruta = req.body?.rutaAsignada !== undefined ? await resolverRuta(req.body.rutaAsignada) : actual.rutaAsignada;
    const usuario = req.body?.usuario !== undefined ? await resolverUsuario(req.body.usuario) : actual.usuario;
    const salario = req.body?.salario !== undefined ? numero(req.body.salario) : numero(actual.salario);
    if (salario < 0) return res.status(400).json({ mensaje: "El salario no es válido." });

    const nuevo = await prisma.empleado.update({
      where: { id: actual.id },
      data: {
        tipoDocumento: req.body?.tipoDocumento !== undefined ? texto(req.body.tipoDocumento) || "CC" : actual.tipoDocumento,
        documento, nombres, apellidos,
        telefono: req.body?.telefono !== undefined ? texto(req.body.telefono) : actual.telefono,
        direccion: req.body?.direccion !== undefined ? texto(req.body.direccion) : actual.direccion,
        ciudad: req.body?.ciudad !== undefined ? texto(req.body.ciudad) || "Ibagué" : actual.ciudad,
        cargo,
        fechaIngreso: req.body?.fechaIngreso !== undefined ? fecha(req.body.fechaIngreso, actual.fechaIngreso) : actual.fechaIngreso,
        salario,
        rutaAsignadaId: ruta?.id || null,
        usuarioId: usuario?.id || null,
        estado: req.body?.estado === "Activo" || req.body?.estado === "Inactivo" ? req.body.estado : actual.estado,
        observaciones: req.body?.observaciones !== undefined ? texto(req.body.observaciones) : actual.observaciones,
      },
      include: includeEmpleado,
    });

    await registrarAuditoriaPostgreSQL({
      req, modulo: "Empleados", accion: "Actualizar",
      registroId: nuevo.id, codigoRegistro: nuevo.codigo,
      descripcion: `Se actualizó el empleado ${nuevo.nombres} ${nuevo.apellidos}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nuevo),
    });
    return res.json({ mensaje: "Empleado actualizado correctamente.", empleado: salida(nuevo) });
  } catch (e) {
    return responderError(res, e, "No fue posible actualizar el empleado.");
  }
}

export async function cambiarEstadoEmpleado(req, res) {
  try {
    const actual = await buscarPorIdOlegacy(prisma.empleado, req.params?.id, { include: includeEmpleado });
    if (!actual) return res.status(404).json({ mensaje: "El empleado no existe." });
    const estado = req.body?.estado === "Activo" || req.body?.estado === "Inactivo"
      ? req.body.estado
      : actual.estado === "Activo" ? "Inactivo" : "Activo";
    const nuevo = await prisma.empleado.update({
      where: { id: actual.id }, data: { estado }, include: includeEmpleado,
    });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Empleados", accion: "Estado",
      registroId: nuevo.id, codigoRegistro: nuevo.codigo,
      descripcion: `El empleado ${nuevo.nombres} ${nuevo.apellidos} quedó ${estado}.`,
      datosAnteriores: salida(actual), datosNuevos: salida(nuevo),
    });
    return res.json({ mensaje: "Estado actualizado correctamente.", empleado: salida(nuevo) });
  } catch (e) {
    return responderError(res, e, "No fue posible cambiar el estado del empleado.");
  }
}

export async function eliminarEmpleado(req, res) {
  try {
    const actual = await buscarPorIdOlegacy(prisma.empleado, req.params?.id, { include: includeEmpleado });
    if (!actual) return res.status(404).json({ mensaje: "El empleado no existe." });

    const [p1, p2, e1, e2, f1, f2, f3] = await Promise.all([
      prisma.pedido.count({ where: { empleadoId: actual.id } }),
      prisma.pedido.count({ where: { empacadorId: actual.id } }),
      prisma.entrega.count({ where: { empacadorId: actual.id } }),
      prisma.entrega.count({ where: { repartidorId: actual.id } }),
      prisma.factura.count({ where: { empleadoId: actual.id } }),
      prisma.factura.count({ where: { empacadorId: actual.id } }),
      prisma.factura.count({ where: { repartidorId: actual.id } }),
    ]);
    if (p1 + p2 + e1 + e2 + f1 + f2 + f3 > 0) {
      return res.status(400).json({
        mensaje: "No puedes eliminar el empleado porque tiene historial operativo. Puedes dejarlo Inactivo.",
      });
    }

    await prisma.empleado.delete({ where: { id: actual.id } });
    await registrarAuditoriaPostgreSQL({
      req, modulo: "Empleados", accion: "Eliminar",
      registroId: actual.id, codigoRegistro: actual.codigo,
      descripcion: `Se eliminó el empleado ${actual.nombres} ${actual.apellidos}.`,
      datosAnteriores: salida(actual),
    });
    return res.json({ mensaje: "Empleado eliminado correctamente." });
  } catch (e) {
    return responderError(res, e, "No fue posible eliminar el empleado.");
  }
}
