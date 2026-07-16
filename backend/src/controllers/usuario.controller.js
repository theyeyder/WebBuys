import bcrypt from "bcryptjs";
import Usuario from "../models/Usuario.js";

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
   CREAR USUARIO
=========================== */

export const crearUsuario = async (req, res) => {
  try {
    const {
      nombres,
      apellidos,
      rol,
      password,
      repetirPassword,
    } = req.body;

    if (
      !nombres ||
      !apellidos ||
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

    /* Generar usuario automáticamente */

    let usuario = `${nombres.split(" ")[0]}.${apellidos.split(" ")[0]}`
      .toLowerCase()
      .replace(/\s+/g, "");

    let contador = 1;

    while (await Usuario.findOne({ usuario })) {
      contador++;
      usuario = `${nombres.split(" ")[0]}.${apellidos.split(" ")[0]}${contador}`
        .toLowerCase()
        .replace(/\s+/g, "");
    }

    const nuevoUsuario = await Usuario.create({
      nombres,
      apellidos,
      usuario,
      rol,
      password: await bcrypt.hash(password, 10),
      estado: "Activo",
      creadoPor: req.usuario._id,
    });

    res.status(201).json({
      mensaje: "Usuario creado correctamente.",
      usuario: {
        id: nuevoUsuario._id,
        nombres: nuevoUsuario.nombres,
        apellidos: nuevoUsuario.apellidos,
        usuario: nuevoUsuario.usuario,
        rol: nuevoUsuario.rol,
        estado: nuevoUsuario.estado,
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

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    ).select("-password");

    res.json(usuario);

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

    const password = await bcrypt.hash("123", 10);

    await Usuario.findByIdAndUpdate(
      req.params.id,
      {
        password,
        debeCambiarPassword: true,
      }
    );

    res.json({
      mensaje: "Contraseña restablecida correctamente.",
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

    if (usuario.usuario === "admin") {
      return res.status(400).json({
        mensaje: "No se puede bloquear el administrador principal.",
      });
    }

    usuario.estado =
      usuario.estado === "Activo"
        ? "Bloqueado"
        : "Activo";

    await usuario.save();

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