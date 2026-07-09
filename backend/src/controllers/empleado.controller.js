import Usuario from '../models/Usuario.js';
import { crearCRUD } from './crudFactory.js';
export const empleadoController = crearCRUD(Usuario);
