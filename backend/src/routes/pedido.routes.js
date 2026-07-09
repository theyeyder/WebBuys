import { pedidoController } from '../controllers/pedido.controller.js';
import { crearRutasCRUD } from './crudRoutes.js';
export default crearRutasCRUD(pedidoController, false);
