import { Router } from 'express';
import { proteger } from '../middlewares/auth.middleware.js';
import { soloAdmin } from '../middlewares/role.middleware.js';
import { obtenerConfiguracion, actualizarConfiguracion } from '../controllers/configuracion.controller.js';

const router = Router();
router.use(proteger, soloAdmin);
router.get('/', obtenerConfiguracion);
router.put('/', actualizarConfiguracion);
export default router;
