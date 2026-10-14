import {
  prisma,
} from "../config/postgresql.js";


const ZONA_NEGOCIO =
  "America/Bogota";


function numero(
  valor,
  fallback = 0
) {
  const n = Number(valor);
  return Number.isFinite(n)
    ? n
    : fallback;
}


function redondear(
  valor,
  decimales = 4
) {
  return Number(
    numero(valor)
      .toFixed(decimales)
  );
}


function periodoValido(
  anio,
  mes
) {
  const a = Number(anio);
  const m = Number(mes);

  if (
    !Number.isInteger(a) ||
    a < 2000 ||
    a > 2200 ||
    !Number.isInteger(m) ||
    m < 1 ||
    m > 12
  ) {
    throw new Error(
      "El período de inventario no es válido."
    );
  }

  return {
    anio: a,
    mes: m,
    periodo:
      `${a}-${String(m).padStart(2, "0")}`,
  };
}


function limitesPeriodo(
  anio,
  mes
) {
  const valido =
    periodoValido(
      anio,
      mes
    );

  const inicio =
    new Date(
      Date.UTC(
        valido.anio,
        valido.mes - 1,
        1
      )
    );

  const finExclusivo =
    new Date(
      Date.UTC(
        valido.anio,
        valido.mes,
        1
      )
    );

  const fin =
    new Date(
      Date.UTC(
        valido.anio,
        valido.mes,
        0
      )
    );

  return {
    ...valido,
    inicio,
    fin,
    finExclusivo,
  };
}


function partesFechaNegocio(
  fecha = new Date()
) {
  const partes =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          ZONA_NEGOCIO,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    )
      .formatToParts(fecha)
      .reduce(
        (acc, parte) => {
          if (
            [
              "year",
              "month",
              "day",
            ].includes(
              parte.type
            )
          ) {
            acc[parte.type] =
              parte.value;
          }

          return acc;
        },
        {}
      );

  return {
    anio:
      Number(partes.year),
    mes:
      Number(partes.month),
    dia:
      Number(partes.day),
    periodo:
      `${partes.year}-${partes.month}`,
  };
}


function periodoDesdeFecha(
  valor
) {
  if (
    typeof valor ===
      "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(
      valor
    )
  ) {
    return valor.slice(
      0,
      7
    );
  }

  const fecha =
    valor instanceof Date
      ? valor
      : valor
        ? new Date(valor)
        : new Date();

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    throw new Error(
      "La fecha del movimiento no es válida."
    );
  }

  return partesFechaNegocio(
    fecha
  ).periodo;
}


function claveObjetivo(
  productoId,
  presentacionId = null
) {
  return `${productoId}:${presentacionId || ""}`;
}


function construirObjetivos(
  productos
) {
  const filas = [];

  for (
    const producto
    of productos
  ) {
    filas.push({
      productoId:
        producto.id,
      presentacionId:
        null,
      codigo:
        producto.codigo || "",
      producto:
        producto.nombre || "",
      presentacion:
        "",
      marca:
        producto.marca || "",
      categoria:
        producto.categoria?.nombre || "",
      tipoVenta:
        producto.tipoVenta || "Unidad",
      unidad:
        producto.unidad || "",
      controlInventario:
        producto.controlInventario !== false,
      createdAt:
        producto.createdAt,
      stockActual:
        redondear(
          producto.stock
        ),
      reservadoActual:
        redondear(
          producto.stockReservado
        ),
      costoPromedioActual:
        redondear(
          producto.costoPromedio ||
          producto.precioCompra
        ),
    });

    for (
      const presentacion
      of (
        producto.presentaciones ||
        []
      )
    ) {
      filas.push({
        productoId:
          producto.id,
        presentacionId:
          presentacion.id,
        codigo:
          producto.codigo || "",
        producto:
          producto.nombre || "",
        presentacion:
          presentacion.nombre || "",
        marca:
          producto.marca || "",
        categoria:
          producto.categoria?.nombre || "",
        tipoVenta:
          presentacion.tipoVenta ||
          producto.tipoVenta ||
          "Unidad",
        unidad:
          presentacion.unidad ||
          producto.unidad ||
          "",
        controlInventario:
          presentacion.controlInventario !== false,
        createdAt:
          presentacion.createdAt,
        stockActual:
          redondear(
            presentacion.stock
          ),
        reservadoActual:
          redondear(
            presentacion.stockReservado
          ),
        costoPromedioActual:
          redondear(
            presentacion.costoPromedio ||
            presentacion.precioCompra
          ),
      });
    }
  }

  return filas;
}


