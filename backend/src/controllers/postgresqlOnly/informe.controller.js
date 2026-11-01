import {
  obtenerDatosInforme,
  obtenerEmpresaInforme,
  obtenerOpcionesRepartidoresInforme,
  obtenerOpcionesCajasInforme,
} from "../../services/informes/informeDatos.service.js";

import { puede } from "../../utils/permisos.js";

import {
  generarInformeHtml,
} from "../../services/informes/informeHtml.service.js";

import {
  generarInformeExcel,
} from "../../services/informes/informeExcel.service.js";

import {
  generarInformePdf,
} from "../../services/informes/informePdf.service.js";


/* =========================================================
   CATÁLOGO DEL MÓDULO
========================================================= */

export const obtenerEstadoInformes =
  async (req, res) => {

    return res.json({
      modulo:
        "Informes",

      estado:
        "OK",

      tipos: [
        "resumen",
        "ventas",
        "facturas",
        "pedidos",
        "entregas",
        "inventario",
        "productos",
        "clientes",
        "caja",
        "cartera",
        "rutas-zonas",
        "repartidores",
      ],

      formatos: [
        "json",
        "html",
        "pdf",
        "xlsx",
      ],
    });

  };


/* =========================================================
   OPCIONES DE REPARTIDORES PARA EL FILTRO
========================================================= */

export const listarOpcionesRepartidores = async (_req, res) => {
  try {
    return res.json(await obtenerOpcionesRepartidoresInforme());
  } catch (error) {
    console.error("Error consultando repartidores del informe:", error);
    return res.status(500).json({
      mensaje: "No fue posible cargar los repartidores del informe.",
    });
  }
};


/* Opciones de caja: solo usuarios con acceso a Caja. */
export const listarOpcionesCajas = async (req, res) => {
  if (!puede(req.usuario, "caja", "ver")) {
    return res.status(403).json({ mensaje: "No tienes permiso para consultar Caja." });
  }
  try {
    return res.json(await obtenerOpcionesCajasInforme());
  } catch (error) {
    console.error("Error consultando cajas para informe:", error);
    return res.status(500).json({ mensaje: "No fue posible cargar las cajas." });
  }
};

/* =========================================================
   RESUMEN GENERAL → TABLA EXPORTABLE
========================================================= */

function convertirResumenATabla(
  datos
) {

  const indicadores =
    datos.indicadores || {};


  const nombres = {
    pedidos:
      "Pedidos",

    valorPedidos:
      "Valor de pedidos",

    entregas:
      "Entregas",

    totalVentas:
      "Total ventas",

    facturas:
      "Facturas",

    valorFacturado:
      "Valor facturado",

    clientesNuevos:
      "Clientes nuevos",

    ingresosCaja:
      "Ingresos de caja",

    egresosCaja:
      "Egresos de caja",

    carteraGenerada:
      "Cartera generada",

    saldoCartera:
      "Saldo de cartera",

    pagosCartera:
      "Pagos de cartera",
  };


  const filas =
    Object.entries(
      indicadores
    ).map(
      ([clave, valor]) => ({

        indicador:
          nombres[clave] ||
          clave,

        valor:
          valor ?? 0,

      })
    );


  const inventario =
    Array.isArray(
      datos.inventarioPorTipo
    )
      ? datos.inventarioPorTipo
      : [];


  inventario.forEach(
    (item) => {

      filas.push({
        indicador:
          `Inventario - ${item.tipo}`,

        valor:
          `Movimientos: ${item.movimientos} | Cantidad: ${item.cantidad} | Valor: ${item.valor}`,
      });

    }
  );


  return {

    titulo:
      datos.titulo ||
      "Resumen general",

    desde:
      datos.desde,

    hasta:
      datos.hasta,

    columnas: [
      {
        titulo:
          "Indicador",

        campo:
          "indicador",
      },

      {
        titulo:
          "Valor",

        campo:
          "valor",
      },
    ],

    filas,

  };

}


/* =========================================================
   GENERAR INFORME
========================================================= */

