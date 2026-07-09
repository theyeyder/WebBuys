import Categoria from '../models/Categoria.js';
import { crearCRUD } from './crudFactory.js';
export const categoriaController = crearCRUD(Categoria);
