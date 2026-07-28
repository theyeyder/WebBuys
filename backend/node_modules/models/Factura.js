import mongoose from 'mongoose';

const facturaSchema = new mongoose.Schema({
  consecutivo: { type: Number, required: true, unique: true },
  pedido: { type: mongoose.Schema.Types.ObjectId, ref: 'Pedido', required: true },
  cliente: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  subtotal: { type: Number, default: 0 },
  iva: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  metodoPago: { type: String, enum: ['Efectivo', 'Transferencia', 'Crédito'], default: 'Efectivo' },
  estado: { type: String, enum: ['Pagada', 'Pendiente', 'Anulada'], default: 'Pendiente' }
}, { timestamps: true });

export default mongoose.model('Factura', facturaSchema);
