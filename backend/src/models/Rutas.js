import mongoose from "mongoose";

const rutaSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    nombre: {
      type: String,
      required: true,
      trim: true,
    },

    descripcion: {
      type: String,
      default: "",
      trim: true,
    },

    empleado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",  
      default: null,
    },

    diasAtencion: {
      type: [String],
      default: [],
      enum: [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo",
      ],
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

export default mongoose.model("Ruta", rutaSchema);