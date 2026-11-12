import {
  prisma,
} from "../../config/postgresql.js";


/* =========================================================
   UTILIDADES
========================================================= */

function numero(valor) {
  if (
    valor === null ||
    valor === undefined
  ) {
    return 0;
  }

  return Number(valor);
}


function validarFecha(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(
    String(fecha || "")
  );
}


function validarPeriodo(
  desde,
  hasta
) {
  if (
    !validarFecha(desde) ||
    !validarFecha(hasta)
  ) {
    throw new Error(
      "Debe indicar las fechas desde y hasta en formato YYYY-MM-DD."
    );
  }

  if (desde > hasta) {
    throw new Error(
      "La fecha inicial no puede ser mayor que la fecha final."
    );
  }
}


/* Para campos DateTime / Timestamptz */

function rangoTimestamp(
  desde,
  hasta
) {
  validarPeriodo(
    desde,
    hasta
  );

  const inicio =
    new Date(
      `${desde}T00:00:00-05:00`
    );

  const fin =
    new Date(
      new Date(
        `${hasta}T00:00:00-05:00`
      ).getTime() +
      86400000
    );

  return {
    gte: inicio,
    lt: fin,
  };
}


/* Para campos PostgreSQL DATE */

function rangoDate(
  desde,
  hasta
) {
  validarPeriodo(
    desde,
    hasta
  );

  const inicio =
    new Date(
      `${desde}T00:00:00.000Z`
    );

  const fin =
    new Date(
      inicio
    );

  const finBase =
    new Date(
      `${hasta}T00:00:00.000Z`
    );

  fin.setTime(
    finBase.getTime() +
    86400000
  );

  return {
    gte: inicio,
    lt: fin,
  };
}


function fechaBogota(
  valor
) {
  if (!valor) {
    return "";
  }

  return new Intl
    .DateTimeFormat(
      "es-CO",
      {
        timeZone:
          "America/Bogota",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",

        hour:
          "2-digit",

        minute:
          "2-digit",

        hour12:
          false,
      }
    )
    .format(
      new Date(valor)
    );
}


function fechaSolo(
  valor
) {
  if (!valor) {
    return "";
  }

  return new Date(valor)
    .toISOString()
    .slice(
      0,
      10
    );
}


function nombreTipoCaja(
  valor
) {
  return String(
    valor || ""
  )
    .trim()
    .toLowerCase();
}


/* =========================================================
   EMPRESA
========================================================= */

export async function obtenerEmpresaInforme() {
  const empresa =
    await prisma.configuracion.findUnique({
      where: {
        clave:
          "principal",
      },
    });

  return {
    nombreComercial:
      empresa?.nombreComercial ||
      "WEBBUYS",

    razonSocial:
      empresa?.razonSocial ||
      "",

    nit:
      empresa?.nit ||
      "",

    direccion:
      empresa?.direccion ||
      "",

    ciudad:
      empresa?.ciudad ||
      "",

    telefono:
      empresa?.telefono ||
      empresa?.celular ||
      "",

    correo:
      empresa?.correo ||
      "",

    logo:
      empresa?.logo ||
      "",
  };
}


/* =========================================================
   RESUMEN GENERAL
========================================================= */

export async function obtenerResumenGeneral({
  desde,
  hasta,
}) {
  const periodoTimestamp =
    rangoTimestamp(
      desde,
      hasta
    );

  const periodoDate =
    rangoDate(
      desde,
      hasta
    );


  const [
    pedidos,
    entregas,
    facturas,
    clientesNuevos,
    movimientosCaja,
    carteraGenerada,
    pagosCartera,
    movimientosInventario,
  ] =
    await Promise.all([

      prisma.pedido.aggregate({
        where: {
          createdAt:
            periodoTimestamp,
        },

        _count: {
          _all: true,
        },

        _sum: {
          total: true,
        },
      }),


      prisma.entrega.aggregate({
        where: {
          fechaEntregaReal:
            periodoTimestamp,
        },

        _count: {
          _all: true,
        },

        _sum: {
          total: true,
        },
      }),


      prisma.factura.aggregate({
        where: {
          createdAt:
            periodoTimestamp,

          fechaAnulacion:
            null,

          estado: {
            not:
              "Anulada",
          },
        },

        _count: {
          _all: true,
        },

        _sum: {
          total: true,
        },
      }),


      prisma.cliente.count({
        where: {
          createdAt:
            periodoTimestamp,
        },
      }),


      prisma.movimientoCaja.findMany({
        where: {
          createdAt:
            periodoTimestamp,

          estado:
            "Activo",
        },

        select: {
          tipo: true,
          valor: true,
        },
      }),


      prisma.cartera.aggregate({
        where: {
          fechaEntrega:
            periodoDate,
        },

        _count: {
          _all: true,
        },

        _sum: {
          valorOriginal:
            true,

          saldoPendiente:
            true,
        },
      }),


      prisma.pagoCartera.aggregate({
        where: {
          fechaPago:
            periodoTimestamp,

          estado:
            "Activo",
        },

        _count: {
          _all: true,
        },

        _sum: {
          valor: true,
        },
      }),


      prisma.movimientoInventario.groupBy({
        by: [
          "tipo",
        ],

        where: {
          fechaMovimiento:
            periodoDate,
        },

        _count: {
          _all: true,
        },

        _sum: {
          cantidad: true,
          valorTotal: true,
        },
      }),

    ]);


  let ingresosCaja = 0;
  let egresosCaja = 0;


  movimientosCaja.forEach(
    (movimiento) => {

      const tipo =
        nombreTipoCaja(
          movimiento.tipo
        );

      const valor =
        numero(
          movimiento.valor
        );

      if (
        tipo.includes(
          "ingreso"
        )
      ) {
        ingresosCaja +=
          valor;
      }

      if (
        tipo.includes(
          "egreso"
        )
      ) {
        egresosCaja +=
          valor;
      }

    }
  );


  return {
    titulo:
      "Resumen general",

    desde,
    hasta,

    indicadores: {

      pedidos:
        pedidos._count._all,

      valorPedidos:
        numero(
          pedidos._sum.total
        ),

      entregas:
        entregas._count._all,

      totalVentas:
        numero(
          entregas._sum.total
        ),

      facturas:
        facturas._count._all,

      valorFacturado:
        numero(
          facturas._sum.total
        ),

      clientesNuevos,

      ingresosCaja,

      egresosCaja,

      carteraGenerada:
        numero(
          carteraGenerada
            ._sum
            .valorOriginal
        ),

      saldoCartera:
        numero(
          carteraGenerada
            ._sum
            .saldoPendiente
        ),

      pagosCartera:
        numero(
          pagosCartera
            ._sum
            .valor
        ),
    },


    inventarioPorTipo:
      movimientosInventario.map(
        (item) => ({
          tipo:
            item.tipo,

          movimientos:
            item._count._all,

          cantidad:
            numero(
              item._sum.cantidad
            ),

          valor:
            numero(
              item._sum.valorTotal
            ),
        })
      ),
  };
}


