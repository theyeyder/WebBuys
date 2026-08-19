import mongoose from "mongoose";

const configuracionSchema = new mongoose.Schema(
  {
    /* EMPRESA */

    nombreComercial: {
      type: String,
      default: "",
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
  trim: true,
},

resolucionDIAN: {
  type: String,
  default: "",
  trim: true,
},

fechaResolucionDIAN: {
  type: Date,
  default: null,
},

vigenciaDesde: {
  type: Date,
  default: null,
},

vigenciaHasta: {
  type: Date,
  default: null,
},

rangoAutorizadoDesde: {
  type: Number,
  default: 1,
  min: 1,
},

rangoAutorizadoHasta: {
  type: Number,
  default: 999999,
  min: 1,
},

consecutivoActual: {
  type: Number,
  default: 1,
  min: 1,
},

iva: {
  type: Number,
  default: 19,
  min: 0,
  max: 100,
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

    /* RUTAS */

    consecutivoRuta: {
      type: Number,
      default: 0,
      min: 0,
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