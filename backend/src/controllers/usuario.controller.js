import bcrypt from "bcryptjs";

import Usuario from "../models/Usuario.js";
import Consecutivo from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";

/* ===========================
   LISTAR USUARIOS
=========================== */

export const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(usuarios);
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   SIGUIENTE CÓDIGO USUARIO
=========================== */

export const obtenerSiguienteCodigoUsuario =
  async (req, res) => {

    try {

      const consecutivo =
        await Consecutivo.findOne({
          clave: "usuarios",
        });

      const siguiente =
        (consecutivo?.ultimoNumero || 0) + 1;

      const codigo =
        `USER-${String(
          siguiente
        ).padStart(4, "0")}`;

      return res.json({
        codigo,
      });

    } catch (error) {

      console.error(
        "Error obteniendo consecutivo de usuario:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener el siguiente código de usuario.",
      });

    }

  };

/* ===========================
   CREAR USUARIO - CON CÓDIGO
=========================== */

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
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios.",
      });
    }

    if (password !== repetirPassword) {
      return res.status(400).json({
        mensaje: "Las contraseñas no coinciden.",
      });
    }

    const usuarioNormalizado = usuario
      .trim()
      .toUpperCase();

    const existe = await Usuario.findOne({
      usuario: usuarioNormalizado,
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Ese nombre de usuario ya existe.",
      });
    }

    const documentoNormalizado = documento.trim();

    const existeDocumento = await Usuario.findOne({
      documento: documentoNormalizado,
    });

    if (existeDocumento) {
      return res.status(400).json({
        mensaje: "Ya existe un usuario con ese documento.",
      });
    }

    /* =========================
       GENERAR CÓDIGO
    ========================= */

    const codigo =
      await generarConsecutivo(
        "usuarios",
        "USER"
      );

    const nuevoUsuario = await Usuario.create({
      codigo,

      documento: documentoNormalizado,

      nombres: nombres.trim(),

      apellidos: apellidos.trim(),

      usuario: usuarioNormalizado,

      rol,

      password:
        await bcrypt.hash(
          password,
          10
        ),

      estado: "Activo",

      creadoPor:
        req.usuario._id,
    });

    // =========================
    // AUDITORÍA - CREAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Usuarios",

      accion: "CREAR",

      registroId:
        nuevoUsuario._id,

      codigoRegistro:
        nuevoUsuario.codigo,

      descripcion:
        `Se creó el usuario ${nuevoUsuario.usuario}.`,

      datosNuevos: {
        codigo:
          nuevoUsuario.codigo,

        documento:
          nuevoUsuario.documento,

        nombres:
          nuevoUsuario.nombres,

        apellidos:
          nuevoUsuario.apellidos,

        usuario:
          nuevoUsuario.usuario,

        rol:
          nuevoUsuario.rol,

        estado:
          nuevoUsuario.estado,
      },
    });

    res.status(201).json({
      mensaje: "Usuario creado correctamente.",

      usuario: {
        id: nuevoUsuario._id,

        codigo:
          nuevoUsuario.codigo,

        documento:
          nuevoUsuario.documento,

        nombres:
          nuevoUsuario.nombres,

        apellidos:
          nuevoUsuario.apellidos,

        usuario:
          nuevoUsuario.usuario,

        rol:
          nuevoUsuario.rol,

        estado:
          nuevoUsuario.estado,
      },
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTUALIZAR
=========================== */

export const actualizarUsuario = async (req, res) => {
  try {
    const {
      documento,
      nombres,
      apellidos,
      usuario,
      rol,
    } = req.body;

    if (
      !documento ||
      !nombres ||
      !apellidos ||
      !usuario ||
      !rol
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios.",
      });
    }

    // =========================
    // OBTENER DATOS ANTERIORES
    // =========================

    const anterior =
      await Usuario.findById(
        req.params.id
      )
        .select("-password")
        .lean();

    if (!anterior) {
      return res.status(404).json({
        mensaje:
          "Usuario no encontrado.",
      });
    }

    const usuarioNormalizado = usuario.trim().toUpperCase();

    const existe = await Usuario.findOne({
      usuario: usuarioNormalizado,
      _id: { $ne: req.params.id },
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Ese nombre de usuario ya existe.",
      });
    }

    const documentoNormalizado = documento.trim();

    const existeDocumento = await Usuario.findOne({
      documento: documentoNormalizado,
      _id: { $ne: req.params.id },
    });

    if (existeDocumento) {
      return res.status(400).json({
        mensaje: "Ya existe otro usuario con ese documento.",
      });
    }

    const actualizado = await Usuario.findByIdAndUpdate(
      req.params.id,
      {
        documento: documentoNormalizado,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        usuario: usuarioNormalizado,
        rol,
      },
      { new: true }
    ).select("-password");

    // =========================
    // AUDITORÍA - ACTUALIZAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Usuarios",

      accion: "ACTUALIZAR",

      registroId:
        actualizado._id,

      codigoRegistro:
        actualizado.codigo,

      descripcion:
        `Se actualizó el usuario ${actualizado.usuario}.`,

      datosAnteriores: {
        codigo:
          anterior.codigo,

        documento:
          anterior.documento,

        nombres:
          anterior.nombres,

        apellidos:
          anterior.apellidos,

        usuario:
          anterior.usuario,

        rol:
          anterior.rol,

        estado:
          anterior.estado,
      },

      datosNuevos: {
        codigo:
          actualizado.codigo,

        documento:
          actualizado.documento,

        nombres:
          actualizado.nombres,

        apellidos:
          actualizado.apellidos,

        usuario:
          actualizado.usuario,

        rol:
          actualizado.rol,

        estado:
          actualizado.estado,
      },
    });

    res.json(actualizado);
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   RESETEAR PASSWORD
=========================== */

