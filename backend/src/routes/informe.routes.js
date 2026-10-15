import {
  Router,
} from "express";

import {
  obtenerEstadoInformes,
  generarInforme,
} from "../controllers/postgresqlOnly/informe.controller.js";


const router =
  Router();


/* Estado / catálogo */

router.get(
  "/",
  obtenerEstadoInformes
);


/* Informe por tipo */

router.get(
  "/:tipo",
  generarInforme
);


export default router;