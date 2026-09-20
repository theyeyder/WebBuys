import Pedido
  from "../models/Pedido.js";

import Producto
  from "../models/Producto.js";

import Cliente
  from "../models/Cliente.js";

import ZonaDespacho
  from "../models/ZonaDespacho.js";

import Ruta
  from "../models/Rutas.js";

import Empleado
  from "../models/Empleado.js";

import Consecutivo
  from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";

import {
  calcularPrecioProducto,
} from "../utils/calcularPrecioProducto.js";


/* =========================================
   VALIDAR PERSONAL DEL PEDIDO
========================================= */

async function validarEmpleadoPorCargo(
  empleadoId,
  cargoEsperado,
  etiqueta,
  obligatorio = true
) {

  if (!empleadoId) {

    if (obligatorio) {

      throw new Error(
        `Debe seleccionar ${etiqueta}.`
      );

    }

    return null;

  }


  const empleado =
    await Empleado.findById(
      empleadoId
    );


  if (!empleado) {

    throw new Error(
      `${etiqueta} seleccionado no existe.`
    );

  }


  if (
    String(
      empleado.estado || ""
    )
      .trim()
      .toLowerCase() !==
    "activo"
  ) {

    throw new Error(
      `${etiqueta} seleccionado no está activo.`
    );

  }


  if (
    String(
      empleado.cargo || ""
    )
      .trim()
      .toLowerCase() !==
    String(
      cargoEsperado || ""
    )
      .trim()
      .toLowerCase()
  ) {

    throw new Error(
      `${etiqueta} seleccionado debe tener el cargo "${cargoEsperado}".`
    );

  }


  return empleado;

}



/* =========================================
   OBTENER DATOS DE DESPACHO DEL CLIENTE
========================================= */

async function obtenerDatosDespachoCliente(cliente) {
  let zona = null;
  let ruta = null;

  if (cliente.zonaDespacho) {
    zona = await ZonaDespacho.findById(cliente.zonaDespacho);
  }

  if (zona) {
    ruta = await Ruta.findOne({
      zonasDespacho: zona._id,
      estado: "Activa",
    });
  }

  return {
    clienteCodigo: cliente.codigo || "",
    clienteNombre: cliente.nombre || "",
    clienteRazonSocial: cliente.razonSocial || "",
    clienteTelefono: cliente.telefono || "",
    clienteDireccion: cliente.direccion || "",
    clienteBarrio: cliente.barrio || "",
    clienteCiudad: cliente.ciudad || "",
    clienteTipo: cliente.tipoCliente || "",
    zonaDespacho: zona?._id || null,
    zonaDespachoCodigo: zona?.codigo || "",
    zonaDespachoNombre: zona?.nombre || "",
    ruta: ruta?._id || null,
    rutaCodigo: ruta?.codigo || "",
    rutaNombre: ruta?.nombre || "",
    rutaDiasAtencion: Array.isArray(ruta?.diasAtencion) ? ruta.diasAtencion : [],
  };
}


/* =========================================
   NORMALIZAR ESTADOS DEL FLUJO ANTERIOR
   Solo para compatibilidad con pedidos
   creados antes del módulo Entrega.
========================================= */

function normalizarEstadoPedido(
  estado
) {

  if (
    estado ===
    "Pendiente"
  ) {
    return "En preparación";
  }


  if (
    estado === "En ruta" ||
    estado === "Entregado"
  ) {
    return "Listo para entrega";
  }


  return estado;

}


/* =========================================
   LISTAR PEDIDOS
========================================= */

export const listarPedidos =
  async (req, res) => {

    try {

      const pedidos =
        await Pedido.find()

          .populate(
            "cliente",
            "codigo nombre razonSocial telefono direccion barrio ciudad tipoCliente zonaDespacho"
          )

          .populate(
            "zonaDespacho",
            "codigo nombre descripcion estado"
          )

          .populate(
            "ruta",
            "codigo nombre descripcion diasAtencion estado"
          )

          .populate(
            "empleado",
            "codigo nombres apellidos documento cargo estado"
          )

          .populate(
            "empacador",
            "codigo nombres apellidos documento cargo estado"
          )

          .populate(
            "items.producto",
            "codigo nombre marca categoria"
          )

          .populate(
            "creadoPor",
            "nombres apellidos"
          )

          .sort({
            createdAt: -1,
          });


      const pedidosNormalizados =
        pedidos.map(
          (pedido) => {

            const data =
              pedido.toObject();


            data.estado =
              normalizarEstadoPedido(
                data.estado
              );


            return data;

          }
        );


      return res.json(
        pedidosNormalizados
      );

    } catch (error) {

      console.error(
        "Error listando pedidos:",
        error
      );


      return res.status(500).json({
        mensaje:
          "No fue posible cargar los pedidos.",
      });

    }

  };


