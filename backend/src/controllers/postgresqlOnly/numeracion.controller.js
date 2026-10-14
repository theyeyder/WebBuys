import { prisma } from "../../config/postgresql.js";

/* =========================================
   FASE 52 - NUMERACIÓN PREPARADA POSTGRESQL-ONLY
   NO ESTÁ ACTIVADA EN LAS RUTAS TODAVÍA.
========================================= */

const CONFIG_NUMERACION = {
  clientes: { modulo: "Clientes", prefijo: "CTE", longitud: 4 },
  usuarios: { modulo: "Usuarios", prefijo: "USER", longitud: 4 },
  rutas: { modulo: "Rutas", prefijo: "RUTA", longitud: 2 },
  "zonas-despacho": { modulo: "Zonas de despacho", prefijo: "ZN", longitud: 4 },
};

export const listarNumeraciones = async (req, res) => {
  try {
    const consecutivos = await prisma.consecutivo.findMany({
      orderBy: { clave: "asc" },
    });

    const porClave = new Map(consecutivos.map((item) => [item.clave, item]));

    const resultado = Object.entries(CONFIG_NUMERACION).map(([clave, configuracion]) => {
      const registro = porClave.get(clave);
      const ultimoNumero = Number(registro?.ultimoNumero || 0);
      const siguienteNumero = ultimoNumero + 1;
      const ultimoFormateado = String(ultimoNumero).padStart(configuracion.longitud, "0");
      const siguienteCodigo = `${configuracion.prefijo}-${String(siguienteNumero).padStart(
        configuracion.longitud,
        "0"
      )}`;

      return {
        clave,
        modulo: configuracion.modulo,
        prefijo: configuracion.prefijo,
        longitud: configuracion.longitud,
        ultimoNumero,
        ultimoFormateado,
        siguienteNumero,
        siguienteCodigo,
        actualizadoEn: registro?.updatedAt || null,
      };
    });

    return res.json(resultado);
  } catch (error) {
    console.error("Error listando numeraciones PostgreSQL-only:", error);
    return res.status(500).json({ mensaje: "No fue posible cargar la numeración." });
  }
};
