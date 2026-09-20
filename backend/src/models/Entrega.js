import mongoose from "mongoose";


const itemEntregaSchema =
  new mongoose.Schema(
    {
      pedidoItemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },

      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true,
      },

      codigoProducto: {
        type: String,
        default: "",
        trim: true,
      },

      nombre: {
        type: String,
        required: true,
        trim: true,
      },

      presentacionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },

      presentacionNombre: {
        type: String,
        default: "",
        trim: true,
      },

      tipoVenta: {
        type: String,
        enum: ["Unidad", "Peso"],
        required: true,
      },

      unidad: {
        type: String,
        default: "",
        trim: true,
      },

      cantidadSolicitada: {
        type: Number,
        required: true,

        validate: {
          validator(valor) {

            if (
              !Number.isFinite(valor) ||
              !Number.isInteger(valor)
            ) {
              return false;
            }

            return this.tipoVenta === "Peso"
              ? valor >= 0
              : valor >= 1;
          },

          message:
            "La cantidad solicitada debe ser válida. Los productos por peso permiten 0; los productos por unidad requieren mínimo 1.",
        },
      },

      precioUnitario: {
        type: Number,
        required: true,
        min: 0,
      },

      pesoReal: {
        type: Number,
        default: null,
        min: 0,
      },

      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      _id: true,
    }
  );


const entregaSchema =
  new mongoose.Schema(
    {
      pedido: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pedido",
        required: true,
        unique: true,
        index: true,
      },

      pedidoCodigo: {
        type: String,
        required: true,
        trim: true,
      },

      cliente: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cliente",
        default: null,
      },

      clienteCodigo: {
        type: String,
        default: "",
        trim: true,
      },

      clienteNombre: {
        type: String,
        default: "",
        trim: true,
      },

      clienteTelefono: {
        type: String,
        default: "",
        trim: true,
      },

      clienteDireccion: {
        type: String,
        default: "",
        trim: true,
      },

      clienteBarrio: {
        type: String,
        default: "",
        trim: true,
      },

      clienteCiudad: {
        type: String,
        default: "",
        trim: true,
      },

      zonaDespacho: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ZonaDespacho",
        default: null,
      },

      zonaDespachoNombre: {
        type: String,
        default: "",
        trim: true,
      },

      ruta: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ruta",
        default: null,
      },

      rutaNombre: {
        type: String,
        default: "",
        trim: true,
      },

      fechaProgramada: {
        type: Date,
        default: null,
      },

      empacador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empleado",
        default: null,
      },

      repartidor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Empleado",
        default: null,
      },

      items: {
        type: [itemEntregaSchema],
        default: [],
      },

      subtotal: {
        type: Number,
        default: 0,
        min: 0,
      },

      descuento: {
        type: Number,
        default: 0,
        min: 0,
      },

      total: {
        type: Number,
        default: 0,
        min: 0,
      },

      metodoPago: {
        type: String,
        enum: ["", "Efectivo", "Transferencia", "Crédito"],
        default: "",
      },

      confirmada: {
        type: Boolean,
        default: false,
        index: true,
      },

      preparacionGuardada: {
        type: Boolean,
        default: false,
      },

      fechaPreparacion: {
        type: Date,
        default: null,
      },

      fechaConfirmacion: {
        type: Date,
        default: null,
      },

      confirmadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },

      estado: {
        type: String,
        enum: [
          "Por preparar",
          "Pendiente",
          "En ruta",
          "Entregado",
          "Cancelado",

          /* Compatibilidad con registros anteriores */
          "Pendiente de entrega",
          "No entregado",
        ],
        default: "Por preparar",
        index: true,
      },

      motivoCancelacion: {
        type: String,
        default: "",
        trim: true,
      },

      motivoNoEntrega: {
        type: String,
        default: "",
        trim: true,
      },

      observaciones: {
        type: String,
        default: "",
        trim: true,
      },

      fechaSalida: {
        type: Date,
        default: null,
      },

      fechaEntregaReal: {
        type: Date,
        default: null,
      },

      actualizadoPor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );


entregaSchema.index({
  estado: 1,
  fechaProgramada: 1,
});


entregaSchema.index({
  repartidor: 1,
  estado: 1,
});


export default mongoose.model(
  "Entrega",
  entregaSchema
);
