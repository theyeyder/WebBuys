import "dotenv/config";

import app from "./app.js";

import {
  connectPostgreSQL,
  disconnectPostgreSQL,
} from "./config/postgresql.js";

const PORT =
  process.env.PORT ||
  5000;

/*
  WEBBUYS - POSTGRESQL ONLY

  MongoDB ya no participa en el arranque ni en el runtime operativo.
  Los archivos históricos de migración/modelos Mongo pueden conservarse
  como referencia o respaldo, pero no son cargados por server.js.
*/
await connectPostgreSQL();

const server =
  app.listen(
    PORT,
    () => {
      console.log(
        `WebBuys API en http://localhost:${PORT}`
      );

      console.log(
        "Runtime activo: PostgreSQL-only. MongoDB no es requerido."
      );
    }
  );

async function cerrarServidor(
  signal
) {
  console.log(
    `Cierre solicitado (${signal}).`
  );

  server.close(
    async () => {
      try {
        await disconnectPostgreSQL();
      } finally {
        process.exit(0);
      }
    }
  );

  setTimeout(
    () => process.exit(1),
    5000
  ).unref();
}

process.on(
  "SIGINT",
  () => cerrarServidor("SIGINT")
);

process.on(
  "SIGTERM",
  () => cerrarServidor("SIGTERM")
);