/* =========================================
   SIGUIENTE CÓDIGO
========================================= */

export const obtenerSiguienteCodigoPedido =
  async (req, res) => {

    try {

      const consecutivo =
        await Consecutivo.findOne({
          clave: "pedidos",
        });


      const siguiente =
        (
          consecutivo?.ultimoNumero ||
          0
        ) + 1;


      const codigo =
        `PED-${String(
          siguiente
        ).padStart(
          4,
          "0"
        )}`;


      return res.json({
        codigo,
      });

    } catch (error) {

      console.error(
        "Error obteniendo código de pedido:",
        error
      );


      return res.status(500).json({
        mensaje:
          "No fue posible obtener el siguiente código.",
      });

    }

  };


/* =========================================
   CALCULAR ITEM
========================================= */

async function calcularItemPedido(
  item
) {

  const producto =
    await Producto.findById(
      item.producto
    );


  if (!producto) {

    throw new Error(
      "Uno de los productos seleccionados no existe."
    );

  }


  if (
    producto.estado !==
    "Activo"
  ) {

    throw new Error(
      `El producto "${producto.nombre}" está inactivo.`
    );

  }


  const cantidad =
    Number(
      item.cantidad
    );


  /* =====================================
     PRESENTACIÓN ADICIONAL
  ===================================== */

  let precioNormal =
    Number(
      producto.precioVenta ||
      0
    );


  let tipoVenta =
    producto.tipoVenta;


  let unidad =
    producto.unidad;


  let reglasPrecio =
    producto.reglasPrecio ||
    [];


  let presentacionId =
    null;


  let presentacionNombre =
    "";


  if (
    item.presentacionId
  ) {

    const presentacion =
      producto
        .presentacionesAdicionales
        ?.id(
          item.presentacionId
        );


    if (
      !presentacion
    ) {

      throw new Error(
        `La presentación seleccionada de "${producto.nombre}" no existe.`
      );

    }


    const presentacionActiva =
      presentacion.estado === "Activo" ||
      presentacion.estado === "Activa" ||
      presentacion.estado === true;


    if (
      !presentacionActiva
    ) {

      throw new Error(
        `La presentación "${presentacion.nombre}" está inactiva.`
      );

    }


    precioNormal =
      Number(
        presentacion.precioVenta ||
        0
      );


    tipoVenta =
      presentacion.tipoVenta;


    unidad =
      presentacion.unidad;


    reglasPrecio =
      presentacion.reglasPrecio ||
      [];


    presentacionId =
      presentacion._id;


    presentacionNombre =
      presentacion.nombre;

  }


  /* =====================================
     VALIDAR CANTIDAD
     - Unidad: mínimo 1
     - Peso: permite 0
  ===================================== */

  const esProductoPorPeso =
    tipoVenta ===
    "Peso";


  if (
    !Number.isFinite(
      cantidad
    ) ||
    !Number.isInteger(
      cantidad
    ) ||
    cantidad < 0 ||
    (
      !esProductoPorPeso &&
      cantidad === 0
    )
  ) {

    throw new Error(
      esProductoPorPeso
        ? `La cantidad solicitada de "${producto.nombre}" debe ser un número entero igual o mayor que cero.`
        : `La cantidad solicitada de "${producto.nombre}" debe ser un número entero mayor que cero.`
    );

  }


  /* =====================================
     PRECIO AUTOMÁTICO POR CANTIDAD
     APLICA TANTO A UNIDAD COMO A PESO
  ===================================== */

  const cantidadSinConfirmar =
    esProductoPorPeso &&
    cantidad === 0;


  const precioAplicado =
    cantidadSinConfirmar
      ? precioNormal
      : calcularPrecioProducto({

          precioVenta:
            precioNormal,

          reglasPrecio,

          cantidad,

        });


  const reglasCumplidas =
    cantidadSinConfirmar
      ? []
      : reglasPrecio

      .filter(
        (regla) =>
          Number(
            regla.desde
          ) <=
          cantidad
      )

      .sort(
        (a, b) =>
          Number(
            b.desde
          ) -
          Number(
            a.desde
          )
      );


  const reglaAplicada =
    reglasCumplidas[0] ||
    null;


  const aplicoPrecioCantidad =
    Boolean(
      reglaAplicada &&
      Number(
        precioAplicado
      ) !==
      Number(
        precioNormal
      )
    );


  /*
    Los productos vendidos por peso NO se pesan en Pedidos.
    Pedidos sí determina el precio por KG según la cantidad
    solicitada. El subtotal definitivo sigue pendiente hasta
    registrar el peso real en Entrega.
  */
  if (
    tipoVenta ===
    "Peso"
  ) {

    return {

      producto:
        producto._id,

      codigoProducto:
        producto.codigo,

      nombre:
        producto.nombre,

      marca:
        producto.marca ||
        "",

      tipoVenta,

      unidad,

      presentacionId,

      presentacionNombre,

      cantidad,

      precioNormal,

      precioAplicado,

      aplicoPrecioCantidad,

      reglaAplicadaDesde:
        reglaAplicada
          ? Number(
            reglaAplicada.desde
          )
          : null,

      subtotal:
        0,

    };

  }


  /* =====================================
     SUBTOTAL - PRODUCTOS POR UNIDAD
  ===================================== */

  const subtotal =
    Number(
      (
        cantidad *
        precioAplicado
      ).toFixed(
        2
      )
    );


  return {

    producto:
      producto._id,

    codigoProducto:
      producto.codigo,

    nombre:
      producto.nombre,

    marca:
      producto.marca ||
      "",

    tipoVenta,

    unidad,

    presentacionId,

    presentacionNombre,

    cantidad,

    precioNormal,

    precioAplicado,

    aplicoPrecioCantidad,

    reglaAplicadaDesde:
      reglaAplicada
        ? Number(
          reglaAplicada.desde
        )
        : null,

    subtotal,

  };

}


