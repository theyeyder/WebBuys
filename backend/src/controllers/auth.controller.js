import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

const generarToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '8h' });

export const login = async (req, res) => {
  const { usuario, password } = req.body;

  const usuarioEncontrado = await Usuario.findOne({ usuario: usuario?.toLowerCase(), estado: true });
  if (!usuarioEncontrado) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });

  const passwordOk = await usuarioEncontrado.compararPassword(password);
  if (!passwordOk) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });

  res.json({
    token: generarToken(usuarioEncontrado._id),
    usuario: {
      id: usuarioEncontrado._id,
      nombre: usuarioEncontrado.nombre,
      usuario: usuarioEncontrado.usuario,
      rol: usuarioEncontrado.rol
    }
  });
};

export const perfil = async (req, res) => {
  res.json(req.usuario);
};
