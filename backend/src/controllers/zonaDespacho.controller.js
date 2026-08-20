import ZonaDespacho from "../models/ZonaDespacho.js";

/* ===========================
   LISTAR ZONAS
=========================== */

export const listarZonasDespacho = async (req, res) => {
  try {
    const zonas = await ZonaDespacho.find()
      .sort({ nombre: 1 });

    return res.json(zonas);
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   CREAR ZONA
=========================== */

export const crearZonaDespacho = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      estado,
    } = req.body;

    if (!nombre?.trim()) {
      return res.status(400).json({
        mensaje: "El nombre de la zona es obligatorio.",
      });
    }

    const existe = await ZonaDespacho.findOne({
      nombre: {
        $regex: `^${nombre.trim()}$`,
        $options: "i",
      },
    });

    if (existe) {
      return res.status(400).json({
        mensaje: "Ya existe una zona con ese nombre.",
      });
    }

    const zona = await ZonaDespacho.create({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || "",
      estado: estado || "Activa",
    });

    return res.status(201).json({
      mensaje: "Zona creada correctamente.",
      zona,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTUALIZAR ZONA
=========================== */

export const actualizarZonaDespacho = async (req, res) => {
  try {
    const zona = await ZonaDespacho.findById(
      req.params.id
    );

    if (!zona) {
      return res.status(404).json({
        mensaje: "Zona no encontrada.",
      });
    }

    const {
      nombre,
      descripcion,
      estado,
    } = req.body;

    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({
          mensaje: "El nombre de la zona es obligatorio.",
        });
      }

      const existe = await ZonaDespacho.findOne({
        _id: { $ne: zona._id },
        nombre: {
          $regex: `^${nombre.trim()}$`,
          $options: "i",
        },
      });

      if (existe) {
        return res.status(400).json({
          mensaje: "Ya existe otra zona con ese nombre.",
        });
      }

      zona.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      zona.descripcion = descripcion.trim();
    }

    if (estado !== undefined) {
      zona.estado = estado;
    }

    await zona.save();

    return res.json({
      mensaje: "Zona actualizada correctamente.",
      zona,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTIVAR / DESACTIVAR
=========================== */

export const cambiarEstadoZonaDespacho = async (
  req,
  res
) => {
  try {
    const zona = await ZonaDespacho.findById(
      req.params.id
    );

    if (!zona) {
      return res.status(404).json({
        mensaje: "Zona no encontrada.",
      });
    }

    zona.estado =
      zona.estado === "Activa"
        ? "Inactiva"
        : "Activa";

    await zona.save();

    return res.json({
      mensaje: "Estado de la zona actualizado.",
      zona,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ELIMINAR ZONA
=========================== */

export const eliminarZonaDespacho = async (
  req,
  res
) => {
  try {
    const zona = await ZonaDespacho.findById(
      req.params.id
    );

    if (!zona) {
      return res.status(404).json({
        mensaje: "Zona no encontrada.",
      });
    }

    await zona.deleteOne();

    return res.json({
      mensaje: "Zona eliminada correctamente.",
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};