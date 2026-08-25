import Preferencia
  from "../models/Preferencia.js";


/* =========================================
   OBTENER PREFERENCIAS
========================================= */

export const obtenerPreferencias =
  async (req, res) => {

    try {

      let preferencias =
        await Preferencia.findOne();

      if (!preferencias) {

        preferencias =
          await Preferencia.create({});

      }

      return res.json(
        preferencias
      );

    } catch (error) {

      console.error(
        "Error obteniendo preferencias:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible cargar las preferencias.",
      });

    }

  };


/* =========================================
   ACTUALIZAR PREFERENCIAS
========================================= */

export const actualizarPreferencias =
  async (req, res) => {

    try {

      const {
        moneda,
        simboloMoneda,
        decimales,
        formatoFecha,
        permitirInventarioNegativo,
        confirmarAntesEliminar,
      } = req.body;


      let preferencias =
        await Preferencia.findOne();


      if (!preferencias) {

        preferencias =
          new Preferencia();

      }


      if (moneda !== undefined) {
        preferencias.moneda =
          moneda;
      }


      if (simboloMoneda !== undefined) {
        preferencias.simboloMoneda =
          String(
            simboloMoneda
          ).trim();
      }


      if (decimales !== undefined) {
        preferencias.decimales =
          Number(decimales);
      }


      if (formatoFecha !== undefined) {
        preferencias.formatoFecha =
          formatoFecha;
      }


      if (
        permitirInventarioNegativo !==
        undefined
      ) {
        preferencias
          .permitirInventarioNegativo =
          Boolean(
            permitirInventarioNegativo
          );
      }


      if (
        confirmarAntesEliminar !==
        undefined
      ) {
        preferencias
          .confirmarAntesEliminar =
          Boolean(
            confirmarAntesEliminar
          );
      }


      await preferencias.save();


      return res.json({
        mensaje:
          "Preferencias actualizadas correctamente.",

        preferencias,
      });

    } catch (error) {

      console.error(
        "Error actualizando preferencias:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible actualizar las preferencias.",
      });

    }

  };