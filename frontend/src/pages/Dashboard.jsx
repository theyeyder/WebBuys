import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarPedidos,
} from "../services/pedido.service.js";

import {
  listarClientes,
} from "../services/cliente.service.js";

import {
  listarProductos,
} from "../services/producto.service.js";

import {
  listarCategorias,
} from "../services/categoria.service.js";

import {
  listarEntregas,
} from "../services/entrega.service.js";

import {
  obtenerResumenCaja,
  listarMovimientosCaja,
} from "../services/caja.service.js";

import {
  listarCartera,
  obtenerResumenCartera,
} from "../services/cartera.service.js";

import {
  listarEntregasFacturables,
} from "../services/factura.service.js";

import {
  listarRutas,
} from "../services/ruta.service.js";

import "../styles/dashboard.css";


function moneda(
  valor
) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(
      valor ||
      0
    )
  );

}


function fechaCorta(
  valor
) {

  if (!valor) {
    return "—";
  }


  const fecha =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—";
  }


  return fecha
    .toLocaleDateString(
      "es-CO"
    );

}


function fechaHora(
  valor
) {

  if (!valor) {
    return "—";
  }


  const fecha =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "—";
  }


  return fecha
    .toLocaleString(
      "es-CO",
      {
        dateStyle: "short",
        timeStyle: "short",
      }
    );

}


function normalizarLista(
  data,
  claves = []
) {

  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }


  for (
    const clave
    of claves
  ) {

    if (
      Array.isArray(
        data?.[clave]
      )
    ) {
      return data[clave];
    }

  }


  if (
    Array.isArray(
      data?.data
    )
  ) {
    return data.data;
  }


  return [];

}


function fechaEventoEntrega(
  entrega
) {

  return (
    entrega?.fechaEntregaReal ||
    entrega?.updatedAt ||
    entrega?.fechaEntrega ||
    entrega?.createdAt ||
    null
  );

}


function estaEntre(
  valor,
  inicio,
  fin
) {

  if (!valor) {
    return false;
  }


  const fecha =
    new Date(
      valor
    );


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return false;
  }


  return (
    fecha >= inicio &&
    fecha <= fin
  );

}


function claseEstado(
  estado
) {

  return String(
    estado ||
    ""
  )
    .trim()
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


function normalizarComparable(
  valor
) {

  return String(
    valor ||
    ""
  )
    .trim()
    .toLowerCase()
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    );

}


function idReferencia(
  valor
) {

  if (!valor) {
    return "";
  }


  if (
    typeof valor ===
    "object"
  ) {

    return String(
      valor._id ||
      valor.id ||
      ""
    );

  }


  return String(
    valor
  );

}


function coincideRuta(
  entidad,
  ruta
) {

  const rutaId =
    idReferencia(
      ruta
    );


  const entidadRutaId =
    idReferencia(
      entidad?.ruta
    );


  if (
    rutaId &&
    entidadRutaId
  ) {

    return (
      rutaId ===
      entidadRutaId
    );

  }


  const nombreRuta =
    normalizarComparable(
      ruta?.nombre
    );


  const nombreEntidad =
    normalizarComparable(
      entidad?.rutaNombre ||
      entidad?.ruta?.nombre
    );


  return Boolean(
    nombreRuta &&
    nombreEntidad &&
    nombreRuta ===
      nombreEntidad
  );

}


function variacionPorcentual(
  actual,
  anterior
) {

  const valorActual =
    Number(
      actual ||
      0
    );


  const valorAnterior =
    Number(
      anterior ||
      0
    );


  if (
    valorAnterior === 0
  ) {

    if (
      valorActual === 0
    ) {
      return {
        texto:
          "Sin cambio",
        tendencia:
          "neutral",
      };
    }


    return {
      texto:
        "Nuevo",
      tendencia:
        "up",
    };

  }


  const porcentaje =
    (
      (
        valorActual -
        valorAnterior
      ) /
      Math.abs(
        valorAnterior
      )
    ) *
    100;


  if (
    Math.abs(
      porcentaje
    ) <
    0.5
  ) {

    return {
      texto:
        "Sin cambio",
      tendencia:
        "neutral",
    };

  }


  return {
    texto:
      `${porcentaje > 0 ? "+" : ""}${Math.round(
        porcentaje
      )}%`,

    tendencia:
      porcentaje > 0
        ? "up"
        : "down",
  };

}


function variacionCantidad(
  actual,
  anterior
) {

  const diferencia =
    Number(
      actual ||
      0
    ) -
    Number(
      anterior ||
      0
    );


  if (
    diferencia === 0
  ) {

    return {
      texto:
        "Sin cambio",
      tendencia:
        "neutral",
    };

  }


  return {
    texto:
      `${diferencia > 0 ? "+" : ""}${diferencia}`,

    tendencia:
      diferencia > 0
        ? "up"
        : "down",
  };

}