function mapaPrimeroPorClave(
  movimientos
) {
  const mapa =
    new Map();

  for (
    const movimiento
    of movimientos
  ) {
    const clave =
      claveObjetivo(
        movimiento.productoId,
        movimiento.presentacionId
      );

    if (
      !mapa.has(clave)
    ) {
      mapa.set(
        clave,
        movimiento
      );
    }
  }

  return mapa;
}


function agruparMovimientosPeriodo(
  movimientos
) {
  const mapa =
    new Map();

  for (
    const movimiento
    of movimientos
  ) {
    const clave =
      claveObjetivo(
        movimiento.productoId,
        movimiento.presentacionId
      );

    if (
      !mapa.has(clave)
    ) {
      mapa.set(
        clave,
        []
      );
    }

    mapa.get(clave)
      .push(movimiento);
  }

  return mapa;
}


function normalizarDetalle(
  detalle
) {
  return {
    id:
      detalle.id,
    cierreId:
      detalle.cierreId,
    productoId:
      detalle.productoId,
    presentacionId:
      detalle.presentacionId,
    codigo:
      detalle.codigo,
    producto:
      detalle.producto,
    presentacion:
      detalle.presentacion,
    marca:
      detalle.marca,
    categoria:
      detalle.categoria,
    tipoVenta:
      detalle.tipoVenta,
    unidad:
      detalle.unidad,
    controlInventario:
      detalle.controlInventario,
    stockInicial:
      numero(
        detalle.stockInicial
      ),
    reservadoInicial:
      numero(
        detalle.reservadoInicial
      ),
    entradas:
      numero(
        detalle.entradas
      ),
    entregas:
      numero(
        detalle.entregas
      ),
    reversiones:
      numero(
        detalle.reversiones
      ),
    vendidoNeto:
      numero(
        detalle.vendidoNeto
      ),
    otrasSalidas:
      numero(
        detalle.otrasSalidas
      ),
    ajustesPositivos:
      numero(
        detalle.ajustesPositivos
      ),
    ajustesNegativos:
      numero(
        detalle.ajustesNegativos
      ),
    stockFinal:
      numero(
        detalle.stockFinal
      ),
    reservadoFinal:
      numero(
        detalle.reservadoFinal
      ),
    costoPromedioInicial:
      numero(
        detalle.costoPromedioInicial
      ),
    costoPromedioFinal:
      numero(
        detalle.costoPromedioFinal
      ),
    valorInventarioInicial:
      numero(
        detalle.valorInventarioInicial
      ),
    valorInventarioFinal:
      numero(
        detalle.valorInventarioFinal
      ),
  };
}


function normalizarCierre(
  cierre,
  incluirDetalles = true
) {
  if (!cierre) {
    return null;
  }

  return {
    id:
      cierre.id,
    periodo:
      cierre.periodo,
    anio:
      cierre.anio,
    mes:
      cierre.mes,
    fechaInicio:
      cierre.fechaInicio,
    fechaFin:
      cierre.fechaFin,
    fechaCierre:
      cierre.fechaCierre,
    estado:
      cierre.estado,
    cerradoPorId:
      cierre.cerradoPorId,
    cerradoPorNombre:
      cierre.cerradoPorNombre,
    totalRegistros:
      cierre.totalRegistros,
    totalProductos:
      cierre.totalProductos,
    totalEntradas:
      numero(
        cierre.totalEntradas
      ),
    totalEntregas:
      numero(
        cierre.totalEntregas
      ),
    totalReversiones:
      numero(
        cierre.totalReversiones
      ),
    totalVendidoNeto:
      numero(
        cierre.totalVendidoNeto
      ),
    totalOtrasSalidas:
      numero(
        cierre.totalOtrasSalidas
      ),
    totalAjustesPositivos:
      numero(
        cierre.totalAjustesPositivos
      ),
    totalAjustesNegativos:
      numero(
        cierre.totalAjustesNegativos
      ),
    valorInventarioInicial:
      numero(
        cierre.valorInventarioInicial
      ),
    valorInventarioFinal:
      numero(
        cierre.valorInventarioFinal
      ),
    observaciones:
      cierre.observaciones || "",
    createdAt:
      cierre.createdAt,
    updatedAt:
      cierre.updatedAt,
    detalles:
      incluirDetalles
        ? (
            cierre.detalles ||
            []
          ).map(
            normalizarDetalle
          )
        : undefined,
  };
}


