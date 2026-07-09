import { productoController } from '../controllers/producto.controller.js';
import { crearRutasCRUD } from './crudRoutes.js';
export default crearRutasCRUD(productoController);
