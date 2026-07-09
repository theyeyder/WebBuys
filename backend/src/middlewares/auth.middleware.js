import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export const proteger = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'No autorizado, token no enviado' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = await Usuario.findById(decoded.id).select('-password');

    if (!req.usuario) return res.status(401).json({ mensaje: 'Usuario no encontrado' });
    next();
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' });
  }
};
