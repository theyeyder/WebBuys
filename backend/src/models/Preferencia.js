import mongoose from "mongoose";

const preferenciaSchema =
  new mongoose.Schema(
    {
      moneda: {
        type: String,
        enum: ["COP", "USD", "EUR"],
        default: "COP",
      },

      simboloMoneda: {
        type: String,
        default: "$",
        trim: true,
      },

      decimales: {
        type: Number,
        enum: [0, 2],
        default: 0,
      },

      formatoFecha: {
        type: String,
        enum: [
          "DD/MM/YYYY",
          "YYYY-MM-DD",
          "MM/DD/YYYY",
        ],
        default: "DD/MM/YYYY",
      },

      permitirInventarioNegativo: {
        type: Boolean,
        default: false,
      },

      confirmarAntesEliminar: {
        type: Boolean,
        default: true,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Preferencia",
  preferenciaSchema
);