import mongoose from 'mongoose';

const categoriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  descripcion: { type: String, default: '' },
  estado: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Categoria', categoriaSchema);
