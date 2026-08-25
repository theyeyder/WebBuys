import Cliente from "../models/Cliente.js";
import Consecutivo from "../models/Consecutivo.js";

import { crearCRUD } from "./crudFactory.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";

import {
  registrarAuditoria,
} from "../utils/registrarAuditoria.js";


/* =========================================================
   CRUD BASE
========================================================= */

const crudBase = crearCRUD(
  Cliente,
  "zonaDespacho"
);


/* =========================================================
   CREAR CLIENTE CON CONSECUTIVO
========================================================= */

async function crearCliente(req, res) {
  try {
    const codigo =
      await generarConsecutivo(
        "clientes",
        "CTE"
      );

    const cliente =
      await Cliente.create({
        ...req.body,

        // El código siempre lo controla el backend
        codigo,
      });

    const clienteCreado =
      await Cliente.findById(
        cliente._id
      ).populate("zonaDespacho");

    // =========================
    // AUDITORÍA - CREAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Clientes",

      accion: "CREAR",

      registroId:
        clienteCreado._id,

      codigoRegistro:
        clienteCreado.codigo,

      descripcion:
        `Se creó el cliente ${clienteCreado.nombre}.`,

      datosNuevos: {
        codigo:
          clienteCreado.codigo,

        tipoDocumento:
          clienteCreado.tipoDocumento,

        documento:
          clienteCreado.documento,

        nombre:
          clienteCreado.nombre,

        razonSocial:
          clienteCreado.razonSocial,

        telefono:
          clienteCreado.telefono,

        direccion:
          clienteCreado.direccion,

        barrio:
          clienteCreado.barrio,

        ciudad:
          clienteCreado.ciudad,

        tipoCliente:
          clienteCreado.tipoCliente,

        estado:
          clienteCreado.estado,

        zonaDespacho:
          clienteCreado.zonaDespacho?._id ||
          clienteCreado.zonaDespacho ||
          null,
      },
    });

    return res
      .status(201)
      .json(clienteCreado);

  } catch (error) {

    if (error?.code === 11000) {

      const campo =
        Object.keys(
          error.keyPattern || {}
        )[0];

      return res.status(409).json({
        mensaje:
          campo === "documento"
            ? "Ya existe un cliente con ese documento."
            : "Ya existe un registro con esos datos.",
      });

    }

    console.error(
      "Error creando cliente:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible crear el cliente.",
    });
  }
}


/* =========================================================
   ACTUALIZAR CLIENTE CON AUDITORÍA
========================================================= */

async function actualizarClienteConAuditoria(
  req,
  res
) {
  try {
    const anterior =
      await Cliente.findById(
        req.params.id
      )
        .populate("zonaDespacho")
        .lean();

    if (!anterior) {
      return res.status(404).json({
        mensaje:
          "Cliente no encontrado.",
      });
    }

    const actualizado =
      await Cliente.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        "zonaDespacho"
      );

    // =========================
    // AUDITORÍA - ACTUALIZAR
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Clientes",

      accion: "ACTUALIZAR",

      registroId:
        actualizado._id,

      codigoRegistro:
        actualizado.codigo,

      descripcion:
        `Se actualizó el cliente ${actualizado.nombre}.`,

      datosAnteriores: {
        codigo:
          anterior.codigo,

        tipoDocumento:
          anterior.tipoDocumento,

        documento:
          anterior.documento,

        nombre:
          anterior.nombre,

        razonSocial:
          anterior.razonSocial,

        telefono:
          anterior.telefono,

        direccion:
          anterior.direccion,

        barrio:
          anterior.barrio,

        ciudad:
          anterior.ciudad,

        tipoCliente:
          anterior.tipoCliente,

        estado:
          anterior.estado,

        zonaDespacho:
          anterior.zonaDespacho?._id ||
          anterior.zonaDespacho ||
          null,
      },

      datosNuevos: {
        codigo:
          actualizado.codigo,

        tipoDocumento:
          actualizado.tipoDocumento,

        documento:
          actualizado.documento,

        nombre:
          actualizado.nombre,

        razonSocial:
          actualizado.razonSocial,

        telefono:
          actualizado.telefono,

        direccion:
          actualizado.direccion,

        barrio:
          actualizado.barrio,

        ciudad:
          actualizado.ciudad,

        tipoCliente:
          actualizado.tipoCliente,

        estado:
          actualizado.estado,

        zonaDespacho:
          actualizado.zonaDespacho?._id ||
          actualizado.zonaDespacho ||
          null,
      },
    });

    return res.json(
      actualizado
    );

  } catch (error) {
    console.error(
      "Error actualizando cliente:",
      error
    );

    return res.status(500).json({
      mensaje:
        error.message,
    });
  }
}


/* =========================================================
   ELIMINAR CLIENTE CON AUDITORÍA
========================================================= */

async function eliminarClienteConAuditoria(
  req,
  res
) {
  try {
    const cliente =
      await Cliente.findById(
        req.params.id
      )
        .populate("zonaDespacho")
        .lean();

    if (!cliente) {
      return res.status(404).json({
        mensaje:
          "Cliente no encontrado.",
      });
    }

    // =========================
    // AUDITORÍA - ELIMINAR (ANTES DE ELIMINAR)
    // =========================

    await registrarAuditoria({
      req,

      modulo: "Clientes",

      accion: "ELIMINAR",

      registroId:
        cliente._id,

      codigoRegistro:
        cliente.codigo,

      descripcion:
        `Se eliminó el cliente ${cliente.nombre}.`,

      datosAnteriores: {
        codigo:
          cliente.codigo,

        tipoDocumento:
          cliente.tipoDocumento,

        documento:
          cliente.documento,

        nombre:
          cliente.nombre,

        razonSocial:
          cliente.razonSocial,

        telefono:
          cliente.telefono,

        direccion:
          cliente.direccion,

        barrio:
          cliente.barrio,

        ciudad:
          cliente.ciudad,

        tipoCliente:
          cliente.tipoCliente,

        estado:
          cliente.estado,

        zonaDespacho:
          cliente.zonaDespacho?._id ||
          cliente.zonaDespacho ||
          null,
      },
    });

    await Cliente.findByIdAndDelete(
      req.params.id
    );

    return res.json({
      mensaje:
        "Cliente eliminado correctamente.",
    });

  } catch (error) {
    console.error(
      "Error eliminando cliente:",
      error
    );

    return res.status(500).json({
      mensaje:
        error.message,
    });
  }
}


/* =========================================================
   CONSULTAR SIGUIENTE CÓDIGO
========================================================= */

export async function obtenerSiguienteCodigoCliente(
  req,
  res
) {
  try {

    const consecutivo =
      await Consecutivo.findOne({
        clave: "clientes",
      });

    const siguienteNumero =
      (consecutivo?.ultimoNumero || 0) + 1;

    const codigo =
      `CTE-${String(
        siguienteNumero
      ).padStart(4, "0")}`;

    return res.json({
      codigo,
    });

  } catch (error) {

    console.error(
      "Error consultando consecutivo de cliente:",
      error
    );

    return res.status(500).json({
      mensaje:
        "No fue posible obtener el siguiente código de cliente.",
    });

  }
}


/* =========================================================
   CONTROLADOR
========================================================= */

export const clienteController = {
  ...crudBase,

  crear:
    crearCliente,

  actualizar:
    actualizarClienteConAuditoria,

  eliminar:
    eliminarClienteConAuditoria,
};