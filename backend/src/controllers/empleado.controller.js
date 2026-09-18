import mongoose from "mongoose";

import Empleado
  from "../models/Empleado.js";

import Consecutivo
  from "../models/Consecutivo.js";

import { generarConsecutivo }
  from "../utils/generarConsecutivo.js";

import { registrarAuditoria }
  from "../utils/registrarAuditoria.js";


/* =========================================================
   UTILIDADES
========================================================= */

function limpiarTexto(
  valor
) {

  return String(
    valor ?? ""
  ).trim();

}


function construirNombre(
  empleado
) {

  return [
    empleado?.nombres,
    empleado?.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

}


async function obtenerEmpleadoPoblado(
  id
) {

  return Empleado.findById(
    id
  )
    .populate(
      "rutaAsignada",
      "codigo nombre estado"
    )
    .populate(
      "usuario",
      "usuario nombre nombres apellidos rol estado bloqueado"
    );

}


function responderErrorDuplicado(
  error,
  res
) {

  if (
    error?.code !== 11000
  ) {
    return false;
  }


  const campo =
    Object.keys(
      error.keyPattern || {}
    )[0] ||
    Object.keys(
      error.keyValue || {}
    )[0] ||
    "";


  if (
    campo === "documento"
  ) {

    res.status(409).json({
      mensaje:
        "Ya existe un empleado con ese documento.",
    });

    return true;
  }


  if (
    campo === "codigo"
  ) {

    res.status(409).json({
      mensaje:
        "Ya existe un empleado con ese código.",
    });

    return true;
  }


  res.status(409).json({
    mensaje:
      "Ya existe un empleado con esos datos.",
  });

  return true;

}


/* =========================================================
   LISTAR / BUSCAR EMPLEADOS
========================================================= */

export async function listarEmpleados(
  req,
  res
) {

  try {

    const {
      search = "",
      estado = "",
      cargo = "",
      ruta = "",
    } = req.query;


    const filtro = {};


    if (
      limpiarTexto(estado)
    ) {

      filtro.estado =
        limpiarTexto(estado);

    }


    if (
      limpiarTexto(cargo)
    ) {

      filtro.cargo =
        limpiarTexto(cargo);

    }


    if (
      limpiarTexto(ruta)
    ) {

      if (
        !mongoose.isValidObjectId(
          ruta
        )
      ) {

        return res.status(400).json({
          mensaje:
            "La ruta enviada no es válida.",
        });

      }


      filtro.rutaAsignada =
        ruta;

    }


    const texto =
      limpiarTexto(search);


    if (texto) {

      const expresion =
        new RegExp(
          texto.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          ),
          "i"
        );


      filtro.$or = [
        {
          codigo:
            expresion,
        },
        {
          documento:
            expresion,
        },
        {
          nombres:
            expresion,
        },
        {
          apellidos:
            expresion,
        },
        {
          telefono:
            expresion,
        },
        {
          cargo:
            expresion,
        },
        {
          ciudad:
            expresion,
        },
      ];

    }


    const empleados =
      await Empleado.find(
        filtro
      )
        .populate(
          "rutaAsignada",
          "codigo nombre estado"
        )
        .populate(
          "usuario",
          "usuario nombre nombres apellidos rol estado bloqueado"
        )
        .sort({
          createdAt: -1,
        });


    return res.json(
      empleados
    );


  } catch (error) {

    console.error(
      "Error listando empleados:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible cargar los empleados.",
    });

  }

}



/* =========================================================
   LISTAR PERSONAL DISPONIBLE PARA PEDIDOS
========================================================= */

export async function listarEmpleadosPedidos(
  _req,
  res
) {

  try {

    const empleados =
      await Empleado.find({
        estado: "Activo",

        cargo: {
          $in: [
            /^Empleado$/i,
            /^Repartidor$/i,
            /^Empacador$/i,
          ],
        },
      })
        .select(
          "codigo nombres apellidos documento cargo estado"
        )
        .sort({
          nombres: 1,
          apellidos: 1,
        });


    return res.json(
      empleados
    );


  } catch (error) {

    console.error(
      "Error cargando personal para pedidos:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible cargar el personal disponible para pedidos.",
    });

  }

}


/* =========================================================
   OBTENER EMPLEADO POR ID
========================================================= */

export async function obtenerEmpleadoPorId(
  req,
  res
) {

  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {

      return res.status(400).json({
        mensaje:
          "El identificador del empleado no es válido.",
      });

    }


    const empleado =
      await obtenerEmpleadoPoblado(
        id
      );


    if (!empleado) {

      return res.status(404).json({
        mensaje:
          "Empleado no encontrado.",
      });

    }


    return res.json(
      empleado
    );


  } catch (error) {

    console.error(
      "Error obteniendo empleado:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible obtener el empleado.",
    });

  }

}


