import {
  Router,
} from "express";

import {
  obtenerEstadoInformes,
  listarOpcionesRepartidores,
  generarInforme,
} from "../controllers/postgresqlOnly/informe.controller.js";


const router =
  Router();


/* Estado / catálogo */

router.get(
  "/",
  obtenerEstadoInformes
);


/* Opciones del filtro de repartidor (antes de /:tipo) */

router.get(
  "/repartidores-opciones",
  listarOpcionesRepartidores
);


/* Informe por tipo */

router.get(
  "/:tipo",
  generarInforme
);


export default router;