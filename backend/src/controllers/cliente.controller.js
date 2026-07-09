import Cliente from '../models/Cliente.js';
import { crearCRUD } from './crudFactory.js';
export const clienteController = crearCRUD(Cliente);
