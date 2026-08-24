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

    zonasDespacho: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ZonaDespacho",
      },
    ],

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

// Índices para mejorar el rendimiento
// NOTA: codigo ya tiene unique: true en el esquema, no es necesario indexarlo nuevamente
rutaSchema.index({ nombre: 1 });
rutaSchema.index({ empleado: 1 });
rutaSchema.index({ estado: 1 });
rutaSchema.index({ zonasDespacho: 1 });

export default mongoose.model("Ruta", rutaSchema);