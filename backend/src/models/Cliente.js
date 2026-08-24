import mongoose from "mongoose";

const clienteSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },

    tipoDocumento: {
      type: String,
      enum: ["CC", "NIT"],
      default: "CC",
      required: true,
    },

    documento: {
      type: String,
      required: true,
      unique: true,
    },

    nombre: {
      type: String,
      required: true,
    },

    razonSocial: {
      type: String,
      default: "",
    },

    telefono: {
      type: String,
      default: "",
    },

    direccion: {
      type: String,
      default: "",
    },

    barrio: {
      type: String,
      default: "",
    },

    // Zona utilizada para organizar los despachos
    zonaDespacho: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ZonaDespacho",
      default: null,
    },

    ciudad: {
      type: String,
      default: "",
    },

    tipoCliente: {
      type: String,
      enum: [
        "Tienda",
        "Restaurante",
        "Supermercado",
        "Persona Natural",
        "Otro",
      ],
      default: "Tienda",
    },

    estado: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Cliente",
  clienteSchema
);