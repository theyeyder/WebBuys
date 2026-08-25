import ZonaDespacho from "../models/ZonaDespacho.js";
import { generarConsecutivo } from "../utils/generarConsecutivo.js";
import Consecutivo from "../models/Consecutivo.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";

/* ===========================
   LISTAR ZONAS
=========================== */

export const listarZonasDespacho = async (req, res) => {
  try {
    const zonas = await ZonaDespacho.find()
      .sort({
        codigo: 1,
        nombre: 1,
      });

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

    // =========================================================
    // GENERAR CÓDIGO CONSECUTIVO
    // =========================================================
    const codigo =
      await generarConsecutivo(
        "zonas-despacho",
        "ZN"
      );

    const zona =
      await ZonaDespacho.create({
        codigo,

        nombre: nombre.trim(),

        descripcion:
          descripcion?.trim() || "",

        estado:
          estado || "Activa",
      });

    // =========================
    // AUDITORÍA - CREAR
    // =========================

    await registrarAuditoria({
      req,
      modulo: "Zonas de despacho",
      accion: "CREAR",

      registroId: zona._id,
      codigoRegistro: zona.codigo,

      descripcion:
        `Se creó la zona de despacho ${zona.nombre}.`,

      datosNuevos: {
        codigo: zona.codigo,
        nombre: zona.nombre,
        descripcion: zona.descripcion,
        estado: zona.estado,
      },
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

    // =========================
    // GUARDAR DATOS ANTERIORES
    // =========================

    const datosAnteriores = {
      codigo: zona.codigo,
      nombre: zona.nombre,
      descripcion: zona.descripcion,
      estado: zona.estado,
    };

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

    // =========================
    // AUDITORÍA - ACTUALIZAR
    // =========================

    await registrarAuditoria({
      req,
      modulo: "Zonas de despacho",
      accion: "ACTUALIZAR",

      registroId: zona._id,
      codigoRegistro: zona.codigo,

      descripcion:
        `Se actualizó la zona de despacho ${zona.nombre}.`,

      datosAnteriores,

      datosNuevos: {
        codigo: zona.codigo,
        nombre: zona.nombre,
        descripcion: zona.descripcion,
        estado: zona.estado,
      },
    });

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

    // =========================
    // GUARDAR ESTADO ANTERIOR
    // =========================

    const estadoAnterior =
      zona.estado;

    zona.estado =
      zona.estado === "Activa"
        ? "Inactiva"
        : "Activa";

    await zona.save();

    // =========================
    // AUDITORÍA - ACTIVAR / DESACTIVAR
    // =========================

    await registrarAuditoria({
      req,
      modulo: "Zonas de despacho",

      accion:
        zona.estado === "Activa"
          ? "ACTIVAR"
          : "DESACTIVAR",

      registroId: zona._id,
      codigoRegistro: zona.codigo,

      descripcion:
        zona.estado === "Activa"
          ? `Se activó la zona de despacho ${zona.nombre}.`
          : `Se desactivó la zona de despacho ${zona.nombre}.`,

      datosAnteriores: {
        estado: estadoAnterior,
      },

      datosNuevos: {
        estado: zona.estado,
      },
    });

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

    // =========================
    // AUDITORÍA - ELIMINAR (ANTES DE ELIMINAR)
    // =========================

    await registrarAuditoria({
      req,
      modulo: "Zonas de despacho",
      accion: "ELIMINAR",

      registroId: zona._id,
      codigoRegistro: zona.codigo,

      descripcion:
        `Se eliminó la zona de despacho ${zona.nombre}.`,

      datosAnteriores: {
        codigo: zona.codigo,
        nombre: zona.nombre,
        descripcion: zona.descripcion,
        estado: zona.estado,
      },
    });

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

/* ===========================
   OBTENER SIGUIENTE CÓDIGO DE ZONA
=========================== */

export const obtenerSiguienteCodigoZona = async (req, res) => {
  try {
    const consecutivo = await Consecutivo.findOne({
      clave: "zonas-despacho",
    });

    const siguienteNumero =
      (consecutivo?.ultimoNumero || 0) + 1;

    const codigo =
      `ZN-${String(siguienteNumero).padStart(4, "0")}`;

    return res.json({
      codigo,
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: error.message,
    });
  }
};