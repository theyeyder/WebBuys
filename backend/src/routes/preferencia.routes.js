import {
  Router,
} from "express";

import {
  obtenerPreferencias,
  actualizarPreferencias,
} from "../controllers/preferencia.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";


const router = Router();


router.use(proteger);
router.use(soloAdmin);


/* OBTENER */

router.get(
  "/",
  obtenerPreferencias
);


/* ACTUALIZAR */

router.put(
  "/",
  actualizarPreferencias
);


export default router;