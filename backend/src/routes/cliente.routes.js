import { Router } from "express";

import {
  clienteController,
  obtenerSiguienteCodigoCliente,
} from "../controllers/cliente.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";


const router = Router();


router.use(proteger);


/* =========================================================
   SIGUIENTE CÓDIGO
   IMPORTANTE: antes de /:id
========================================================= */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoCliente
);


/* =========================================================
   CRUD CLIENTES
========================================================= */

router.get(
  "/",
  clienteController.listar
);

router.get(
  "/:id",
  clienteController.obtener
);

router.post(
  "/",
  clienteController.crear
);

router.put(
  "/:id",
  clienteController.actualizar
);

router.delete(
  "/:id",
  soloAdmin,
  clienteController.eliminar
);


export default router;