async function construirResumenPeriodo(
  db,
  anio,
  mes
) {
  const limites =
    limitesPeriodo(
      anio,
      mes
    );

  const productos =
    await db.producto.findMany({
      include: {
        categoria: true,
        presentaciones: {
          orderBy: {
            orden: "asc",
          },
        },
      },
      orderBy: [
        {
          nombre: "asc",
        },
        {
          codigo: "asc",
        },
      ],
    });

  const objetivos =
    construirObjetivos(
      productos
    ).filter(
      (objetivo) =>
        !objetivo.createdAt ||
        new Date(
          objetivo.createdAt
        ) < limites.finExclusivo
    );

  const [
    movimientosPeriodo,
    anteriores,
    posteriores,
  ] = await Promise.all([
    db.movimientoInventario.findMany({
      where: {
        fechaMovimiento: {
          gte:
            limites.inicio,
          lt:
            limites.finExclusivo,
        },
      },
      orderBy: [
        {
          fechaMovimiento:
            "asc",
        },
        {
          createdAt:
            "asc",
        },
      ],
    }),

    db.$queryRaw`
      SELECT DISTINCT ON (
        "productoId",
        COALESCE("presentacionId"::text, '')
      )
        "productoId",
        "presentacionId",
        "stockNuevo",
        "reservadoNuevo",
        "costoPromedioNuevo",
        "fechaMovimiento",
        "createdAt"
      FROM "movimientos_inventario"
      WHERE "fechaMovimiento" < ${limites.inicio}
      ORDER BY
        "productoId",
        COALESCE("presentacionId"::text, ''),
        "fechaMovimiento" DESC,
        "createdAt" DESC
    `,

    db.$queryRaw`
      SELECT DISTINCT ON (
        "productoId",
        COALESCE("presentacionId"::text, '')
      )
        "productoId",
        "presentacionId",
        "stockAnterior",
        "reservadoAnterior",
        "costoPromedioAnterior",
        "fechaMovimiento",
        "createdAt"
      FROM "movimientos_inventario"
      WHERE "fechaMovimiento" >= ${limites.finExclusivo}
      ORDER BY
        "productoId",
        COALESCE("presentacionId"::text, ''),
        "fechaMovimiento" ASC,
        "createdAt" ASC
    `,
  ]);

  const porPeriodo =
    agruparMovimientosPeriodo(
      movimientosPeriodo
    );

  const mapaAnteriores =
    mapaPrimeroPorClave(
      anteriores
    );

  const mapaPosteriores =
    mapaPrimeroPorClave(
      posteriores
    );

  const detalles =
    objetivos.map(
      (objetivo) => {
        const clave =
          claveObjetivo(
            objetivo.productoId,
            objetivo.presentacionId
          );

        const movimientos =
          porPeriodo.get(clave) ||
          [];

        const primero =
          movimientos[0] ||
          null;

        const ultimo =
          movimientos[
            movimientos.length - 1
          ] ||
          null;

        const anterior =
          mapaAnteriores.get(
            clave
          ) ||
          null;

        const posterior =
          mapaPosteriores.get(
            clave
          ) ||
          null;

        const creadoDurantePeriodo =
          objetivo.createdAt &&
          new Date(
            objetivo.createdAt
          ) >= limites.inicio;

        const stockInicial =
          redondear(
            creadoDurantePeriodo
              ? 0
              : primero
                ? primero.stockAnterior
                : anterior
                  ? anterior.stockNuevo
                  : posterior
                    ? posterior.stockAnterior
                    : objetivo.stockActual
          );

        const reservadoInicial =
          redondear(
            creadoDurantePeriodo
              ? 0
              : primero
                ? primero.reservadoAnterior
                : anterior
                  ? anterior.reservadoNuevo
                  : posterior
                    ? posterior.reservadoAnterior
                    : objetivo.reservadoActual
          );

        const costoPromedioInicial =
          redondear(
            creadoDurantePeriodo
              ? 0
              : primero
                ? primero.costoPromedioAnterior
                : anterior
                  ? anterior.costoPromedioNuevo
                  : posterior
                    ? posterior.costoPromedioAnterior
                    : objetivo.costoPromedioActual
          );

        const stockFinal =
          redondear(
            ultimo
              ? ultimo.stockNuevo
              : anterior
                ? anterior.stockNuevo
                : posterior
                  ? posterior.stockAnterior
                  : objetivo.stockActual
          );

        const reservadoFinal =
          redondear(
            ultimo
              ? ultimo.reservadoNuevo
              : anterior
                ? anterior.reservadoNuevo
                : posterior
                  ? posterior.reservadoAnterior
                  : objetivo.reservadoActual
          );

        const costoPromedioFinal =
          redondear(
            ultimo
              ? ultimo.costoPromedioNuevo
              : anterior
                ? anterior.costoPromedioNuevo
                : posterior
                  ? posterior.costoPromedioAnterior
                  : objetivo.costoPromedioActual
          );

        const entradaInicialCreacion =
          creadoDurantePeriodo
            ? redondear(
                primero
                  ? primero.stockAnterior
                  : posterior
                    ? posterior.stockAnterior
                    : objetivo.stockActual
              )
            : 0;

        let entradas =
          entradaInicialCreacion;
        let entregas = 0;
        let reversiones = 0;
        let otrasSalidas = 0;
        let ajustesPositivos = 0;
        let ajustesNegativos = 0;

        for (
          const movimiento
          of movimientos
        ) {
          const cantidad =
            numero(
              movimiento.cantidad
            );

          const tipo =
            String(
              movimiento.tipo ||
              ""
            )
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              )
              .trim()
              .toUpperCase();

          const esMovimientoEntrega =
            Boolean(
              movimiento.entregaId
            ) ||
            String(
              movimiento.origen ||
              ""
            )
              .toLowerCase()
              .includes(
                "entrega"
              ) ||
            String(
              movimiento.motivo ||
              ""
            )
              .toLowerCase()
              .includes(
                "entrega"
              );

          switch (tipo) {
            case "ENTRADA":
              entradas +=
                cantidad;
              break;

            case "ENTREGA":
              entregas +=
                cantidad;
              break;

            case "SALIDA":
              if (
                esMovimientoEntrega
              ) {
                entregas +=
                  cantidad;
              } else {
                otrasSalidas +=
                  cantidad;
              }
              break;

            case "REVERSION_ENTREGA":
            case "REVERSION":
              if (
                esMovimientoEntrega ||
                tipo ===
                  "REVERSION_ENTREGA"
              ) {
                reversiones +=
                  cantidad;
              }
              break;

            case "AJUSTE_POSITIVO":
              ajustesPositivos +=
                cantidad;
              break;

            case "AJUSTE_NEGATIVO":
              ajustesNegativos +=
                cantidad;
              break;

            default:
              break;
          }
        }

        entradas =
          redondear(entradas);
        entregas =
          redondear(entregas);
        reversiones =
          redondear(reversiones);
        otrasSalidas =
          redondear(otrasSalidas);
        ajustesPositivos =
          redondear(
            ajustesPositivos
          );
        ajustesNegativos =
          redondear(
            ajustesNegativos
          );

        const vendidoNeto =
          redondear(
            entregas -
            reversiones
          );

        return {
          productoId:
            objetivo.productoId,
          presentacionId:
            objetivo.presentacionId,
          codigo:
            objetivo.codigo,
          producto:
            objetivo.producto,
          presentacion:
            objetivo.presentacion,
          marca:
            objetivo.marca,
          categoria:
            objetivo.categoria,
          tipoVenta:
            objetivo.tipoVenta,
          unidad:
            objetivo.unidad,
          controlInventario:
            objetivo.controlInventario,
          stockInicial,
          reservadoInicial,
          entradas,
          entregas,
          reversiones,
          vendidoNeto,
          otrasSalidas,
          ajustesPositivos,
          ajustesNegativos,
          stockFinal,
          reservadoFinal,
          costoPromedioInicial,
          costoPromedioFinal,
          valorInventarioInicial:
            redondear(
              stockInicial *
              costoPromedioInicial,
              2
            ),
          valorInventarioFinal:
            redondear(
              stockFinal *
              costoPromedioFinal,
              2
            ),
        };
      }
    );

  const sumar =
    (campo, decimales = 4) =>
      redondear(
        detalles.reduce(
          (total, detalle) =>
            total +
            numero(
              detalle[campo]
            ),
          0
        ),
        decimales
      );

  return {
    id: null,
    periodo:
      limites.periodo,
    anio:
      limites.anio,
    mes:
      limites.mes,
    fechaInicio:
      limites.inicio,
    fechaFin:
      limites.fin,
    fechaCierre: null,
    estado: "ABIERTO",
    cerradoPorId: null,
    cerradoPorNombre: "",
    totalRegistros:
      detalles.length,
    totalProductos:
      new Set(
        detalles.map(
          (detalle) =>
            detalle.productoId
        )
      ).size,
    totalEntradas:
      sumar("entradas"),
    totalEntregas:
      sumar("entregas"),
    totalReversiones:
      sumar("reversiones"),
    totalVendidoNeto:
      sumar("vendidoNeto"),
    totalOtrasSalidas:
      sumar("otrasSalidas"),
    totalAjustesPositivos:
      sumar(
        "ajustesPositivos"
      ),
    totalAjustesNegativos:
      sumar(
        "ajustesNegativos"
      ),
    valorInventarioInicial:
      sumar(
        "valorInventarioInicial",
        2
      ),
    valorInventarioFinal:
      sumar(
        "valorInventarioFinal",
        2
      ),
    observaciones: "",
    detalles,
  };
}


