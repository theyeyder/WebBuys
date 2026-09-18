import express from "express";

import {
  listarPedidos,
  obtenerSiguienteCodigoPedido,
  crearPedido,
  actualizarPedido,
  cambiarEstadoPedido,
  eliminarPedido,
} from "../controllers/pedido.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router = express.Router();


/* =========================================
   PROTEGER TODAS LAS RUTAS DE PEDIDOS
========================================= */

router.use(proteger);


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoPedido
);


/* =========================================
   LISTAR PEDIDOS
========================================= */

router.get(
  "/",
  listarPedidos
);


/* =========================================
   CREAR PEDIDO
========================================= */

router.post(
  "/",
  crearPedido
);


/* =========================================
   ACTUALIZAR PEDIDO
========================================= */

router.put(
  "/:id",
  actualizarPedido
);


/* =========================================
   CAMBIAR ESTADO
========================================= */

router.patch(
  "/:id/estado",
  cambiarEstadoPedido
);


/* =========================================
   ELIMINAR PEDIDO
========================================= */

router.delete(
  "/:id",
  eliminarPedido
);


export default router;