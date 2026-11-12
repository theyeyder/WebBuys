import {
  cerrarMesInventario,
  listarCierresMensualesInventario,
  obtenerResumenMensualInventario,
} from "../services/cierreInventario.service.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";

import { generarExcelCierreInventario } from "../services/cierreInventarioExcel.service.js";


function usuarioNombre(
  usuario
) {
  return [
    usuario?.nombres,
    usuario?.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim() ||
    usuario?.usuario ||
    "";
}


export const listarCierresInventario =
  async (req, res) => {
    try {
      const cierres =
        await listarCierresMensualesInventario();

      return res.json({
        cierres,
      });
    } catch (error) {
      console.error(
        "Error listando cierres de inventario:",
        error
      );

      return res
        .status(500)
        .json({
          mensaje:
            error.message ||
            "No fue posible cargar los cierres de inventario.",
        });
    }
  };


export const obtenerPeriodoInventario =
  async (req, res) => {
    try {
      const resumen =
        await obtenerResumenMensualInventario(
          req.params.anio,
          req.params.mes
        );

      return res.json({
        cierre:
          resumen,
      });
    } catch (error) {
      console.error(
        "Error consultando período de inventario:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible consultar el período de inventario.",
        });
    }
  };


export const cerrarPeriodoInventario =
  async (req, res) => {
    try {
      const cierre =
        await cerrarMesInventario({
          anio:
            req.params.anio,
          mes:
            req.params.mes,
          usuarioId:
            req.usuario?.postgresId ||
            req.usuario?.id ||
            null,
          usuarioNombre:
            usuarioNombre(
              req.usuario
            ),
          observaciones:
            req.body?.observaciones ||
            "",
        });

      await registrarAuditoria({
        req,
        modulo:
          "Inventario",
        accion:
          "CERRAR_MES",
        registroId:
          cierre.id,
        codigoRegistro:
          cierre.periodo,
        descripcion:
          `Cierre mensual de inventario ${cierre.periodo}.`,
        datosNuevos: {
          periodo:
            cierre.periodo,
          totalProductos:
            cierre.totalProductos,
          totalRegistros:
            cierre.totalRegistros,
          totalVendidoNeto:
            cierre.totalVendidoNeto,
          valorInventarioFinal:
            cierre.valorInventarioFinal,
        },
      });

      return res
        .status(201)
        .json({
          mensaje:
            `Inventario ${cierre.periodo} cerrado correctamente.`,
          cierre,
        });
    } catch (error) {
      console.error(
        "Error cerrando período de inventario:",
        error
      );

      return res
        .status(400)
        .json({
          mensaje:
            error.message ||
            "No fue posible cerrar el período de inventario.",
        });
    }
  };


/* Descarga el snapshot historico del mes, sin recalcular existencias. */
export const descargarExcelCierreInventario = async (req, res) => {
  try {
    const cierre = await obtenerResumenMensualInventario(
      req.params.anio,
      req.params.mes
    );

    if (cierre?.estado !== "CERRADO") {
      return res.status(404).json({
        mensaje: "Este periodo no tiene un cierre mensual registrado."
      });
    }

    const archivo = await generarExcelCierreInventario(cierre);
    const nombre = `WebBuys_Cierre_Inventario_${cierre.periodo}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    res.setHeader("Cache-Control", "private, no-store");

    return res.send(Buffer.from(archivo));
  } catch (error) {
    console.error("Error descargando cierre mensual Excel:", error);
    return res.status(500).json({
      mensaje: "No fue posible generar el Excel del cierre mensual."
    });
  }
};
