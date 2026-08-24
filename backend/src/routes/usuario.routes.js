import { Router } from "express";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarEstadoUsuario,
  cambiarPassword,
  obtenerSiguienteCodigoUsuario,
} from "../controllers/usuario.controller.js";

import { proteger } from "../middlewares/auth.middleware.js";
import { soloAdmin } from "../middlewares/role.middleware.js";

const router = Router();

/* Todas las rutas requieren autenticación y rol Administrador */
router.use(proteger);
router.use(soloAdmin);

/* Listar usuarios */
router.get("/", listarUsuarios);
router.get("/siguiente-codigo",obtenerSiguienteCodigoUsuario);

/* Crear usuario */
router.post("/", crearUsuario);

/* Actualizar usuario */
router.put("/:id", actualizarUsuario);

/* Resetear contraseña a 123456 */
router.patch("/:id/reset-password", resetearPassword);

/* Cambiar contraseña */
router.patch("/:id/cambiar-password", cambiarPassword);

/* Bloquear o desbloquear usuario */
router.patch("/:id/estado", cambiarEstadoUsuario);


export default router;