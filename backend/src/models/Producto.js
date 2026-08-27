import mongoose from "mongoose";


/* =========================================
   REGLA DE PRECIO POR CANTIDAD
========================================= */

const reglaPrecioSchema =
  new mongoose.Schema(
    {
      desde: {
        type: Number,
        required: true,
        min: 0,
      },

      precio: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: true,
    }
  );


/* =========================================
   PRESENTACIÓN ADICIONAL
   OPCIONAL
========================================= */

const presentacionAdicionalSchema =
  new mongoose.Schema(
    {
      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      tipoVenta: {
        type: String,

        enum: [
          "Unidad",
          "Peso",
        ],

        default: "Unidad",
      },

      unidad: {
        type: String,
        required: true,
        trim: true,
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

      reglasPrecio: {
        type: [
          reglaPrecioSchema
        ],

        default: [],
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


      /* =====================================
         FORMA PRINCIPAL DE VENTA
      ===================================== */

      tipoVenta: {
        type: String,

        enum: [
          "Unidad",
          "Peso",
        ],

        default: "Unidad",
      },

      unidad: {
        type: String,
        required: true,
        trim: true,
        default: "Unidad",
      },


      /* =====================================
         PRECIOS
      ===================================== */

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


      /* =====================================
         INVENTARIO
      ===================================== */

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


      /* =====================================
         PRECIO AUTOMÁTICO POR CANTIDAD
      ===================================== */

      reglasPrecio: {
        type: [
          reglaPrecioSchema
        ],

        default: [],
      },


      /* =====================================
         PRESENTACIONES ESPECIALES
         OPCIONALES
      ===================================== */

      presentacionesAdicionales: {
        type: [
          presentacionAdicionalSchema
        ],

        default: [],
      },


      /* =====================================
         SABORES / VARIANTES
      ===================================== */

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


productoSchema.index({
  categoria: 1,
  nombre: 1,
});


export default mongoose.model(
  "Producto",
  productoSchema
);