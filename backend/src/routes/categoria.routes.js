import express
  from "express";

import {
  listarCategorias,
  obtenerSiguienteCodigoCategoria,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
} from "../controllers/categoria.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";


const router =
  express.Router();


/* =========================================
   TODAS REQUIEREN AUTENTICACIÓN
========================================= */

router.use(proteger);


/* =========================================
   SIGUIENTE CÓDIGO

   IMPORTANTE:
   Va antes de /:id
========================================= */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoCategoria
);


/* =========================================
   LISTAR
========================================= */

router.get(
  "/",
  listarCategorias
);


/* =========================================
   CREAR
========================================= */

router.post(
  "/",
  crearCategoria
);


/* =========================================
   ACTUALIZAR
========================================= */

router.put(
  "/:id",
  actualizarCategoria
);


/* =========================================
   ACTIVAR / DESACTIVAR
========================================= */

router.patch(
  "/:id/estado",
  cambiarEstadoCategoria
);


/* =========================================
   ELIMINAR
========================================= */

router.delete(
  "/:id",
  eliminarCategoria
);


export default router;