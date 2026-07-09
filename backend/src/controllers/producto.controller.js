import Producto from '../models/Producto.js';
import { crearCRUD } from './crudFactory.js';
export const productoController = crearCRUD(Producto, 'categoria');