/* =========================================================
   VENTAS
   Una venta se toma desde la ENTREGA REAL.
========================================================= */

export async function obtenerInformeVentas({
  desde,
  hasta,
}) {
  const entregas =
    await prisma.entrega.findMany({

      where: {
        fechaEntregaReal:
          rangoTimestamp(
            desde,
            hasta
          ),
      },

      orderBy: {
        fechaEntregaReal:
          "asc",
      },

      select: {
        pedidoCodigo: true,

        clienteCodigo:
          true,

        clienteNombre:
          true,

        rutaNombre:
          true,

        zonaDespachoNombre:
          true,

        metodoPago:
          true,

        subtotal:
          true,

        descuento:
          true,

        total:
          true,

        estado:
          true,

        fechaEntregaReal:
          true,
      },
    });


  const filas =
    entregas.map(
      (entrega) => ({

        fecha:
          fechaBogota(
            entrega.fechaEntregaReal
          ),

        pedido:
          entrega.pedidoCodigo,

        cliente:
          entrega.clienteNombre,

        ruta:
          entrega.rutaNombre,

        zona:
          entrega
            .zonaDespachoNombre,

        metodoPago:
          entrega.metodoPago,

        subtotal:
          numero(
            entrega.subtotal
          ),

        descuento:
          numero(
            entrega.descuento
          ),

        total:
          numero(
            entrega.total
          ),

        estado:
          entrega.estado,
      })
    );


  return {
    titulo:
      "Informe de ventas",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Fecha",
        campo:
          "fecha",
      },
      {
        titulo:
          "Pedido",
        campo:
          "pedido",
      },
      {
        titulo:
          "Cliente",
        campo:
          "cliente",
      },
      {
        titulo:
          "Ruta",
        campo:
          "ruta",
      },
      {
        titulo:
          "Zona",
        campo:
          "zona",
      },
      {
        titulo:
          "Forma de pago",
        campo:
          "metodoPago",
      },
      {
        titulo:
          "Subtotal",
        campo:
          "subtotal",
      },
      {
        titulo:
          "Descuento",
        campo:
          "descuento",
      },
      {
        titulo:
          "Total",
        campo:
          "total",
      },
      {
        titulo:
          "Estado",
        campo:
          "estado",
      },
    ],

    filas,

    total:
      filas.reduce(
        (
          acumulado,
          fila
        ) =>
          acumulado +
          numero(
            fila.total
          ),
        0
      ),
  };
}


/* =========================================================
   FACTURAS
   Incluye facturas vigentes y anuladas del período.
   Los totales monetarios "facturados" solo suman vigentes.
========================================================= */

export async function obtenerInformeFacturas({
  desde,
  hasta,
}) {
  const facturas =
    await prisma.factura.findMany({

      where: {
        createdAt:
          rangoTimestamp(
            desde,
            hasta
          ),
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        codigo:
          true,

        pedidoCodigo:
          true,

        clienteNombre:
          true,

        clienteDocumento:
          true,

        metodoPago:
          true,

        subtotal:
          true,

        descuento:
          true,

        iva:
          true,

        total:
          true,

        estado:
          true,

        fechaAnulacion:
          true,

        createdAt:
          true,

        creadoPor: {
          select: {
            nombres:
              true,

            apellidos:
              true,

            usuario:
              true,
          },
        },
      },
    });


  const filas =
    facturas.map(
      (factura) => {

        const anulada =
          Boolean(
            factura.fechaAnulacion
          ) ||
          String(
            factura.estado || ""
          )
            .trim()
            .toLowerCase() ===
            "anulada";


        const nombreUsuario =
          [
            factura
              .creadoPor
              ?.nombres,

            factura
              .creadoPor
              ?.apellidos,
          ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
          factura
            .creadoPor
            ?.usuario ||
          "";


        return {

          fecha:
            fechaBogota(
              factura.createdAt
            ),

          factura:
            factura.codigo,

          pedido:
            factura.pedidoCodigo,

          cliente:
            factura.clienteNombre,

          documento:
            factura.clienteDocumento,

          metodoPago:
            factura.metodoPago,

          subtotal:
            numero(
              factura.subtotal
            ),

          descuento:
            numero(
              factura.descuento
            ),

          iva:
            numero(
              factura.iva
            ),

          total:
            numero(
              factura.total
            ),

          estado:
            factura.estado,

          generadoPor:
            nombreUsuario,

          /* Dato auxiliar para exportaciones.
             No se muestra como columna. */
          anulada,
        };

      }
    );


  const vigentes =
    filas.filter(
      (fila) =>
        !fila.anulada
    );


  const anuladas =
    filas.filter(
      (fila) =>
        fila.anulada
    );


  const totalFacturado =
    vigentes.reduce(
      (
        acumulado,
        fila
      ) =>
        acumulado +
        numero(
          fila.total
        ),
      0
    );


  const totalDescuentos =
    vigentes.reduce(
      (
        acumulado,
        fila
      ) =>
        acumulado +
        numero(
          fila.descuento
        ),
      0
    );


  const valorAnulado =
    anuladas.reduce(
      (
        acumulado,
        fila
      ) =>
        acumulado +
        numero(
          fila.total
        ),
      0
    );


  return {
    titulo:
      "Informe de facturas",

    desde,
    hasta,

    indicadores: {
      totalFacturas:
        filas.length,

      facturasVigentes:
        vigentes.length,

      facturasAnuladas:
        anuladas.length,

      totalFacturado,

      totalDescuentos,

      valorAnulado,
    },

    columnas: [
      {
        titulo:
          "Fecha",
        campo:
          "fecha",
      },
      {
        titulo:
          "Factura",
        campo:
          "factura",
      },
      {
        titulo:
          "Pedido",
        campo:
          "pedido",
      },
      {
        titulo:
          "Cliente",
        campo:
          "cliente",
      },
      {
        titulo:
          "Documento",
        campo:
          "documento",
      },
      {
        titulo:
          "Forma de pago",
        campo:
          "metodoPago",
      },
      {
        titulo:
          "Subtotal",
        campo:
          "subtotal",
      },
      {
        titulo:
          "Descuento",
        campo:
          "descuento",
      },
      {
        titulo:
          "IVA",
        campo:
          "iva",
      },
      {
        titulo:
          "Total",
        campo:
          "total",
      },
      {
        titulo:
          "Estado",
        campo:
          "estado",
      },
      {
        titulo:
          "Generada por",
        campo:
          "generadoPor",
      },
    ],

    filas,

    totalFacturado,
    totalDescuentos,
    valorAnulado,
  };
}


/* =========================================================
   PEDIDOS
========================================================= */

export async function obtenerInformePedidos({
  desde,
  hasta,
}) {
  const pedidos =
    await prisma.pedido.findMany({

      where: {
        createdAt:
          rangoTimestamp(
            desde,
            hasta
          ),
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        codigo: true,
        clienteNombre: true,
        clienteRazonSocial: true,
        rutaNombre: true,
        zonaDespachoNombre: true,
        subtotal: true,
        descuento: true,
        total: true,
        estado: true,
        fechaEntrega: true,
        createdAt: true,
      },
    });


  const filas =
    pedidos.map(
      (pedido) => ({

        fecha:
          fechaBogota(
            pedido.createdAt
          ),

        codigo:
          pedido.codigo,

        cliente:
          pedido.clienteNombre ||
          pedido
            .clienteRazonSocial,

        ruta:
          pedido.rutaNombre,

        zona:
          pedido
            .zonaDespachoNombre,

        fechaEntrega:
          fechaSolo(
            pedido.fechaEntrega
          ),

        subtotal:
          numero(
            pedido.subtotal
          ),

        descuento:
          numero(
            pedido.descuento
          ),

        total:
          numero(
            pedido.total
          ),

        estado:
          pedido.estado,
      })
    );


  return {
    titulo:
      "Informe de pedidos",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Fecha",
        campo:
          "fecha",
      },
      {
        titulo:
          "Pedido",
        campo:
          "codigo",
      },
      {
        titulo:
          "Cliente",
        campo:
          "cliente",
      },
      {
        titulo:
          "Ruta",
        campo:
          "ruta",
      },
      {
        titulo:
          "Zona",
        campo:
          "zona",
      },
      {
        titulo:
          "Entrega",
        campo:
          "fechaEntrega",
      },
      {
        titulo:
          "Subtotal",
        campo:
          "subtotal",
      },
      {
        titulo:
          "Descuento",
        campo:
          "descuento",
      },
      {
        titulo:
          "Total",
        campo:
          "total",
      },
      {
        titulo:
          "Estado",
        campo:
          "estado",
      },
    ],

    filas,
  };
}


