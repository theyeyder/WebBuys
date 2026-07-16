import { Router } from "express";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarEstadoUsuario,
} from "../controllers/usuario.controller.js";

import { proteger } from "../middlewares/auth.middleware.js";
import { soloAdmin } from "../middlewares/role.middleware.js";

const router = Router();

/* Todas las rutas requieren autenticación y rol Administrador */
router.use(proteger);
router.use(soloAdmin);

/* Listar usuarios */
router.get("/", listarUsuarios);

/* Crear usuario */
router.post("/", crearUsuario);

/* Actualizar usuario */
router.put("/:id", actualizarUsuario);

/* Resetear contraseña a 123 */
router.patch("/:id/reset-password", resetearPassword);

/* Bloquear o desbloquear usuario */
router.patch("/:id/estado", cambiarEstadoUsuario);

export default router;