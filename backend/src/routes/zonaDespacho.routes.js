import { Router } from "express";

import {
  listarZonasDespacho,
  crearZonaDespacho,
  actualizarZonaDespacho,
  cambiarEstadoZonaDespacho,
  eliminarZonaDespacho,
} from "../controllers/zonaDespacho.controller.js";

import { proteger } from "../middlewares/auth.middleware.js";
import { soloAdmin } from "../middlewares/role.middleware.js";

const router = Router();

/* TODAS requieren autenticación */
router.use(proteger);

/* CONSULTAR ZONAS
   Puede hacerlo cualquier usuario autenticado
*/
router.get(
  "/",
  listarZonasDespacho
);

/* ADMINISTRAR ZONAS
   Solo administrador
*/
router.post(
  "/",
  soloAdmin,
  crearZonaDespacho
);

router.put(
  "/:id",
  soloAdmin,
  actualizarZonaDespacho
);

router.patch(
  "/:id/estado",
  soloAdmin,
  cambiarEstadoZonaDespacho
);

router.delete(
  "/:id",
  soloAdmin,
  eliminarZonaDespacho
);

export default router;