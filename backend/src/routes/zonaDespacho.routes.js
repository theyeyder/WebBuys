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

router.use(proteger);
router.use(soloAdmin);

router.get("/", listarZonasDespacho);
router.post("/", crearZonaDespacho);
router.put("/:id", actualizarZonaDespacho);
router.patch(
  "/:id/estado",
  cambiarEstadoZonaDespacho
);
router.delete("/:id", eliminarZonaDespacho);

export default router;