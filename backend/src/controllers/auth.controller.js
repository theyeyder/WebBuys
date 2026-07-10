import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

export async function login(req, res) {
  try {
    const { usuario, password } = req.body;
    const user = await Usuario.findOne({ usuario: usuario?.toLowerCase(), estado: true });
    if (!user) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    const token = jwt.sign({ id: user._id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user._id, nombre: user.nombre, usuario: user.usuario, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
