import { Router } from 'express';
import { proteger } from '../middlewares/auth.middleware.js';
import { soloAdmin } from '../middlewares/role.middleware.js';

export const crearRutasCRUD = (controller, adminParaEliminar = true) => {
  const router = Router();
  router.use(proteger);
  router.get('/', controller.listar);
  router.get('/:id', controller.obtener);
  router.post('/', controller.crear);
  router.put('/:id', controller.actualizar);
  router.delete('/:id', adminParaEliminar ? soloAdmin : (req, res, next) => next(), controller.eliminar);
  return router;
};
