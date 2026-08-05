import Configuracion from "../models/Configuracion.js";

/* ===========================
   OBTENER CONFIGURACIÓN
=========================== */

export const obtenerConfiguracion = async (req, res) => {
  try {
    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = await Configuracion.create({});
    }

    res.json(configuracion);
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTUALIZAR CONFIGURACIÓN
=========================== */

export const actualizarConfiguracion = async (req, res) => {
  try {
    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = await Configuracion.create(req.body);
    } else {
      configuracion = await Configuracion.findByIdAndUpdate(
        configuracion._id,
        {
          $set: req.body,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    }

    res.json({
      mensaje: "Configuración guardada correctamente.",
      configuracion,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};