import { Router } from "express";

import {
  listarRutas,
  crearRuta,
  actualizarRuta,
  cambiarEstadoRuta,
  eliminarRuta,
} from "../controllers/ruta.controller.js";

import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

/* ===========================
   RUTAS
=========================== */

// Listar todas las rutas
router.get(
  "/",
  authMiddleware,
  listarRutas
);

// Crear una nueva ruta
router.post(
  "/",
  authMiddleware,
  crearRuta
);

// Actualizar una ruta
router.put(
  "/:id",
  authMiddleware,
  actualizarRuta
);

// Activar / desactivar
router.patch(
  "/:id/estado",
  authMiddleware,
  cambiarEstadoRuta
);

// Eliminar
router.delete(
  "/:id",
  authMiddleware,
  eliminarRuta
);

export default router;