import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import productoRoutes from './routes/producto.routes.js';
import pedidoRoutes from './routes/pedido.routes.js';
import facturaRoutes from './routes/factura.routes.js';
import empleadoRoutes from './routes/empleado.routes.js';
import configuracionRoutes from './routes/configuracion.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API WebBuys funcionando correctamente' });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/empleados', empleadoRoutes);
app.use('/api/configuracion', configuracionRoutes);

export default app;
