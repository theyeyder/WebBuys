import express
  from "express";

import {
  listarProductos,
  obtenerSiguienteCodigoProducto,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  eliminarProducto,
} from "../controllers/producto.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router =
  express.Router();


router.use(
  proteger
);


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoProducto
);


/* =========================================
   LISTAR
========================================= */

router.get(
  "/",
  listarProductos
);


/* =========================================
   CREAR
========================================= */

router.post(
  "/",
  crearProducto
);


/* =========================================
   ACTUALIZAR
========================================= */

router.put(
  "/:id",
  actualizarProducto
);


/* =========================================
   ESTADO
========================================= */

router.patch(
  "/:id/estado",
  cambiarEstadoProducto
);


/* =========================================
   ELIMINAR
========================================= */

router.delete(
  "/:id",
  eliminarProducto
);


export default router;