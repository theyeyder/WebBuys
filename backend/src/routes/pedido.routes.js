import express
  from "express";

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


const router =
  express.Router();


router.use(
  proteger
);


/* SIGUIENTE CÓDIGO */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoPedido
);


/* LISTAR */

router.get(
  "/",
  listarPedidos
);


/* CREAR */

router.post(
  "/",
  crearPedido
);


/* ACTUALIZAR */

router.put(
  "/:id",
  actualizarPedido
);


/* ESTADO */

router.patch(
  "/:id/estado",
  cambiarEstadoPedido
);


/* ELIMINAR */

router.delete(
  "/:id",
  eliminarPedido
);


export default router;