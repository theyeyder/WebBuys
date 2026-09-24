import mongoose from "mongoose";


const movimientoCajaSchema =
  new mongoose.Schema(
    {
      caja: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Caja",
        required: true,
        index: true,
      },


      /*
        Pedido entregado = Ingreso comercial.

        IMPORTANTE:
        no todo Ingreso aumenta el efectivo físico.
        Transferencia y Crédito usan
        afectaEfectivo = false.
      */
      tipo: {
        type: String,
        enum: [
          "Ingreso",
          "Egreso",
        ],
        required: true,
      },


      origen: {
        type: String,

        /*
          Se mantienen los valores anteriores
          para no romper movimientos históricos.
        */
        enum: [
          "Manual",
          "Cartera",
          "Entrega",
          "Pedido",
          "Factura",
          "Anulación factura",
          "Ajuste",
        ],

        default: "Manual",
        required: true,
      },


      concepto: {
        type: String,
        required: true,
        trim: true,
      },


      valor: {
        type: Number,
        required: true,
        min: 0.01,
      },


      /* =====================================
         PEDIDO - REFERENCIA DE ORIGEN / COMPATIBILIDAD
      ===================================== */

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
        uppercase: true,
      },


      /* =====================================
         ENTREGA - FUENTE ACTUAL DE LA VENTA
      ===================================== */

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
        uppercase: true,
      },


      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cliente",

        default: null,
      },


      clienteNombre: {
        type: String,
        default: "",
        trim: true,
      },


      /* =====================================
         MÉTODO DE PAGO DEL PEDIDO
      ===================================== */

      metodoPago: {
        type: String,

        enum: [
          "",
          "Efectivo",
          "Transferencia",
          "Crédito",
        ],

        default: "",
      },


      /*
        Solo debe ser true para movimientos que
        modifican el dinero físico esperado.

        Pedido Efectivo    -> true
        Pedido Transferencia -> false
        Pedido Crédito       -> false
        Ingreso manual       -> true
        Egreso manual        -> true
      */
      afectaEfectivo: {
        type: Boolean,
        default: true,
      },


      /* =====================================
         CARTERA - ABONO DE VENTA A CRÉDITO
      ===================================== */

      cartera: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cartera",

        default: null,
      },


      pagoCartera: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "PagoCartera",

        default: null,
      },


      /* =====================================
         FACTURA - OPCIONAL
      ===================================== */

      factura: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Factura",

        default: null,
      },


      facturaCodigo: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },


      /* =====================================
         OBSERVACIÓN VISIBLE EN CAJA
      ===================================== */

      observacion: {
        type: String,
        default: "",
        trim: true,
      },


      /*
        Para pedidos se utilizará:
        PEDIDO:<pedidoId>

        Esto evita que un pedido entregado
        entre dos veces a Caja aunque luego
        se genere su factura.
      */
      claveUnica: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
      },


      usuario: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Usuario",

        default: null,
      },


      estado: {
        type: String,
        enum: [
          "Activo",
          "Anulado",
        ],
        default: "Activo",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );


movimientoCajaSchema.index({
  caja: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  pedido: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  entrega: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  factura: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  cartera: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  pagoCartera: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  metodoPago: 1,
  createdAt: -1,
});


movimientoCajaSchema.index({
  tipo: 1,
  createdAt: -1,
});


export default mongoose.model(
  "MovimientoCaja",
  movimientoCajaSchema
);