export const generarInforme =
  async (req, res) => {

    try {

      const tipo =
        String(
          req.params.tipo ||
          ""
        )
          .trim()
          .toLowerCase();


      const formato =
        String(
          req.query.formato ||
          "json"
        )
          .trim()
          .toLowerCase();


      const desde =
        String(
          req.query.desde ||
          ""
        )
          .trim();


      const hasta =
        String(
          req.query.hasta ||
          ""
        )
          .trim();


      if (
        !desde ||
        !hasta
      ) {

        return res
          .status(400)
          .json({
            mensaje:
              "Debe indicar las fechas desde y hasta.",
          });

      }


      /* Los informes financieros respetan los permisos de lectura. */
      if ((tipo === "caja" || tipo === "cartera") &&
          !puede(req.usuario, tipo, "ver")) {
        return res.status(403).json({ mensaje: `No tienes permiso para consultar ${tipo}.` });
      }

      /* =========================================
         CONSULTAR POSTGRESQL
      ========================================= */

      const resultado =
        await obtenerDatosInforme({
          tipo,
          desde,
          hasta,
          repartidorId: tipo === "repartidores"
            ? String(req.query.repartidorId || "").trim()
            : "",
          cajaId: tipo === "caja" ? String(req.query.cajaId || "").trim() : "",
          carteraEstado: tipo === "cartera" ? String(req.query.carteraEstado || "").trim() : "",
          carteraPeriodo: tipo === "cartera" ? String(req.query.carteraPeriodo || "entrega").trim() : "entrega",
        });


      /* =========================================
         JSON / VISTA PREVIA
      ========================================= */

      if (
        formato ===
        "json"
      ) {

        return res.json(
          resultado
        );

      }


      /* =========================================
         NORMALIZAR DATOS PARA EXPORTACIÓN
      ========================================= */

      const datos =
        tipo === "resumen"
          ? convertirResumenATabla(
              resultado
            )
          : resultado;


      const usuario =
        req.usuario?.usuario ||
        req.user?.usuario ||
        "Usuario";


      const empresa =
        await obtenerEmpresaInforme();


      const datosExportacion = {

        tipo,

        empresa,

        titulo:
          datos.titulo,

        nota: datos.nota || "",

        desde,
        hasta,

        usuario,

        columnas:
          datos.columnas ||
          [],

        filas:
          datos.filas ||
          [],

        indicadores: datos.indicadores || null,
        secciones: datos.secciones || [],

      };


      /* =========================================
         HTML
      ========================================= */

      if (
        formato ===
        "html"
      ) {

        const html =
          generarInformeHtml(
            datosExportacion
          );


        return res
          .type("html")
          .send(html);

      }


      /* =========================================
         EXCEL
      ========================================= */

      if (
        formato === "xlsx" ||
        formato === "excel"
      ) {

        const archivo =
          await generarInformeExcel(
            datosExportacion
          );


        const nombre =
          `informe-${tipo}-${desde}-${hasta}.xlsx`;


        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );


        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${nombre}"`
        );


        return res.send(
          Buffer.from(
            archivo
          )
        );

      }


      /* =========================================
         PDF
      ========================================= */

      if (
        formato ===
        "pdf"
      ) {

        const archivo =
          await generarInformePdf(
            datosExportacion
          );


        const nombre =
          `informe-${tipo}-${desde}-${hasta}.pdf`;


        res.setHeader(
          "Content-Type",
          "application/pdf"
        );


        res.setHeader(
          "Content-Disposition",
          `inline; filename="${nombre}"`
        );


        return res.send(
          archivo
        );

      }


      /* =========================================
         FORMATO NO VÁLIDO
      ========================================= */

      return res
        .status(400)
        .json({
          mensaje:
            "Formato no válido. Use json, html, pdf o xlsx.",
        });


    } catch (error) {

      console.error(
        "Error generando informe:",
        error
      );


      return res
        .status(500)
        .json({
          mensaje:
            error.message,
        });

    }

  };