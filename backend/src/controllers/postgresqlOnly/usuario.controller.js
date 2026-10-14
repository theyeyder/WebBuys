import bcrypt from "bcryptjs";

import { prisma } from "../../config/postgresql.js";
import { registrarAuditoria } from "../../utils/registrarAuditoria.js";

const incluirPerfiles = {
  perfil: true,
  perfiles: {
    include: {
      perfil: true,
    },
    orderBy: {
      asignadoAt: "asc",
    },
  },
};

function serializarPerfil(perfil) {
  if (!perfil) return null;

  return {
    id: perfil.id,
    codigo: perfil.codigo,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    estado: perfil.estado,
    esSistema: perfil.esSistema,
  };
}

function perfilesSalida(user) {
  const asignados = Array.isArray(user?.perfiles)
    ? user.perfiles
        .map((item) => serializarPerfil(item?.perfil))
        .filter(Boolean)
    : [];

  if (asignados.length > 0) return asignados;

  const legado = serializarPerfil(user?.perfil);
  return legado ? [legado] : [];
}

function normalizarUsuarioSalida(user) {
  if (!user) return null;

  const perfiles = perfilesSalida(user);
  const perfilPrincipal = perfiles[0] || null;

  return {
    _id: user.id,
    id: user.id,
    legacyMongoId: user.legacyMongoId || null,
    codigo: user.codigo,
    documento: user.documento,
    nombres: user.nombres,
    apellidos: user.apellidos,
    usuario: user.usuario,
    rol: user.rol,
    perfilId: perfilPrincipal?.id || user.perfilId || null,
    perfil: perfilPrincipal,
    perfilIds: perfiles.map((perfil) => perfil.id),
    perfiles,
    estado: user.estado,
    debeCambiarPassword: user.debeCambiarPassword,
    ultimoIngreso: user.ultimoIngreso,
    creadoPorId: user.creadoPorId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

const idAuditoria = (user) => user?.legacyMongoId || user?.id || null;

function normalizarPerfilIds(reqBody = {}) {
  if (Array.isArray(reqBody?.perfilIds)) {
    return [...new Set(
      reqBody.perfilIds
        .map((id) => String(id || "").trim())
        .filter(Boolean)
    )];
  }

  const unico = String(reqBody?.perfilId || "").trim();
  return unico ? [unico] : [];
}

async function resolverPerfilesEmpleado(rol, perfilIds) {
  if (rol === "Administrador") {
    return { perfilIds: [], perfiles: [] };
  }

  if (!Array.isArray(perfilIds) || perfilIds.length === 0) {
    return {
      error: "Seleccione al menos un perfil para el usuario empleado.",
    };
  }

  const perfiles = await prisma.perfilUsuario.findMany({
    where: {
      id: { in: perfilIds },
      estado: "Activo",
    },
    orderBy: { nombre: "asc" },
  });

  if (perfiles.length !== perfilIds.length) {
    return {
      error: "Uno o más perfiles seleccionados no existen o están inactivos.",
    };
  }

  return {
    perfilIds,
    perfiles,
  };
}

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: incluirPerfiles,
      orderBy: { createdAt: "desc" },
    });

    return res.json(usuarios.map(normalizarUsuarioSalida));
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const obtenerSiguienteCodigoUsuario = async (req, res) => {
  try {
    const consecutivo = await prisma.consecutivo.findUnique({
      where: { clave: "usuarios" },
    });
    const ultimo = Number(consecutivo?.ultimoNumero || 0);
    return res.json({ codigo: `USER-${String(ultimo + 1).padStart(4, "0")}` });
  } catch (error) {
    return res.status(500).json({
      mensaje: "No fue posible obtener el siguiente código de usuario.",
    });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const {
      documento,
      nombres,
      apellidos,
      usuario,
      rol,
      password,
      repetirPassword,
    } = req.body;

    if (
      !documento ||
      !nombres ||
      !apellidos ||
      !usuario ||
      !rol ||
      !password ||
      !repetirPassword
    ) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    if (password !== repetirPassword) {
      return res.status(400).json({ mensaje: "Las contraseñas no coinciden." });
    }

    const perfilIds = normalizarPerfilIds(req.body);
    const perfilesResueltos = await resolverPerfilesEmpleado(rol, perfilIds);

    if (perfilesResueltos.error) {
      return res.status(400).json({ mensaje: perfilesResueltos.error });
    }

    const usuarioNormalizado = String(usuario).trim().toUpperCase();
    const documentoNormalizado = String(documento).trim();

    const [existeUsuario, existeDocumento] = await Promise.all([
      prisma.usuario.findFirst({
        where: { usuario: { equals: usuarioNormalizado, mode: "insensitive" } },
      }),
      prisma.usuario.findUnique({ where: { documento: documentoNormalizado } }),
    ]);

    if (existeUsuario) {
      return res.status(400).json({ mensaje: "Ese nombre de usuario ya existe." });
    }
    if (existeDocumento) {
      return res.status(400).json({
        mensaje: "Ya existe un usuario con ese documento.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const creado = await prisma.$transaction(async (tx) => {
      const consecutivo = await tx.consecutivo.upsert({
        where: { clave: "usuarios" },
        update: { ultimoNumero: { increment: 1 } },
        create: { clave: "usuarios", ultimoNumero: 1 },
      });

      const codigo = `USER-${String(consecutivo.ultimoNumero).padStart(4, "0")}`;
      const ids = perfilesResueltos.perfilIds;

      return tx.usuario.create({
        data: {
          codigo,
          documento: documentoNormalizado,
          nombres: String(nombres).trim(),
          apellidos: String(apellidos).trim(),
          usuario: usuarioNormalizado,
          rol,
          // Compatibilidad: conserva como principal el primer perfil.
          perfilId: ids[0] || null,
          perfiles: {
            create: ids.map((perfilId) => ({ perfilId })),
          },
          password: passwordHash,
          estado: "Activo",
          debeCambiarPassword: false,
          creadoPorId: req.usuario?.postgresId || req.usuario?.id || null,
        },
        include: incluirPerfiles,
      });
    });

    const perfiles = perfilesSalida(creado);

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "CREAR",
      registroId: creado.id,
      codigoRegistro: creado.codigo || "",
      descripcion: `Se creó el usuario ${creado.usuario}.`,
      datosNuevos: {
        codigo: creado.codigo,
        documento: creado.documento,
        nombres: creado.nombres,
        apellidos: creado.apellidos,
        usuario: creado.usuario,
        rol: creado.rol,
        perfilIds: perfiles.map((perfil) => perfil.id),
        perfiles: perfiles.map((perfil) => perfil.nombre),
        estado: creado.estado,
      },
    });

    return res.status(201).json({
      mensaje: "Usuario creado correctamente.",
      usuario: normalizarUsuarioSalida(creado),
    });
  } catch (error) {
    console.error("Error creando usuario PostgreSQL-only:", error);
    return res.status(500).json({ mensaje: error.message });
  }
};

