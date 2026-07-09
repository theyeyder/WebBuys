import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Usuario from '../models/Usuario.js';
import Categoria from '../models/Categoria.js';

dotenv.config();
await connectDB();

await Usuario.deleteMany({ usuario: { $in: ['admin', 'empleado'] } });

await Usuario.create([
  {
    nombre: 'Administrador WebBuys',
    documento: '1000000001',
    telefono: '3000000001',
    cargo: 'Administrador',
    usuario: 'admin',
    password: '123456',
    rol: 'Administrador'
  },
  {
    nombre: 'Empleado WebBuys',
    documento: '1000000002',
    telefono: '3000000002',
    cargo: 'Empleado',
    usuario: 'empleado',
    password: '123456',
    rol: 'Empleado'
  }
]);

const categoriasBase = ['Quesos', 'Yogures', 'Kumis', 'Leches', 'Mantequillas', 'Arequipe', 'Otros'];
for (const nombre of categoriasBase) {
  await Categoria.findOneAndUpdate({ nombre }, { nombre, estado: true }, { upsert: true });
}

console.log('Seed ejecutado correctamente en la base de datos WebBuys');
process.exit();
