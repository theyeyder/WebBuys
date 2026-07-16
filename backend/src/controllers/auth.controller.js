import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

export async function login(req, res) {
  try {
    const { usuario, password } = req.body;

    const user = await Usuario.findOne({
      usuario: usuario.toLowerCase(),
    }).select("+password");

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

    user.ultimoIngreso = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        rol: user.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,

      user: {
        id: user._id,
        nombres: user.nombres,
        apellidos: user.apellidos,
        usuario: user.usuario,
        rol: user.rol,
        estado: user.estado,
        debeCambiarPassword: user.debeCambiarPassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}