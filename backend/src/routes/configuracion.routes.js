import { Router } from 'express';
import { proteger } from '../middlewares/auth.middleware.js';
import { soloAdmin } from '../middlewares/role.middleware.js';
import { 
  obtenerConfiguracion, 
  actualizarConfiguracion, 
  subirLogo,
  eliminarLogo 
} from '../controllers/configuracion.controller.js';
import uploadLogo from "../middlewares/uploadLogo.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación y ser admin
router.use(proteger, soloAdmin);

// Rutas de configuración
router.get('/', obtenerConfiguracion);
router.put('/', actualizarConfiguracion);

// Rutas de logo
router.post(
  "/logo",
  uploadLogo.single("logo"),
  subirLogo
);

router.delete("/logo", eliminarLogo); 

export default router;