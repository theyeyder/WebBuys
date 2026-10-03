import "dotenv/config";

import mongoose
  from "mongoose";

import {
  connectDB,
} from "../config/db.js";

import Producto
  from "../models/Producto.js";

import {
  registrarStockInicialExistente,
} from "../services/inventario.service.js";


/* =========================================
   MIGRACIÓN DE INVENTARIO INICIAL

   Ejecutar UNA VEZ después de instalar esta
   mejora. El script es idempotente, por lo que
   si se ejecuta otra vez no duplica movimientos.
========================================= */

async function ejecutar() {

  await connectDB();


  const productos =
    await Producto.find();


  const resumen = {
    productosRevisados: 0,
    presentacionesRevisadas: 0,
    movimientosInicialesCreados: 0,
    costosPromedioCorregidos: 0,
    omitidos: 0,
  };


  for (
    const producto
    of productos
  ) {

    resumen.productosRevisados +=
      1;


    const principal =
      await registrarStockInicialExistente({
        productoId:
          producto._id,
      });


    if (
      principal.movimientoCreado
    ) {
      resumen.movimientosInicialesCreados +=
        1;
    } else {
      resumen.omitidos +=
        1;
    }


    if (
      principal.costoActualizado
    ) {
      resumen.costosPromedioCorregidos +=
        1;
    }


    for (
      const presentacion
      of producto.presentacionesAdicionales ||
      []
    ) {

      resumen.presentacionesRevisadas +=
        1;


      const resultado =
        await registrarStockInicialExistente({
          productoId:
            producto._id,
          presentacionId:
            presentacion._id,
        });


      if (
        resultado.movimientoCreado
      ) {
        resumen.movimientosInicialesCreados +=
          1;
      } else {
        resumen.omitidos +=
          1;
      }


      if (
        resultado.costoActualizado
      ) {
        resumen.costosPromedioCorregidos +=
          1;
      }

    }

  }


  console.log(
    "\nMigración de inventario inicial finalizada."
  );

  console.table(
    resumen
  );

}


ejecutar()
  .catch(
    (error) => {
      console.error(
        "Error en la migración de inventario inicial:",
        error
      );
      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await mongoose.connection.close();
    }
  );
