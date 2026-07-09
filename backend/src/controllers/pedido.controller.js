import Pedido from '../models/Pedido.js';
import { crearCRUD } from './crudFactory.js';
export const pedidoController = crearCRUD(Pedido, 'cliente items.producto creadoPor');
