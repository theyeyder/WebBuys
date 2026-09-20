import express
  from "express";

import {
  listarEntregas,
  obtenerEntrega,
  actualizarPreparacionEntrega,
  confirmarEntrega,
  cambiarEstadoEntrega,
} from "../controllers/entrega.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router =
  express.Router();


router.use(
  proteger
);


router.get(
  "/",
  listarEntregas
);


router.get(
  "/:id",
  obtenerEntrega
);


router.put(
  "/:id/preparacion",
  actualizarPreparacionEntrega
);


router.patch(
  "/:id/confirmar",
  confirmarEntrega
);


router.patch(
  "/:id/estado",
  cambiarEstadoEntrega
);


export default router;
