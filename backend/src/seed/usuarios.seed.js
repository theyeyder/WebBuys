import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

export async function seedUsuarios() {
  const count = await Usuario.countDocuments();
  if (count > 0) return;
  await Usuario.create([
    { nombre: 'Administrador', usuario: 'admin', password: await bcrypt.hash('123456', 10), rol: 'Administrador' },
    { nombre: 'Empleado', usuario: 'empleado', password: await bcrypt.hash('123456', 10), rol: 'Empleado' }
  ]);
  console.log('Usuarios iniciales creados');
}
