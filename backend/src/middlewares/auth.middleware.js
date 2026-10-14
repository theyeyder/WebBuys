import jwt from "jsonwebtoken";

import { prisma } from "../config/postgresql.js";
import { construirPermisosEfectivos } from "../utils/permisos.js";

function pareceObjectIdMongo(valor) {
  return /^[a-f\d]{24}$/i.test(String(valor || ""));
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
  };
}

const incluirAccesos = {
  perfil: {
    include: { permisos: true },
  },
  perfiles: {
    include: {
      perfil: {
        include: { permisos: true },
      },
    },
    orderBy: { asignadoAt: "asc" },
  },
  permisosPersonalizados: true,
};

function perfilesUsuario(user) {
  const asignados = Array.isArray(user?.perfiles)
    ? user.perfiles
        .map((item) => serializarPerfil(item?.perfil))
        .filter(Boolean)
    : [];

  if (asignados.length > 0) return asignados;

  const legado = serializarPerfil(user?.perfil);
  return legado ? [legado] : [];
}

export const proteger = async (req, res, next) => {
  try {
    if (req.usuario) {
      return next();
    }

    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({
        mensaje: "No autorizado, token no enviado",
      });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user = null;

    if (pareceObjectIdMongo(decoded.id)) {
      user = await prisma.usuario.findUnique({
        where: { legacyMongoId: String(decoded.id) },
        include: incluirAccesos,
      });
    } else {
      user = await prisma.usuario.findUnique({
        where: { id: String(decoded.id) },
        include: incluirAccesos,
      });
    }

    if (!user) {
      return res.status(401).json({ mensaje: "Usuario no encontrado" });
    }

    if (user.estado !== "Activo") {
      return res.status(401).json({
        mensaje: "El usuario se encuentra bloqueado.",
      });
    }

    const perfiles = perfilesUsuario(user);
    const permisos = construirPermisosEfectivos(user);

    req.usuario = {
      id: user.id,
      postgresId: user.id,
      _id: user.legacyMongoId || user.id,
      legacyMongoId: user.legacyMongoId,
      codigo: user.codigo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      usuario: user.usuario,
      rol: user.rol,
      perfilId: perfiles[0]?.id || user.perfilId || null,
      perfil: perfiles[0] || null,
      perfilIds: perfiles.map((perfil) => perfil.id),
      perfiles,
      permisos,
      estado: user.estado,
      debeCambiarPassword: user.debeCambiarPassword,
      ultimoIngreso: user.ultimoIngreso,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    next();
  } catch (error) {
    console.error(
      "Error autenticación PostgreSQL:",
      error?.message || error
    );

    return res.status(401).json({ mensaje: "Token inválido" });
  }
};
