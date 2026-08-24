import Cliente from "../models/Cliente.js";
import Consecutivo from "../models/Consecutivo.js";

import { crearCRUD } from "./crudFactory.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";


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

  crear: crearCliente,
};