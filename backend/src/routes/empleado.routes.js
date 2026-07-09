import { Router } from 'express';
import { empleadoController } from '../controllers/empleado.controller.js';
import { proteger } from '../middlewares/auth.middleware.js';
import { soloAdmin } from '../middlewares/role.middleware.js';

const router = Router();
router.use(proteger, soloAdmin);
router.get('/', empleadoController.listar);
router.post('/', empleadoController.crear);
router.put('/:id', empleadoController.actualizar);
router.delete('/:id', empleadoController.eliminar);
export default router;
