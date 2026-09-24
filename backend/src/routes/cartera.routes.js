import express
  from "express";

import {
  carteraController,
} from "../controllers/cartera.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router =
  express.Router();


router.use(
  proteger
);


router.get(
  "/resumen",
  carteraController.resumen
);


router.get(
  "/",
  carteraController.listar
);


router.get(
  "/:id",
  carteraController.obtenerPorId
);


router.put(
  "/:id",
  carteraController.actualizar
);


router.post(
  "/:id/pagos",
  carteraController.registrarPago
);


export default router;
