import express
  from "express";

import {
  cajaController,
} from "../controllers/caja.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router =
  express.Router();


router.use(
  proteger
);


/* =========================================
   RESUMEN
========================================= */

router.get(
  "/resumen",
  cajaController.resumen
);


/* =========================================
   MOVIMIENTOS
========================================= */

router.get(
  "/movimientos",
  cajaController.listarMovimientos
);


router.post(
  "/movimientos",
  cajaController.crearMovimiento
);




/* =========================================
   HISTORIAL
========================================= */

router.get(
  "/historial",
  cajaController.listarHistorial
);


router.get(
  "/historial/:id",
  cajaController.obtenerDetalle
);


/* =========================================
   APERTURA
========================================= */

router.post(
  "/abrir",
  cajaController.abrir
);


/* =========================================
   CIERRE
========================================= */

router.post(
  "/cerrar",
  cajaController.cerrar
);


export default router;
