import express from "express";

import {
  facturaController,
} from "../controllers/factura.controller.js";


const router =
  express.Router();


/* =========================================
   LISTAR FACTURAS
========================================= */

router.get(
  "/",
  facturaController.listar
);


/* =========================================
   OBTENER FACTURA POR ID
========================================= */

router.get(
  "/:id",
  facturaController.obtenerPorId
);


/* =========================================
   GENERAR FACTURA DESDE PEDIDO
========================================= */

router.post(
  "/",
  facturaController.crear
);


/* =========================================
   ACTUALIZAR FACTURA
========================================= */

router.put(
  "/:id",
  facturaController.actualizar
);
/* =========================================
   ANULAR FACTURA
========================================= */

router.patch(
  "/:id/anular",
  facturaController.anular
);


/* =========================================
   REVERTIR FACTURA ANULADA
========================================= */

router.patch(
  "/:id/revertir",
  facturaController.revertir
);

/* =========================================
   ELIMINAR FACTURA
========================================= */

router.delete(
  "/:id",
  facturaController.eliminar
);


export default router;