export const resetearPassword = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    usuario.password = await bcrypt.hash("123456", 10);
    usuario.debeCambiarPassword = true;

    await usuario.save();

    // =========================
    // AUDITORÍA - RESET_PASSWORD
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Usuarios",

      accion: "RESET_PASSWORD",

      registroId:
        usuario._id,

      codigoRegistro:
        usuario.codigo,

      descripcion:
        `Se restableció la contraseña del usuario ${usuario.usuario}.`,
    });

    res.json({
      mensaje: "Contraseña restablecida a 123456.",
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   CAMBIAR PASSWORD
=========================== */

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
      return res.status(400).json({
        mensaje: "Las contraseñas no coinciden.",
      });
    }

    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    usuario.password = await bcrypt.hash(password, 10);
    usuario.debeCambiarPassword = false;

    await usuario.save();

    // =========================
    // AUDITORÍA - CAMBIAR_PASSWORD
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Usuarios",

      accion: "CAMBIAR_PASSWORD",

      registroId:
        usuario._id,

      codigoRegistro:
        usuario.codigo,

      descripcion:
        `Se cambió la contraseña del usuario ${usuario.usuario}.`,
    });

    res.json({
      mensaje: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   BLOQUEAR / DESBLOQUEAR
=========================== */

export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id);

    if (!usuario) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado.",
      });
    }

    if (req.usuario._id.toString() === usuario._id.toString()) {
      return res.status(400).json({
        mensaje: "No puedes bloquear tu propia cuenta.",
      });
    }

    // =========================
    // COMPROBACIÓN ADMIN - MAYÚSCULAS
    // =========================

    if (
      usuario.usuario
        ?.toUpperCase() === "ADMIN"
    ) {
      return res.status(400).json({
        mensaje:
          "No se puede bloquear el administrador principal.",
      });
    }

    // =========================
    // GUARDAR ESTADO ANTERIOR
    // =========================

    const estadoAnterior =
      usuario.estado;

    usuario.estado =
      usuario.estado === "Activo"
        ? "Bloqueado"
        : "Activo";

    await usuario.save();

    // =========================
    // AUDITORÍA - BLOQUEAR / DESBLOQUEAR
    // =========================

    const accionAuditoria =
      usuario.estado === "Bloqueado"
        ? "BLOQUEAR"
        : "DESBLOQUEAR";

    await registrarAuditoria({
      req,

      modulo: "Usuarios",

      accion:
        accionAuditoria,

      registroId:
        usuario._id,

      codigoRegistro:
        usuario.codigo,

      descripcion:
        usuario.estado === "Bloqueado"
          ? `Se bloqueó el usuario ${usuario.usuario}.`
          : `Se desbloqueó el usuario ${usuario.usuario}.`,

      datosAnteriores: {
        estado:
          estadoAnterior,
      },

      datosNuevos: {
        estado:
          usuario.estado,
      },
    });

    res.json({
      mensaje: "Estado actualizado.",
      estado: usuario.estado,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};