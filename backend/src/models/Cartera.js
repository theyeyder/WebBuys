import mongoose
  from "mongoose";


const carteraSchema =
  new mongoose.Schema(
    {
      codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },


      entrega: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Entrega",

        required: true,
        unique: true,
        index: true,
      },


      pedido: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Pedido",

        required: true,
        index: true,
      },


      pedidoCodigo: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
      },


      cliente: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Cliente",

        default: null,
        index: true,
      },


      clienteCodigo: {
        type: String,
        default: "",
        trim: true,
        uppercase: true,
      },


      clienteNombre: {
        type: String,
        default: "Cliente",
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


      fechaEntrega: {
        type: Date,
        default: Date.now,
      },


      fechaVencimiento: {
        type: Date,
        default: null,
      },


      valorOriginal: {
        type: Number,
        required: true,
        min: 0.01,
      },


      totalAbonado: {
        type: Number,
        default: 0,
        min: 0,
      },


      saldoPendiente: {
        type: Number,
        required: true,
        min: 0,
      },


      metodoPagoOriginal: {
        type: String,
        enum: ["Crédito"],
        default: "Crédito",
      },


      estado: {
        type: String,
        enum: [
          "Pendiente",
          "Abonada",
          "Pagada",
        ],
        default: "Pendiente",
        index: true,
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


      actualizadoPor: {
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


carteraSchema.index({
  estado: 1,
  fechaEntrega: -1,
});


carteraSchema.index({
  cliente: 1,
  estado: 1,
});


carteraSchema.index({
  pedidoCodigo: 1,
});


export default mongoose.model(
  "Cartera",
  carteraSchema
);
