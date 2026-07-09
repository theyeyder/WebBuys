import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria', required: true },
  presentacion: { type: String, default: 'Unidad' },
  precioCompra: { type: Number, default: 0 },
  precioVenta: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  unidad: { type: String, default: 'Unidad' },
  imagen: { type: String, default: '' },
  estado: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Producto', productoSchema);
