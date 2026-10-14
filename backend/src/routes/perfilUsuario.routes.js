import { Router } from "express";

import {
  actualizarPerfil,
  actualizarPermisosPerfil,
  actualizarPermisosPersonalizados,
  asignarPerfilUsuario,
  crearPerfil,
  listarModulosPermisos,
  listarPerfiles,
  obtenerPermisosUsuario,
} from "../controllers/perfilUsuario.controller.js";

import { proteger } from "../middlewares/auth.middleware.js";
import { soloAdmin } from "../middlewares/role.middleware.js";

const router = Router();

router.use(proteger);
router.use(soloAdmin);

router.get("/modulos", listarModulosPermisos);
router.get("/", listarPerfiles);
router.post("/", crearPerfil);
router.put("/:id", actualizarPerfil);
router.put("/:id/permisos", actualizarPermisosPerfil);

router.get("/usuario/:usuarioId", obtenerPermisosUsuario);
router.patch("/usuario/:usuarioId/perfil", asignarPerfilUsuario);
router.put(
  "/usuario/:usuarioId/personalizados",
  actualizarPermisosPersonalizados
);

export default router;
