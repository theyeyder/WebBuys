import mongoose from "mongoose";

const categoriaSchema =
  new mongoose.Schema(
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
        enum: [
          "Activa",
          "Inactiva",
        ],
        default: "Activa",
      },

      creadoPor: {
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


export default mongoose.model(
  "Categoria",
  categoriaSchema
);