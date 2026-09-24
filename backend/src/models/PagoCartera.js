import mongoose
  from "mongoose";


const pagoCarteraSchema =
  new mongoose.Schema(
    {
      cartera: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Cartera",
        required: true,
        index: true,
      },


      entrega: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Entrega",
        required: true,
      },


      pedido: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Pedido",
        required: true,
      },


      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        default: null,
      },


      caja: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Caja",
        required: true,
      },


      movimientoCaja: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "MovimientoCaja",
        default: null,
      },


      valor: {
        type: Number,
        required: true,
        min: 0.01,
      },


      metodoPago: {
        type: String,
        enum: [
          "Efectivo",
          "Transferencia",
        ],
        required: true,
      },


      referencia: {
        type: String,
        default: "",
        trim: true,
      },


      observacion: {
        type: String,
        default: "",
        trim: true,
      },


      fechaPago: {
        type: Date,
        default: Date.now,
        index: true,
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


pagoCarteraSchema.index({
  cartera: 1,
  fechaPago: -1,
});


pagoCarteraSchema.index({
  caja: 1,
  fechaPago: -1,
});


export default mongoose.model(
  "PagoCartera",
  pagoCarteraSchema
);