/* =========================================================
   ENTREGAS
========================================================= */

export async function obtenerInformeEntregas({
  desde,
  hasta,
}) {
  const periodoDate =
    rangoDate(
      desde,
      hasta
    );

  const periodoTimestamp =
    rangoTimestamp(
      desde,
      hasta
    );


  const entregas =
    await prisma.entrega.findMany({

      where: {
        OR: [
          {
            fechaProgramada:
              periodoDate,
          },
          {
            fechaEntregaReal:
              periodoTimestamp,
          },
        ],
      },

      orderBy: {
        createdAt:
          "asc",
      },

      select: {
        pedidoCodigo:
          true,

        clienteNombre:
          true,

        rutaNombre:
          true,

        zonaDespachoNombre:
          true,

        fechaProgramada:
          true,

        fechaEntregaReal:
          true,

        metodoPago:
          true,

        total:
          true,

        estado:
          true,

        repartidor: {
          select: {
            nombres: true,
            apellidos: true,
          },
        },
      },
    });


  const filas =
    entregas.map(
      (entrega) => ({

        pedido:
          entrega.pedidoCodigo,

        repartidor:
          nombreRepartidorInforme(entrega.repartidor),

        cliente:
          entrega.clienteNombre,

        ruta:
          entrega.rutaNombre,

        zona:
          entrega
            .zonaDespachoNombre,

        programada:
          fechaSolo(
            entrega.fechaProgramada
          ),

        entregaReal:
          fechaBogota(
            entrega.fechaEntregaReal
          ),

        metodoPago:
          entrega.metodoPago,

        total:
          numero(
            entrega.total
          ),

        estado:
          entrega.estado,
      })
    );


  return {
    titulo:
      "Informe de entregas",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Pedido",
        campo:
          "pedido",
      },
      {
        titulo:
          "Cliente",
        campo:
          "cliente",
      },
      {
        titulo:
          "Repartidor",
        campo:
          "repartidor",
      },
      {
        titulo:
          "Ruta",
        campo:
          "ruta",
      },
      {
        titulo:
          "Zona",
        campo:
          "zona",
      },
      {
        titulo:
          "Programada",
        campo:
          "programada",
      },
      {
        titulo:
          "Entrega real",
        campo:
          "entregaReal",
      },
      {
        titulo:
          "Pago",
        campo:
          "metodoPago",
      },
      {
        titulo:
          "Total",
        campo:
          "total",
      },
      {
        titulo:
          "Estado",
        campo:
          "estado",
      },
    ],

    filas,
  };
}


/* =========================================================
   INVENTARIO
========================================================= */

