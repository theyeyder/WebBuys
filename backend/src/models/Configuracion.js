import mongoose from 'mongoose';

const configuracionSchema = new mongoose.Schema({
  nombreEmpresa: { type: String, default: 'LÁCTEOS DEL NAPOLESS' },
  nit: { type: String, default: '' },
  direccion: { type: String, default: '' },
  telefono: { type: String, default: '' },
  correo: { type: String, default: '' },
  logo: { type: String, default: '' },
  iva: { type: Number, default: 0 },
  consecutivoFactura: { type: Number, default: 1 }
}, { timestamps: true });

export default mongoose.model('Configuracion', configuracionSchema);