/* =========================================================
   MOSTRAR SIGUIENTE CÓDIGO
   NO incrementa el consecutivo.
========================================================= */

export async function obtenerSiguienteCodigoEmpleado(
  _req,
  res
) {

  try {

    const consecutivo =
      await Consecutivo.findOne({
        clave:
          "empleados",
      });


    const siguiente =
      Number(
        consecutivo?.ultimoNumero ||
        0
      ) + 1;


    return res.json({
      codigo:
        `EMP-${String(
          siguiente
        ).padStart(
          4,
          "0"
        )}`,
    });


  } catch (error) {

    console.error(
      "Error consultando código de empleado:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible obtener el siguiente código de empleado.",
    });

  }

}


/* =========================================================
   CREAR EMPLEADO
========================================================= */

export async function crearEmpleado(
  req,
  res
) {

  try {

    const {
      tipoDocumento =
        "CC",
      documento,
      nombres,
      apellidos,
      telefono =
        "",
      direccion =
        "",
      ciudad =
        "Ibagué",
      cargo,
      fechaIngreso,
      salario =
        0,
      rutaAsignada =
        null,
      usuario =
        null,
      estado =
        "Activo",
      observaciones =
        "",
    } = req.body;


    const documentoLimpio =
      limpiarTexto(
        documento
      );

    const nombresLimpios =
      limpiarTexto(
        nombres
      );

    const apellidosLimpios =
      limpiarTexto(
        apellidos
      );

    const cargoLimpio =
      limpiarTexto(
        cargo
      );


    if (
      !documentoLimpio
    ) {

      return res.status(400).json({
        mensaje:
          "El documento del empleado es obligatorio.",
      });

    }


    if (
      !nombresLimpios
    ) {

      return res.status(400).json({
        mensaje:
          "Los nombres del empleado son obligatorios.",
      });

    }


    if (
      !apellidosLimpios
    ) {

      return res.status(400).json({
        mensaje:
          "Los apellidos del empleado son obligatorios.",
      });

    }


    if (
      !cargoLimpio
    ) {

      return res.status(400).json({
        mensaje:
          "El cargo del empleado es obligatorio.",
      });

    }


    if (
      Number(salario) < 0
    ) {

      return res.status(400).json({
        mensaje:
          "El salario no puede ser negativo.",
      });

    }


    if (
      rutaAsignada &&
      !mongoose.isValidObjectId(
        rutaAsignada
      )
    ) {

      return res.status(400).json({
        mensaje:
          "La ruta asignada no es válida.",
      });

    }


    if (
      usuario &&
      !mongoose.isValidObjectId(
        usuario
      )
    ) {

      return res.status(400).json({
        mensaje:
          "El usuario relacionado no es válido.",
      });

    }


    const documentoExiste =
      await Empleado.findOne({
        documento:
          documentoLimpio,
      });


    if (
      documentoExiste
    ) {

      return res.status(409).json({
        mensaje:
          "Ya existe un empleado con ese documento.",
      });

    }


    if (usuario) {

      const usuarioAsignado =
        await Empleado.findOne({
          usuario,
        });


      if (
        usuarioAsignado
      ) {

        return res.status(409).json({
          mensaje:
            "Ese usuario ya está relacionado con otro empleado.",
        });

      }

    }


    const codigo =
      await generarConsecutivo(
        "empleados",
        "EMP",
        4
      );


    const empleado =
      await Empleado.create({

        codigo,

        tipoDocumento:
          limpiarTexto(
            tipoDocumento
          ).toUpperCase() ||
          "CC",

        documento:
          documentoLimpio,

        nombres:
          nombresLimpios,

        apellidos:
          apellidosLimpios,

        telefono:
          limpiarTexto(
            telefono
          ),

        direccion:
          limpiarTexto(
            direccion
          ),

        ciudad:
          limpiarTexto(
            ciudad
          ) ||
          "Ibagué",

        cargo:
          cargoLimpio,

        fechaIngreso:
          fechaIngreso ||
          new Date(),

        salario:
          Number(
            salario ||
            0
          ),

        rutaAsignada:
          rutaAsignada ||
          null,

        usuario:
          usuario ||
          null,

        estado,

        observaciones:
          limpiarTexto(
            observaciones
          ),

      });


    const empleadoCreado =
      await obtenerEmpleadoPoblado(
        empleado._id
      );


    await registrarAuditoria({

      req,

      modulo:
        "Empleados",

      accion:
        "Crear",

      registroId:
        empleado._id,

      codigoRegistro:
        empleado.codigo,

      descripcion:
        `Se creó el empleado ${construirNombre(
          empleado
        )}.`,

      datosNuevos:
        empleado.toObject(),

    });


    return res.status(201).json({

      mensaje:
        "Empleado creado correctamente.",

      empleado:
        empleadoCreado,

    });


  } catch (error) {

    console.error(
      "Error creando empleado:",
      error
    );


    if (
      responderErrorDuplicado(
        error,
        res
      )
    ) {
      return;
    }


    return res.status(500).json({
      mensaje:
        error.message ||
        "No fue posible crear el empleado.",
    });

  }

}