export async function obtenerInformeInventario({
  desde,
  hasta,
}) {
  const movimientos =
    await prisma.movimientoInventario.findMany({

      where: {
        fechaMovimiento:
          rangoDate(
            desde,
            hasta
          ),
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

      select: {
        fechaMovimiento:
          true,

        codigoProducto:
          true,

        nombreProducto:
          true,

        presentacionNombre:
          true,

        tipo:
          true,

        cantidad:
          true,

        unidad:
          true,

        stockAnterior:
          true,

        stockNuevo:
          true,

        costoUnitario:
          true,

        valorTotal:
          true,

        origen:
          true,

        pedidoCodigo:
          true,

        proveedor:
          true,

        documentoReferencia:
          true,
      },
    });


  const filas =
    movimientos.map(
      (movimiento) => ({

        fecha:
          fechaSolo(
            movimiento
              .fechaMovimiento
          ),

        codigo:
          movimiento
            .codigoProducto,

        producto:
          movimiento
            .nombreProducto,

        presentacion:
          movimiento
            .presentacionNombre,

        tipo:
          movimiento.tipo,

        cantidad:
          numero(
            movimiento.cantidad
          ),

        unidad:
          movimiento.unidad,

        stockAnterior:
          numero(
            movimiento
              .stockAnterior
          ),

        stockNuevo:
          numero(
            movimiento
              .stockNuevo
          ),

        costoUnitario:
          numero(
            movimiento
              .costoUnitario
          ),

        valor:
          numero(
            movimiento.valorTotal
          ),

        origen:
          movimiento.origen,

        referencia:
          movimiento.pedidoCodigo ||
          movimiento
            .documentoReferencia ||
          movimiento.proveedor,
      })
    );


  return {
    titulo:
      "Informe de inventario",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Fecha",
        campo:
          "fecha",
      },
      {
        titulo:
          "Código",
        campo:
          "codigo",
      },
      {
        titulo:
          "Producto",
        campo:
          "producto",
      },
      {
        titulo:
          "Presentación",
        campo:
          "presentacion",
      },
      {
        titulo:
          "Movimiento",
        campo:
          "tipo",
      },
      {
        titulo:
          "Cantidad",
        campo:
          "cantidad",
      },
      {
        titulo:
          "Unidad",
        campo:
          "unidad",
      },
      {
        titulo:
          "Stock anterior",
        campo:
          "stockAnterior",
      },
      {
        titulo:
          "Stock nuevo",
        campo:
          "stockNuevo",
      },
      {
        titulo:
          "Valor",
        campo:
          "valor",
      },
      {
        titulo:
          "Origen",
        campo:
          "origen",
      },
      {
        titulo:
          "Referencia",
        campo:
          "referencia",
      },
    ],

    filas,
  };
}


/* =========================================================
   PRODUCTOS VENDIDOS
========================================================= */

export async function obtenerInformeProductos({
  desde,
  hasta,
}) {
  const items =
    await prisma.entregaItem.findMany({

      where: {
        entrega: {
          fechaEntregaReal:
            rangoTimestamp(
              desde,
              hasta
            ),
        },
      },

      select: {
        productoId:
          true,

        codigoProducto:
          true,

        nombre:
          true,

        presentacionId:
          true,

        presentacionNombre:
          true,

        unidad:
          true,

        cantidadSolicitada:
          true,

        cantidadReal:
          true,

        pesoReal:
          true,

        subtotal:
          true,
      },
    });


  const mapa =
    new Map();


  items.forEach(
    (item) => {

      const clave =
        `${item.productoId}|${item.presentacionId || ""}`;

      const cantidad =
        item.cantidadReal !== null
          ? numero(
              item.cantidadReal
            )
          : item.pesoReal !== null
            ? numero(
                item.pesoReal
              )
            : numero(
                item.cantidadSolicitada
              );


      if (
        !mapa.has(clave)
      ) {
        mapa.set(
          clave,
          {
            codigo:
              item.codigoProducto,

            producto:
              item.nombre,

            presentacion:
              item
                .presentacionNombre,

            unidad:
              item.unidad,

            cantidad:
              0,

            valor:
              0,
          }
        );
      }


      const registro =
        mapa.get(clave);

      registro.cantidad +=
        cantidad;

      registro.valor +=
        numero(
          item.subtotal
        );

    }
  );


  const filas =
    Array.from(
      mapa.values()
    )
      .sort(
        (a, b) =>
          b.valor -
          a.valor
      );


  return {
    titulo:
      "Informe de productos vendidos",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Código",
        campo:
          "codigo",
      },
      {
        titulo:
          "Producto",
        campo:
          "producto",
      },
      {
        titulo:
          "Presentación",
        campo:
          "presentacion",
      },
      {
        titulo:
          "Unidad",
        campo:
          "unidad",
      },
      {
        titulo:
          "Cantidad vendida",
        campo:
          "cantidad",
      },
      {
        titulo:
          "Valor vendido",
        campo:
          "valor",
      },
    ],

    filas,
  };
}


/* =========================================================
   CLIENTES
========================================================= */

export async function obtenerInformeClientes({
  desde,
  hasta,
}) {
  const entregas =
    await prisma.entrega.findMany({

      where: {
        fechaEntregaReal:
          rangoTimestamp(
            desde,
            hasta
          ),
      },

      select: {
        clienteId:
          true,

        clienteCodigo:
          true,

        clienteNombre:
          true,

        fechaEntregaReal:
          true,

        total:
          true,
      },
    });


  const mapa =
    new Map();


  entregas.forEach(
    (entrega) => {

      const clave =
        entrega.clienteId ||
        entrega.clienteCodigo ||
        entrega.clienteNombre;


      if (
        !mapa.has(clave)
      ) {
        mapa.set(
          clave,
          {
            codigo:
              entrega
                .clienteCodigo,

            cliente:
              entrega
                .clienteNombre,

            compras:
              0,

            totalComprado:
              0,

            ultimaCompra:
              "",
          }
        );
      }


      const registro =
        mapa.get(clave);

      registro.compras +=
        1;

      registro.totalComprado +=
        numero(
          entrega.total
        );


      const fecha =
        entrega.fechaEntregaReal
          ? new Date(
              entrega.fechaEntregaReal
            )
          : null;


      if (fecha) {
        const fechaActual =
          registro.ultimaCompra
            ? new Date(
                registro
                  .ultimaCompraRaw
              )
            : null;

        if (
          !fechaActual ||
          fecha >
          fechaActual
        ) {
          registro.ultimaCompraRaw =
            fecha;

          registro.ultimaCompra =
            fechaBogota(
              fecha
            );
        }
      }

    }
  );


  const filas =
    Array.from(
      mapa.values()
    )
      .map(
        ({
          ultimaCompraRaw,
          ...fila
        }) => fila
      )
      .sort(
        (
          a,
          b
        ) =>
          b.totalComprado -
          a.totalComprado
      );


  return {
    titulo:
      "Informe de clientes",

    desde,
    hasta,

    columnas: [
      {
        titulo:
          "Código",
        campo:
          "codigo",
      },
      {
        titulo:
          "Cliente",
        campo:
          "cliente",
      },
      {
        titulo:
          "Compras",
        campo:
          "compras",
      },
      {
        titulo:
          "Total comprado",
        campo:
          "totalComprado",
      },
      {
        titulo:
          "Última compra",
        campo:
          "ultimaCompra",
      },
    ],

    filas,
  };
}


