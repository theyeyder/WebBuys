import mongoose from "mongoose";

const auditoriaSchema =
  new mongoose.Schema(
    {
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },

      codigoUsuario: {
        type: String,
        default: "",
        trim: true,
      },

      nombreUsuario: {
        type: String,
        default: "",
        trim: true,
      },

      modulo: {
        type: String,
        required: true,
        trim: true,
      },

      accion: {
        type: String,
        required: true,
        enum: [
          "CREAR",
          "ACTUALIZAR",
          "ELIMINAR",
          "ACTIVAR",
          "DESACTIVAR",
          "BLOQUEAR",
          "DESBLOQUEAR",
          "RESET_PASSWORD",
          "CAMBIAR_PASSWORD",
          "LOGIN",
          "LOGOUT",
        ],
      },

      registroId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      codigoRegistro: {
        type: String,
        default: "",
        trim: true,
      },

      descripcion: {
        type: String,
        default: "",
        trim: true,
      },

      datosAnteriores: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      datosNuevos: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },

      ip: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

auditoriaSchema.index({
  createdAt: -1,
});

auditoriaSchema.index({
  modulo: 1,
});

auditoriaSchema.index({
  accion: 1,
});

auditoriaSchema.index({
  usuario: 1,
});

export default mongoose.model(
  "Auditoria",
  auditoriaSchema
);