/* =========================================================
   ACTUALIZAR EMPLEADO
========================================================= */

export async function actualizarEmpleado(
  req,
  res
) {

  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {

      return res.status(400).json({
        mensaje:
          "El identificador del empleado no es válido.",
      });

    }


    const empleado =
      await Empleado.findById(
        id
      );


    if (!empleado) {

      return res.status(404).json({
        mensaje:
          "Empleado no encontrado.",
      });

    }


    const datosAnteriores =
      empleado.toObject();


    const {
      tipoDocumento,
      documento,
      nombres,
      apellidos,
      telefono,
      direccion,
      ciudad,
      cargo,
      fechaIngreso,
      salario,
      rutaAsignada,
      usuario,
      estado,
      observaciones,
    } = req.body;


    if (
      documento !== undefined
    ) {

      const valor =
        limpiarTexto(
          documento
        );


      if (!valor) {

        return res.status(400).json({
          mensaje:
            "El documento del empleado es obligatorio.",
        });

      }


      const repetido =
        await Empleado.findOne({
          documento:
            valor,
          _id: {
            $ne:
              empleado._id,
          },
        });


      if (repetido) {

        return res.status(409).json({
          mensaje:
            "Ya existe otro empleado con ese documento.",
        });

      }


      empleado.documento =
        valor;

    }


    if (
      nombres !== undefined
    ) {

      const valor =
        limpiarTexto(
          nombres
        );


      if (!valor) {

        return res.status(400).json({
          mensaje:
            "Los nombres del empleado son obligatorios.",
        });

      }


      empleado.nombres =
        valor;

    }


    if (
      apellidos !== undefined
    ) {

      const valor =
        limpiarTexto(
          apellidos
        );


      if (!valor) {

        return res.status(400).json({
          mensaje:
            "Los apellidos del empleado son obligatorios.",
        });

      }


      empleado.apellidos =
        valor;

    }


    if (
      cargo !== undefined
    ) {

      const valor =
        limpiarTexto(
          cargo
        );


      if (!valor) {

        return res.status(400).json({
          mensaje:
            "El cargo del empleado es obligatorio.",
        });

      }


      empleado.cargo =
        valor;

    }


    if (
      salario !== undefined
    ) {

      const salarioNumero =
        Number(
          salario
        );


      if (
        !Number.isFinite(
          salarioNumero
        ) ||
        salarioNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El salario debe ser un valor válido mayor o igual a cero.",
        });

      }


      empleado.salario =
        salarioNumero;

    }


    if (
      rutaAsignada !== undefined
    ) {

      if (
        rutaAsignada &&
        !mongoose.isValidObjectId(
          rutaAsignada
        )
      ) {

        return res.status(400).json({
          mensaje:
            "La ruta asignada no es válida.",
        });

      }


      empleado.rutaAsignada =
        rutaAsignada ||
        null;

    }


    if (
      usuario !== undefined
    ) {

      if (
        usuario &&
        !mongoose.isValidObjectId(
          usuario
        )
      ) {

        return res.status(400).json({
          mensaje:
            "El usuario relacionado no es válido.",
        });

      }


      if (usuario) {

        const usuarioAsignado =
          await Empleado.findOne({
            usuario,
            _id: {
              $ne:
                empleado._id,
            },
          });


        if (
          usuarioAsignado
        ) {

          return res.status(409).json({
            mensaje:
              "Ese usuario ya está relacionado con otro empleado.",
          });

        }

      }


      empleado.usuario =
        usuario ||
        null;

    }


    if (
      tipoDocumento !== undefined
    ) {

      empleado.tipoDocumento =
        limpiarTexto(
          tipoDocumento
        ).toUpperCase();

    }


    if (
      telefono !== undefined
    ) {

      empleado.telefono =
        limpiarTexto(
          telefono
        );

    }


    if (
      direccion !== undefined
    ) {

      empleado.direccion =
        limpiarTexto(
          direccion
        );

    }


    if (
      ciudad !== undefined
    ) {

      empleado.ciudad =
        limpiarTexto(
          ciudad
        ) ||
        "Ibagué";

    }


    if (
      fechaIngreso !== undefined
    ) {

      empleado.fechaIngreso =
        fechaIngreso ||
        empleado.fechaIngreso;

    }


    if (
      estado !== undefined
    ) {

      empleado.estado =
        estado;

    }


    if (
      observaciones !== undefined
    ) {

      empleado.observaciones =
        limpiarTexto(
          observaciones
        );

    }


    await empleado.save();


    const empleadoActualizado =
      await obtenerEmpleadoPoblado(
        empleado._id
      );


    await registrarAuditoria({

      req,

      modulo:
        "Empleados",

      accion:
        "Actualizar",

      registroId:
        empleado._id,

      codigoRegistro:
        empleado.codigo,

      descripcion:
        `Se actualizó el empleado ${construirNombre(
          empleado
        )}.`,

      datosAnteriores,

      datosNuevos:
        empleado.toObject(),

    });


    return res.json({

      mensaje:
        "Empleado actualizado correctamente.",

      empleado:
        empleadoActualizado,

    });


  } catch (error) {

    console.error(
      "Error actualizando empleado:",
      error
    );


    if (
      responderErrorDuplicado(
        error,
        res
      )
    ) {
      return;
    }


    return res.status(500).json({
      mensaje:
        error.message ||
        "No fue posible actualizar el empleado.",
    });

  }

}


