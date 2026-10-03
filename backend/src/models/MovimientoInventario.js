import mongoose from "mongoose";


/* =========================================
   MOVIMIENTO DE INVENTARIO
========================================= */

const movimientoInventarioSchema =
  new mongoose.Schema(
    {
      producto: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Producto",

        required: true,
        index: true,
      },

      codigoProducto: {
        type: String,
        default: "",
        trim: true,
      },

      nombreProducto: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         PRESENTACIÓN
         SI EL MOVIMIENTO CORRESPONDE A UNA
         PRESENTACIÓN ADICIONAL
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
         TIPO DE MOVIMIENTO
      ===================================== */

      tipo: {
        type: String,

        enum: [
          "ENTRADA",
          "SALIDA",
          "AJUSTE_POSITIVO",
          "AJUSTE_NEGATIVO",
          "RESERVA",
          "LIBERACION_RESERVA",
          "ENTREGA",
          "REVERSION_ENTREGA",
        ],

        required: true,

        index: true,
      },


      /* =====================================
         CANTIDAD DEL MOVIMIENTO
      ===================================== */

      cantidad: {
        type: Number,
        required: true,
        min: 0,
      },

      unidad: {
        type: String,
        default: "",
        trim: true,
      },

      tipoVenta: {
        type: String,

        enum: [
          "Unidad",
          "Peso",
        ],

        default: "Unidad",
      },


      /* =====================================
         STOCK FÍSICO
      ===================================== */

      stockAnterior: {
        type: Number,
        default: 0,
      },

      stockNuevo: {
        type: Number,
        default: 0,
      },


      /* =====================================
         STOCK RESERVADO
      ===================================== */

      reservadoAnterior: {
        type: Number,
        default: 0,
      },

      reservadoNuevo: {
        type: Number,
        default: 0,
      },


      /* =====================================
         COSTOS
      ===================================== */

      costoUnitario: {
        type: Number,
        default: 0,
        min: 0,
      },

      costoPromedioAnterior: {
        type: Number,
        default: 0,
        min: 0,
      },

      costoPromedioNuevo: {
        type: Number,
        default: 0,
        min: 0,
      },

      valorTotal: {
        type: Number,
        default: 0,
        min: 0,
      },


      /* =====================================
         ORIGEN
      ===================================== */

      origen: {
        type: String,

        enum: [
          "Manual",
          "Pedido",
          "Entrega",
          "Producto",
          "Ajuste",
          "Inicial",
        ],

        default: "Manual",
      },

      pedido: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Pedido",

        default: null,
      },

      pedidoCodigo: {
        type: String,
        default: "",
        trim: true,
      },

      entrega: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Entrega",

        default: null,
      },

      entregaCodigo: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         DATOS DE ENTRADA / SOPORTE
      ===================================== */

      proveedor: {
        type: String,
        default: "",
        trim: true,
      },

      documentoReferencia: {
        type: String,
        default: "",
        trim: true,
      },

      fechaMovimiento: {
        type: Date,
        default: Date.now,
        index: true,
      },


      /* =====================================
         MOTIVO / OBSERVACIONES
      ===================================== */

      motivo: {
        type: String,
        default: "",
        trim: true,
      },

      observaciones: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         USUARIO
      ===================================== */

      usuario: {
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

movimientoInventarioSchema.index({
  producto: 1,
  fechaMovimiento: -1,
});

movimientoInventarioSchema.index({
  producto: 1,
  presentacionId: 1,
  fechaMovimiento: -1,
});

movimientoInventarioSchema.index({
  pedido: 1,
});

movimientoInventarioSchema.index({
  entrega: 1,
});


export default mongoose.model(
  "MovimientoInventario",
  movimientoInventarioSchema
);
