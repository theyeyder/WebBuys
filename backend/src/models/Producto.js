import mongoose from "mongoose";


/* =========================================
   PRESENTACIONES
========================================= */

const presentacionSchema =
  new mongoose.Schema(
    {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      unidad: {
        type: String,
        required: true,
        trim: true,
        default: "Unidad",
      },

      precioCompra: {
        type: Number,
        default: 0,
        min: 0,
      },

      precioVenta: {
        type: Number,
        required: true,
        min: 0,
      },

      stock: {
        type: Number,
        default: 0,
        min: 0,
      },

      stockMinimo: {
        type: Number,
        default: 0,
        min: 0,
      },

      estado: {
        type: String,
        enum: [
          "Activa",
          "Inactiva",
        ],
        default: "Activa",
      },
    },
    {
      _id: true,
    }
  );


/* =========================================
   PRODUCTO
========================================= */

const productoSchema =
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
        trim: true,
      },

      categoria: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Categoria",

        required: true,
      },

      marca: {
        type: String,
        default: "",
        trim: true,
      },

      descripcion: {
        type: String,
        default: "",
        trim: true,
      },

      presentaciones: {
        type: [
          presentacionSchema
        ],

        default: [],
      },

      sabores: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],

        default: [],
      },

      imagen: {
        type: String,
        default: "",
      },

      estado: {
        type: String,

        enum: [
          "Activo",
          "Inactivo",
        ],

        default: "Activo",
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


/* =========================================
   ÍNDICES
========================================= */

productoSchema.index({
  categoria: 1,
  nombre: 1,
});


export default mongoose.model(
  "Producto",
  productoSchema
);