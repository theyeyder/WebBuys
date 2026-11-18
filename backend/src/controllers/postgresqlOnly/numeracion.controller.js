import { prisma } from "../../config/postgresql.js";

/*
 * NUMERACION V13 - CONSULTA DE SOLO LECTURA.
 * Las claves de CONFIG_NUMERACION corresponden a las que utilizan los
 * controladores para asignar codigos dentro de transacciones PostgreSQL.
 * Cartera y Entregas no poseen un contador propio: dependen de PED-XXXX.
 */
const CONFIG_NUMERACION = [
  ["clientes", { modulo: "Clientes", prefijo: "CTE", longitud: 4 }],
  ["usuarios", { modulo: "Usuarios", prefijo: "USER", longitud: 4 }],
  ["empleados", { modulo: "Empleados", prefijo: "EMP", longitud: 4 }],
  ["categorias", { modulo: "Categorías", prefijo: "CAT", longitud: 4 }],
  ["productos", { modulo: "Productos", prefijo: "PROD", longitud: 4 }],
  ["pedidos", { modulo: "Pedidos", prefijo: "PED", longitud: 4 }],
  ["facturas", { modulo: "Facturación", prefijo: "FAC", longitud: 4 }],
  ["cajas", { modulo: "Caja", prefijo: "CAJ", longitud: 4 }],
  ["rutas", { modulo: "Rutas", prefijo: "RUTA", longitud: 2 }],
  ["zonas-despacho", { modulo: "Zonas de despacho", prefijo: "ZN", longitud: 4 }],
];

function consecutivoPropio(clave, configuracion, registro) {
  const ultimoNumero = Number(registro?.ultimoNumero || 0);
  const siguienteNumero = ultimoNumero + 1;
  const ultimoFormateado = String(ultimoNumero).padStart(configuracion.longitud, "0");
  return {
    clave,
    ...configuracion,
    tipo: "propio",
    ultimoNumero,
    ultimoFormateado,
    ultimoCodigo: ultimoNumero > 0 ? `${configuracion.prefijo}-${ultimoFormateado}` : null,
    siguienteNumero,
    siguienteCodigo: `${configuracion.prefijo}-${String(siguienteNumero).padStart(configuracion.longitud, "0")}`,
    actualizadoEn: registro?.updatedAt || null,
  };
}

function consecutivoVinculado({ clave, modulo, prefijo, codigo, descripcion, actualizadoEn }) {
  const codigoActual = String(codigo || "").trim();
  const coincidencia = codigoActual.match(/^[A-Z]+-(\d+)$/i);
  const numeroExtraido = coincidencia ? Number(coincidencia[1]) : null;
  const ultimoNumero = numeroExtraido !== null && Number.isSafeInteger(numeroExtraido)
    ? numeroExtraido
    : codigoActual ? null : 0;
  return {
    clave,
    modulo,
    prefijo,
    longitud: 4,
    tipo: "vinculado",
    descripcion,
    ultimoNumero,
    ultimoFormateado: ultimoNumero === null ? "" : String(ultimoNumero).padStart(4, "0"),
    ultimoCodigo: codigoActual || null,
    siguienteNumero: null,
    siguienteCodigo: "Según pedido",
    actualizadoEn: actualizadoEn || null,
  };
}

export const listarNumeraciones = async (_req, res) => {
  try {
    // No crea ni incrementa consecutivos. Solo consulta los registros existentes.
    const [consecutivos, ultimaCartera, ultimaEntrega] = await Promise.all([
      prisma.consecutivo.findMany({ orderBy: { clave: "asc" } }),
      prisma.cartera.findFirst({
        select: { codigo: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.entrega.findFirst({
        select: { pedidoCodigo: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const porClave = new Map(consecutivos.map((item) => [item.clave, item]));
    const resultado = CONFIG_NUMERACION.map(([clave, configuracion]) =>
      consecutivoPropio(clave, configuracion, porClave.get(clave))
    );

    // Se colocan junto a Pedidos y Caja para facilitar la consulta.
    const indiceFacturas = resultado.findIndex((item) => item.clave === "facturas");
    resultado.splice(indiceFacturas, 0, consecutivoVinculado({
      clave: "entregas-vinculadas",
      modulo: "Entregas",
      prefijo: "PED",
      codigo: ultimaEntrega?.pedidoCodigo,
      descripcion: "Utiliza el código del pedido; no genera uno nuevo.",
      actualizadoEn: ultimaEntrega?.createdAt,
    }));

    const indiceCaja = resultado.findIndex((item) => item.clave === "cajas");
    resultado.splice(indiceCaja + 1, 0, consecutivoVinculado({
      clave: "cartera-vinculada",
      modulo: "Cartera",
      prefijo: "CAR",
      codigo: ultimaCartera?.codigo,
      descripcion: "Código derivado del pedido a crédito.",
      actualizadoEn: ultimaCartera?.createdAt,
    }));

    return res.json(resultado);
  } catch (error) {
    console.error("Error listando numeraciones PostgreSQL-only:", error);
    return res.status(500).json({ mensaje: "No fue posible cargar la numeración." });
  }
};
