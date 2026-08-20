import mongoose from "mongoose";

const zonaDespachoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    descripcion: {
      type: String,
      default: "",
      trim: true,
    },

    estado: {
      type: String,
      enum: ["Activa", "Inactiva"],
      default: "Activa",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "ZonaDespacho",
  zonaDespachoSchema
);  