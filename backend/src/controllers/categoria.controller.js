import Categoria
  from "../models/Categoria.js";

import Consecutivo
  from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


/* =========================================
   LISTAR CATEGORÍAS
========================================= */

export const listarCategorias =
  async (req, res) => {

    try {

      const categorias =
        await Categoria.find()
          .sort({
            createdAt: -1,
          });

      return res.json(
        categorias
      );

    } catch (error) {

      console.error(
        "Error listando categorías:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible cargar las categorías.",
      });

    }

  };


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export const obtenerSiguienteCodigoCategoria =
  async (req, res) => {

    try {

      const consecutivo =
        await Consecutivo.findOne({
          clave: "categorias",
        });

      const siguiente =
        (consecutivo?.ultimoNumero || 0) + 1;


      const codigo =
        `CAT-${String(
          siguiente
        ).padStart(4, "0")}`;


      return res.json({
        codigo,
      });

    } catch (error) {

      console.error(
        "Error obteniendo consecutivo de categoría:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener el siguiente código.",
      });

    }

  };


/* =========================================
   CREAR CATEGORÍA
========================================= */

export const crearCategoria =
  async (req, res) => {

    try {

      const {
        nombre,
        descripcion,
      } = req.body;


      if (!nombre?.trim()) {

        return res.status(400).json({
          mensaje:
            "El nombre de la categoría es obligatorio.",
        });

      }


      const nombreNormalizado =
        nombre.trim();


      const existe =
        await Categoria.findOne({
          nombre: {
            $regex:
              `^${nombreNormalizado.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,

            $options: "i",
          },
        });


      if (existe) {

        return res.status(400).json({
          mensaje:
            "Ya existe una categoría con ese nombre.",
        });

      }


      const codigo =
        await generarConsecutivo(
          "categorias",
          "CAT"
        );


      const categoria =
        await Categoria.create({
          codigo,

          nombre:
            nombreNormalizado,

          descripcion:
            descripcion?.trim() ||
            "",

          estado: "Activa",

          creadoPor:
            req.usuario?._id ||
            null,
        });


      return res
        .status(201)
        .json({
          mensaje:
            "Categoría creada correctamente.",

          categoria,
        });

    } catch (error) {

      console.error(
        "Error creando categoría:",
        error
      );


      return res.status(500).json({
        mensaje:
          error.message ||
          "No fue posible crear la categoría.",
      });

    }

  };


/* =========================================
   ACTUALIZAR CATEGORÍA
========================================= */

export const actualizarCategoria =
  async (req, res) => {

    try {

      const {
        nombre,
        descripcion,
      } = req.body;


      if (!nombre?.trim()) {

        return res.status(400).json({
          mensaje:
            "El nombre de la categoría es obligatorio.",
        });

      }


      const categoria =
        await Categoria.findById(
          req.params.id
        );


      if (!categoria) {

        return res.status(404).json({
          mensaje:
            "Categoría no encontrada.",
        });

      }


      const nombreNormalizado =
        nombre.trim();


      const existe =
        await Categoria.findOne({
          _id: {
            $ne: categoria._id,
          },

          nombre: {
            $regex:
              `^${nombreNormalizado.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              )}$`,

            $options: "i",
          },
        });


      if (existe) {

        return res.status(400).json({
          mensaje:
            "Ya existe otra categoría con ese nombre.",
        });

      }


      categoria.nombre =
        nombreNormalizado;

      categoria.descripcion =
        descripcion?.trim() ||
        "";


      await categoria.save();


      return res.json({
        mensaje:
          "Categoría actualizada correctamente.",

        categoria,
      });

    } catch (error) {

      console.error(
        "Error actualizando categoría:",
        error
      );


      return res.status(500).json({
        mensaje:
          error.message ||
          "No fue posible actualizar la categoría.",
      });

    }

  };


/* =========================================
   ACTIVAR / DESACTIVAR
========================================= */

export const cambiarEstadoCategoria =
  async (req, res) => {

    try {

      const categoria =
        await Categoria.findById(
          req.params.id
        );


      if (!categoria) {

        return res.status(404).json({
          mensaje:
            "Categoría no encontrada.",
        });

      }


      categoria.estado =
        categoria.estado === "Activa"
          ? "Inactiva"
          : "Activa";


      await categoria.save();


      return res.json({
        mensaje:
          categoria.estado === "Activa"
            ? "Categoría activada correctamente."
            : "Categoría desactivada correctamente.",

        estado:
          categoria.estado,
      });

    } catch (error) {

      console.error(
        "Error cambiando estado de categoría:",
        error
      );


      return res.status(500).json({
        mensaje:
          "No fue posible cambiar el estado de la categoría.",
      });

    }

  };


/* =========================================
   ELIMINAR CATEGORÍA
========================================= */

export const eliminarCategoria =
  async (req, res) => {

    try {

      const categoria =
        await Categoria.findById(
          req.params.id
        );


      if (!categoria) {

        return res.status(404).json({
          mensaje:
            "Categoría no encontrada.",
        });

      }


      await categoria.deleteOne();


      return res.json({
        mensaje:
          "Categoría eliminada correctamente.",
      });

    } catch (error) {

      console.error(
        "Error eliminando categoría:",
        error
      );


      return res.status(500).json({
        mensaje:
          "No fue posible eliminar la categoría.",
      });

    }

  };