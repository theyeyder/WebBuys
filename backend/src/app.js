import express from "express";
import cors from "cors";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_, res) =>
  res.json({
    app: "WebBuys API",
    status: "OK",
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuarioRoutes);

export default app;