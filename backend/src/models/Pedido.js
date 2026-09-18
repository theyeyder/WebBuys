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


      marca: {
        type: String,
        default: "",
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


      /* =====================================
         CLIENTE
      ===================================== */

      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cliente",

        default: null,
      },


      /* =====================================
         DATOS DEL CLIENTE AL MOMENTO
         DEL PEDIDO
      ===================================== */

      clienteCodigo: {
        type: String,
        default: "",
        trim: true,
      },


      clienteNombre: {
        type: String,
        default: "",
        trim: true,
      },


      clienteRazonSocial: {
        type: String,
        default: "",
        trim: true,
      },


      clienteTelefono: {
        type: String,
        default: "",
        trim: true,
      },


      clienteDireccion: {
        type: String,
        default: "",
        trim: true,
      },


      clienteBarrio: {
        type: String,
        default: "",
        trim: true,
      },


      clienteCiudad: {
        type: String,
        default: "",
        trim: true,
      },


      clienteTipo: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         ZONA DE DESPACHO
      ===================================== */

      zonaDespacho: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "ZonaDespacho",

        default: null,
      },


      zonaDespachoCodigo: {
        type: String,
        default: "",
        trim: true,
      },


      zonaDespachoNombre: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         RUTA DE DESPACHO
      ===================================== */

      ruta: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Ruta",

        default: null,
      },


      rutaCodigo: {
        type: String,
        default: "",
        trim: true,
      },


      rutaNombre: {
        type: String,
        default: "",
        trim: true,
      },


      rutaDiasAtencion: {
        type: [String],
        default: [],
      },


      /* =====================================
         PERSONAL DEL PEDIDO
      ===================================== */


      /* =====================================
         ATENDIDO POR
         Cargo: Empleado
         OBLIGATORIO
      ===================================== */

      empleado: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Empleado",

        required: true,
      },


      /* =====================================
         REPARTIDOR
         Cargo: Repartidor
         OBLIGATORIO
      ===================================== */

      repartidor: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Empleado",

        required: true,
      },


      /* =====================================
         EMPACADOR
         Cargo: Empacador
         OPCIONAL
      ===================================== */

      empacador: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Empleado",

        default: null,
      },


      /* =====================================
         PRODUCTOS
      ===================================== */

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


      /* =====================================
         TOTALES
      ===================================== */

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


      /* =====================================
         MÉTODO DE PAGO
      ===================================== */

      metodoPago: {
        type: String,

        enum: [
          "Efectivo",
          "Transferencia",
          "Crédito",
        ],

        default: "Efectivo",
      },


      /* =====================================
         ESTADO
      ===================================== */

      estado: {
        type: String,

        enum: [
          "Borrador",
          "Pendiente",
          "En preparación",
          "En ruta",
          "Entregado",
          "Cancelado",
        ],

        default: "Borrador",
      },


      /* =====================================
         FECHA DE ENTREGA
      ===================================== */

      fechaEntrega: {
        type: Date,
        default: null,
      },


      /* =====================================
         OBSERVACIONES
      ===================================== */

      observaciones: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         USUARIO QUE CREÓ EL PEDIDO
      ===================================== */

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
  empleado: 1,
  createdAt: -1,
});


pedidoSchema.index({
  repartidor: 1,
  createdAt: -1,
});


pedidoSchema.index({
  empacador: 1,
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