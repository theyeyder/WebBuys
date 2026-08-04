import mongoose from "mongoose";

const configuracionSchema = new mongoose.Schema(
  {
    /* EMPRESA */

    nombreComercial: {
      type: String,
      default: "Lácteos Del Tolima S.A.S.",
    },

    razonSocial: {
      type: String,
      default: "",
    },

    nit: {
      type: String,
      default: "",
    },

    regimenTributario: {
      type: String,
      default: "",
    },

    direccion: {
      type: String,
      default: "",
    },

    ciudad: {
      type: String,
      default: "",
    },

    departamento: {
      type: String,
      default: "",
    },

    pais: {
      type: String,
      default: "Colombia",
    },

    telefono: {
      type: String,
      default: "",
    },

    celular: {
      type: String,
      default: "",
    },

    whatsapp: {
      type: String,
      default: "",
    },

    correo: {
      type: String,
      default: "",
    },

    paginaWeb: {
      type: String,
      default: "",
    },

    logo: {
      type: String,
      default: "",
    },

    /* FACTURACIÓN */

    prefijoFactura: {
      type: String,
      default: "FAC",
    },

    resolucionDIAN: {
      type: String,
      default: "",
    },

    consecutivoInicial: {
      type: Number,
      default: 1,
    },

    consecutivoActual: {
      type: Number,
      default: 1,
    },

    consecutivoFinal: {
      type: Number,
      default: 999999,
    },

    iva: {
      type: Number,
      default: 19,
    },

    /* IMPRESIÓN */

    piePaginaFactura: {
      type: String,
      default: "",
    },

    observacionesFactura: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model(
  "Configuracion",
  configuracionSchema
);