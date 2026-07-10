import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  usuario: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ['Administrador', 'Empleado'], default: 'Empleado' },
  estado: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Usuario', usuarioSchema);
