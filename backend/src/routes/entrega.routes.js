import express
  from "express";

import {
  listarEntregas,
  obtenerEntrega,
  actualizarPreparacionEntrega,
  confirmarEntrega,
  cambiarEstadoEntrega,
  cambiarMetodoPagoEntrega,
  reabrirPreparacionEntrega,
  revertirEntregaFinalizada,
} from "../controllers/postgresqlOnly/entrega.controller.js";

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
  "/:id/metodo-pago",
  cambiarMetodoPagoEntrega
);


router.patch(
  "/:id/reabrir-preparacion",
  reabrirPreparacionEntrega
);


router.patch(
  "/:id/confirmar",
  confirmarEntrega
);


router.patch(
  "/:id/estado",
  cambiarEstadoEntrega
);


router.patch(
  "/:id/revertir",
  soloAdmin,
  revertirEntregaFinalizada
);


export default router;
