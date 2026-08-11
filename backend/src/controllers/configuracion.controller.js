import fs from "fs";
import path from "path";
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

/* ===========================
   SUBIR LOGO
=========================== */

export const subirLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        mensaje: "Debe seleccionar una imagen.",
      });
    }

    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = await Configuracion.create({});
    }

    configuracion.logo =
      "/uploads/" + path.basename(req.file.path);

    await configuracion.save();

    res.json({
      mensaje: "Logo actualizado correctamente.",
      logo: configuracion.logo,
    });

  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};
/* ===========================
   ELIMINAR LOGO
=========================== */

export const eliminarLogo = async (req, res) => {
  try {
    const configuracion = await Configuracion.findOne();

    if (!configuracion || !configuracion.logo) {
      return res.status(404).json({
        mensaje: "La empresa no tiene un logo registrado.",
      });
    }

    const nombreArchivo = path.basename(configuracion.logo);

    const rutaArchivo = path.resolve(
      "uploads",
      nombreArchivo
    );

    if (fs.existsSync(rutaArchivo)) {
      fs.unlinkSync(rutaArchivo);
    }

    configuracion.logo = "";

    await configuracion.save();

    res.json({
      mensaje: "Logo eliminado correctamente.",
      logo: "",
    });
  } catch (error) {
    console.error("Error eliminando logo:", error);

    res.status(500).json({
      mensaje: error.message,
    });
  }
};