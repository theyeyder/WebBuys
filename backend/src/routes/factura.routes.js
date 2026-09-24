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
   ENTREGAS FINALIZADAS DISPONIBLES
   PARA FACTURACIÓN
========================================= */

router.get(
  "/disponibles",
  facturaController.listarDisponibles
);


/* =========================================
   OBTENER FACTURA POR ID
========================================= */

router.get(
  "/:id",
  facturaController.obtenerPorId
);


/* =========================================
   GENERAR FACTURA DESDE ENTREGA
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