export async function validarPeriodoInventarioAbierto(
  fechaMovimiento = null
) {
  const periodo =
    periodoDesdeFecha(
      fechaMovimiento ||
      new Date()
    );

  const cierre =
    await prisma.cierreInventario.findUnique({
      where: {
        periodo,
      },
      select: {
        estado: true,
      },
    });

  if (
    cierre?.estado ===
    "CERRADO"
  ) {
    throw new Error(
      `El inventario de ${periodo} ya está cerrado. Registra la corrección en un período abierto.`
    );
  }

  return true;
}


export async function obtenerResumenMensualInventario(
  anio,
  mes
) {
  const limites =
    limitesPeriodo(
      anio,
      mes
    );

  const cierre =
    await prisma.cierreInventario.findUnique({
      where: {
        periodo:
          limites.periodo,
      },
      include: {
        detalles: {
          orderBy: [
            {
              producto: "asc",
            },
            {
              presentacion:
                "asc",
            },
          ],
        },
      },
    });

  if (
    cierre?.estado ===
    "CERRADO"
  ) {
    return normalizarCierre(
      cierre,
      true
    );
  }

  return construirResumenPeriodo(
    prisma,
    limites.anio,
    limites.mes
  );
}


export async function listarCierresMensualesInventario() {
  const cierres =
    await prisma.cierreInventario.findMany({
      orderBy: [
        {
          anio: "desc",
        },
        {
          mes: "desc",
        },
      ],
    });

  return cierres.map(
    (cierre) =>
      normalizarCierre(
        cierre,
        false
      )
  );
}