export const actualizarUsuario = async (req, res) => {
  try {
    const { documento, nombres, apellidos, usuario, rol } = req.body;

    if (!documento || !nombres || !apellidos || !usuario || !rol) {
      return res.status(400).json({ mensaje: "Todos los campos son obligatorios." });
    }

    const anterior = await prisma.usuario.findUnique({
      where: { id: req.params.id },
      include: incluirPerfiles,
    });
    if (!anterior) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const perfilIds = normalizarPerfilIds(req.body);
    const perfilesResueltos = await resolverPerfilesEmpleado(rol, perfilIds);

    if (perfilesResueltos.error) {
      return res.status(400).json({ mensaje: perfilesResueltos.error });
    }

    const usuarioNormalizado = String(usuario).trim().toUpperCase();
    const documentoNormalizado = String(documento).trim();

    const [existeUsuario, existeDocumento] = await Promise.all([
      prisma.usuario.findFirst({
        where: {
          usuario: { equals: usuarioNormalizado, mode: "insensitive" },
          NOT: { id: anterior.id },
        },
      }),
      prisma.usuario.findFirst({
        where: { documento: documentoNormalizado, NOT: { id: anterior.id } },
      }),
    ]);

    if (existeUsuario) {
      return res.status(400).json({ mensaje: "Ese nombre de usuario ya existe." });
    }
    if (existeDocumento) {
      return res.status(400).json({
        mensaje: "Ya existe otro usuario con ese documento.",
      });
    }

    const ids = perfilesResueltos.perfilIds;

    const actualizado = await prisma.usuario.update({
      where: { id: anterior.id },
      data: {
        documento: documentoNormalizado,
        nombres: String(nombres).trim(),
        apellidos: String(apellidos).trim(),
        usuario: usuarioNormalizado,
        rol,
        perfilId: ids[0] || null,
        perfiles: {
          deleteMany: {},
          create: ids.map((perfilId) => ({ perfilId })),
        },
      },
      include: incluirPerfiles,
    });

    const perfilesAnteriores = perfilesSalida(anterior);
    const perfilesNuevos = perfilesSalida(actualizado);

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "ACTUALIZAR",
      registroId: idAuditoria(anterior),
      codigoRegistro: actualizado.codigo || "",
      descripcion: `Se actualizó el usuario ${actualizado.usuario}.`,
      datosAnteriores: {
        codigo: anterior.codigo,
        documento: anterior.documento,
        nombres: anterior.nombres,
        apellidos: anterior.apellidos,
        usuario: anterior.usuario,
        rol: anterior.rol,
        perfilIds: perfilesAnteriores.map((perfil) => perfil.id),
        perfiles: perfilesAnteriores.map((perfil) => perfil.nombre),
        estado: anterior.estado,
      },
      datosNuevos: {
        codigo: actualizado.codigo,
        documento: actualizado.documento,
        nombres: actualizado.nombres,
        apellidos: actualizado.apellidos,
        usuario: actualizado.usuario,
        rol: actualizado.rol,
        perfilIds: perfilesNuevos.map((perfil) => perfil.id),
        perfiles: perfilesNuevos.map((perfil) => perfil.nombre),
        estado: actualizado.estado,
      },
    });

    return res.json(normalizarUsuarioSalida(actualizado));
  } catch (error) {
    console.error("Error actualizando usuario PostgreSQL-only:", error);
    return res.status(500).json({ mensaje: error.message });
  }
};

