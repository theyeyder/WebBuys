import Ruta from "../models/Rutas.js";
import Usuario from "../models/Usuario.js";
import Configuracion from "../models/Configuracion.js";



/* ===========================
   LISTAR RUTAS
=========================== */

export const listarRutas = async (req, res) => {
  try {
    const rutas = await Ruta.find()
      .populate({
        path: "empleado",
        model: Usuario,
        select: "nombre usuario rol estado bloqueado",
      })
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
      nombre,
      descripcion,
      empleado,
      diasAtencion,
      estado,
    } = req.body;

    /* =========================
       VALIDAR NOMBRE
    ========================= */

    if (!nombre?.trim()) {
      return res.status(400).json({
        mensaje: "El nombre de la ruta es obligatorio.",
      });
    }

    /* =========================
       OBTENER CONSECUTIVO
    ========================= */

    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = await Configuracion.create({
        consecutivoRuta: 0,
      });
    }

    /*
      Incrementamos primero.

      0 -> 1 = RUTA-01
      1 -> 2 = RUTA-02
      2 -> 3 = RUTA-03
    */

    configuracion.consecutivoRuta =
      (configuracion.consecutivoRuta || 0) + 1;

    await configuracion.save();

    const numeroRuta =
      configuracion.consecutivoRuta;

    const codigo = `RUTA-${String(
      numeroRuta
    ).padStart(2, "0")}`;

    /* =========================
       CREAR RUTA
    ========================= */

    const nuevaRuta = await Ruta.create({
      codigo,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || "",
      empleado: empleado || null,

      diasAtencion: Array.isArray(diasAtencion)
        ? diasAtencion
        : [],

      estado: estado || "Activa",
    });

    /* =========================
       CARGAR EMPLEADO
    ========================= */

    const rutaCreada = await Ruta.findById(
      nuevaRuta._id
    ).populate({
      path: "empleado",
      model: Usuario,
      select:
        "nombre usuario rol estado bloqueado",
    });

    return res.status(201).json({
      mensaje: "Ruta creada correctamente.",
      ruta: rutaCreada,
    });
  } catch (error) {
    console.error(
      "Error creando ruta:",
      error
    );

    return res.status(500).json({
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
      nombre,
      descripcion,
      empleado,
      diasAtencion,
      estado,
    } = req.body;

    
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
    ).populate({
      path: "empleado",
      model: Usuario,
      select: "nombre usuario rol estado bloqueado",
    });

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

    // Obtener la ruta actualizada con el empleado
    const rutaActualizada = await Ruta.findById(ruta._id)
      .populate({
        path: "empleado",
        model: Usuario,
        select: "nombre usuario rol estado bloqueado",
      });

    res.json({
      mensaje: "Estado de la ruta actualizado.",
      ruta: rutaActualizada,
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

/* ===========================
  CONSECUTIVO RUTA-CARGUE AUTOMÁTICO
=========================== */

export const obtenerSiguienteCodigoRuta = async (req, res) => {
  try {
    let configuracion = await Configuracion.findOne();

    if (!configuracion) {
      configuracion = await Configuracion.create({
        consecutivoRuta: 0,
      });
    }

    const siguiente =
      (configuracion.consecutivoRuta || 0) + 1;

    const codigo = `RUTA-${String(
      siguiente
    ).padStart(2, "0")}`;

    return res.json({
      codigo,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};