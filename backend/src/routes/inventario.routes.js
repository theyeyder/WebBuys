import express
  from "express";

import {
  listarInventario,
  consultarStock,
  listarMovimientos,
  crearEntradaInventario,
  crearSalidaInventario,
  crearAjusteInventario,
} from "../controllers/inventario.controller.js";


import {
  cerrarPeriodoInventario,
  listarCierresInventario,
  obtenerPeriodoInventario,
} from "../controllers/cierreInventario.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";


const router =
  express.Router();


router.use(
  proteger
);


/* =========================================
   CONSULTAS
   ADMINISTRADOR Y EMPLEADO
========================================= */

router.get(
  "/",
  listarInventario
);


router.get(
  "/movimientos",
  listarMovimientos
);


/* =========================================
   CIERRES MENSUALES
========================================= */

router.get(
  "/cierres",
  listarCierresInventario
);


router.get(
  "/cierres/:anio/:mes",
  obtenerPeriodoInventario
);


router.post(
  "/cierres/:anio/:mes/cerrar",
  soloAdmin,
  cerrarPeriodoInventario
);


router.get(
  "/stock/:productoId",
  consultarStock
);


/* =========================================
   MOVIMIENTOS MANUALES
   SOLO ADMINISTRADOR
========================================= */

router.post(
  "/entrada",
  soloAdmin,
  crearEntradaInventario
);


router.post(
  "/salida",
  soloAdmin,
  crearSalidaInventario
);


router.post(
  "/ajuste",
  soloAdmin,
  crearAjusteInventario
);


export default router;
