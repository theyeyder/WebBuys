import { prisma } from "../config/postgresql.js";
import { registrarAuditoria } from "../utils/registrarAuditoria.js";
import {
  ACCIONES_PERMISO,
  CLAVES_MODULOS_PERMISOS,
  MODULOS_PERMISOS,
  construirPermisosEfectivos,
  normalizarPermiso,
} from "../utils/permisos.js";

function codigoDesdeNombre(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

function serializarPerfil(perfil) {
  if (!perfil) return null;

  return {
    id: perfil.id,
    codigo: perfil.codigo,
    nombre: perfil.nombre,
    descripcion: perfil.descripcion,
    estado: perfil.estado,
    esSistema: perfil.esSistema,
    permisos: Array.isArray(perfil.permisos)
      ? perfil.permisos.map((permiso) => ({
          modulo: permiso.modulo,
          ...normalizarPermiso(permiso),
        }))
      : [],
    createdAt: perfil.createdAt,
    updatedAt: perfil.updatedAt,
  };
}

function normalizarFilasPermisos(permisos = []) {
  const mapa = new Map();

  for (const item of Array.isArray(permisos) ? permisos : []) {
    const modulo = String(item?.modulo || "").trim();
    if (!CLAVES_MODULOS_PERMISOS.has(modulo)) continue;

    mapa.set(modulo, {
      modulo,
      ...normalizarPermiso(item),
    });
  }

  return MODULOS_PERMISOS.map((modulo) => ({
    modulo: modulo.clave,
    ...(mapa.get(modulo.clave) || normalizarPermiso()),
  }));
}

export async function listarModulosPermisos(req, res) {
  return res.json({
    acciones: ACCIONES_PERMISO,
    modulos: MODULOS_PERMISOS,
  });
}

export async function listarPerfiles(req, res) {
  try {
    const perfiles = await prisma.perfilUsuario.findMany({
      include: {
        permisos: true,
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: [{ esSistema: "desc" }, { nombre: "asc" }],
    });

    return res.json(
      perfiles.map((perfil) => ({
        ...serializarPerfil(perfil),
        usuariosAsignados: perfil._count?.usuarios || 0,
      }))
    );
  } catch (error) {
    console.error("Error listando perfiles:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function crearPerfil(req, res) {
  try {
    const nombre = String(req.body?.nombre || "").trim();
    const descripcion = String(req.body?.descripcion || "").trim();
    const codigo = codigoDesdeNombre(req.body?.codigo || nombre);

    if (!nombre || !codigo) {
      return res.status(400).json({
        mensaje: "El nombre del perfil es obligatorio.",
      });
    }

    const existe = await prisma.perfilUsuario.findFirst({
      where: {
        OR: [
          { codigo: { equals: codigo, mode: "insensitive" } },
          { nombre: { equals: nombre, mode: "insensitive" } },
        ],
      },
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe un perfil con ese nombre o código.",
      });
    }

    const filas = normalizarFilasPermisos(req.body?.permisos);

    const perfil = await prisma.$transaction(async (tx) => {
      const creado = await tx.perfilUsuario.create({
        data: {
          codigo,
          nombre,
          descripcion,
          estado: "Activo",
          esSistema: false,
        },
      });

      await tx.perfilPermiso.createMany({
        data: filas.map((permiso) => ({
          perfilId: creado.id,
          ...permiso,
        })),
      });

      return tx.perfilUsuario.findUnique({
        where: { id: creado.id },
        include: { permisos: true },
      });
    });

    await registrarAuditoria({
      req,
      modulo: "Perfiles",
      accion: "CREAR",
      registroId: perfil.id,
      codigoRegistro: perfil.codigo,
      descripcion: `Se creó el perfil ${perfil.nombre}.`,
      datosNuevos: {
        codigo: perfil.codigo,
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
      },
    });

    return res.status(201).json({
      mensaje: "Perfil creado correctamente.",
      perfil: serializarPerfil(perfil),
    });
  } catch (error) {
    console.error("Error creando perfil:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function actualizarPerfil(req, res) {
  try {
    const anterior = await prisma.perfilUsuario.findUnique({
      where: { id: req.params.id },
      include: { permisos: true },
    });

    if (!anterior) {
      return res.status(404).json({ mensaje: "Perfil no encontrado." });
    }

    const nombre = String(req.body?.nombre ?? anterior.nombre).trim();
    const descripcion = String(
      req.body?.descripcion ?? anterior.descripcion
    ).trim();
    const estado = req.body?.estado === "Inactivo" ? "Inactivo" : "Activo";

    if (!nombre) {
      return res.status(400).json({ mensaje: "El nombre es obligatorio." });
    }

    const repetido = await prisma.perfilUsuario.findFirst({
      where: {
        nombre: { equals: nombre, mode: "insensitive" },
        NOT: { id: anterior.id },
      },
    });

    if (repetido) {
      return res.status(400).json({ mensaje: "Ya existe otro perfil con ese nombre." });
    }

    const actualizado = await prisma.perfilUsuario.update({
      where: { id: anterior.id },
      data: { nombre, descripcion, estado },
      include: { permisos: true },
    });

    await registrarAuditoria({
      req,
      modulo: "Perfiles",
      accion: "ACTUALIZAR",
      registroId: actualizado.id,
      codigoRegistro: actualizado.codigo,
      descripcion: `Se actualizó el perfil ${actualizado.nombre}.`,
      datosAnteriores: {
        nombre: anterior.nombre,
        descripcion: anterior.descripcion,
        estado: anterior.estado,
      },
      datosNuevos: {
        nombre: actualizado.nombre,
        descripcion: actualizado.descripcion,
        estado: actualizado.estado,
      },
    });

    return res.json({
      mensaje: "Perfil actualizado correctamente.",
      perfil: serializarPerfil(actualizado),
    });
  } catch (error) {
    console.error("Error actualizando perfil:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function actualizarPermisosPerfil(req, res) {
  try {
    const perfil = await prisma.perfilUsuario.findUnique({
      where: { id: req.params.id },
      include: { permisos: true },
    });

    if (!perfil) {
      return res.status(404).json({ mensaje: "Perfil no encontrado." });
    }

    const filas = normalizarFilasPermisos(req.body?.permisos);

    const actualizado = await prisma.$transaction(async (tx) => {
      await tx.perfilPermiso.deleteMany({
        where: { perfilId: perfil.id },
      });

      await tx.perfilPermiso.createMany({
        data: filas.map((permiso) => ({
          perfilId: perfil.id,
          ...permiso,
        })),
      });

      return tx.perfilUsuario.findUnique({
        where: { id: perfil.id },
        include: { permisos: true },
      });
    });

    await registrarAuditoria({
      req,
      modulo: "Perfiles",
      accion: "PERMISOS",
      registroId: perfil.id,
      codigoRegistro: perfil.codigo,
      descripcion: `Se actualizaron los permisos del perfil ${perfil.nombre}.`,
    });

    return res.json({
      mensaje: "Permisos del perfil actualizados correctamente.",
      perfil: serializarPerfil(actualizado),
    });
  } catch (error) {
    console.error("Error actualizando permisos del perfil:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function obtenerPermisosUsuario(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.usuarioId },
      include: {
        perfil: { include: { permisos: true } },
        perfiles: {
          include: {
            perfil: { include: { permisos: true } },
          },
          orderBy: { asignadoAt: "asc" },
        },
        permisosPersonalizados: true,
      },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    const perfiles = Array.isArray(usuario.perfiles) && usuario.perfiles.length
      ? usuario.perfiles.map((item) => serializarPerfil(item.perfil)).filter(Boolean)
      : usuario.perfil
        ? [serializarPerfil(usuario.perfil)]
        : [];

    return res.json({
      usuario: {
        id: usuario.id,
        codigo: usuario.codigo,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        usuario: usuario.usuario,
        rol: usuario.rol,
        perfilId: perfiles[0]?.id || usuario.perfilId || null,
        perfil: perfiles[0] || null,
        perfilIds: perfiles.map((perfil) => perfil.id),
        perfiles,
      },
      permisos: construirPermisosEfectivos(usuario),
      personalizados: usuario.permisosPersonalizados,
    });
  } catch (error) {
    console.error("Error consultando permisos de usuario:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function asignarPerfilUsuario(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.usuarioId },
      include: {
        perfiles: {
          include: { perfil: true },
        },
      },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (usuario.rol === "Administrador") {
      return res.status(400).json({
        mensaje: "El Administrador tiene acceso total y no necesita perfiles de empleado.",
      });
    }

    let perfilIds = [];

    if (Array.isArray(req.body?.perfilIds)) {
      perfilIds = [...new Set(
        req.body.perfilIds
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      )];
    } else if (req.body?.perfilId) {
      perfilIds = [String(req.body.perfilId).trim()];
    }

    if (perfilIds.length === 0) {
      return res.status(400).json({
        mensaje: "Seleccione al menos un perfil para el empleado.",
      });
    }

    const perfiles = await prisma.perfilUsuario.findMany({
      where: {
        id: { in: perfilIds },
        estado: "Activo",
      },
      orderBy: { nombre: "asc" },
    });

    if (perfiles.length !== perfilIds.length) {
      return res.status(400).json({
        mensaje: "Uno o más perfiles seleccionados no existen o están inactivos.",
      });
    }

    const anteriores = Array.isArray(usuario.perfiles)
      ? usuario.perfiles.map((item) => item.perfil?.id).filter(Boolean)
      : [];

    const actualizado = await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        perfilId: perfilIds[0] || null,
        perfiles: {
          deleteMany: {},
          create: perfilIds.map((perfilId) => ({ perfilId })),
        },
      },
      include: {
        perfil: true,
        perfiles: {
          include: { perfil: true },
          orderBy: { asignadoAt: "asc" },
        },
      },
    });

    const perfilesActuales = actualizado.perfiles
      .map((item) => serializarPerfil(item.perfil))
      .filter(Boolean);

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "ASIGNAR_PERFIL",
      registroId: usuario.id,
      codigoRegistro: usuario.codigo || "",
      descripcion: `Se actualizaron los perfiles del usuario ${usuario.usuario}: ${perfilesActuales.map((perfil) => perfil.nombre).join(", ")}.`,
      datosAnteriores: { perfilIds: anteriores },
      datosNuevos: { perfilIds: perfilesActuales.map((perfil) => perfil.id) },
    });

    return res.json({
      mensaje: "Perfiles asignados correctamente.",
      usuario: {
        id: actualizado.id,
        perfilId: perfilesActuales[0]?.id || null,
        perfil: perfilesActuales[0] || null,
        perfilIds: perfilesActuales.map((perfil) => perfil.id),
        perfiles: perfilesActuales,
      },
    });
  } catch (error) {
    console.error("Error asignando perfiles:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}

export async function actualizarPermisosPersonalizados(req, res) {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.params.usuarioId },
    });

    if (!usuario) {
      return res.status(404).json({ mensaje: "Usuario no encontrado." });
    }

    if (usuario.rol === "Administrador") {
      return res.status(400).json({
        mensaje: "El Administrador ya tiene acceso total.",
      });
    }

    const entradas = Array.isArray(req.body?.permisos)
      ? req.body.permisos
      : [];

    const filas = [];

    for (const item of entradas) {
      const modulo = String(item?.modulo || "").trim();
      if (!CLAVES_MODULOS_PERMISOS.has(modulo)) continue;

      const fila = { usuarioId: usuario.id, modulo };
      let tieneOverride = false;

      for (const accion of ACCIONES_PERMISO) {
        if (typeof item?.[accion] === "boolean") {
          fila[accion] = item[accion];
          tieneOverride = true;
        }
      }

      if (tieneOverride) filas.push(fila);
    }

    await prisma.$transaction(async (tx) => {
      await tx.usuarioPermiso.deleteMany({
        where: { usuarioId: usuario.id },
      });

      if (filas.length) {
        await tx.usuarioPermiso.createMany({ data: filas });
      }
    });

    const completo = await prisma.usuario.findUnique({
      where: { id: usuario.id },
      include: {
        perfil: { include: { permisos: true } },
        perfiles: {
          include: {
            perfil: { include: { permisos: true } },
          },
          orderBy: { asignadoAt: "asc" },
        },
        permisosPersonalizados: true,
      },
    });

    await registrarAuditoria({
      req,
      modulo: "Usuarios",
      accion: "PERMISOS_PERSONALIZADOS",
      registroId: usuario.id,
      codigoRegistro: usuario.codigo || "",
      descripcion: `Se actualizaron los permisos personalizados de ${usuario.usuario}.`,
    });

    return res.json({
      mensaje: "Permisos personalizados actualizados correctamente.",
      permisos: construirPermisosEfectivos(completo),
      personalizados: completo.permisosPersonalizados,
    });
  } catch (error) {
    console.error("Error actualizando permisos personalizados:", error);
    return res.status(500).json({ mensaje: error.message });
  }
}
