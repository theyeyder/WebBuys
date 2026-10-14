import { prisma } from "../../config/postgresql.js";

/* =========================================
   FASE 52 - PREFERENCIAS PREPARADAS POSTGRESQL-ONLY
   NO ESTÁ ACTIVADA EN LAS RUTAS TODAVÍA.
========================================= */

const CLAVE = "principal";

const defaults = {
  moneda: "COP",
  simboloMoneda: "$",
  decimales: 0,
  formatoFecha: "DD/MM/YYYY",
  permitirInventarioNegativo: false,
  confirmarAntesEliminar: true,
};

function construirUpdate(body = {}) {
  const data = {};

  if (body.moneda !== undefined) data.moneda = String(body.moneda).trim();
  if (body.simboloMoneda !== undefined) data.simboloMoneda = String(body.simboloMoneda).trim();
  if (body.decimales !== undefined) data.decimales = Number(body.decimales);
  if (body.formatoFecha !== undefined) data.formatoFecha = String(body.formatoFecha);
  if (body.permitirInventarioNegativo !== undefined) {
    data.permitirInventarioNegativo = Boolean(body.permitirInventarioNegativo);
  }
  if (body.confirmarAntesEliminar !== undefined) {
    data.confirmarAntesEliminar = Boolean(body.confirmarAntesEliminar);
  }

  return data;
}

export const obtenerPreferencias = async (req, res) => {
  try {
    const preferencias = await prisma.preferencia.upsert({
      where: { clave: CLAVE },
      update: {},
      create: { clave: CLAVE, ...defaults },
    });
    return res.json(preferencias);
  } catch (error) {
    console.error("Error obteniendo preferencias PostgreSQL-only:", error);
    return res.status(500).json({ mensaje: "No fue posible cargar las preferencias." });
  }
};

export const actualizarPreferencias = async (req, res) => {
  try {
    const data = construirUpdate(req.body);
    const preferencias = await prisma.preferencia.upsert({
      where: { clave: CLAVE },
      update: data,
      create: { clave: CLAVE, ...defaults, ...data },
    });

    return res.json({
      mensaje: "Preferencias actualizadas correctamente.",
      preferencias,
    });
  } catch (error) {
    console.error("Error actualizando preferencias PostgreSQL-only:", error);
    return res.status(500).json({
      mensaje: "No fue posible actualizar las preferencias.",
      detalle: error.message,
    });
  }
};