export async function cerrarMesInventario({
  anio,
  mes,
  usuarioId = null,
  usuarioNombre = "",
  observaciones = "",
}) {
  const limites =
    limitesPeriodo(
      anio,
      mes
    );

  const actual =
    partesFechaNegocio(
      new Date()
    );

  const periodoActualNumero =
    actual.anio * 100 +
    actual.mes;

  const periodoCerrarNumero =
    limites.anio * 100 +
    limites.mes;

  if (
    periodoCerrarNumero >=
    periodoActualNumero
  ) {
    throw new Error(
      "El mes todavía está en curso. Solo se pueden cerrar períodos ya finalizados."
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const existente =
        await tx.cierreInventario.findUnique({
          where: {
            periodo:
              limites.periodo,
          },
          include: {
            detalles: true,
          },
        });

      if (
        existente?.estado ===
        "CERRADO"
      ) {
        return normalizarCierre(
          existente,
          true
        );
      }

      const resumen =
        await construirResumenPeriodo(
          tx,
          limites.anio,
          limites.mes
        );

      const cierre =
        await tx.cierreInventario.create({
          data: {
            periodo:
              resumen.periodo,
            anio:
              resumen.anio,
            mes:
              resumen.mes,
            fechaInicio:
              resumen.fechaInicio,
            fechaFin:
              resumen.fechaFin,
            fechaCierre:
              new Date(),
            estado:
              "CERRADO",
            cerradoPorId:
              usuarioId ||
              null,
            cerradoPorNombre:
              String(
                usuarioNombre ||
                ""
              ),
            totalRegistros:
              resumen.totalRegistros,
            totalProductos:
              resumen.totalProductos,
            totalEntradas:
              resumen.totalEntradas,
            totalEntregas:
              resumen.totalEntregas,
            totalReversiones:
              resumen.totalReversiones,
            totalVendidoNeto:
              resumen.totalVendidoNeto,
            totalOtrasSalidas:
              resumen.totalOtrasSalidas,
            totalAjustesPositivos:
              resumen.totalAjustesPositivos,
            totalAjustesNegativos:
              resumen.totalAjustesNegativos,
            valorInventarioInicial:
              resumen.valorInventarioInicial,
            valorInventarioFinal:
              resumen.valorInventarioFinal,
            observaciones:
              String(
                observaciones ||
                ""
              ).trim(),
            detalles: {
              create:
                resumen.detalles.map(
                  (detalle) => ({
                    productoId:
                      detalle.productoId,
                    presentacionId:
                      detalle.presentacionId,
                    codigo:
                      detalle.codigo,
                    producto:
                      detalle.producto,
                    presentacion:
                      detalle.presentacion,
                    marca:
                      detalle.marca,
                    categoria:
                      detalle.categoria,
                    tipoVenta:
                      detalle.tipoVenta,
                    unidad:
                      detalle.unidad,
                    controlInventario:
                      detalle.controlInventario,
                    stockInicial:
                      detalle.stockInicial,
                    reservadoInicial:
                      detalle.reservadoInicial,
                    entradas:
                      detalle.entradas,
                    entregas:
                      detalle.entregas,
                    reversiones:
                      detalle.reversiones,
                    vendidoNeto:
                      detalle.vendidoNeto,
                    otrasSalidas:
                      detalle.otrasSalidas,
                    ajustesPositivos:
                      detalle.ajustesPositivos,
                    ajustesNegativos:
                      detalle.ajustesNegativos,
                    stockFinal:
                      detalle.stockFinal,
                    reservadoFinal:
                      detalle.reservadoFinal,
                    costoPromedioInicial:
                      detalle.costoPromedioInicial,
                    costoPromedioFinal:
                      detalle.costoPromedioFinal,
                    valorInventarioInicial:
                      detalle.valorInventarioInicial,
                    valorInventarioFinal:
                      detalle.valorInventarioFinal,
                  })
                ),
            },
          },
          include: {
            detalles: {
              orderBy: [
                {
                  producto: "asc",
                },
                {
                  presentacion:
                    "asc",
                },
              ],
            },
          },
        });

      return normalizarCierre(
        cierre,
        true
      );
    },
    {
      isolationLevel:
        "Serializable",
      maxWait:
        5000,
      timeout:
        30000,
    }
  );
}
