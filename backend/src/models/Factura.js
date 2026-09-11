import mongoose from "mongoose";


/* =========================================
   ITEM DE FACTURA
========================================= */

const facturaItemSchema =
  new mongoose.Schema(
    {
      producto: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Producto",

        default: null,
      },

      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      presentacionNombre: {
        type: String,
        default: "",
        trim: true,
      },

      unidad: {
        type: String,
        default: "",
        trim: true,
      },

      cantidad: {
        type: Number,
        required: true,
        min: 0,
      },

      precioAplicado: {
        type: Number,
        required: true,
        min: 0,
      },

      subtotal: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );


/* =========================================
   FACTURA
========================================= */

const facturaSchema =
  new mongoose.Schema(
    {
      /* -----------------------------------------
         CONSECUTIVO
      ----------------------------------------- */

      consecutivo: {
        type: Number,
        required: true,
        unique: true,
      },


      codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },


      /* -----------------------------------------
         PEDIDO
      ----------------------------------------- */

      pedido: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Pedido",

        required: true,

        unique: true,
      },


      pedidoCodigo: {
        type: String,
        required: true,
        trim: true,
      },


      /* -----------------------------------------
         CLIENTE
      ----------------------------------------- */

      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cliente",

        required: true,
      },


      clienteNombre: {
        type: String,
        required: true,
        trim: true,
      },


      clienteDocumento: {
        type: String,
        default: "",
        trim: true,
      },


      clienteTelefono: {
        type: String,
        default: "",
        trim: true,
      },


      /* -----------------------------------------
         EMPLEADO
      ----------------------------------------- */

      empleado: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Usuario",

        default: null,
      },


      empleadoNombre: {
        type: String,
        default: "",
        trim: true,
      },


      /* -----------------------------------------
         PRODUCTOS
      ----------------------------------------- */

      items: {
        type: [
          facturaItemSchema,
        ],

        default: [],
      },


      /* -----------------------------------------
         VALORES
      ----------------------------------------- */

      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },


      descuento: {
        type: Number,
        default: 0,
        min: 0,
      },


      iva: {
        type: Number,
        default: 0,
        min: 0,
      },


      total: {
        type: Number,
        default: 0,
        min: 0,
      },


      /* -----------------------------------------
         PAGO
      ----------------------------------------- */

      metodoPago: {
        type: String,

        enum: [
          "Efectivo",
          "Transferencia",
          "Crédito",
        ],

        default: "Efectivo",
      },


      /* -----------------------------------------
         ESTADO
      ----------------------------------------- */

      estado: {
        type: String,

        enum: [
          "Emitida",
          "Pagada",
          "Pendiente",
          "Anulada",
        ],

        default: "Emitida",
      },
      /* -----------------------------------------
   ANULACIÓN
----------------------------------------- */

      motivoAnulacion: {
        type: String,
        default: "",
        trim: true,
      },

      fechaAnulacion: {
        type: Date,
        default: null,
      },

      fechaReversion: {
        type: Date,
        default: null,
      },

      /* -----------------------------------------
         OBSERVACIONES
      ----------------------------------------- */

      observaciones: {
        type: String,
        default: "",
        trim: true,
      },


      /* -----------------------------------------
         USUARIO QUE GENERÓ LA FACTURA
      ----------------------------------------- */

      creadoPor: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Usuario",

        default: null,
      },
    },

    {
      timestamps: true,
      versionKey: false,
    }
  );


/* =========================================
   ÍNDICES
========================================= */

facturaSchema.index({
  createdAt: -1,
});


facturaSchema.index({
  cliente: 1,
  createdAt: -1,
});


facturaSchema.index({
  empleado: 1,
  createdAt: -1,
});


export default mongoose.model(
  "Factura",
  facturaSchema
);