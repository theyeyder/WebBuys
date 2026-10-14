import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../config/postgresql.js";
import { construirPermisosEfectivos } from "../utils/permisos.js";

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

export async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        message: "Usuario y contraseña son obligatorios.",
      });
    }

    const usuarioNormalizado = String(usuario).trim();

    const user = await prisma.usuario.findFirst({
      where: {
        usuario: {
          equals: usuarioNormalizado,
          mode: "insensitive",
        },
      },
      include: incluirAccesos,
    });

    if (!user) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    if (user.estado !== "Activo") {
      return res.status(401).json({
        message: "El usuario se encuentra bloqueado.",
      });
    }

    const valido = await bcrypt.compare(password, user.password);

    if (!valido) {
      return res.status(401).json({
        message: "Usuario o contraseña incorrectos",
      });
    }

    const ultimoIngreso = new Date();

    await prisma.usuario.update({
      where: { id: user.id },
      data: { ultimoIngreso },
    });

    const token = jwt.sign(
      {
        id: user.id,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const perfiles = perfilesUsuario(user);
    const permisos = construirPermisosEfectivos(user);

    return res.json({
      token,
      user: {
        id: user.id,
        _id: user.id,
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
        ultimoIngreso,
      },
    });
  } catch (error) {
    console.error("Error login PostgreSQL:", error);

    return res.status(500).json({
      message: error.message,
    });
  }
}
