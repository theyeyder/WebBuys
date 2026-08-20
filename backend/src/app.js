import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";
import configuracionRoutes from "./routes/configuracion.routes.js";
import rutaRoutes from "./routes/ruta.routes.js";
import zonaDespachoRoutes from "./routes/zonaDespacho.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(path.resolve("uploads"))
);

app.use(morgan("dev"));

app.get("/", (_, res) =>
  res.json({
    app: "WebBuys API",
    status: "OK",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/configuracion", configuracionRoutes);
app.use("/api/rutas", rutaRoutes);

app.use(
  "/api/zonas-despacho",
  zonaDespachoRoutes
);

export default app;