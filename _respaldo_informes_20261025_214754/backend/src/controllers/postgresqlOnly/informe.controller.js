import {
  obtenerDatosInforme,
  obtenerEmpresaInforme,
} from "../../services/informes/informeDatos.service.js";

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


      /* =========================================
         CONSULTAR POSTGRESQL
      ========================================= */

      const resultado =
        await obtenerDatosInforme({
          tipo,
          desde,
          hasta,
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

        desde,
        hasta,

        usuario,

        columnas:
          datos.columnas ||
          [],

        filas:
          datos.filas ||
          [],

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