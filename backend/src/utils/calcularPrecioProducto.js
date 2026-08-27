export function calcularPrecioProducto({
  precioVenta,
  reglasPrecio = [],
  cantidad,
}) {

  const cantidadNumero =
    Number(cantidad || 0);

  const precioNormal =
    Number(precioVenta || 0);


  if (
    !Array.isArray(reglasPrecio) ||
    reglasPrecio.length === 0
  ) {
    return precioNormal;
  }


  const reglasOrdenadas =
    [...reglasPrecio]
      .filter(
        (regla) =>
          Number(regla.desde) <=
          cantidadNumero
      )
      .sort(
        (a, b) =>
          Number(b.desde) -
          Number(a.desde)
      );


  if (
    reglasOrdenadas.length === 0
  ) {
    return precioNormal;
  }


  return Number(
    reglasOrdenadas[0].precio
  );
}