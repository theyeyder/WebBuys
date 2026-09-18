import {
  Router,
} from "express";

import {
  listarEmpleados,
  listarEmpleadosPedidos,
  obtenerEmpleadoPorId,
  obtenerSiguienteCodigoEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  cambiarEstadoEmpleado,
  eliminarEmpleado,
} from "../controllers/empleado.controller.js";

import {
  proteger,
} from "../middlewares/auth.middleware.js";

import {
  soloAdmin,
} from "../middlewares/role.middleware.js";


const router =
  Router();


/* =========================================================
   AUTENTICACIÓN
========================================================= */

router.use(
  proteger
);


/* =========================================================
   PERSONAL DISPONIBLE PARA PEDIDOS
   No expone salario ni datos administrativos.
========================================================= */

router.get(
  "/pedidos",
  listarEmpleadosPedidos
);


/* =========================================================
   ADMINISTRACIÓN DE EMPLEADOS
========================================================= */

router.use(
  soloAdmin
);


/* =========================================================
   EMPLEADOS
========================================================= */

router.get(
  "/siguiente-codigo",
  obtenerSiguienteCodigoEmpleado
);

router.get(
  "/",
  listarEmpleados
);

router.get(
  "/:id",
  obtenerEmpleadoPorId
);

router.post(
  "/",
  crearEmpleado
);

router.put(
  "/:id",
  actualizarEmpleado
);

router.patch(
  "/:id/estado",
  cambiarEstadoEmpleado
);

router.delete(
  "/:id",
  eliminarEmpleado
);


export default router;
