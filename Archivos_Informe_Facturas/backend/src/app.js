import express from "express";

import cors from "cors";

import morgan from "morgan";

import path from "path";

import authRoutes from "./routes/auth.routes.js";

import usuarioRoutes from "./routes/usuario.routes.js";

import perfilUsuarioRoutes from "./routes/perfilUsuario.routes.js";

import configuracionRoutes from "./routes/configuracion.routes.js";

import rutaRoutes from "./routes/ruta.routes.js";

import zonaDespachoRoutes from "./routes/zonaDespacho.routes.js";

import clienteRoutes from "./routes/cliente.routes.js";

import numeracionRoutes from "./routes/numeracion.routes.js";

import preferenciaRoutes from "./routes/preferencia.routes.js";

import auditoriaRoutes from "./routes/auditoria.routes.js";

import categoriaRoutes from "./routes/categoria.routes.js";

import productoRoutes from "./routes/producto.routes.js";

import inventarioRoutes from "./routes/inventario.routes.js";

import pedidoRoutes from "./routes/pedido.routes.js";

import entregaRoutes from "./routes/entrega.routes.js";

import empleadoRoutes from "./routes/empleado.routes.js";

import facturaRoutes from "./routes/factura.routes.js";

import cajaRoutes from "./routes/caja.routes.js";

import carteraRoutes from "./routes/cartera.routes.js";

import informeRoutes from "./routes/informe.routes.js";

import { proteger } from "./middlewares/auth.middleware.js";

import { controlarAccesoModulo } from "./middlewares/controlAcceso.middleware.js";


const app = express();


/* =========================================
   MIDDLEWARES
========================================= */

app.use(
  cors()
);

app.use(
  express.json()
);

app.use(
  "/uploads",
  express.static(
    path.resolve(
      "uploads"
    )
  )
);

app.use(
  morgan(
    "dev"
  )
);


/* =========================================
   RUTA PRINCIPAL
========================================= */

app.get(
  "/",
  (_, res) =>

    res.json({
      app: "WebBuys API",
      status: "OK",
    })
);


/* =========================================
   RUTAS API
========================================= */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/usuarios",
  proteger,
  controlarAccesoModulo("usuarios"),
  usuarioRoutes
);

app.use(
  "/api/perfiles",
  perfilUsuarioRoutes
);

app.use(
  "/api/configuracion",
  proteger,
  controlarAccesoModulo("empresa"),
  configuracionRoutes
);

app.use(
  "/api/rutas",
  proteger,
  controlarAccesoModulo("rutas"),
  rutaRoutes
);

app.use(
  "/api/zonas-despacho",
  proteger,
  controlarAccesoModulo("zonas_despacho"),
  zonaDespachoRoutes
);

app.use(
  "/api/clientes",
  proteger,
  controlarAccesoModulo("clientes"),
  clienteRoutes
);

app.use(
  "/api/numeracion",
  proteger,
  controlarAccesoModulo("numeracion"),
  numeracionRoutes
);

app.use(
  "/api/preferencias",
  proteger,
  controlarAccesoModulo("preferencias"),
  preferenciaRoutes
);

app.use(
  "/api/auditoria",
  proteger,
  controlarAccesoModulo("auditoria"),
  auditoriaRoutes
);

app.use(
  "/api/categorias",
  proteger,
  controlarAccesoModulo("categorias"),
  categoriaRoutes
);

app.use(
  "/api/productos",
  proteger,
  controlarAccesoModulo("productos"),
  productoRoutes
);

app.use(
  "/api/inventario",
  proteger,
  controlarAccesoModulo("inventario"),
  inventarioRoutes
);

app.use(
  "/api/pedidos",
  proteger,
  controlarAccesoModulo("pedidos"),
  pedidoRoutes
);

app.use(
  "/api/entregas",
  proteger,
  controlarAccesoModulo("entregas"),
  entregaRoutes
);

app.use(
  "/api/empleados",
  proteger,
  controlarAccesoModulo("empleados"),
  empleadoRoutes
);

app.use(
  "/api/facturas",
  proteger,
  controlarAccesoModulo("facturacion"),
  facturaRoutes
);

app.use(
  "/api/caja",
  proteger,
  controlarAccesoModulo("caja"),
  cajaRoutes
);

app.use(
  "/api/cartera",
  proteger,
  controlarAccesoModulo("cartera"),
  carteraRoutes
);

/* =========================================
   INFORMES
========================================= */

app.use(
  "/api/informes",
  proteger,
  informeRoutes
);


export default app;