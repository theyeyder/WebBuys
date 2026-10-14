import {
  cerrarMesInventario,
  listarCierresMensualesInventario,
  obtenerResumenMensualInventario,
} from "../services/cierreInventario.service.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";


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
