import { Router } from "express";

import {
  listarRutas,
  crearRuta,
  actualizarRuta,
  cambiarEstadoRuta,
  eliminarRuta,
  obtenerSiguienteCodigoRuta,
} from "../controllers/ruta.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";

const router = Router();

router.use(proteger);
router.use(soloAdmin);

/* IMPORTANTE: ruta específica antes de /:id */
router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoRuta
);

router.get(
  "/",
  listarRutas
);

router.post(
  "/",
  crearRuta
);

router.put(
  "/:id",
  actualizarRuta
);

router.patch(
  "/:id/estado",
  cambiarEstadoRuta
);

router.delete(
  "/:id",
  eliminarRuta
);

/* ESTE EXPORT ES EL QUE TE FALTA */
export default router;