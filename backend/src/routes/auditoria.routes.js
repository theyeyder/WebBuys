import {
  Router,
} from "express";

import {
  listarAuditoria,
  obtenerAuditoriaPorId,
} from "../controllers/auditoria.controller.js";

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
   AUDITORÍA
========================================================= */

router.get(
  "/",
  listarAuditoria
);


router.get(
  "/:id",
  obtenerAuditoriaPorId
);


export default router;