/* =========================================
   CREAR PEDIDO
========================================= */

export const crearPedido =
  async (req, res) => {

    try {

      const {

        cliente,

        empleado,

        empacador = null,

        items = [],

        descuento = 0,

        fechaEntrega,

        observaciones = "",

      } = req.body;


      /* =====================================
         CLIENTE OPCIONAL
         SI NO HAY CLIENTE, SE GUARDA
         COMO BORRADOR
      ===================================== */

      let clienteExiste =
        null;

      let datosDespacho = {
        clienteCodigo: "",
        clienteNombre: "",
        clienteRazonSocial: "",
        clienteTelefono: "",
        clienteDireccion: "",
        clienteBarrio: "",
        clienteCiudad: "",
        clienteTipo: "",
        zonaDespacho: null,
        zonaDespachoCodigo: "",
        zonaDespachoNombre: "",
        ruta: null,
        rutaCodigo: "",
        rutaNombre: "",
        rutaDiasAtencion: [],
      };


      if (cliente) {

        clienteExiste =
          await Cliente.findById(
            cliente
          );


        if (!clienteExiste) {

          return res
            .status(404)
            .json({

              mensaje:
                "El cliente seleccionado no existe.",

            });

        }


        datosDespacho =
          await obtenerDatosDespachoCliente(
            clienteExiste
          );

      }


      /* =====================================
         PERSONAL DEL PEDIDO
         - ATENDIDO POR: OBLIGATORIO
         - EMPACADOR: OPCIONAL
         El repartidor se asignará en Entrega.
      ===================================== */

      let empleadoExiste =
        null;

      let empacadorExiste =
        null;


      try {

        empleadoExiste =
          await validarEmpleadoPorCargo(
            empleado,
            "Empleado",
            "un empleado para atender el pedido",
            true
          );


        empacadorExiste =
          await validarEmpleadoPorCargo(
            empacador,
            "Empacador",
            "un empacador",
            false
          );

      } catch (error) {

        return res
          .status(400)
          .json({

            mensaje:
              error.message,

          });

      }


      /* =====================================
         VALIDAR ITEMS
      ===================================== */

      if (
        !Array.isArray(
          items
        ) ||
        items.length === 0
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El pedido debe tener al menos un producto.",

          });

      }


      const itemsCalculados =
        [];


      for (
        const item
        of items
      ) {

        itemsCalculados.push(
          await calcularItemPedido(
            item
          )
        );

      }


      /*
        Los productos por peso quedan con subtotal 0.
        Su valor definitivo se calculará en Entrega.
      */
      const subtotal =
        Number(
          itemsCalculados
            .reduce(
              (
                acumulado,
                item
              ) =>
                acumulado +
                Number(
                  item.subtotal ||
                  0
                ),
              0
            )
            .toFixed(
              2
            )
        );


      const descuentoNumero =
        Number(
          descuento ||
          0
        );


      if (
        !Number.isFinite(
          descuentoNumero
        ) ||
        descuentoNumero < 0 ||
        descuentoNumero >
        subtotal
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El descuento no es válido para el subtotal calculado.",

          });

      }


      const total =
        Number(
          (
            subtotal -
            descuentoNumero
          ).toFixed(
            2
          )
        );


      const codigo =
        await generarConsecutivo(
          "pedidos",
          "PED"
        );


      const pedido =
        await Pedido.create({

          codigo,

          cliente:
            clienteExiste
              ? clienteExiste._id
              : null,

          clienteCodigo:
            datosDespacho.clienteCodigo,

          clienteNombre:
            datosDespacho.clienteNombre,

          clienteRazonSocial:
            datosDespacho.clienteRazonSocial,

          clienteTelefono:
            datosDespacho.clienteTelefono,

          clienteDireccion:
            datosDespacho.clienteDireccion,

          clienteBarrio:
            datosDespacho.clienteBarrio,

          clienteCiudad:
            datosDespacho.clienteCiudad,

          clienteTipo:
            datosDespacho.clienteTipo,

          zonaDespacho:
            datosDespacho.zonaDespacho,

          zonaDespachoCodigo:
            datosDespacho.zonaDespachoCodigo,

          zonaDespachoNombre:
            datosDespacho.zonaDespachoNombre,

          ruta:
            datosDespacho.ruta,

          rutaCodigo:
            datosDespacho.rutaCodigo,

          rutaNombre:
            datosDespacho.rutaNombre,

          rutaDiasAtencion:
            datosDespacho.rutaDiasAtencion,

          empleado:
            empleadoExiste._id,

          empacador:
            empacadorExiste
              ? empacadorExiste._id
              : null,

          items:
            itemsCalculados,

          subtotal,

          descuento:
            descuentoNumero,

          total,

          estado:
            "Borrador",

          fechaEntrega:
            fechaEntrega ||
            null,

          observaciones:
            String(
              observaciones ||
              ""
            ).trim(),

          creadoPor:
            req.usuario?._id ||
            null,

        });


      await pedido.populate([

        {
          path:
            "cliente",

          select:
            "codigo nombre razonSocial telefono direccion barrio ciudad tipoCliente zonaDespacho",
        },

        {
          path:
            "zonaDespacho",

          select:
            "codigo nombre descripcion estado",
        },

        {
          path:
            "ruta",

          select:
            "codigo nombre descripcion diasAtencion estado",
        },

        {
          path:
            "empleado",

          select:
            "codigo nombres apellidos documento cargo estado",
        },

        {
          path:
            "empacador",

          select:
            "codigo nombres apellidos documento cargo estado",
        },

        {
          path:
            "items.producto",

          select:
            "codigo nombre marca categoria",
        },

        {
          path:
            "creadoPor",

          select:
            "nombres apellidos",
        },

      ]);


      return res
        .status(201)
        .json({

          mensaje:
            "Pedido creado correctamente.",

          pedido,

        });

    } catch (error) {

      console.error(
        "Error creando pedido:",
        error
      );


      return res
        .status(500)
        .json({

          mensaje:
            error.message ||
            "No fue posible crear el pedido.",

        });

    }

  };

