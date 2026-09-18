import mongoose from "mongoose";

const empleadoSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    tipoDocumento: {
      type: String,
      enum: [
        "CC",
        "CE",
        "TI",
        "PPT",
        "PASAPORTE",
        "NIT",
      ],
      default: "CC",
      trim: true,
      uppercase: true,
    },

    documento: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    nombres: {
      type: String,
      required: true,
      trim: true,
    },

    apellidos: {
      type: String,
      required: true,
      trim: true,
    },

    telefono: {
      type: String,
      default: "",
      trim: true,
    },

    direccion: {
      type: String,
      default: "",
      trim: true,
    },

    ciudad: {
      type: String,
      default: "Ibagué",
      trim: true,
    },

    cargo: {
      type: String,
      required: true,
      trim: true,
    },

    fechaIngreso: {
      type: Date,
      default: Date.now,
    },

    salario: {
      type: Number,
      default: 0,
      min: 0,
    },

    rutaAsignada: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ruta",
      default: null,
    },

    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      default: null,
    },

    estado: {
      type: String,
      enum: [
        "Activo",
        "Inactivo",
      ],
      default: "Activo",
    },

    observaciones: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);


/* =========================================================
   NOMBRE COMPLETO
========================================================= */

empleadoSchema.virtual(
  "nombreCompleto"
).get(function () {

  return [
    this.nombres,
    this.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

});


/* =========================================================
   ÍNDICES
========================================================= */

empleadoSchema.index({
  nombres: 1,
  apellidos: 1,
});

empleadoSchema.index({
  cargo: 1,
  estado: 1,
});

empleadoSchema.index({
  rutaAsignada: 1,
});

empleadoSchema.index({
  usuario: 1,
});


export default mongoose.model(
  "Empleado",
  empleadoSchema
);
