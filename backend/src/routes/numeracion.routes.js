import {
  Router,
} from "express";

import {
  listarNumeraciones,
} from "../controllers/numeracion.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";


const router =
  Router();


/* =========================================================
   SEGURIDAD
========================================================= */

router.use(
  proteger
);

router.use(
  soloAdmin
);


/* =========================================================
   NUMERACIÓN
========================================================= */

router.get(
  "/",
  listarNumeraciones
);


export default router;