export const resetearPassword = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    const hash = await bcrypt.hash("123456", 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { password: hash, debeCambiarPassword: true },
    });

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "RESET_PASSWORD",
      registroId: idAuditoria(user),
      codigoRegistro: user.codigo || "",
      descripcion: `Se restableció la contraseña del usuario ${user.usuario}.`,
    });

    return res.json({ mensaje: "Contraseña restablecida a 123456." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const cambiarPassword = async (req, res) => {
  try {
    const { password, repetirPassword } = req.body;

    if (!password || !repetirPassword) {
      return res.status(400).json({
        mensaje: "Debes ingresar y repetir la nueva contraseña.",
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener mínimo 6 caracteres.",
      });
    }
    if (password !== repetirPassword) {
      return res.status(400).json({ mensaje: "Las contraseñas no coinciden." });
    }

    const user = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    const hash = await bcrypt.hash(password, 10);
    await prisma.usuario.update({
      where: { id: user.id },
      data: { password: hash, debeCambiarPassword: false },
    });

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "CAMBIAR_PASSWORD",
      registroId: idAuditoria(user),
      codigoRegistro: user.codigo || "",
      descripcion: `Se cambió la contraseña del usuario ${user.usuario}.`,
    });

    return res.json({ mensaje: "Contraseña actualizada correctamente." });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ mensaje: "Usuario no encontrado." });

    const usuarioActualId = req.usuario?.postgresId || req.usuario?.id;
    if (usuarioActualId === user.id) {
      return res.status(400).json({ mensaje: "No puedes bloquear tu propia cuenta." });
    }
    if (user.usuario?.toUpperCase() === "ADMIN") {
      return res.status(400).json({
        mensaje: "No se puede bloquear el administrador principal.",
      });
    }

    const estadoNuevo = user.estado === "Activo" ? "Bloqueado" : "Activo";
    const actualizado = await prisma.usuario.update({
      where: { id: user.id },
      data: { estado: estadoNuevo },
    });

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: estadoNuevo === "Bloqueado" ? "BLOQUEAR" : "DESBLOQUEAR",
      registroId: idAuditoria(user),
      codigoRegistro: user.codigo || "",
      descripcion:
        estadoNuevo === "Bloqueado"
          ? `Se bloqueó el usuario ${user.usuario}.`
          : `Se desbloqueó el usuario ${user.usuario}.`,
      datosAnteriores: { estado: user.estado },
      datosNuevos: { estado: actualizado.estado },
    });

    return res.json({ mensaje: "Estado actualizado.", estado: actualizado.estado });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};
