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

import Factura
  from "../models/Factura.js";

import Caja
  from "../models/Caja.js";

import MovimientoCaja
  from "../models/MovimientoCaja.js";

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
   UTILIDADES DE CAJA PARA PEDIDOS
========================================= */

function usuarioActualPedido(req) {

  return (
    req.usuario?._id ||
    req.user?._id ||
    null
  );

}


async function obtenerCajaAbiertaPedido() {

  return Caja.findOne({
    estado: "Abierta",
  });

}


async function obtenerFacturaActivaPedido(
  pedidoId
) {

  return Factura.findOne({
    pedido:
      pedidoId,

    estado: {
      $ne: "Anulada",
    },
  })
    .sort({
      createdAt: -1,
    });

}


function nombreClientePedido(
  pedido
) {

  return (
    pedido.clienteNombre ||
    pedido.clienteRazonSocial ||
    "Cliente"
  );

}


async function registrarPedidoEntregadoEnCaja({
  pedido,
  caja,
  usuarioId = null,
}) {

  if (
    !pedido ||
    !caja
  ) {

    const error =
      new Error(
        "No fue posible identificar el pedido o la caja abierta."
      );

    error.statusCode =
      400;

    throw error;

  }


  const valor =
    Number(
      pedido.total ||
      0
    );


  if (
    !Number.isFinite(
      valor
    ) ||
    valor <= 0
  ) {

    const error =
      new Error(
        `El pedido ${pedido.codigo} no tiene un total válido para ingresar a Caja.`
      );

    error.statusCode =
      400;

    throw error;

  }


  const factura =
    await obtenerFacturaActivaPedido(
      pedido._id
    );


  const claveUnica =
    `PEDIDO:${pedido._id}`;


  const existente =
    await MovimientoCaja
      .findOne({
        claveUnica,
      })
      .populate(
        "caja",
        "codigo estado"
      );


  /*
    Si el pedido ya quedó registrado en otra caja y
    ese movimiento sigue activo, no se duplica.
  */
  if (
    existente &&
    existente.estado ===
      "Activo" &&
    String(
      existente.caja?._id ||
      existente.caja
    ) !==
    String(
      caja._id
    )
  ) {

    return existente;

  }


  /*
    Si el movimiento fue anulado dentro de una caja
    ya cerrada, no se mueve a otra caja porque eso
    modificaría un cierre histórico.
  */
  if (
    existente &&
    existente.estado ===
      "Anulado" &&
    existente.caja?.estado ===
      "Cerrada" &&
    String(
      existente.caja?._id ||
      existente.caja
    ) !==
    String(
      caja._id
    )
  ) {

    const error =
      new Error(
        `El pedido ${pedido.codigo} ya tuvo un movimiento en la caja ${existente.caja.codigo}. No puede reingresarse automáticamente porque esa caja está cerrada.`
      );

    error.statusCode =
      400;

    throw error;

  }


  return MovimientoCaja
    .findOneAndUpdate(
      {
        claveUnica,
      },

      {
        $set: {
          caja:
            caja._id,

          tipo:
            "Ingreso",

          origen:
            "Pedido",

          concepto:
            `Pedido entregado - ${pedido.codigo}`,

          valor,

          pedido:
            pedido._id,

          pedidoCodigo:
            pedido.codigo ||
            "",

          cliente:
            pedido.cliente ||
            null,

          clienteNombre:
            nombreClientePedido(
              pedido
            ),

          metodoPago:
            pedido.metodoPago ||
            "Efectivo",

          afectaEfectivo:
            (
              pedido.metodoPago ||
              "Efectivo"
            ) ===
            "Efectivo",

          factura:
            factura?._id ||
            null,

          facturaCodigo:
            factura?.codigo ||
            "",

          observacion:
            factura
              ? "Factura generada"
              : "Pedido sin factura generada",

          usuario:
            usuarioId,

          estado:
            "Activo",

          claveUnica,
        },
      },

      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

}


async function anularMovimientoPedidoEntregado(
  pedido
) {

  const claveUnica =
    `PEDIDO:${pedido._id}`;


  const movimiento =
    await MovimientoCaja
      .findOne({
        claveUnica,
        estado:
          "Activo",
      })
      .populate(
        "caja",
        "codigo estado"
      );


  if (!movimiento) {
    return null;
  }


  if (
    movimiento.caja?.estado ===
    "Cerrada"
  ) {

    const error =
      new Error(
        `El pedido ${pedido.codigo} ya fue incluido en la caja cerrada ${movimiento.caja.codigo}. No puede retirarse de esa caja cambiando el estado del pedido.`
      );

    error.statusCode =
      400;

    throw error;

  }


  movimiento.estado =
    "Anulado";

  movimiento.observacion =
    "Movimiento anulado porque el pedido dejó de estar Entregado";


  await movimiento.save();


  return movimiento;

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
            "repartidor",
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


      return res.json(
        pedidos
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


  if (
    !Number.isFinite(
      cantidad
    ) ||
    cantidad <= 0
  ) {

    throw new Error(
      `La cantidad de "${producto.nombre}" no es válida.`
    );

  }


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
     PRECIO AUTOMÁTICO
  ===================================== */

  const precioAplicado =
    calcularPrecioProducto({

      precioVenta:
        precioNormal,

      reglasPrecio,

      cantidad,

    });


  const reglasCumplidas =
    reglasPrecio

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

        repartidor,

        empacador = null,

        items = [],

        descuento = 0,

        metodoPago = "Efectivo",

        fechaEntrega,

        observaciones = "",

      } = req.body;


      /* =====================================
         CLIENTE OPCIONAL
         SI NO HAY CLIENTE, EL PEDIDO
         SE GUARDA COMO BORRADOR
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
         VALIDAR PERSONAL DEL PEDIDO
         - ATENDIDO POR: OBLIGATORIO
         - REPARTIDOR: OBLIGATORIO
         - EMPACADOR: OPCIONAL
      ===================================== */

      let empleadoExiste =
        null;

      let repartidorExiste =
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


        repartidorExiste =
          await validarEmpleadoPorCargo(
            repartidor,
            "Repartidor",
            "un repartidor",
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
         VALIDAR MÉTODO DE PAGO
      ===================================== */

      const metodosPagoValidos = [
        "Efectivo",
        "Transferencia",
        "Crédito",
      ];


      if (
        !metodosPagoValidos.includes(
          metodoPago
        )
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El tipo de pago seleccionado no es válido.",

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


      /* =====================================
         CALCULAR ITEMS
      ===================================== */

      const itemsCalculados =
        [];


      for (
        const item
        of items
      ) {

        const calculado =
          await calcularItemPedido(
            item
          );


        itemsCalculados.push(
          calculado
        );

      }


      /* =====================================
         SUBTOTAL
      ===================================== */

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
                  item.subtotal
                ),

              0
            )

            .toFixed(
              2
            )
        );


      /* =====================================
         DESCUENTO
      ===================================== */

      const descuentoNumero =
        Number(
          descuento ||
          0
        );


      if (
        !Number.isFinite(
          descuentoNumero
        ) ||
        descuentoNumero < 0
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El descuento no es válido.",

          });

      }


      if (
        descuentoNumero >
        subtotal
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El descuento no puede superar el subtotal.",

          });

      }


      /* =====================================
         TOTAL
      ===================================== */

      const total =
        Number(
          (
            subtotal -
            descuentoNumero
          ).toFixed(
            2
          )
        );


      /* =====================================
         CONSECUTIVO
      ===================================== */

      const codigo =
        await generarConsecutivo(
          "pedidos",
          "PED"
        );


      /* =====================================
         CREAR PEDIDO
      ===================================== */

      const pedido =
        await Pedido.create({

          codigo,


          cliente:
            clienteExiste
              ? clienteExiste._id
              : null,

          clienteCodigo: datosDespacho.clienteCodigo,
          clienteNombre: datosDespacho.clienteNombre,
          clienteRazonSocial: datosDespacho.clienteRazonSocial,
          clienteTelefono: datosDespacho.clienteTelefono,
          clienteDireccion: datosDespacho.clienteDireccion,
          clienteBarrio: datosDespacho.clienteBarrio,
          clienteCiudad: datosDespacho.clienteCiudad,
          clienteTipo: datosDespacho.clienteTipo,

          zonaDespacho: datosDespacho.zonaDespacho,
          zonaDespachoCodigo: datosDespacho.zonaDespachoCodigo,
          zonaDespachoNombre: datosDespacho.zonaDespachoNombre,

          ruta: datosDespacho.ruta,
          rutaCodigo: datosDespacho.rutaCodigo,
          rutaNombre: datosDespacho.rutaNombre,
          rutaDiasAtencion: datosDespacho.rutaDiasAtencion,


          empleado:
            empleadoExiste._id,


          repartidor:
            repartidorExiste._id,


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


          metodoPago,


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


      /* =====================================
         POPULATE
      ===================================== */

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
            "repartidor",

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


      if (
        !pedido
      ) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      if (
        [
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
              "No puedes modificar un pedido entregado o cancelado.",

          });

      }


      const {

        cliente,

        empleado,

        repartidor,

        empacador = null,

        items = [],

        descuento = 0,

        metodoPago = "Efectivo",

        fechaEntrega,

        observaciones = "",

      } = req.body;


      /* =====================================
         CLIENTE OPCIONAL
         PERMITE ASIGNARLO O RETIRARLO
         MIENTRAS EL PEDIDO SEA BORRADOR
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


      if (
        !clienteExiste &&
        pedido.estado !== "Borrador"
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "No puedes retirar el cliente de un pedido que ya fue confirmado.",

          });

      }


      /* =====================================
         VALIDAR PERSONAL DEL PEDIDO
         - ATENDIDO POR: OBLIGATORIO
         - REPARTIDOR: OBLIGATORIO
         - EMPACADOR: OPCIONAL
      ===================================== */

      let empleadoExiste =
        null;

      let repartidorExiste =
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


        repartidorExiste =
          await validarEmpleadoPorCargo(
            repartidor,
            "Repartidor",
            "un repartidor",
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
         VALIDAR MÉTODO DE PAGO
      ===================================== */

      const metodosPagoValidos = [
        "Efectivo",
        "Transferencia",
        "Crédito",
      ];


      if (
        !metodosPagoValidos.includes(
          metodoPago
        )
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "El tipo de pago seleccionado no es válido.",

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


      /* =====================================
         RECALCULAR ITEMS
      ===================================== */

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


      /* =====================================
         SUBTOTAL
      ===================================== */

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
                  item.subtotal
                ),

              0
            )

            .toFixed(
              2
            )
        );


      /* =====================================
         DESCUENTO
      ===================================== */

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
              "El descuento no es válido.",

          });

      }


      /* =====================================
         ACTUALIZAR
      ===================================== */

      pedido.cliente =
        clienteExiste
          ? clienteExiste._id
          : null;

      pedido.clienteCodigo = datosDespacho.clienteCodigo;
      pedido.clienteNombre = datosDespacho.clienteNombre;
      pedido.clienteRazonSocial = datosDespacho.clienteRazonSocial;
      pedido.clienteTelefono = datosDespacho.clienteTelefono;
      pedido.clienteDireccion = datosDespacho.clienteDireccion;
      pedido.clienteBarrio = datosDespacho.clienteBarrio;
      pedido.clienteCiudad = datosDespacho.clienteCiudad;
      pedido.clienteTipo = datosDespacho.clienteTipo;

      pedido.zonaDespacho = datosDespacho.zonaDespacho;
      pedido.zonaDespachoCodigo = datosDespacho.zonaDespachoCodigo;
      pedido.zonaDespachoNombre = datosDespacho.zonaDespachoNombre;

      pedido.ruta = datosDespacho.ruta;
      pedido.rutaCodigo = datosDespacho.rutaCodigo;
      pedido.rutaNombre = datosDespacho.rutaNombre;
      pedido.rutaDiasAtencion = datosDespacho.rutaDiasAtencion;


      pedido.empleado =
        empleadoExiste._id;


      pedido.repartidor =
        repartidorExiste._id;


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


      pedido.metodoPago =
        metodoPago;


      pedido.fechaEntrega =
        fechaEntrega ||
        null;


      pedido.observaciones =
        String(
          observaciones ||
          ""
        ).trim();


      await pedido.save();


      /* =====================================
         POPULATE
      ===================================== */

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
            "repartidor",

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
        "Pendiente",
        "En preparación",
        "En ruta",
        "Entregado",
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


      if (
        !pedido
      ) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      /* =====================================
         NO PERMITIR CONFIRMAR NI AVANZAR
         UN PEDIDO SIN CLIENTE
      ===================================== */

      if (
        !pedido.cliente &&
        estado !== "Borrador" &&
        estado !== "Cancelado"
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "Debes asignar un cliente antes de confirmar o cambiar el estado del pedido.",

          });

      }


      const estadoAnterior =
        pedido.estado;


      /*
        Si no cambió realmente el estado,
        no se crea ningún movimiento nuevo.
      */
      if (
        estadoAnterior ===
        estado
      ) {

        return res.json({

          mensaje:
            "El pedido ya se encuentra en ese estado.",

          estado:
            pedido.estado,

        });

      }


      /* =====================================
         ENTREGADO -> ENTRA A CAJA
      ===================================== */

      if (
        estado ===
        "Entregado"
      ) {

        const caja =
          await obtenerCajaAbiertaPedido();


        if (!caja) {

          return res
            .status(400)
            .json({

              mensaje:
                "Debe abrir la caja antes de marcar un pedido como Entregado.",

            });

        }


        pedido.estado =
          estado;


        await pedido.save();


        try {

          await registrarPedidoEntregadoEnCaja({

            pedido,

            caja,

            usuarioId:
              usuarioActualPedido(
                req
              ),

          });


        } catch (
          errorCaja
        ) {

          /*
            Rollback del estado si Caja no pudo
            registrar correctamente el pedido.
          */

          pedido.estado =
            estadoAnterior;


          await pedido.save();


          throw errorCaja;

        }


        return res.json({

          mensaje:
            "Pedido marcado como Entregado y registrado en Caja correctamente.",

          estado:
            pedido.estado,

        });

      }


      /* =====================================
         SI DEJA DE ESTAR ENTREGADO
         SE ANULA SU MOVIMIENTO SOLO SI
         LA CAJA TODAVÍA ESTÁ ABIERTA
      ===================================== */

      if (
        estadoAnterior ===
        "Entregado"
      ) {

        await anularMovimientoPedidoEntregado(
          pedido
        );

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
        .status(
          error?.statusCode ||
          500
        )
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


      if (
        !pedido
      ) {

        return res
          .status(404)
          .json({

            mensaje:
              "Pedido no encontrado.",

          });

      }


      if (
        pedido.estado ===
        "Entregado"
      ) {

        return res
          .status(400)
          .json({

            mensaje:
              "No puedes eliminar un pedido entregado.",

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