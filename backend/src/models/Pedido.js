import mongoose from "mongoose";


/* =========================================
   ITEM DEL PEDIDO
========================================= */

const itemPedidoSchema =
  new mongoose.Schema(
    {
      producto: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Producto",

        required: true,
      },


      codigoProducto: {
        type: String,
        default: "",
        trim: true,
      },


      nombre: {
        type: String,
        required: true,
        trim: true,
      },


      /* =====================================
         FORMA DE VENTA
      ===================================== */

      tipoVenta: {
        type: String,

        enum: [
          "Unidad",
          "Peso",
        ],

        required: true,
      },


      unidad: {
        type: String,
        required: true,
        trim: true,
      },


      /* =====================================
         PRESENTACIÓN ADICIONAL
         SI APLICA
      ===================================== */

      presentacionId: {
        type:
          mongoose.Schema.Types.ObjectId,

        default: null,
      },


      presentacionNombre: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         CANTIDAD / PESO
      ===================================== */

      cantidad: {
        type: Number,
        required: true,
        min: 0.001,
      },


      /* =====================================
         PRECIOS
      ===================================== */

      precioNormal: {
        type: Number,
        required: true,
        min: 0,
      },


      precioAplicado: {
        type: Number,
        required: true,
        min: 0,
      },


      aplicoPrecioCantidad: {
        type: Boolean,
        default: false,
      },


      reglaAplicadaDesde: {
        type: Number,
        default: null,
      },


      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: true,
    }
  );


/* =========================================
   PEDIDO
========================================= */

const pedidoSchema =
  new mongoose.Schema(
    {
      codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },


      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cliente",

        required: true,
      },


      items: {
        type: [itemPedidoSchema],

        validate: {
          validator(items) {
            return (
              Array.isArray(items) &&
              items.length > 0
            );
          },

          message:
            "El pedido debe tener al menos un producto.",
        },
      },


      subtotal: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },


      descuento: {
        type: Number,
        default: 0,
        min: 0,
      },


      total: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },


      estado: {
        type: String,

        enum: [
          "Pendiente",
          "En preparación",
          "En ruta",
          "Entregado",
          "Cancelado",
        ],

        default: "Pendiente",
      },


      fechaEntrega: {
        type: Date,
        default: null,
      },


      observaciones: {
        type: String,
        default: "",
        trim: true,
      },


      creadoPor: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Usuario",

        default: null,
      },
    },
    {
      timestamps: true,
    }
  );


/* =========================================
   ÍNDICES
========================================= */

pedidoSchema.index({
  cliente: 1,
  createdAt: -1,
});


pedidoSchema.index({
  estado: 1,
  createdAt: -1,
});


export default mongoose.model(
  "Pedido",
  pedidoSchema
);