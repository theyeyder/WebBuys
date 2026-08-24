import Consecutivo from "../models/Consecutivo.js";

export async function generarConsecutivo(
  clave,
  prefijo,
  longitud = 4
) {
  const consecutivo =
    await Consecutivo.findOneAndUpdate(
      { clave },

      {
        $inc: {
          ultimoNumero: 1,
        },
      },

      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

  const numero = String(
    consecutivo.ultimoNumero
  ).padStart(
    longitud,
    "0"
  );

  return `${prefijo}-${numero}`;
}