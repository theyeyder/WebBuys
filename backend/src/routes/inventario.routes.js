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