export default function Dashboard() {

  const navigate =
    useNavigate();


  const [
    pedidos,
    setPedidos,
  ] = useState([]);


  const [
    clientes,
    setClientes,
  ] = useState([]);


  const [
    productos,
    setProductos,
  ] = useState([]);


  const [
    categorias,
    setCategorias,
  ] = useState([]);


  const [
    entregas,
    setEntregas,
  ] = useState([]);


  const [
    datosCaja,
    setDatosCaja,
  ] = useState(null);


  const [
    movimientosCaja,
    setMovimientosCaja,
  ] = useState([]);


  const [
    cuentasCartera,
    setCuentasCartera,
  ] = useState([]);


  const [
    resumenCartera,
    setResumenCartera,
  ] = useState({});


  const [
    facturables,
    setFacturables,
  ] = useState([]);


  const [
    rutas,
    setRutas,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    actualizando,
    setActualizando,
  ] = useState(false);


  async function cargarDashboard(
    mostrarCarga = true
  ) {

    try {

      if (
        mostrarCarga
      ) {
        setCargando(
          true
        );
      } else {
        setActualizando(
          true
        );
      }


      const resultados =
        await Promise.allSettled([
          listarPedidos(),
          listarClientes(),
          listarProductos(),
          listarCategorias(),
          listarEntregas(),
          obtenerResumenCaja(),
          listarMovimientosCaja(),
          listarCartera(),
          obtenerResumenCartera(),
          listarEntregasFacturables(),
          listarRutas(),
        ]);


      if (
        resultados[0].status ===
          "fulfilled"
      ) {

        setPedidos(
          normalizarLista(
            resultados[0].value,
            [
              "pedidos",
            ]
          )
        );

      }


      if (
        resultados[1].status ===
          "fulfilled"
      ) {

        setClientes(
          normalizarLista(
            resultados[1].value,
            [
              "clientes",
            ]
          )
        );

      }


      if (
        resultados[2].status ===
          "fulfilled"
      ) {

        setProductos(
          normalizarLista(
            resultados[2].value,
            [
              "productos",
            ]
          )
        );

      }


      if (
        resultados[3].status ===
          "fulfilled"
      ) {

        setCategorias(
          normalizarLista(
            resultados[3].value,
            [
              "categorias",
            ]
          )
        );

      }


      if (
        resultados[4].status ===
          "fulfilled"
      ) {

        setEntregas(
          normalizarLista(
            resultados[4].value,
            [
              "entregas",
            ]
          )
        );

      }


      if (
        resultados[5].status ===
          "fulfilled"
      ) {

        setDatosCaja(
          resultados[5].value ||
          null
        );

      }


      if (
        resultados[6].status ===
          "fulfilled"
      ) {

        setMovimientosCaja(
          normalizarLista(
            resultados[6].value,
            [
              "movimientos",
            ]
          )
        );

      }


      if (
        resultados[7].status ===
          "fulfilled"
      ) {

        setCuentasCartera(
          normalizarLista(
            resultados[7].value,
            [
              "cuentas",
              "cartera",
            ]
          )
        );

      }


      if (
        resultados[8].status ===
          "fulfilled"
      ) {

        setResumenCartera(
          resultados[8].value ||
          {}
        );

      }


      if (
        resultados[9].status ===
          "fulfilled"
      ) {

        setFacturables(
          normalizarLista(
            resultados[9].value,
            [
              "entregas",
              "disponibles",
            ]
          )
        );

      }


      if (
        resultados[10].status ===
          "fulfilled"
      ) {

        setRutas(
          normalizarLista(
            resultados[10].value,
            [
              "rutas",
            ]
          )
        );

      }


      resultados.forEach(
        (
          resultado,
          index
        ) => {

          if (
            resultado.status ===
              "rejected"
          ) {

            console.warn(
              `Dashboard: la consulta ${index + 1} no pudo cargarse.`,
              resultado.reason
            );

          }

        }
      );


    } catch (error) {

      console.error(
        "Error cargando Dashboard:",
        error
      );


    } finally {

      setCargando(
        false
      );

      setActualizando(
        false
      );

    }

  }


  useEffect(
    () => {

      cargarDashboard();

    },
    []
  );


  const rangos =
    useMemo(
      () => {

        const ahora =
          new Date();


        const inicioHoy =
          new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate()
          );


        const finHoy =
          new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            ahora.getDate(),
            23,
            59,
            59,
            999
          );


        const inicioAyer =
          new Date(
            inicioHoy
          );


        inicioAyer.setDate(
          inicioHoy.getDate() -
          1
        );


        const finAyer =
          new Date(
            inicioAyer.getFullYear(),
            inicioAyer.getMonth(),
            inicioAyer.getDate(),
            23,
            59,
            59,
            999
          );


        const inicioSemana =
          new Date(
            inicioHoy
          );


        inicioSemana.setDate(
          inicioHoy.getDate() -
          6
        );


        const inicioMes =
          new Date(
            ahora.getFullYear(),
            ahora.getMonth(),
            1
          );


        return {
          ahora,
          inicioHoy,
          finHoy,
          inicioAyer,
          finAyer,
          inicioSemana,
          inicioMes,
        };

      },
      []
    );


  const entregasCompletadas =
    useMemo(
      () =>
        entregas.filter(
          (
            entrega
          ) =>
            entrega.estado ===
            "Entregado"
        ),
      [
        entregas,
      ]
    );


  const entregasHoy =
    useMemo(
      () =>
        entregasCompletadas.filter(
          (
            entrega
          ) =>
            estaEntre(
              fechaEventoEntrega(
                entrega
              ),
              rangos.inicioHoy,
              rangos.finHoy
            )
        ),
      [
        entregasCompletadas,
        rangos,
      ]
    );


  const ventasHoy =
    useMemo(
      () =>
        entregasHoy.reduce(
          (
            total,
            entrega
          ) =>
            total +
            Number(
              entrega.total ||
              0
            ),
          0
        ),
      [
        entregasHoy,
      ]
    );


  const ventasHoyPorPago =
    useMemo(
      () => {

        const resultado = {
          Efectivo: 0,
          Transferencia: 0,
          Crédito: 0,
        };


        entregasHoy.forEach(
          (
            entrega
          ) => {

            const metodo =
              entrega.metodoPago ||
              "Efectivo";


            if (
              Object.prototype
                .hasOwnProperty.call(
                  resultado,
                  metodo
                )
            ) {

              resultado[
                metodo
              ] +=
                Number(
                  entrega.total ||
                  0
                );

            }

          }
        );


        return resultado;

      },
      [
        entregasHoy,
      ]
    );


  const ventasSemana =
    useMemo(
      () =>
        entregasCompletadas
          .filter(
            (
              entrega
            ) =>
              estaEntre(
                fechaEventoEntrega(
                  entrega
                ),
                rangos.inicioSemana,
                rangos.finHoy
              )
          )
          .reduce(
            (
              total,
              entrega
            ) =>
              total +
              Number(
                entrega.total ||
                0
              ),
            0
          ),
      [
        entregasCompletadas,
        rangos,
      ]
    );


  const ventasMes =
    useMemo(
      () =>
        entregasCompletadas
          .filter(
            (
              entrega
            ) =>
              estaEntre(
                fechaEventoEntrega(
                  entrega
                ),
                rangos.inicioMes,
                rangos.finHoy
              )
          )
          .reduce(
            (
              total,
              entrega
            ) =>
              total +
              Number(
                entrega.total ||
                0
              ),
            0
          ),
      [
        entregasCompletadas,
        rangos,
      ]
    );


  const entregasPorPreparar =
    entregas.filter(
      (
        entrega
      ) =>
        entrega.estado ===
        "Por preparar"
    ).length;


  const entregasPendientes =
    entregas.filter(
      (
        entrega
      ) =>
        entrega.estado ===
        "Pendiente"
    ).length;


  const entregasEnRuta =
    entregas.filter(
      (
        entrega
      ) =>
        entrega.estado ===
        "En ruta"
    ).length;


  const totalPorEntregar =
    entregasPorPreparar +
    entregasPendientes +
    entregasEnRuta;


  const pedidosBorrador =
    pedidos.filter(
      (
        pedido
      ) =>
        pedido.estado ===
        "Borrador"
    ).length;


  const pedidosPreparacion =
    pedidos.filter(
      (
        pedido
      ) =>
        pedido.estado ===
        "En preparación"
    ).length;


  const pedidosListos =
    pedidos.filter(
      (
        pedido
      ) =>
        pedido.estado ===
        "Listo para entrega"
    ).length;


  const clientesActivos =
    clientes.filter(
      (
        cliente
      ) =>
        cliente.estado !==
          false &&
        cliente.estado !==
          "Inactivo"
    ).length;


  const productosActivos =
    productos.filter(
      (
        producto
      ) =>
        producto.estado ===
          "Activo" ||
        producto.estado ===
          true
    );


  const stockBajo =
    productosActivos.filter(
      (
        producto
      ) => {

        const stock =
          Number(
            producto.stock ||
            0
          );


        const minimo =
          Number(
            producto.stockMinimo ||
            0
          );


        return (
          minimo > 0 &&
          stock <= minimo
        );

      }
    ).length;


  const saldoCartera =
    Number(
      resumenCartera
        ?.saldoPendiente ??
      cuentasCartera.reduce(
        (
          total,
          cuenta
        ) =>
          total +
          Number(
            cuenta.saldoPendiente ||
            0
          ),
        0
      )
    );


  const totalAbonadoCartera =
    Number(
      resumenCartera
        ?.totalAbonado ??
      cuentasCartera.reduce(
        (
          total,
          cuenta
        ) =>
          total +
          Number(
            cuenta.totalAbonado ||
            0
          ),
        0
      )
    );


  const carteraVencida =
    useMemo(
      () => {

        const vencidas =
          cuentasCartera.filter(
            (
              cuenta
            ) => {

              if (
                Number(
                  cuenta.saldoPendiente ||
                  0
                ) <= 0 ||
                !cuenta.fechaVencimiento
              ) {
                return false;
              }


              const fecha =
                new Date(
                  cuenta.fechaVencimiento
                );


              if (
                Number.isNaN(
                  fecha.getTime()
                )
              ) {
                return false;
              }


              fecha.setHours(
                0,
                0,
                0,
                0
              );


              return (
                fecha <
                rangos.inicioHoy
              );

            }
          );


        return {
          cantidad:
            vencidas.length,

          valor:
            vencidas.reduce(
              (
                total,
                cuenta
              ) =>
                total +
                Number(
                  cuenta.saldoPendiente ||
                  0
                ),
              0
            ),
        };

      },
      [
        cuentasCartera,
        rangos,
      ]
    );


  const cajaAbierta =
    Boolean(
      datosCaja?.abierta
    );


  const cajaActual =
    datosCaja?.caja ||
    null;


  const resumenCaja =
    datosCaja?.resumen ||
    {};


  const movimientosHoy =
    useMemo(
      () =>
        movimientosCaja
          .filter(
            (
              movimiento
            ) =>
              estaEntre(
                movimiento.createdAt,
                rangos.inicioHoy,
                rangos.finHoy
              )
          )
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.createdAt ||
                0
              ) -
              new Date(
                a.createdAt ||
                0
              )
          ),
      [
        movimientosCaja,
        rangos,
      ]
    );


  const movimientosRecientes =
    movimientosHoy.slice(
      0,
      6
    );


  const pedidosRecientes =
    useMemo(
      () =>
        [
          ...pedidos,
        ]
          .sort(
            (
              a,
              b
            ) =>
              new Date(
                b.createdAt ||
                0
              ) -
              new Date(
                a.createdAt ||
                0
              )
          )
          .slice(
            0,
            6
          ),
      [
        pedidos,
      ]
    );


  const creditosHoy =
    entregasHoy.filter(
      (
        entrega
      ) =>
        entrega.metodoPago ===
        "Crédito"
    ).length;


  const entregasAyer =
    useMemo(
      () =>
        entregasCompletadas.filter(
          (
            entrega
          ) =>
            estaEntre(
              fechaEventoEntrega(
                entrega
              ),
              rangos.inicioAyer,
              rangos.finAyer
            )
        ),
      [
        entregasCompletadas,
        rangos,
      ]
    );


  const ventasAyer =
    useMemo(
      () =>
        entregasAyer.reduce(
          (
            total,
            entrega
          ) =>
            total +
            Number(
              entrega.total ||
              0
            ),
          0
        ),
      [
        entregasAyer,
      ]
    );


  const creditosAyer =
    entregasAyer.filter(
      (
        entrega
      ) =>
        entrega.metodoPago ===
        "Crédito"
    ).length;


  const valorCreditoAyer =
    entregasAyer
      .filter(
        (
          entrega
        ) =>
          entrega.metodoPago ===
          "Crédito"
      )
      .reduce(
        (
          total,
          entrega
        ) =>
          total +
          Number(
            entrega.total ||
            0
          ),
        0
      );


  const comparativos =
    [
      {
        titulo:
          "Ventas",
        actual:
          moneda(
            ventasHoy
          ),
        anterior:
          moneda(
            ventasAyer
          ),
        ...variacionPorcentual(
          ventasHoy,
          ventasAyer
        ),
      },
      {
        titulo:
          "Entregas",
        actual:
          entregasHoy.length,
        anterior:
          entregasAyer.length,
        ...variacionCantidad(
          entregasHoy.length,
          entregasAyer.length
        ),
      },
      {
        titulo:
          "Crédito",
        actual:
          moneda(
            ventasHoyPorPago[
              "Crédito"
            ]
          ),
        anterior:
          moneda(
            valorCreditoAyer
          ),
        ...variacionPorcentual(
          ventasHoyPorPago[
            "Crédito"
          ],
          valorCreditoAyer
        ),
        detalle:
          `${creditosHoy} hoy · ${creditosAyer} ayer`,
      },
    ];


  const entregasAtrasadas =
    entregas.filter(
      (
        entrega
      ) => {

        if (
          ![
            "Por preparar",
            "Pendiente",
            "En ruta",
          ].includes(
            entrega.estado
          ) ||
          !entrega.fechaProgramada
        ) {
          return false;
        }


        const fechaProgramada =
          new Date(
            entrega.fechaProgramada
          );


        if (
          Number.isNaN(
            fechaProgramada.getTime()
          )
        ) {
          return false;
        }


        fechaProgramada.setHours(
          0,
          0,
          0,
          0
        );


        return (
          fechaProgramada <
          rangos.inicioHoy
        );

      }
    ).length;


  const pedidosListosAnteriores =
    pedidos.filter(
      (
        pedido
      ) => {

        if (
          pedido.estado !==
          "Listo para entrega"
        ) {
          return false;
        }


        const fechaCambio =
          new Date(
            pedido.updatedAt ||
            pedido.createdAt ||
            0
          );


        return (
          !Number.isNaN(
            fechaCambio.getTime()
          ) &&
          fechaCambio <
            rangos.inicioHoy
        );

      }
    ).length;


  const alertasAtencion =
    [
      {
        id:
          "cartera",
        titulo:
          "Cartera vencida",
        valor:
          carteraVencida.cantidad,
        detalle:
          moneda(
            carteraVencida.valor
          ),
        destino:
          "/cartera",
        activa:
          carteraVencida.cantidad >
          0,
        tipo:
          "danger",
      },
      {
        id:
          "entregas",
        titulo:
          "Entregas atrasadas",
        valor:
          entregasAtrasadas,
        detalle:
          "Con fecha programada anterior a hoy",
        destino:
          "/entregas",
        activa:
          entregasAtrasadas >
          0,
        tipo:
          "warning",
      },
      {
        id:
          "pedidos",
        titulo:
          "Pedidos listos anteriores",
        valor:
          pedidosListosAnteriores,
        detalle:
          "Listos para entrega antes de hoy",
        destino:
          "/pedidos",
        activa:
          pedidosListosAnteriores >
          0,
        tipo:
          "warning",
      },
      {
        id:
          "facturacion",
        titulo:
          "Facturación pendiente",
        valor:
          facturables.length,
        detalle:
          "Entregas disponibles para facturar",
        destino:
          "/facturacion",
        activa:
          facturables.length >
          0,
        tipo:
          "info",
      },
      {
        id:
          "stock",
        titulo:
          "Stock bajo",
        valor:
          stockBajo,
        detalle:
          "Producto(s) por revisar",
        destino:
          "/productos",
        activa:
          stockBajo >
          0,
        tipo:
          "warning",
      },
      {
        id:
          "caja",
        titulo:
          "Caja cerrada",
        valor:
          !cajaAbierta &&
          totalPorEntregar >
            0
            ? totalPorEntregar
            : 0,
        detalle:
          "Hay entregas pendientes de gestionar",
        destino:
          "/caja",
        activa:
          !cajaAbierta &&
          totalPorEntregar >
            0,
        tipo:
          "danger",
      },
    ].filter(
      (
        alerta
      ) =>
        alerta.activa
    );


  const nombresDias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];


  const diaAtencionActual =
    nombresDias[
      rangos.ahora.getDay()
    ];


  const rutasHoy =
    useMemo(
      () => {

        return rutas
          .filter(
            (
              ruta
            ) => {

              const activa =
                ruta.estado !==
                "Inactiva";


              const dias =
                Array.isArray(
                  ruta.diasAtencion
                )
                  ? ruta.diasAtencion
                  : [];


              return (
                activa &&
                dias.some(
                  (
                    dia
                  ) =>
                    normalizarComparable(
                      dia
                    ) ===
                    normalizarComparable(
                      diaAtencionActual
                    )
                )
              );

            }
          )
          .map(
            (
              ruta
            ) => {

              const zonasRuta =
                new Set(
                  (
                    Array.isArray(
                      ruta.zonasDespacho
                    )
                      ? ruta.zonasDespacho
                      : []
                  )
                    .map(
                      (
                        zona
                      ) =>
                        idReferencia(
                          zona
                        )
                    )
                    .filter(
                      Boolean
                    )
                );


              const clientesRuta =
                clientesActivos ===
                0
                  ? 0
                  : clientes.filter(
                      (
                        cliente
                      ) => {

                        const clienteActivo =
                          cliente.estado !==
                            false &&
                          cliente.estado !==
                            "Inactivo";


                        const zonaCliente =
                          idReferencia(
                            cliente.zonaDespacho
                          );


                        return (
                          clienteActivo &&
                          zonaCliente &&
                          zonasRuta.has(
                            zonaCliente
                          )
                        );

                      }
                    ).length;


              const pedidosListosRuta =
                pedidos.filter(
                  (
                    pedido
                  ) =>
                    pedido.estado ===
                      "Listo para entrega" &&
                    coincideRuta(
                      pedido,
                      ruta
                    )
                ).length;


              const entregasPendientesRuta =
                entregas.filter(
                  (
                    entrega
                  ) =>
                    [
                      "Por preparar",
                      "Pendiente",
                      "En ruta",
                    ].includes(
                      entrega.estado
                    ) &&
                    coincideRuta(
                      entrega,
                      ruta
                    )
                ).length;


              return {
                ...ruta,
                clientesRuta,
                pedidosListosRuta,
                entregasPendientesRuta,
              };

            }
          )
          .sort(
            (
              a,
              b
            ) =>
              String(
                a.nombre ||
                ""
              ).localeCompare(
                String(
                  b.nombre ||
                  ""
                ),
                "es"
              )
          );

      },
      [
        rutas,
        clientes,
        pedidos,
        entregas,
        clientesActivos,
        diaAtencionActual,
      ]
    );


  return (

    <section className="dashboard-page">

      <header className="dashboard-title-bar">

        <div className="dashboard-title-left">

          <ModulosMenu />

          <div className="dashboard-title-info">
            <h2>
              Dashboard
            </h2>

            <span>
              Resumen operativo de WebBuys
            </span>
          </div>

        </div>


        <div className="dashboard-title-actions">

          <button
            type="button"
            className="dashboard-refresh-btn"
            onClick={() =>
              cargarDashboard(
                false
              )
            }
            disabled={
              actualizando
            }
          >
            {actualizando
              ? "Actualizando..."
              : "Actualizar"}
          </button>


          <div className="dashboard-date">

            {new Date()
              .toLocaleDateString(
                "es-CO",
                {
                  weekday:
                    "long",
                  day:
                    "numeric",
                  month:
                    "long",
                  year:
                    "numeric",
                }
              )}

          </div>

        </div>

      </header>


      <main className="dashboard-content">

        {cargando ? (

          <div className="dashboard-loading">
            Cargando información del sistema...
          </div>

        ) : (

          <>

            <section className="dashboard-metrics">

              <button
                type="button"
                className="dashboard-metric dashboard-metric-sales"
                onClick={() =>
                  navigate(
                    "/caja"
                  )
                }
              >
                <span>
                  Ventas hoy
                </span>

                <strong>
                  {moneda(
                    ventasHoy
                  )}
                </strong>

                <small>
                  {entregasHoy.length} venta(s) entregada(s)
                </small>
              </button>


              <button
                type="button"
                className="dashboard-metric dashboard-metric-delivery"
                onClick={() =>
                  navigate(
                    "/entregas"
                  )
                }
              >
                <span>
                  Entregas
                </span>

                <strong>
                  {totalPorEntregar}
                </strong>

                <small>
                  {entregasHoy.length} entregada(s) hoy
                </small>
              </button>


              <button
                type="button"
                className={
                  `dashboard-metric dashboard-metric-wallet ${
                    carteraVencida
                      .cantidad >
                    0
                      ? "dashboard-metric-alert"
                      : ""
                  }`
                }
                onClick={() =>
                  navigate(
                    "/cartera"
                  )
                }
              >
                <span>
                  Cartera por cobrar
                </span>

                <strong>
                  {moneda(
                    saldoCartera
                  )}
                </strong>

                <small>
                  {carteraVencida.cantidad} cuenta(s) vencida(s)
                </small>
              </button>


              <button
                type="button"
                className={
                  `dashboard-metric dashboard-metric-cash ${
                    cajaAbierta
                      ? "dashboard-metric-open"
                      : "dashboard-metric-closed"
                  }`
                }
                onClick={() =>
                  navigate(
                    "/caja"
                  )
                }
              >
                <span>
                  Caja
                </span>

                <strong className="dashboard-cash-state">
                  {cajaAbierta
                    ? "ABIERTA"
                    : "CERRADA"}
                </strong>

                <small>
                  {cajaAbierta
                    ? `${cajaActual?.codigo || "Caja"} · ${moneda(
                        resumenCaja
                          .saldoActual
                      )}`
                    : "Abrir caja para registrar ventas"}
                </small>
              </button>

            </section>


            <section className="dashboard-day-summary">

              <div>
                <strong>
                  Atención de hoy · {diaAtencionActual}
                </strong>

                <span>
                  {cajaAbierta
                    ? `Caja abierta${cajaActual?.codigo ? ` · ${cajaActual.codigo}` : ""}`
                    : "Caja cerrada"}
                  {" · "}
                  {totalPorEntregar} entrega(s) pendiente(s)
                  {" · "}
                  {alertasAtencion.length} alerta(s)
                </span>
              </div>

              <small>
                {rutasHoy.length} ruta(s) programada(s) hoy
              </small>

            </section>


            <section className="dashboard-attention">

              <header className="dashboard-section-heading">

                <div>
                  <h3>
                    Requiere atención
                  </h3>

                  <span>
                    Pendientes que necesitan revisión operativa
                  </span>
                </div>

                <strong>
                  {alertasAtencion.length}
                </strong>

              </header>


              {alertasAtencion.length ===
              0 ? (

                <div className="dashboard-attention-ok">
                  No hay alertas operativas pendientes en este momento.
                </div>

              ) : (

                <div className="dashboard-attention-grid">

                  {alertasAtencion.map(
                    (
                      alerta
                    ) => (

                      <button
                        key={
                          alerta.id
                        }
                        type="button"
                        className={
                          `dashboard-attention-card dashboard-attention-${alerta.tipo}`
                        }
                        onClick={() =>
                          navigate(
                            alerta.destino
                          )
                        }
                      >

                        <div>
                          <span>
                            {alerta.titulo}
                          </span>

                          <strong>
                            {alerta.valor}
                          </strong>
                        </div>

                        <small>
                          {alerta.detalle}
                        </small>

                      </button>

                    )
                  )}

                </div>

              )}

            </section>


            <section className="dashboard-control-grid">

              <article className="dashboard-panel dashboard-routes-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Rutas de hoy
                    </h3>

                    <span>
                      Atención programada para {diaAtencionActual}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/entregas"
                      )
                    }
                  >
                    Ver entregas
                  </button>

                </header>


                {rutasHoy.length ===
                0 ? (

                  <div className="dashboard-empty dashboard-empty-small">
                    No hay rutas activas programadas para hoy.
                  </div>

                ) : (

                  <div className="dashboard-routes-list">

                    {rutasHoy.map(
                      (
                        ruta
                      ) => (

                        <div
                          key={
                            ruta._id ||
                            ruta.codigo ||
                            ruta.nombre
                          }
                          className="dashboard-route-card"
                        >

                          <div className="dashboard-route-main">

                            <div>
                              <strong>
                                {ruta.nombre ||
                                  "Ruta"}
                              </strong>

                              <span>
                                {Array.isArray(
                                  ruta.diasAtencion
                                )
                                  ? ruta.diasAtencion.join(
                                      " · "
                                    )
                                  : diaAtencionActual}
                              </span>
                            </div>

                            <b>
                              {ruta.codigo ||
                                "Ruta"}
                            </b>

                          </div>


                          <div className="dashboard-route-stats">

                            <div>
                              <span>
                                Clientes
                              </span>

                              <strong>
                                {ruta.clientesRuta}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Pedidos listos
                              </span>

                              <strong>
                                {ruta.pedidosListosRuta}
                              </strong>
                            </div>

                            <div>
                              <span>
                                Entregas pendientes
                              </span>

                              <strong>
                                {ruta.entregasPendientesRuta}
                              </strong>
                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

              </article>


              <article className="dashboard-panel dashboard-compare-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Hoy vs ayer
                    </h3>

                    <span>
                      Comparativo rápido de operación
                    </span>
                  </div>

                </header>


                <div className="dashboard-compare-list">

                  {comparativos.map(
                    (
                      item
                    ) => (

                      <div
                        key={
                          item.titulo
                        }
                        className="dashboard-compare-item"
                      >

                        <div className="dashboard-compare-copy">

                          <span>
                            {item.titulo}
                          </span>

                          <strong>
                            {item.actual}
                          </strong>

                          <small>
                            Ayer: {item.anterior}
                            {item.detalle
                              ? ` · ${item.detalle}`
                              : ""}
                          </small>

                        </div>


                        <div
                          className={
                            `dashboard-compare-variation ${item.tendencia}`
                          }
                        >
                          <b aria-hidden="true">
                            {item.tendencia ===
                            "up"
                              ? "↑"
                              : item.tendencia ===
                                "down"
                                ? "↓"
                                : "→"}
                          </b>

                          <span>
                            {item.texto}
                          </span>
                        </div>

                      </div>

                    )
                  )}

                </div>

              </article>

            </section>


            <section className="dashboard-grid">

              <article className="dashboard-panel dashboard-recent">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Pedidos recientes
                    </h3>

                    <span>
                      Últimos movimientos de Pedidos
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/pedidos"
                      )
                    }
                  >
                    Ver pedidos
                  </button>

                </header>


                <div className="dashboard-recent-list">

                  {pedidosRecientes.length ===
                  0 ? (

                    <div className="dashboard-empty">
                      No hay pedidos registrados.
                    </div>

                  ) : (

                    pedidosRecientes.map(
                      (
                        pedido
                      ) => (

                        <div
                          key={
                            pedido._id
                          }
                          className="dashboard-order"
                          onDoubleClick={() =>
                            navigate(
                              "/pedidos"
                            )
                          }
                        >

                          <div className="dashboard-order-code">

                            <strong>
                              {pedido.codigo ||
                                "Pedido"}
                            </strong>

                            <span>
                              {fechaCorta(
                                pedido.createdAt
                              )}
                            </span>

                          </div>


                          <div className="dashboard-order-client">

                            <strong>
                              {pedido.cliente
                                ?.nombre ||
                                pedido.cliente
                                  ?.nombres ||
                                "Sin cliente"}
                            </strong>

                            <span>
                              {pedido.items
                                ?.length ||
                                0} producto(s)
                            </span>

                          </div>


                          <span
                            className={
                              `dashboard-order-status dashboard-status-${claseEstado(
                                pedido.estado
                              )}`
                            }
                          >
                            {pedido.estado ||
                              "Sin estado"}
                          </span>


                          <strong className="dashboard-order-total">
                            {moneda(
                              pedido.total
                            )}
                          </strong>

                        </div>

                      )
                    )

                  )}

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">
                  <div>
                    <h3>
                      Estado de pedidos
                    </h3>

                    <span>
                      Flujo actual de preparación
                    </span>
                  </div>
                </header>


                <div className="dashboard-status-list dashboard-status-pedidos">

                  <div>
                    <span>
                      Borradores
                    </span>

                    <strong>
                      {pedidosBorrador}
                    </strong>
                  </div>


                  <div>
                    <span>
                      En preparación
                    </span>

                    <strong>
                      {pedidosPreparacion}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Listos para entrega
                    </span>

                    <strong>
                      {pedidosListos}
                    </strong>
                  </div>

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Estado de entregas
                    </h3>

                    <span>
                      Operación de despacho
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/entregas"
                      )
                    }
                  >
                    Ver entrega
                  </button>

                </header>


                <div className="dashboard-status-list dashboard-status-entregas">

                  <div>
                    <span>
                      Por preparar
                    </span>

                    <strong>
                      {entregasPorPreparar}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Pendientes
                    </span>

                    <strong>
                      {entregasPendientes}
                    </strong>
                  </div>


                  <div>
                    <span>
                      En ruta
                    </span>

                    <strong>
                      {entregasEnRuta}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Entregados hoy
                    </span>

                    <strong>
                      {entregasHoy.length}
                    </strong>
                  </div>

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Ventas reales
                    </h3>

                    <span>
                      Calculadas desde Entrega
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/caja"
                      )
                    }
                  >
                    Ver caja
                  </button>

                </header>


                <div className="dashboard-sales-list">

                  <div>
                    <span>
                      Hoy
                    </span>

                    <strong>
                      {moneda(
                        ventasHoy
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Últimos 7 días
                    </span>

                    <strong>
                      {moneda(
                        ventasSemana
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Este mes
                    </span>

                    <strong>
                      {moneda(
                        ventasMes
                      )}
                    </strong>
                  </div>


                  <div className="dashboard-sales-payment">
                    <span>
                      Efectivo hoy
                    </span>

                    <strong>
                      {moneda(
                        ventasHoyPorPago
                          .Efectivo
                      )}
                    </strong>
                  </div>


                  <div className="dashboard-sales-payment">
                    <span>
                      Transferencia hoy
                    </span>

                    <strong>
                      {moneda(
                        ventasHoyPorPago
                          .Transferencia
                      )}
                    </strong>
                  </div>


                  <div className="dashboard-sales-payment">
                    <span>
                      Crédito hoy
                    </span>

                    <strong>
                      {moneda(
                        ventasHoyPorPago[
                          "Crédito"
                        ]
                      )}
                    </strong>
                  </div>

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Cartera
                    </h3>

                    <span>
                      Créditos y recaudo
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/cartera"
                      )
                    }
                  >
                    Ver cartera
                  </button>

                </header>


                <div className="dashboard-wallet-list">

                  <div>
                    <span>
                      Saldo por cobrar
                    </span>

                    <strong>
                      {moneda(
                        saldoCartera
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Total abonado
                    </span>

                    <strong>
                      {moneda(
                        totalAbonadoCartera
                      )}
                    </strong>
                  </div>


                  <div
                    className={
                      carteraVencida
                        .cantidad >
                      0
                        ? "warning"
                        : ""
                    }
                  >
                    <span>
                      Vencida
                    </span>

                    <strong>
                      {moneda(
                        carteraVencida.valor
                      )}
                    </strong>

                    <small>
                      {carteraVencida.cantidad} cuenta(s)
                    </small>
                  </div>


                  <div>
                    <span>
                      Cuentas activas
                    </span>

                    <strong>
                      {resumenCartera
                        ?.pendientes ??
                        cuentasCartera
                          .filter(
                            (
                              cuenta
                            ) =>
                              Number(
                                cuenta.saldoPendiente ||
                                0
                              ) >
                              0
                          )
                          .length}
                    </strong>
                  </div>

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Caja de hoy
                    </h3>

                    <span>
                      Estado y movimientos recientes
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/caja"
                      )
                    }
                  >
                    Ver caja
                  </button>

                </header>


                <div className="dashboard-cash-summary">

                  <div>
                    <span>
                      Estado
                    </span>

                    <strong
                      className={
                        cajaAbierta
                          ? "open"
                          : "closed"
                      }
                    >
                      {cajaAbierta
                        ? "Abierta"
                        : "Cerrada"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Código
                    </span>

                    <strong>
                      {cajaActual?.codigo ||
                        "—"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Efectivo esperado
                    </span>

                    <strong>
                      {moneda(
                        resumenCaja
                          .saldoActual
                      )}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Ventas en caja
                    </span>

                    <strong>
                      {moneda(
                        resumenCaja
                          .totalVentasEntregadas
                      )}
                    </strong>
                  </div>

                </div>


                <div className="dashboard-activity-list">

                  {movimientosRecientes
                    .length ===
                  0 ? (

                    <div className="dashboard-empty dashboard-empty-small">
                      No hay movimientos de caja hoy.
                    </div>

                  ) : (

                    movimientosRecientes.map(
                      (
                        movimiento
                      ) => (

                        <div
                          key={
                            movimiento._id
                          }
                          className="dashboard-activity"
                        >

                          <div>
                            <strong>
                              {movimiento.concepto ||
                                movimiento.origen ||
                                "Movimiento"}
                            </strong>

                            <span>
                              {fechaHora(
                                movimiento.createdAt
                              )}
                            </span>
                          </div>


                          <div>
                            <small>
                              {movimiento.metodoPago ||
                                movimiento.tipo ||
                                ""}
                            </small>

                            <strong
                              className={
                                movimiento.tipo ===
                                  "Egreso"
                                  ? "expense"
                                  : ""
                              }
                            >
                              {movimiento.tipo ===
                                "Egreso"
                                ? "− "
                                : "+ "}
                              {moneda(
                                movimiento.valor
                              )}
                            </strong>
                          </div>

                        </div>

                      )
                    )

                  )}

                </div>

              </article>


              <article className="dashboard-panel">

                <header className="dashboard-panel-header">

                  <div>
                    <h3>
                      Inventario
                    </h3>

                    <span>
                      Estado general
                    </span>
                  </div>


                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/productos"
                      )
                    }
                  >
                    Ver productos
                  </button>

                </header>


                <div className="dashboard-inventory-list">

                  <div>
                    <span>
                      Productos activos
                    </span>

                    <strong>
                      {productosActivos
                        .length}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Stock bajo
                    </span>

                    <strong>
                      {stockBajo}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Categorías
                    </span>

                    <strong>
                      {categorias.length}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Clientes activos
                    </span>

                    <strong>
                      {clientesActivos}
                    </strong>
                  </div>

                </div>

              </article>

            </section>

          </>

        )}

      </main>

    </section>

  );

}
