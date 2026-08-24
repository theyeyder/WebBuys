import mongoose from "mongoose";

const consecutivoSchema =
  new mongoose.Schema(
    {
      clave: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      ultimoNumero: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

export default mongoose.model(
  "Consecutivo",
  consecutivoSchema
);