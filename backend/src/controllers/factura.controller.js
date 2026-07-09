import Factura from '../models/Factura.js';
import { crearCRUD } from './crudFactory.js';
export const facturaController = crearCRUD(Factura, 'pedido cliente');
