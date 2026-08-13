import Ruta from "../models/Rutas.js";

/* ===========================
   LISTAR RUTAS
=========================== */

export const listarRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate("empleado", "nombres apellidos")
      .sort({ createdAt: -1 });

    res.json(rutas);
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   CREAR RUTA
=========================== */

export const crearRuta = async (req, res) => {
  try {
    const {
      codigo,
      nombre,
      descripcion,
      empleado,
      diasAtencion,
      estado,
    } = req.body;

    if (!codigo?.trim()) {
      return res.status(400).json({
        mensaje: "El código de la ruta es obligatorio.",
      });
    }

    if (!nombre?.trim()) {
      return res.status(400).json({
        mensaje: "El nombre de la ruta es obligatorio.",
      });
    }

    const codigoNormalizado = codigo.trim().toUpperCase();

    const rutaExistente = await Ruta.findOne({
      codigo: codigoNormalizado,
    });

    if (rutaExistente) {
      return res.status(400).json({
        mensaje: "Ya existe una ruta con ese código.",
      });
    }

    const nuevaRuta = await Ruta.create({
      codigo: codigoNormalizado,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || "",
      empleado: empleado || null,
      diasAtencion: Array.isArray(diasAtencion)
        ? diasAtencion
        : [],
      estado: estado || "Activa",
    });

    const rutaCreada = await Ruta.findById(
      nuevaRuta._id
    ).populate(
      "empleado",
      "nombres apellidos"
    );

    res.status(201).json({
      mensaje: "Ruta creada correctamente.",
      ruta: rutaCreada,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTUALIZAR RUTA
=========================== */

export const actualizarRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada.",
      });
    }

    const {
      codigo,
      nombre,
      descripcion,
      empleado,
      diasAtencion,
      estado,
    } = req.body;

    if (codigo !== undefined) {
      const codigoNormalizado =
        codigo.trim().toUpperCase();

      if (!codigoNormalizado) {
        return res.status(400).json({
          mensaje: "El código de la ruta es obligatorio.",
        });
      }

      const otraRuta = await Ruta.findOne({
        codigo: codigoNormalizado,
        _id: { $ne: ruta._id },
      });

      if (otraRuta) {
        return res.status(400).json({
          mensaje: "Ya existe otra ruta con ese código.",
        });
      }

      ruta.codigo = codigoNormalizado;
    }

    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({
          mensaje: "El nombre de la ruta es obligatorio.",
        });
      }

      ruta.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      ruta.descripcion = descripcion.trim();
    }

    if (empleado !== undefined) {
      ruta.empleado = empleado || null;
    }

    if (diasAtencion !== undefined) {
      ruta.diasAtencion = Array.isArray(diasAtencion)
        ? diasAtencion
        : [];
    }

    if (estado !== undefined) {
      ruta.estado = estado;
    }

    await ruta.save();

    const rutaActualizada = await Ruta.findById(
      ruta._id
    ).populate(
      "empleado",
      "nombres apellidos"
    );

    res.json({
      mensaje: "Ruta actualizada correctamente.",
      ruta: rutaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ACTIVAR / DESACTIVAR RUTA
=========================== */

export const cambiarEstadoRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada.",
      });
    }

    ruta.estado =
      ruta.estado === "Activa"
        ? "Inactiva"
        : "Activa";

    await ruta.save();

    res.json({
      mensaje: "Estado de la ruta actualizado.",
      estado: ruta.estado,
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};

/* ===========================
   ELIMINAR RUTA
=========================== */

export const eliminarRuta = async (req, res) => {
  try {
    const ruta = await Ruta.findById(req.params.id);

    if (!ruta) {
      return res.status(404).json({
        mensaje: "Ruta no encontrada.",
      });
    }

    await ruta.deleteOne();

    res.json({
      mensaje: "Ruta eliminada correctamente.",
    });
  } catch (error) {
    res.status(500).json({
      mensaje: error.message,
    });
  }
};