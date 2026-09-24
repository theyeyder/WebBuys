import mongoose from "mongoose";


const cajaSchema =
  new mongoose.Schema(
    {
      codigo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
      },


      fechaApertura: {
        type: Date,
        default: Date.now,
        required: true,
      },


      fechaCierre: {
        type: Date,
        default: null,
      },


      saldoInicial: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },


      /* =====================================
         RESUMEN DE VENTAS ENTREGADAS
         Se consolida al cerrar la caja.
      ===================================== */

      cantidadPedidosEntregados: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalVentasEntregadas: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalEfectivoPedidos: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalTransferencias: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalCredito: {
        type: Number,
        default: 0,
        min: 0,
      },


      /* =====================================
         MOVIMIENTOS DE EFECTIVO
      ===================================== */

      /*
        totalIngresos conserva compatibilidad
        con la Caja anterior.

        En la nueva lógica representa ingresos
        que realmente afectan el efectivo:
        - pedidos pagados en efectivo
        - ingresos manuales
      */
      totalIngresos: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalIngresosManuales: {
        type: Number,
        default: 0,
        min: 0,
      },


      totalEgresos: {
        type: Number,
        default: 0,
        min: 0,
      },


      saldoEsperado: {
        type: Number,
        default: 0,
        min: 0,
      },


      efectivoContado: {
        type: Number,
        default: null,
        min: 0,
      },


      /* =====================================
         CONTEO DE BILLETES AL CIERRE
      ===================================== */

      conteoBilletes: {

        dosMil: {
          type: Number,
          default: 0,
          min: 0,
        },

        cincoMil: {
          type: Number,
          default: 0,
          min: 0,
        },

        diezMil: {
          type: Number,
          default: 0,
          min: 0,
        },

        veinteMil: {
          type: Number,
          default: 0,
          min: 0,
        },

        cincuentaMil: {
          type: Number,
          default: 0,
          min: 0,
        },

        cienMil: {
          type: Number,
          default: 0,
          min: 0,
        },

      },


      diferencia: {
        type: Number,
        default: null,
      },


      estado: {
        type: String,
        enum: [
          "Abierta",
          "Cerrada",
        ],
        default: "Abierta",
        required: true,
      },


      observacionesApertura: {
        type: String,
        default: "",
        trim: true,
      },


      observacionesCierre: {
        type: String,
        default: "",
        trim: true,
      },


      abiertoPor: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },


      cerradoPor: {
        type:
          mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null,
      },
    },
    {
      timestamps: true,
      versionKey: false,
    }
  );


cajaSchema.index({
  createdAt: -1,
});


/*
  Solo puede existir UNA caja abierta.
  Las cajas cerradas no participan en este índice.
*/
cajaSchema.index(
  {
    estado: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      estado: "Abierta",
    },
  }
);


export default mongoose.model(
  "Caja",
  cajaSchema
);