/* =========================================
   ACTUALIZAR PEDIDO
========================================= */

export const actualizarPedido =
  async (req, res) => {

    try {

      const pedido =
        await Pedido.findById(
          req.params.id
        );


      if (!pedido) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      if (
        [
          "Listo para entrega",
          "En ruta",
          "Entregado",
          "Cancelado",
        ].includes(
          pedido.estado
        )
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "No puedes modificar un pedido listo para entrega o cancelado.",

          });

      }


      const {

        cliente,

        empleado,

        empacador = null,

        items = [],

        descuento = 0,

        fechaEntrega,

        observaciones = "",

      } = req.body;


      let clienteExiste =
        null;

      let datosDespacho = {
        clienteCodigo: "",
        clienteNombre: "",
        clienteRazonSocial: "",
        clienteTelefono: "",
        clienteDireccion: "",
        clienteBarrio: "",
        clienteCiudad: "",
        clienteTipo: "",
        zonaDespacho: null,
        zonaDespachoCodigo: "",
        zonaDespachoNombre: "",
        ruta: null,
        rutaCodigo: "",
        rutaNombre: "",
        rutaDiasAtencion: [],
      };


      if (cliente) {

        clienteExiste =
          await Cliente.findById(
            cliente
          );


        if (!clienteExiste) {

          return res
            .status(404)
            .json({

              mensaje:
                "El cliente seleccionado no existe.",

            });

        }


        datosDespacho =
          await obtenerDatosDespachoCliente(
            clienteExiste
          );

      }


      if (
        !clienteExiste &&
        pedido.estado !==
          "Borrador"
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "No puedes retirar el cliente de un pedido que ya está en preparación.",

          });

      }


      let empleadoExiste =
        null;

      let empacadorExiste =
        null;


      try {

        empleadoExiste =
          await validarEmpleadoPorCargo(
            empleado,
            "Empleado",
            "un empleado para atender el pedido",
            true
          );


        empacadorExiste =
          await validarEmpleadoPorCargo(
            empacador,
            "Empacador",
            "un empacador",
            false
          );

      } catch (error) {

        return res
          .status(400)
          .json({

            mensaje:
              error.message,

          });

      }


      if (
        !Array.isArray(
          items
        ) ||
        items.length === 0
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El pedido debe tener al menos un producto.",

          });

      }


      const itemsCalculados =
        [];


      for (
        const item
        of items
      ) {

        itemsCalculados.push(
          await calcularItemPedido(
            item
          )
        );

      }


      const subtotal =
        Number(
          itemsCalculados
            .reduce(
              (
                acumulado,
                item
              ) =>
                acumulado +
                Number(
                  item.subtotal ||
                  0
                ),
              0
            )
            .toFixed(
              2
            )
        );


      const descuentoNumero =
        Number(
          descuento ||
          0
        );


      if (
        !Number.isFinite(
          descuentoNumero
        ) ||
        descuentoNumero < 0 ||
        descuentoNumero >
        subtotal
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El descuento no es válido para el subtotal calculado.",

          });

      }


      pedido.cliente =
        clienteExiste
          ? clienteExiste._id
          : null;

      pedido.clienteCodigo =
        datosDespacho.clienteCodigo;

      pedido.clienteNombre =
        datosDespacho.clienteNombre;

      pedido.clienteRazonSocial =
        datosDespacho.clienteRazonSocial;

      pedido.clienteTelefono =
        datosDespacho.clienteTelefono;

      pedido.clienteDireccion =
        datosDespacho.clienteDireccion;

      pedido.clienteBarrio =
        datosDespacho.clienteBarrio;

      pedido.clienteCiudad =
        datosDespacho.clienteCiudad;

      pedido.clienteTipo =
        datosDespacho.clienteTipo;

      pedido.zonaDespacho =
        datosDespacho.zonaDespacho;

      pedido.zonaDespachoCodigo =
        datosDespacho.zonaDespachoCodigo;

      pedido.zonaDespachoNombre =
        datosDespacho.zonaDespachoNombre;

      pedido.ruta =
        datosDespacho.ruta;

      pedido.rutaCodigo =
        datosDespacho.rutaCodigo;

      pedido.rutaNombre =
        datosDespacho.rutaNombre;

      pedido.rutaDiasAtencion =
        datosDespacho.rutaDiasAtencion;

      pedido.empleado =
        empleadoExiste._id;

      pedido.empacador =
        empacadorExiste
          ? empacadorExiste._id
          : null;

      pedido.items =
        itemsCalculados;

      pedido.subtotal =
        subtotal;

      pedido.descuento =
        descuentoNumero;

      pedido.total =
        Number(
          (
            subtotal -
            descuentoNumero
          ).toFixed(
            2
          )
        );

      pedido.fechaEntrega =
        fechaEntrega ||
        null;

      pedido.observaciones =
        String(
          observaciones ||
          ""
        ).trim();


      if (
        pedido.estado ===
        "Pendiente"
      ) {
        pedido.estado =
          "En preparación";
      }


      await pedido.save();


      await pedido.populate([

        {
          path:
            "cliente",

          select:
            "codigo nombre razonSocial telefono direccion barrio ciudad tipoCliente zonaDespacho",
        },

        {
          path:
            "zonaDespacho",

          select:
            "codigo nombre descripcion estado",
        },

        {
          path:
            "ruta",

          select:
            "codigo nombre descripcion diasAtencion estado",
        },

        {
          path:
            "empleado",

          select:
            "codigo nombres apellidos documento cargo estado",
        },

        {
          path:
            "empacador",

          select:
            "codigo nombres apellidos documento cargo estado",
        },

        {
          path:
            "items.producto",

          select:
            "codigo nombre marca categoria",
        },

        {
          path:
            "creadoPor",

          select:
            "nombres apellidos",
        },

      ]);


      return res.json({

        mensaje:
          "Pedido actualizado correctamente.",

        pedido,

      });

    } catch (error) {

      console.error(
        "Error actualizando pedido:",
        error
      );


      return res
        .status(500)
        .json({

          mensaje:
            error.message ||
            "No fue posible actualizar el pedido.",

        });

    }

  };