/* =========================================================
   ACTIVAR / DESACTIVAR EMPLEADO
========================================================= */

export async function cambiarEstadoEmpleado(
  req,
  res
) {

  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {

      return res.status(400).json({
        mensaje:
          "El identificador del empleado no es válido.",
      });

    }


    const empleado =
      await Empleado.findById(
        id
      );


    if (!empleado) {

      return res.status(404).json({
        mensaje:
          "Empleado no encontrado.",
      });

    }


    const estadoAnterior =
      empleado.estado;


    empleado.estado =
      empleado.estado ===
        "Activo"
        ? "Inactivo"
        : "Activo";


    await empleado.save();


    const empleadoActualizado =
      await obtenerEmpleadoPoblado(
        empleado._id
      );


    await registrarAuditoria({

      req,

      modulo:
        "Empleados",

      accion:
        "Cambiar estado",

      registroId:
        empleado._id,

      codigoRegistro:
        empleado.codigo,

      descripcion:
        `El empleado ${construirNombre(
          empleado
        )} cambió de ${estadoAnterior} a ${empleado.estado}.`,

      datosAnteriores: {
        estado:
          estadoAnterior,
      },

      datosNuevos: {
        estado:
          empleado.estado,
      },

    });


    return res.json({

      mensaje:
        empleado.estado ===
          "Activo"
          ? "Empleado activado correctamente."
          : "Empleado desactivado correctamente.",

      empleado:
        empleadoActualizado,

    });


  } catch (error) {

    console.error(
      "Error cambiando estado del empleado:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible cambiar el estado del empleado.",
    });

  }

}


/* =========================================================
   ELIMINAR EMPLEADO
========================================================= */

export async function eliminarEmpleado(
  req,
  res
) {

  try {

    const {
      id,
    } = req.params;


    if (
      !mongoose.isValidObjectId(
        id
      )
    ) {

      return res.status(400).json({
        mensaje:
          "El identificador del empleado no es válido.",
      });

    }


    const empleado =
      await Empleado.findById(
        id
      );


    if (!empleado) {

      return res.status(404).json({
        mensaje:
          "Empleado no encontrado.",
      });

    }


    const datosAnteriores =
      empleado.toObject();


    await empleado.deleteOne();


    await registrarAuditoria({

      req,

      modulo:
        "Empleados",

      accion:
        "Eliminar",

      registroId:
        empleado._id,

      codigoRegistro:
        empleado.codigo,

      descripcion:
        `Se eliminó el empleado ${construirNombre(
          empleado
        )}.`,

      datosAnteriores,

      datosNuevos:
        null,

    });


    return res.json({
      mensaje:
        "Empleado eliminado correctamente.",
    });


  } catch (error) {

    console.error(
      "Error eliminando empleado:",
      error
    );


    return res.status(500).json({
      mensaje:
        "No fue posible eliminar el empleado.",
    });

  }

}
