import fs from "fs";
import path from "path";

import { prisma } from "../../config/postgresql.js";

/* =========================================
   FASE 52 - CONFIGURACIÓN PREPARADA POSTGRESQL-ONLY
   NO ESTÁ ACTIVADA EN LAS RUTAS TODAVÍA.
========================================= */

const CLAVE = "principal";

const defaults = {
  nombreComercial: "",
  razonSocial: "",
  nit: "",
  regimenTributario: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  pais: "Colombia",
  telefono: "",
  celular: "",
  whatsapp: "",
  correo: "",
  paginaWeb: "",
  logo: "",
  prefijoFactura: "FAC",
  resolucionDIAN: "",
  fechaResolucionDIAN: null,
  vigenciaDesde: null,
  vigenciaHasta: null,
  rangoAutorizadoDesde: 1,
  rangoAutorizadoHasta: 999999,
  consecutivoActual: 1,
  iva: 19,
  piePaginaFactura: "",
  observacionesFactura: "",
  consecutivoRuta: 0,
};

function fechaNullable(valor) {
  if (valor === null || valor === undefined || valor === "") return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function construirUpdate(body = {}) {
  const data = {};

  const textos = [
    "nombreComercial",
    "razonSocial",
    "nit",
    "regimenTributario",
    "direccion",
    "ciudad",
    "departamento",
    "pais",
    "telefono",
    "celular",
    "whatsapp",
    "correo",
    "paginaWeb",
    "prefijoFactura",
    "resolucionDIAN",
    "piePaginaFactura",
    "observacionesFactura",
  ];

  for (const campo of textos) {
    if (body[campo] !== undefined) data[campo] = String(body[campo] ?? "");
  }

  const enteros = [
    "rangoAutorizadoDesde",
    "rangoAutorizadoHasta",
    "consecutivoActual",
    "consecutivoRuta",
  ];

  for (const campo of enteros) {
    if (body[campo] !== undefined) data[campo] = Number(body[campo]);
  }

  if (body.iva !== undefined) data.iva = Number(body.iva);

  const fechas = ["fechaResolucionDIAN", "vigenciaDesde", "vigenciaHasta"];
  for (const campo of fechas) {
    if (body[campo] !== undefined) data[campo] = fechaNullable(body[campo]);
  }

  return data;
}

async function obtenerPrincipal() {
  return prisma.configuracion.upsert({
    where: { clave: CLAVE },
    update: {},
    create: { clave: CLAVE, ...defaults },
  });
}

export const obtenerConfiguracion = async (req, res) => {
  try {
    const configuracion = await obtenerPrincipal();
    return res.json(configuracion);
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const actualizarConfiguracion = async (req, res) => {
  try {
    const data = construirUpdate(req.body);
    const configuracion = await prisma.configuracion.upsert({
      where: { clave: CLAVE },
      update: data,
      create: { clave: CLAVE, ...defaults, ...data },
    });

    return res.json({
      mensaje: "Configuración guardada correctamente.",
      configuracion,
    });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const subirLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: "Debe seleccionar una imagen." });
    }

    const logo = "/uploads/" + path.basename(req.file.path);

    try {
      await prisma.configuracion.upsert({
        where: { clave: CLAVE },
        update: { logo },
        create: { clave: CLAVE, ...defaults, logo },
      });
    } catch (errorPg) {
      try {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      } catch {}
      throw errorPg;
    }

    return res.json({ mensaje: "Logo actualizado correctamente.", logo });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};

export const eliminarLogo = async (req, res) => {
  try {
    const configuracion = await obtenerPrincipal();

    if (!configuracion.logo) {
      return res.status(400).json({ mensaje: "La empresa no tiene un logo registrado." });
    }

    const logoAnterior = configuracion.logo;
    const nombreArchivo = path.basename(logoAnterior);
    const rutaArchivo = path.resolve("uploads", nombreArchivo);

    await prisma.configuracion.update({
      where: { clave: CLAVE },
      data: { logo: "" },
    });

    try {
      if (fs.existsSync(rutaArchivo)) fs.unlinkSync(rutaArchivo);
    } catch (errorArchivo) {
      await prisma.configuracion.update({
        where: { clave: CLAVE },
        data: { logo: logoAnterior },
      }).catch(() => {});
      throw errorArchivo;
    }

    return res.json({ mensaje: "Logo eliminado correctamente.", logo: "" });
  } catch (error) {
    return res.status(500).json({ mensaje: error.message });
  }
};