/* =========================================
   CAMBIAR ESTADO
========================================= */

export const cambiarEstadoPedido =
  async (req, res) => {

    try {

      const {
        estado,
      } = req.body;


      const estadosValidos = [
        "Borrador",
        "En preparación",
        "Listo para entrega",
        "Cancelado",
      ];


      if (
        !estadosValidos.includes(
          estado
        )
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El estado indicado no es válido.",

          });

      }


      const pedido =
        await Pedido.findById(
          req.params.id
        );


      if (!pedido) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      /*
        Los estados del pedido se pueden cambiar libremente.
        Únicamente para marcarlo como "Listo para entrega"
        se exige tener un cliente asignado, porque ese es el
        estado que permite que Entrega lo reciba.
      */
      if (
        estado ===
          "Listo para entrega" &&
        !pedido.cliente
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "Debes asignar un cliente antes de marcar el pedido como Listo para entrega.",

          });

      }


      if (
        pedido.estado ===
        estado
      ) {

        return res.json({

          mensaje:
            "El pedido ya se encuentra en ese estado.",

          estado:
            pedido.estado,

        });

      }


      pedido.estado =
        estado;


      await pedido.save();


      return res.json({

        mensaje:
          "Estado del pedido actualizado correctamente.",

        estado:
          pedido.estado,

      });

    } catch (error) {

      console.error(
        "Error cambiando estado del pedido:",
        error
      );


      return res
        .status(500)
        .json({

          mensaje:
            error.message ||
            "No fue posible cambiar el estado del pedido.",

        });

    }

  };

/* =========================================
   ELIMINAR PEDIDO
========================================= */

export const eliminarPedido =
  async (req, res) => {

    try {

      const pedido =
        await Pedido.findById(
          req.params.id
        );


      if (!pedido) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      if (
        [
          "Listo para entrega",
          "En ruta",
          "Entregado",
        ].includes(
          pedido.estado
        )
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "No puedes eliminar un pedido que ya fue enviado al proceso de entrega.",

          });

      }


      await pedido.deleteOne();


      return res.json({

        mensaje:
          "Pedido eliminado correctamente.",

      });

    } catch (error) {

      console.error(
        "Error eliminando pedido:",
        error
      );


      return res
        .status(500)
        .json({

          mensaje:
            "No fue posible eliminar el pedido.",

        });

    }

  };
