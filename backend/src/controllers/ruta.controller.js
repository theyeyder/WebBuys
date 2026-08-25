import Ruta from "../models/Rutas.js";
import Usuario from "../models/Usuario.js";
import ZonaDespacho from "../models/ZonaDespacho.js";
import Consecutivo from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";

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
      .populate({
        path: "zonasDespacho", 
        model: ZonaDespacho,
        select: "nombre estado",
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
      zonasDespacho, 
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

    const codigo =
      await generarConsecutivo(
        "rutas",
        "RUTA",
        2
      );

    /* =========================
       CREAR RUTA
    ========================= */

    const nuevaRuta = await Ruta.create({
      codigo,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || "",
      empleado: empleado || null,
      zonasDespacho: Array.isArray(zonasDespacho) 
        ? zonasDespacho
        : [],
      diasAtencion: Array.isArray(diasAtencion)
        ? diasAtencion
        : [],
      estado: estado || "Activa",
    });

    /* =========================
       CARGAR EMPLEADO Y ZONAS
    ========================= */

    const rutaCreada = await Ruta.findById(
      nuevaRuta._id
    )
      .populate({
        path: "empleado",
        model: Usuario,
        select: "nombre usuario rol estado bloqueado",
      })
      .populate({
        path: "zonasDespacho", 
        model: ZonaDespacho,
        select: "nombre estado",
      });

    // =========================
    // AUDITORÍA - CREAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Rutas",

      accion: "CREAR",

      registroId:
        rutaCreada._id,

      codigoRegistro:
        rutaCreada.codigo,

      descripcion:
        `Se creó la ruta ${rutaCreada.nombre}.`,

      datosNuevos: {
        codigo:
          rutaCreada.codigo,

        nombre:
          rutaCreada.nombre,

        descripcion:
          rutaCreada.descripcion,

        empleado:
          rutaCreada.empleado?._id ||
          rutaCreada.empleado ||
          null,

        zonasDespacho:
          Array.isArray(
            rutaCreada.zonasDespacho
          )
            ? rutaCreada.zonasDespacho.map(
                (zona) =>
                  zona?._id ||
                  zona
              )
            : [],

        diasAtencion:
          rutaCreada.diasAtencion,

        estado:
          rutaCreada.estado,
      },
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

    // =========================
    // GUARDAR DATOS ANTERIORES
    // =========================

    const datosAnteriores = {
      codigo:
        ruta.codigo,

      nombre:
        ruta.nombre,

      descripcion:
        ruta.descripcion,

      empleado:
        ruta.empleado,

      zonasDespacho:
        [...ruta.zonasDespacho],

      diasAtencion:
        [...ruta.diasAtencion],

      estado:
        ruta.estado,
    };

    const {
      nombre,
      descripcion,
      empleado,
      zonasDespacho, 
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

    if (zonasDespacho !== undefined) {
      ruta.zonasDespacho = Array.isArray(zonasDespacho)
        ? zonasDespacho
        : [];
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
    )
      .populate({
        path: "empleado",
        model: Usuario,
        select: "nombre usuario rol estado bloqueado",
      })
      .populate({
        path: "zonasDespacho", 
        model: ZonaDespacho,
        select: "nombre estado",
      });

    // =========================
    // AUDITORÍA - ACTUALIZAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Rutas",

      accion: "ACTUALIZAR",

      registroId:
        rutaActualizada._id,

      codigoRegistro:
        rutaActualizada.codigo,

      descripcion:
        `Se actualizó la ruta ${rutaActualizada.nombre}.`,

      datosAnteriores,

      datosNuevos: {
        codigo:
          rutaActualizada.codigo,

        nombre:
          rutaActualizada.nombre,

        descripcion:
          rutaActualizada.descripcion,

        empleado:
          rutaActualizada.empleado?._id ||
          rutaActualizada.empleado ||
          null,

        zonasDespacho:
          Array.isArray(
            rutaActualizada.zonasDespacho
          )
            ? rutaActualizada.zonasDespacho.map(
                (zona) =>
                  zona?._id ||
                  zona
              )
            : [],

        diasAtencion:
          rutaActualizada.diasAtencion,

        estado:
          rutaActualizada.estado,
      },
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

    // =========================
    // GUARDAR ESTADO ANTERIOR
    // =========================

    const estadoAnterior =
      ruta.estado;

    ruta.estado =
      ruta.estado === "Activa"
        ? "Inactiva"
        : "Activa";

    await ruta.save();

    // Obtener la ruta actualizada con el empleado y zonas
    const rutaActualizada = await Ruta.findById(ruta._id)
      .populate({
        path: "empleado",
        model: Usuario,
        select: "nombre usuario rol estado bloqueado",
      })
      .populate({
        path: "zonasDespacho",
        model: ZonaDespacho,
        select: "nombre estado",
      });

    // =========================
    // AUDITORÍA - ACTIVAR / DESACTIVAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Rutas",

      accion:
        rutaActualizada.estado === "Activa"
          ? "ACTIVAR"
          : "DESACTIVAR",

      registroId:
        rutaActualizada._id,

      codigoRegistro:
        rutaActualizada.codigo,

      descripcion:
        rutaActualizada.estado === "Activa"
          ? `Se activó la ruta ${rutaActualizada.nombre}.`
          : `Se desactivó la ruta ${rutaActualizada.nombre}.`,

      datosAnteriores: {
        estado:
          estadoAnterior,
      },

      datosNuevos: {
        estado:
          rutaActualizada.estado,
      },
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

    // =========================
    // AUDITORÍA - ELIMINAR (ANTES DE ELIMINAR)
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Rutas",

      accion: "ELIMINAR",

      registroId:
        ruta._id,

      codigoRegistro:
        ruta.codigo,

      descripcion:
        `Se eliminó la ruta ${ruta.nombre}.`,

      datosAnteriores: {
        codigo:
          ruta.codigo,

        nombre:
          ruta.nombre,

        descripcion:
          ruta.descripcion,

        empleado:
          ruta.empleado,

        zonasDespacho:
          ruta.zonasDespacho,

        diasAtencion:
          ruta.diasAtencion,

        estado:
          ruta.estado,
      },
    });

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
   SIGUIENTE CÓDIGO RUTA
=========================== */

export const obtenerSiguienteCodigoRuta =
  async (req, res) => {

    try {

      const consecutivo =
        await Consecutivo.findOne({
          clave: "rutas",
        });

      const siguiente =
        (consecutivo?.ultimoNumero || 0) + 1;

      const codigo =
        `RUTA-${String(
          siguiente
        ).padStart(2, "0")}`;

      return res.json({
        codigo,
      });

    } catch (error) {

      console.error(
        "Error obteniendo consecutivo de ruta:",
        error
      );

      return res.status(500).json({
        mensaje:
          "No fue posible obtener el siguiente código de ruta.",
      });

    }

  };