/* =========================================================
   CAJA Y CARTERA — INFORMES DE GESTIÓN V10
   Los movimientos son del período; los cierres y saldos de
   cartera reflejan el estado actual almacenado.
========================================================= */

function nombreUsuarioInforme(usuario) {
  if (!usuario) return "";
  return [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ").trim()
    || usuario.usuario || "";
}

function fechaHoyBogota() {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const valor = Object.fromEntries(partes.map((p) => [p.type, p.value]));
  return `${valor.year}-${valor.month}-${valor.day}`;
}

function sumarImportes(filas, campo) {
  return Number(filas.reduce((suma, fila) => suma + numero(fila[campo]), 0).toFixed(2));
}

export async function obtenerOpcionesCajasInforme() {
  const cajas = await prisma.caja.findMany({
    select: { id: true, codigo: true, fechaApertura: true, estado: true },
    orderBy: { fechaApertura: "desc" },
  });
  return cajas.map((caja) => ({
    id: caja.id, codigo: caja.codigo, estado: caja.estado,
    fechaApertura: fechaBogota(caja.fechaApertura),
  }));
}

export async function obtenerInformeCaja({ desde, hasta, cajaId = "" }) {
  const periodo = rangoTimestamp(desde, hasta);
  const id = String(cajaId || "").trim();
  const whereMovimiento = { createdAt: periodo, estado: "Activo", ...(id ? { cajaId: id } : {}) };

  const [movimientos, cajas] = await Promise.all([
    prisma.movimientoCaja.findMany({
      where: whereMovimiento,
      include: {
        caja: { select: { codigo: true } },
        usuario: { select: { nombres: true, apellidos: true, usuario: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    prisma.caja.findMany({
      where: id ? { id } : {
        OR: [
          { fechaApertura: periodo },
          { fechaCierre: periodo },
          { movimientos: { some: whereMovimiento } },
        ],
      },
      include: {
        abiertoPor: { select: { nombres: true, apellidos: true, usuario: true } },
        cerradoPor: { select: { nombres: true, apellidos: true, usuario: true } },
      },
      orderBy: { fechaApertura: "asc" },
    }),
  ]);

  if (id && cajas.length === 0) throw new Error("La caja seleccionada no existe.");

  const filas = movimientos.map((m) => ({
    fecha: fechaBogota(m.createdAt),
    caja: m.caja?.codigo || "",
    tipo: m.tipo,
    origen: m.origen,
    concepto: m.concepto,
    cliente: m.clienteNombre || "",
    metodoPago: m.metodoPago || (m.origen === "Manual" ? "Efectivo" : "Sin especificar"),
    referencia: m.facturaCodigo || m.pedidoCodigo || m.entregaCodigo || "",
    valor: numero(m.valor),
    registradoPor: nombreUsuarioInforme(m.usuario),
  }));

  const ingresos = movimientos.filter((m) => m.tipo === "Ingreso");
  const egresos = movimientos.filter((m) => m.tipo === "Egreso");
  const cierresPeriodo = cajas.filter((caja) =>
    caja.estado === "Cerrada" && caja.fechaCierre &&
    caja.fechaCierre >= periodo.gte && caja.fechaCierre < periodo.lt
  );

  const resumenCajas = cajas.map((caja) => ({
    caja: caja.codigo,
    apertura: fechaBogota(caja.fechaApertura),
    cierre: fechaBogota(caja.fechaCierre),
    estado: caja.estado,
    saldoInicial: numero(caja.saldoInicial),
    saldoCierre: caja.estado === "Cerrada" ? numero(caja.saldoEsperado) : "",
    contado: caja.efectivoContado === null ? "" : numero(caja.efectivoContado),
    diferencia: caja.diferencia === null ? "" : numero(caja.diferencia),
    abiertoPor: nombreUsuarioInforme(caja.abiertoPor),
    cerradoPor: nombreUsuarioInforme(caja.cerradoPor),
  }));

  const indicadores = {
    cajas: cajas.length,
    movimientos: movimientos.length,
    ingresos: sumarImportes(ingresos, "valor"),
    egresos: sumarImportes(egresos, "valor"),
    neto: Number((sumarImportes(ingresos, "valor") - sumarImportes(egresos, "valor")).toFixed(2)),
    efectivoIngresado: sumarImportes(ingresos.filter((m) => m.afectaEfectivo), "valor"),
    transferencias: sumarImportes(ingresos.filter((m) => m.metodoPago === "Transferencia"), "valor"),
    recaudosCartera: sumarImportes(ingresos.filter((m) => m.origen === "Cartera"), "valor"),
    cierres: cierresPeriodo.length,
    diferenciaCierres: sumarImportes(cierresPeriodo, "diferencia"),
  };

  return {
    titulo: id ? `Informe de caja - ${cajas[0].codigo}` : "Informe de caja y cierres",
    desde, hasta,
    nota: "Los ingresos, egresos y recaudos corresponden a movimientos activos registrados en el período. Los abonos de cartera están incluidos en ingresos (no se suman otra vez). El resumen de cajas muestra su estado y cierre registrados actualmente, que pueden ser posteriores al período. La diferencia de cierres suma solo las cajas cerradas dentro del período; no equivale al efectivo de todas las cajas.",
    indicadores,
    columnas: [
      { titulo: "Fecha", campo: "fecha" },
      { titulo: "Caja", campo: "caja" },
      { titulo: "Tipo", campo: "tipo" },
      { titulo: "Origen", campo: "origen" },
      { titulo: "Concepto", campo: "concepto" },
      { titulo: "Cliente", campo: "cliente" },
      { titulo: "Medio", campo: "metodoPago" },
      { titulo: "Referencia", campo: "referencia" },
      { titulo: "Valor", campo: "valor" },
      { titulo: "Registrado por", campo: "registradoPor" },
    ],
    filas,
    secciones: [{
      titulo: "Cajas y cierres registrados",
      columnas: [
        { titulo: "Caja", campo: "caja" },
        { titulo: "Apertura", campo: "apertura" },
        { titulo: "Cierre", campo: "cierre" },
        { titulo: "Estado", campo: "estado" },
        { titulo: "Saldo inicial", campo: "saldoInicial" },
        { titulo: "Saldo al cierre", campo: "saldoCierre" },
        { titulo: "Contado", campo: "contado" },
        { titulo: "Diferencia", campo: "diferencia" },
        { titulo: "Abrió", campo: "abiertoPor" },
        { titulo: "Cerró", campo: "cerradoPor" },
      ],
      filas: resumenCajas,
    }],
  };
}

function estadoCarteraInforme(cartera, hoy) {
  const saldo = numero(cartera.saldoPendiente);
  if (saldo <= 0 || cartera.estado === "Pagada") return "Pagada";
  const vencimiento = fechaSolo(cartera.fechaVencimiento);
  if (vencimiento && vencimiento < hoy) return "Vencida";
  if (numero(cartera.totalAbonado) > 0) return "Abonada";
  return "Pendiente";
}

export async function obtenerInformeCartera({
  desde, hasta, carteraEstado = "", carteraPeriodo = "entrega",
}) {
  const periodo = rangoTimestamp(desde, hasta);
  const periodoEntrega = rangoDate(desde, hasta);
  const estadoFiltro = String(carteraEstado || "").trim();
  const modo = String(carteraPeriodo || "entrega").trim();
  const estadosPermitidos = ["", "Pendiente", "Abonada", "Pagada", "Vencida", "Sin vencimiento"];
  if (!estadosPermitidos.includes(estadoFiltro)) throw new Error("Estado de cartera no válido.");
  if (!["entrega", "todas"].includes(modo)) throw new Error("Alcance de cartera no válido.");

  const cuentas = await prisma.cartera.findMany({
    where: modo === "entrega" ? { fechaEntrega: periodoEntrega } : {},
    orderBy: [{ fechaEntrega: "asc" }, { codigo: "asc" }],
    select: {
      id: true, codigo: true, pedidoCodigo: true, clienteCodigo: true,
      clienteNombre: true, clienteDocumento: true, fechaEntrega: true,
      fechaVencimiento: true, valorOriginal: true, totalAbonado: true,
      saldoPendiente: true, estado: true,
    },
  });

  const hoy = fechaHoyBogota();
  const carteras = cuentas.filter((c) => {
    if (!estadoFiltro) return true;
    if (estadoFiltro === "Sin vencimiento") {
      return numero(c.saldoPendiente) > 0 && !c.fechaVencimiento;
    }
    if (estadoFiltro === "Abonada") {
      return numero(c.saldoPendiente) > 0 && numero(c.totalAbonado) > 0;
    }
    if (estadoFiltro === "Pendiente") {
      return numero(c.saldoPendiente) > 0 && numero(c.totalAbonado) === 0;
    }
    return estadoCarteraInforme(c, hoy) === estadoFiltro;
  });
  const cuentasPorId = new Map(carteras.map((c) => [c.id, c]));
  const pagos = carteras.length ? await prisma.pagoCartera.findMany({
    where: { carteraId: { in: carteras.map((c) => c.id) }, fechaPago: periodo, estado: "Activo" },
    include: {
      caja: { select: { codigo: true } },
      usuario: { select: { nombres: true, apellidos: true, usuario: true } },
    },
    orderBy: [{ fechaPago: "asc" }, { id: "asc" }],
  }) : [];

  const filas = carteras.map((c) => {
    const vencimiento = fechaSolo(c.fechaVencimiento);
    const estado = estadoCarteraInforme(c, hoy);
    return {
      codigo: c.codigo, pedido: c.pedidoCodigo,
      cliente: c.clienteNombre, documento: c.clienteDocumento,
      fechaEntrega: fechaSolo(c.fechaEntrega), vencimiento,
      estado, valorOriginal: numero(c.valorOriginal),
      abonado: numero(c.totalAbonado), saldo: numero(c.saldoPendiente),
      diasMora: estado === "Vencida"
        ? Math.round((Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${vencimiento}T00:00:00Z`)) / 86400000)
        : 0,
    };
  });

  const filasPagos = pagos.map((pago) => {
    const cuenta = cuentasPorId.get(pago.carteraId);
    return {
      fecha: fechaBogota(pago.fechaPago),
      cartera: cuenta?.codigo || "", pedido: cuenta?.pedidoCodigo || "",
      cliente: cuenta?.clienteNombre || "", metodoPago: pago.metodoPago,
      caja: pago.caja?.codigo || "", referencia: pago.referencia || "",
      valor: numero(pago.valor), registradoPor: nombreUsuarioInforme(pago.usuario),
    };
  });

  const clientes = new Map();
  const cuentasPorCodigo = new Map(carteras.map((c) => [c.codigo, c]));
  for (const fila of filas) {
    const cuenta = cuentasPorCodigo.get(fila.codigo);
    const clave = cuenta?.clienteCodigo || `${fila.documento}|${fila.cliente}`;
    if (!clientes.has(clave)) clientes.set(clave, {
      cliente: fila.cliente, documento: fila.documento, cuentas: 0,
      valorOriginal: 0, abonado: 0, saldo: 0, vencido: 0,
    });
    const r = clientes.get(clave);
    r.cuentas += 1;
    r.valorOriginal += fila.valorOriginal;
    r.abonado += fila.abonado;
    r.saldo += fila.saldo;
    if (fila.estado === "Vencida") r.vencido += fila.saldo;
  }

  // Aviso informativo: nunca cambiar vencimientos ni fechas de entrega desde un informe.
  const fechasPorRevisar = carteras.filter((cuenta) => {
    const entrega = fechaSolo(cuenta.fechaEntrega);
    const vencimiento = fechaSolo(cuenta.fechaVencimiento);
    return Boolean(entrega && vencimiento && vencimiento < entrega);
  });
  const avisoFechas = fechasPorRevisar.length
    ? `REVISAR FECHAS: ${fechasPorRevisar.length} cuenta(s) con vencimiento anterior a la entrega (${fechasPorRevisar.slice(0, 5).map((cuenta) => cuenta.codigo).join(", ")}${fechasPorRevisar.length > 5 ? ", ..." : ""}). Verifique la fecha en Cartera; este informe no modifica los registros.`
    : "";

  const indicadores = {
    cuentas: filas.length,
    valorOriginal: sumarImportes(filas, "valorOriginal"),
    abonadoHistorico: sumarImportes(filas, "abonado"),
    saldoPendiente: sumarImportes(filas, "saldo"),
    saldoVencido: sumarImportes(filas.filter((f) => f.estado === "Vencida"), "saldo"),
    pagosPeriodo: sumarImportes(pagos, "valor"),
    efectivoPeriodo: sumarImportes(pagos.filter((p) => p.metodoPago === "Efectivo"), "valor"),
    transferenciaPeriodo: sumarImportes(pagos.filter((p) => p.metodoPago === "Transferencia"), "valor"),
  };

  return {
    titulo: "Informe de cartera y abonos",
    desde, hasta,
    nota: [modo === "todas"
      ? "Se muestran todas las cuentas con su saldo ACTUAL, independientemente de cuándo se originaron. Los abonos detallados corresponden únicamente al período seleccionado y a las cuentas filtradas. El saldo actual no representa un corte histórico a la fecha Hasta."
      : "Se muestran las cuentas originadas (fecha de entrega) dentro del período, con su saldo ACTUAL. Los abonos detallados corresponden al período seleccionado y solo a esas cuentas. El saldo actual no representa un corte histórico a la fecha Hasta.", avisoFechas].filter(Boolean).join(" "),
    indicadores,
    columnas: [
      { titulo: "Cartera", campo: "codigo" },
      { titulo: "Pedido", campo: "pedido" },
      { titulo: "Cliente", campo: "cliente" },
      { titulo: "Documento", campo: "documento" },
      { titulo: "Entrega", campo: "fechaEntrega" },
      { titulo: "Vencimiento", campo: "vencimiento" },
      { titulo: "Estado actual", campo: "estado" },
      { titulo: "Valor original", campo: "valorOriginal" },
      { titulo: "Abonado", campo: "abonado" },
      { titulo: "Saldo", campo: "saldo" },
      { titulo: "Días mora", campo: "diasMora" },
    ],
    filas,
    resumenPagos: { cantidad: pagos.length, valor: indicadores.pagosPeriodo },
    secciones: [
      {
        titulo: "Abonos recibidos en el período",
        columnas: [
          { titulo: "Fecha", campo: "fecha" },
          { titulo: "Cartera", campo: "cartera" },
          { titulo: "Pedido", campo: "pedido" },
          { titulo: "Cliente", campo: "cliente" },
          { titulo: "Medio", campo: "metodoPago" },
          { titulo: "Caja", campo: "caja" },
          { titulo: "Referencia", campo: "referencia" },
          { titulo: "Valor", campo: "valor" },
          { titulo: "Registrado por", campo: "registradoPor" },
        ],
        filas: filasPagos,
      },
      {
        titulo: "Resumen por cliente",
        columnas: [
          { titulo: "Cliente", campo: "cliente" },
          { titulo: "Documento", campo: "documento" },
          { titulo: "Cuentas", campo: "cuentas" },
          { titulo: "Valor original", campo: "valorOriginal" },
          { titulo: "Abonado", campo: "abonado" },
          { titulo: "Saldo", campo: "saldo" },
          { titulo: "Vencido", campo: "vencido" },
        ],
        filas: [...clientes.values()].sort((a, b) => a.cliente.localeCompare(b.cliente, "es")),
      },
    ],
  };
}

/* =========================================================
   RUTAS Y ZONAS
========================================================= */

export async function obtenerInformeRutasZonas({
  desde,
  hasta,
}) {
  const entregas = await prisma.entrega.findMany({
    where: {
      estado: "Entregado",
      fechaEntregaReal: rangoTimestamp(desde, hasta),
    },
    select: {
      rutaId: true,
      rutaNombre: true,
      zonaDespachoId: true,
      zonaDespachoNombre: true,
      metodoPago: true,
      total: true,
    },
  });

  const mapa = new Map();
  const indicadores = indicadoresRecaudo(entregas);

  for (const entrega of entregas) {
    const clave = [
      entrega.rutaId || entrega.rutaNombre || "Sin ruta",
      entrega.zonaDespachoId || entrega.zonaDespachoNombre || "Sin zona",
    ].join("|");

    if (!mapa.has(clave)) {
      mapa.set(clave, {
        ruta: entrega.rutaNombre || "Sin ruta",
        zona: entrega.zonaDespachoNombre || "Sin zona",
        entregas: 0,
        efectivo: 0,
        transferencia: 0,
        credito: 0,
        sinClasificar: 0,
        total: 0,
      });
    }

    const fila = mapa.get(clave);
    const valor = numero(entrega.total);
    fila.entregas += 1;
    fila.total += valor;
    fila[clasificarMetodoPago(entrega.metodoPago)] += valor;
  }

  const filas = [...mapa.values()].sort((a, b) => b.total - a.total);

  return {
    titulo: "Informe de rutas y zonas",
    desde,
    hasta,
    nota: "Solo incluye pedidos con entrega finalizada. Los valores se clasifican según la forma de pago registrada, no según la recepción comprobada del dinero.",
    indicadores,
    columnas: [
      { titulo: "Ruta", campo: "ruta" },
      { titulo: "Zona de despacho", campo: "zona" },
      { titulo: "Entregas", campo: "entregas" },
      { titulo: "Efectivo registrado", campo: "efectivo" },
      { titulo: "Transferencia registrada", campo: "transferencia" },
      { titulo: "Crédito", campo: "credito" },
      { titulo: "Sin clasificar", campo: "sinClasificar" },
      { titulo: "Total vendido", campo: "total" },
    ],
    filas,
  };
}


/* =========================================================
   REPARTIDORES Y RECAUDOS REGISTRADOS
   Reporte de solo lectura: no equivale a cierre de caja.
========================================================= */

function nombreRepartidorInforme(repartidor) {
  return [repartidor?.nombres, repartidor?.apellidos]
    .filter(Boolean)
    .join(" ")
    .trim() || "Sin repartidor";
}

function clasificarMetodoPago(valor) {
  const metodo = String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (metodo === "efectivo") return "efectivo";
  if (metodo === "transferencia") return "transferencia";
  if (metodo === "credito") return "credito";
  return "sinClasificar";
}

function indicadoresRecaudo(entregas) {
  const resumen = {
    pedidosEntregados: 0,
    totalVendido: 0,
    efectivo: 0,
    transferencia: 0,
    credito: 0,
    sinClasificar: 0,
  };

  for (const entrega of entregas) {
    const valor = numero(entrega.total);
    resumen.pedidosEntregados += 1;
    resumen.totalVendido += valor;
    resumen[clasificarMetodoPago(entrega.metodoPago)] += valor;
  }

  return resumen;
}

export async function obtenerOpcionesRepartidoresInforme() {
  const empleados = await prisma.empleado.findMany({
    where: { entregasRepartidas: { some: {} } },
    select: { id: true, codigo: true, nombres: true, apellidos: true },
    orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
  });

  return empleados.map((empleado) => ({
    id: empleado.id,
    nombre: nombreRepartidorInforme(empleado),
    codigo: empleado.codigo,
  }));
}

export async function obtenerInformeRepartidores({
  desde,
  hasta,
  repartidorId = "",
}) {
  const id = String(repartidorId || "").trim();

  if (id && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) {
    throw new Error("El identificador del repartidor no es válido.");
  }

  const repartidorSeleccionado = id
    ? await prisma.empleado.findUnique({
        where: { id },
        select: { nombres: true, apellidos: true },
      })
    : null;

  if (id && !repartidorSeleccionado) {
    throw new Error("No existe el repartidor seleccionado.");
  }

  const entregas = await prisma.entrega.findMany({
    where: {
      estado: "Entregado",
      fechaEntregaReal: rangoTimestamp(desde, hasta),
      ...(id ? { repartidorId: id } : {}),
    },
    select: {
      repartidorId: true,
      repartidor: {
        select: { nombres: true, apellidos: true },
      },
      pedidoCodigo: true,
      clienteNombre: true,
      rutaNombre: true,
      zonaDespachoNombre: true,
      fechaEntregaReal: true,
      metodoPago: true,
      total: true,
    },
    orderBy: { fechaEntregaReal: "asc" },
  });

  const indicadores = indicadoresRecaudo(entregas);
  const nota = "Los importes corresponden a pedidos entregados y a su forma de pago registrada. No verifican si el dinero fue recibido por el repartidor o directamente por la empresa. Los abonos posteriores de cartera no se incluyen aquí.";

  // El filtro solo cambia qué repartidores se consultan.
  // Tanto "Todos" como un repartidor específico muestran
  // el mismo detalle por pedido, sin sustituirlo por un resumen.
  const filas = entregas.map((entrega) => {
    const valor = numero(entrega.total);
    const metodo = clasificarMetodoPago(entrega.metodoPago);

    return {
      repartidor: nombreRepartidorInforme(entrega.repartidor),
      fecha: fechaBogota(entrega.fechaEntregaReal),
      pedido: entrega.pedidoCodigo,
      cliente: entrega.clienteNombre,
      ruta: entrega.rutaNombre || "Sin ruta",
      zona: entrega.zonaDespachoNombre || "Sin zona",
      metodoPago: entrega.metodoPago || "Sin definir",
      efectivo: metodo === "efectivo" ? valor : 0,
      transferencia: metodo === "transferencia" ? valor : 0,
      credito: metodo === "credito" ? valor : 0,
      sinClasificar: metodo === "sinClasificar" ? valor : 0,
      total: valor,
    };
  });

  // Al consultar a todos, agrupamos visualmente los pedidos por
  // repartidor; se conserva el orden cronológico dentro de cada grupo.
  if (!id) {
    filas.sort((a, b) =>
      a.repartidor.localeCompare(b.repartidor, "es", {
        sensitivity: "base",
      })
    );
  }

  const columnas = [
    { titulo: "Repartidor", campo: "repartidor" },
    { titulo: "Fecha", campo: "fecha" },
    { titulo: "Pedido", campo: "pedido" },
    { titulo: "Cliente", campo: "cliente" },
    { titulo: "Ruta", campo: "ruta" },
    { titulo: "Zona", campo: "zona" },
    { titulo: "Forma de pago", campo: "metodoPago" },
    { titulo: "Efectivo", campo: "efectivo" },
    { titulo: "Transferencia", campo: "transferencia" },
    { titulo: "Crédito", campo: "credito" },
    { titulo: "Sin clasificar", campo: "sinClasificar" },
    { titulo: "Total", campo: "total" },
  ];

  const titulo = id
    ? `Entregas y recaudos registrados - ${nombreRepartidorInforme(repartidorSeleccionado)}`
    : "Repartidores y recaudos registrados";

  const repartidores = new Set(
    entregas.map((entrega) => entrega.repartidorId || "sin-repartidor")
  ).size;

  return {
    titulo,
    desde,
    hasta,
    nota,
    indicadores: { ...indicadores, repartidores },
    columnas,
    filas,
  };
}


/* =========================================================
   DESPACHADOR GENERAL
========================================================= */

export async function obtenerDatosInforme({
  tipo,
  desde,
  hasta,
  repartidorId = "",
  cajaId = "",
  carteraEstado = "",
  carteraPeriodo = "entrega",
}) {
  const nombre =
    String(
      tipo || ""
    )
      .trim()
      .toLowerCase();


  switch (nombre) {

    case "resumen":
      return obtenerResumenGeneral({
        desde,
        hasta,
      });


    case "ventas":
      return obtenerInformeVentas({
        desde,
        hasta,
      });


    case "facturas":
      return obtenerInformeFacturas({
        desde,
        hasta,
      });


    case "pedidos":
      return obtenerInformePedidos({
        desde,
        hasta,
      });


    case "entregas":
      return obtenerInformeEntregas({
        desde,
        hasta,
      });


    case "inventario":
      return obtenerInformeInventario({
        desde,
        hasta,
      });


    case "productos":
      return obtenerInformeProductos({
        desde,
        hasta,
      });


    case "clientes":
      return obtenerInformeClientes({
        desde,
        hasta,
      });


    case "caja":
      return obtenerInformeCaja({
        desde,
        hasta,
        cajaId,
      });


    case "cartera":
      return obtenerInformeCartera({
        desde,
        hasta,
        carteraEstado,
        carteraPeriodo,
      });


    case "rutas-zonas":
    case "rutas_zonas":
      return obtenerInformeRutasZonas({
        desde,
        hasta,
      });

    case "repartidores":
      return obtenerInformeRepartidores({
        desde,
        hasta,
        repartidorId,
      });


    default:
      throw new Error(
        `Tipo de informe no válido: ${tipo}`
      );
  }
}