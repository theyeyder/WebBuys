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
      .toLowerCase();

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

    const nuevoUsuario = await Usuario.create({
      documento: documentoNormalizado,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      usuario: usuarioNormalizado,
      rol,
      password: await bcrypt.hash(password, 10),
      estado: "Activo",
      creadoPor: req.usuario._id,
    });

    res.status(201).json({
      mensaje: "Usuario creado correctamente.",
      usuario: {
        id: nuevoUsuario._id,
        documento: nuevoUsuario.documento,
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

    const usuarioNormalizado = usuario.trim().toLowerCase();

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