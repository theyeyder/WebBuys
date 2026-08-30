import Pedido
  from "../models/Pedido.js";

import Producto
  from "../models/Producto.js";

import Cliente
  from "../models/Cliente.js";

import Consecutivo
  from "../models/Consecutivo.js";

import {
  generarConsecutivo,
} from "../utils/generarConsecutivo.js";

import {
  calcularPrecioProducto,
} from "../utils/calcularPrecioProducto.js";


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
            "codigo documento nombre telefono zonaDespacho"
          )
          .populate(
            "items.producto",
            "codigo nombre categoria"
          )
          .populate(
            "creadoPor",
            "nombres apellidos usuario"
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
        (consecutivo?.ultimoNumero || 0) + 1;

      const codigo =
        `PED-${String(
          siguiente
        ).padStart(4, "0")}`;

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
    producto.estado !== "Activo"
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
    !Number.isFinite(cantidad) ||
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
      producto.precioVenta || 0
    );

  let tipoVenta =
    producto.tipoVenta;

  let unidad =
    producto.unidad;

  let reglasPrecio =
    producto.reglasPrecio || [];

  let presentacionId =
    null;

  let presentacionNombre =
    "";


  if (item.presentacionId) {

    const presentacion =
      producto.presentacionesAdicionales
        ?.id(
          item.presentacionId
        );


    if (!presentacion) {

      throw new Error(
        `La presentación seleccionada de "${producto.nombre}" no existe.`
      );

    }


    if (
      presentacion.estado !==
      "Activa"
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
          Number(regla.desde) <=
          cantidad
      )
      .sort(
        (a, b) =>
          Number(b.desde) -
          Number(a.desde)
      );


  const reglaAplicada =
    reglasCumplidas[0] ||
    null;


  const aplicoPrecioCantidad =
    Boolean(
      reglaAplicada &&
      Number(precioAplicado) !==
      Number(precioNormal)
    );


  const subtotal =
    Number(
      (
        cantidad *
        precioAplicado
      ).toFixed(2)
    );


  return {

    producto:
      producto._id,

    codigoProducto:
      producto.codigo,

    nombre:
      producto.nombre,

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
        items = [],
        descuento = 0,
        fechaEntrega,
        observaciones = "",
      } = req.body;


      if (!cliente) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar un cliente.",
        });

      }


      const clienteExiste =
        await Cliente.findById(
          cliente
        );


      if (!clienteExiste) {

        return res.status(404).json({
          mensaje:
            "El cliente seleccionado no existe.",
        });

      }


      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
          mensaje:
            "El pedido debe tener al menos un producto.",
        });

      }


      /* CALCULAR ITEMS */

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


      /* SUBTOTAL */

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
            .toFixed(2)
        );


      /* DESCUENTO */

      const descuentoNumero =
        Number(
          descuento || 0
        );


      if (
        !Number.isFinite(
          descuentoNumero
        ) ||
        descuentoNumero < 0
      ) {

        return res.status(400).json({
          mensaje:
            "El descuento no es válido.",
        });

      }


      if (
        descuentoNumero >
        subtotal
      ) {

        return res.status(400).json({
          mensaje:
            "El descuento no puede superar el subtotal.",
        });

      }


      const total =
        Number(
          (
            subtotal -
            descuentoNumero
          ).toFixed(2)
        );


      /* CONSECUTIVO */

      const codigo =
        await generarConsecutivo(
          "pedidos",
          "PED"
        );


      const pedido =
        await Pedido.create({

          codigo,

          cliente:
            clienteExiste._id,

          items:
            itemsCalculados,

          subtotal,

          descuento:
            descuentoNumero,

          total,

          estado:
            "Pendiente",

          fechaEntrega:
            fechaEntrega ||
            null,

          observaciones:
            observaciones.trim(),

          creadoPor:
            req.usuario?._id ||
            null,

        });


      await pedido.populate([
        {
          path: "cliente",

          select:
            "codigo documento nombre telefono zonaDespacho",
        },

        {
          path:
            "items.producto",

          select:
            "codigo nombre categoria",
        },

        {
          path:
            "creadoPor",

          select:
            "nombres apellidos usuario",
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


      return res.status(500).json({
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

        return res.status(404).json({
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

        return res.status(400).json({
          mensaje:
            "No puedes modificar un pedido entregado o cancelado.",
        });

      }


      const {
        cliente,
        items = [],
        descuento = 0,
        fechaEntrega,
        observaciones = "",
      } = req.body;


      const clienteExiste =
        await Cliente.findById(
          cliente
        );


      if (!clienteExiste) {

        return res.status(404).json({
          mensaje:
            "El cliente seleccionado no existe.",
        });

      }


      if (
        !Array.isArray(items) ||
        items.length === 0
      ) {

        return res.status(400).json({
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
                  item.subtotal
                ),

              0
            )
            .toFixed(2)
        );


      const descuentoNumero =
        Number(
          descuento || 0
        );


      if (
        descuentoNumero < 0 ||
        descuentoNumero >
        subtotal
      ) {

        return res.status(400).json({
          mensaje:
            "El descuento no es válido.",
        });

      }


      pedido.cliente =
        clienteExiste._id;

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
          ).toFixed(2)
        );

      pedido.fechaEntrega =
        fechaEntrega ||
        null;

      pedido.observaciones =
        observaciones.trim();


      await pedido.save();


      await pedido.populate([
        {
          path: "cliente",

          select:
            "codigo documento nombre telefono zonaDespacho",
        },

        {
          path:
            "items.producto",

          select:
            "codigo nombre categoria",
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


      return res.status(500).json({
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

        return res.status(400).json({
          mensaje:
            "El estado indicado no es válido.",
        });

      }


      const pedido =
        await Pedido.findById(
          req.params.id
        );


      if (!pedido) {

        return res.status(404).json({
          mensaje:
            "Pedido no encontrado.",
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


      return res.status(500).json({
        mensaje:
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

        return res.status(404).json({
          mensaje:
            "Pedido no encontrado.",
        });

      }


      if (
        pedido.estado ===
        "Entregado"
      ) {

        return res.status(400).json({
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


      return res.status(500).json({
        mensaje:
          "No fue posible eliminar el pedido.",
      });

    }

  };