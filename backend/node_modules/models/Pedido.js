import mongoose from 'mongoose';

const itemPedidoSchema = new mongoose.Schema({
  producto: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
  nombre: { type: String, required: true },
  cantidad: { type: Number, required: true },
  precio: { type: Number, required: true },
  subtotal: { type: Number, required: true }
}, { _id: false });

const pedidoSchema = new mongoose.Schema({
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  items: [itemPedidoSchema],
  subtotal: { type: Number, default: 0 },
  descuento: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  estado: { type: String, enum: ['Pendiente', 'En preparación', 'En ruta', 'Entregado', 'Cancelado'], default: 'Pendiente' },
  fechaEntrega: { type: Date },
  observaciones: { type: String, default: '' },
  creadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

export default mongoose.model('Pedido', pedidoSchema);
