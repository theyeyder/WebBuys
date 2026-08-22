  import mongoose from "mongoose";

  const usuarioSchema = new mongoose.Schema(
    {
      nombres: {
        type: String,
        required: true,
        trim: true,
      },

      documento: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },

      apellidos: {
        type: String,
        required: true,
        trim: true,
      },

      usuario: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },

      password: {
        type: String,
        required: true,
        select: false,
      },

      rol: {
        type: String,
        enum: ["Administrador", "Empleado"],
        default: "Empleado",
        required: true,
      },

      estado: {
        type: String,
        enum: ["Activo", "Bloqueado"],
        default: "Activo",
      },

      debeCambiarPassword: {
        type: Boolean,
        default: false,
      },

      ultimoIngreso: {
        type: Date,
        default: null,
      },

      creadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );

  export default mongoose.model("Usuario", usuarioSchema);