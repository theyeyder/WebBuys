import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import AppLayout
  from "../layouts/AppLayout.jsx";

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

import "../styles/dashboard.css";


/* =========================================
   MONEDA
========================================= */

function moneda(valor) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(valor || 0)
  );

}


/* =========================================
   COMPONENTE
========================================= */

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
    cargando,
    setCargando,
  ] = useState(true);


  /* =========================================
     CARGAR INFORMACIÓN
  ========================================= */

  useEffect(() => {

    async function cargarDashboard() {

      try {

        setCargando(true);


        const resultados =
          await Promise.allSettled([

            listarPedidos(),

            listarClientes(),

            listarProductos(),

            listarCategorias(),

          ]);


        /* PEDIDOS */

        if (
          resultados[0].status ===
          "fulfilled"
        ) {

          const data =
            resultados[0].value;

          setPedidos(
            Array.isArray(data)
              ? data
              : data?.pedidos ||
                data?.data ||
                []
          );

        }


        /* CLIENTES */

        if (
          resultados[1].status ===
          "fulfilled"
        ) {

          const data =
            resultados[1].value;

          setClientes(
            Array.isArray(data)
              ? data
              : data?.clientes ||
                data?.data ||
                []
          );

        }


        /* PRODUCTOS */

        if (
          resultados[2].status ===
          "fulfilled"
        ) {

          const data =
            resultados[2].value;

          setProductos(
            Array.isArray(data)
              ? data
              : data?.productos ||
                data?.data ||
                []
          );

        }


        /* CATEGORÍAS */

        if (
          resultados[3].status ===
          "fulfilled"
        ) {

          const data =
            resultados[3].value;

          setCategorias(
            Array.isArray(data)
              ? data
              : data?.categorias ||
                data?.data ||
                []
          );

        }


      } catch (error) {

        console.error(
          "Error cargando Dashboard:",
          error
        );


      } finally {

        setCargando(false);

      }

    }


    cargarDashboard();

  }, []);


  /* =========================================
     FECHA ACTUAL
  ========================================= */

  const hoy =
    useMemo(() => {

      const fecha =
        new Date();

      return {
        inicio:
          new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
          ),

        fin:
          new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate(),
            23,
            59,
            59,
            999
          ),
      };

    }, []);


  /* =========================================
     PEDIDOS DE HOY
  ========================================= */

  const pedidosHoy =
    useMemo(
      () =>
        pedidos.filter(
          (pedido) => {

            if (!pedido.createdAt) {
              return false;
            }


            const fecha =
              new Date(
                pedido.createdAt
              );


            return (
              fecha >= hoy.inicio &&
              fecha <= hoy.fin
            );

          }
        ),

      [
        pedidos,
        hoy,
      ]
    );


  /* =========================================
     VENTAS DEL DÍA
  ========================================= */

  const ventasHoy =
    useMemo(
      () =>
        pedidosHoy
          .filter(
            (pedido) =>
              pedido.estado !==
              "Cancelado"
          )
          .reduce(
            (
              total,
              pedido
            ) =>
              total +
              Number(
                pedido.total || 0
              ),

            0
          ),

      [pedidosHoy]
    );


  /* =========================================
     ESTADOS
  ========================================= */

  const pendientes =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "Pendiente"
    ).length;


  const preparacion =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "En preparación"
    ).length;


  const enRuta =
    pedidos.filter(
      (pedido) =>
        pedido.estado ===
        "En ruta"
    ).length;


  const entregadosHoy =
    pedidosHoy.filter(
      (pedido) =>
        pedido.estado ===
        "Entregado"
    ).length;


  const porEntregar =
    pendientes +
    preparacion +
    enRuta;


  /* =========================================
     CLIENTES ACTIVOS
  ========================================= */

  const clientesActivos =
    clientes.filter(
      (cliente) =>
        cliente.estado !== false &&
        cliente.estado !== "Inactivo"
    ).length;


  /* =========================================
     PRODUCTOS ACTIVOS
  ========================================= */

  const productosActivos =
    productos.filter(
      (producto) =>
        producto.estado ===
          "Activo" ||
        producto.estado ===
          true
    );


  /* =========================================
     STOCK BAJO
  ========================================= */

  const stockBajo =
    productosActivos.filter(
      (producto) => {

        const stock =
          Number(
            producto.stock || 0
          );

        const minimo =
          Number(
            producto.stockMinimo || 0
          );


        return (
          minimo > 0 &&
          stock <= minimo
        );

      }
    ).length;


  /* =========================================
     PEDIDOS RECIENTES
  ========================================= */

  const pedidosRecientes =
    useMemo(
      () =>
        [...pedidos]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ) -
              new Date(
                a.createdAt || 0
              )
          )
          .slice(
            0,
            6
          ),

      [pedidos]
    );


  /* =========================================
     SEMANA
  ========================================= */

  const ventasSemana =
    useMemo(() => {

      const ahora =
        new Date();


      const inicio =
        new Date(
          ahora.getFullYear(),
          ahora.getMonth(),
          ahora.getDate() - 6
        );


      return pedidos
        .filter(
          (pedido) => {

            if (
              !pedido.createdAt ||
              pedido.estado ===
                "Cancelado"
            ) {
              return false;
            }


            return (
              new Date(
                pedido.createdAt
              ) >= inicio
            );

          }
        )
        .reduce(
          (
            total,
            pedido
          ) =>
            total +
            Number(
              pedido.total || 0
            ),

          0
        );

    }, [pedidos]);


  /* =========================================
     MES
  ========================================= */

  const ventasMes =
    useMemo(() => {

      const ahora =
        new Date();


      return pedidos
        .filter(
          (pedido) => {

            if (
              !pedido.createdAt ||
              pedido.estado ===
                "Cancelado"
            ) {
              return false;
            }


            const fecha =
              new Date(
                pedido.createdAt
              );


            return (
              fecha.getMonth() ===
                ahora.getMonth() &&
              fecha.getFullYear() ===
                ahora.getFullYear()
            );

          }
        )
        .reduce(
          (
            total,
            pedido
          ) =>
            total +
            Number(
              pedido.total || 0
            ),

          0
        );

    }, [pedidos]);


  /* =========================================
     RENDER
  ========================================= */

  return (

    <AppLayout title="Dashboard">

      <section className="dashboard-page">


        {/* MENÚ MÓDULOS */}

        <ModulosMenu />


        {/* CABECERA */}

        <div className="dashboard-title-bar">

          <div className="dashboard-title-info">

            <h2>
              Dashboard
            </h2>

          </div>


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


        {/* CONTENIDO */}

        <div className="dashboard-content">


          {cargando ? (

            <div className="dashboard-loading">

              Cargando información...

            </div>

          ) : (

            <>


              {/* ==========================
                  MÉTRICAS PRINCIPALES
              ========================== */}

              <section className="dashboard-metrics">


                <button
                  type="button"
                  className="dashboard-metric"
                  onClick={() =>
                    navigate(
                      "/pedidos"
                    )
                  }
                >

                  <span>
                    Pedidos hoy
                  </span>

                  <strong>
                    {
                      pedidosHoy.length
                    }
                  </strong>

                  <small>
                    Pedidos registrados hoy
                  </small>

                </button>


                <button
                  type="button"
                  className="dashboard-metric dashboard-metric-primary"
                  onClick={() =>
                    navigate(
                      "/pedidos"
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
                    Sin pedidos cancelados
                  </small>

                </button>


                <button
                  type="button"
                  className="dashboard-metric"
                  onClick={() =>
                    navigate(
                      "/pedidos"
                    )
                  }
                >

                  <span>
                    Por entregar
                  </span>

                  <strong>
                    {
                      porEntregar
                    }
                  </strong>

                  <small>
                    Pendientes, preparación y ruta
                  </small>

                </button>


                <button
                  type="button"
                  className="dashboard-metric"
                  onClick={() =>
                    navigate(
                      "/clientes"
                    )
                  }
                >

                  <span>
                    Clientes
                  </span>

                  <strong>
                    {
                      clientesActivos
                    }
                  </strong>

                  <small>
                    Clientes activos
                  </small>

                </button>

              </section>


              {/* ==========================
                  ZONA PRINCIPAL
              ========================== */}

              <section className="dashboard-grid">


                {/* PEDIDOS RECIENTES */}

                <article className="dashboard-panel dashboard-recent">

                  <header className="dashboard-panel-header">

                    <div>

                      <h3>
                        Pedidos recientes
                      </h3>

                      <span>
                        Últimos movimientos
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
                        (pedido) => (

                          <div
                            key={
                              pedido._id
                            }
                            className="dashboard-order"
                          >

                            <div className="dashboard-order-code">

                              <strong>
                                {pedido.codigo ||
                                  "Pedido"}
                              </strong>

                              <span>

                                {pedido.createdAt
                                  ? new Date(
                                      pedido.createdAt
                                    )
                                      .toLocaleDateString(
                                        "es-CO"
                                      )
                                  : ""}

                              </span>

                            </div>


                            <div className="dashboard-order-client">

                              <strong>

                                {pedido.cliente
                                  ?.nombre ||
                                  "Cliente"}

                              </strong>

                              <span>

                                {pedido.items
                                  ?.length ||
                                  0}

                                {" "}

                                producto(s)

                              </span>

                            </div>


                            <span
                              className={`dashboard-order-status dashboard-status-${String(
                                pedido.estado ||
                                  ""
                              )
                                .toLowerCase()
                                .replaceAll(
                                  " ",
                                  "-"
                                )
                                .normalize(
                                  "NFD"
                                )
                                .replace(
                                  /[\u0300-\u036f]/g,
                                  ""
                                )}`}
                            >

                              {pedido.estado}

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


                {/* ESTADO PEDIDOS */}

                <article className="dashboard-panel">

                  <header className="dashboard-panel-header">

                    <div>

                      <h3>
                        Estado de pedidos
                      </h3>

                      <span>
                        Pedidos actuales
                      </span>

                    </div>

                  </header>


                  <div className="dashboard-status-list">


                    <div>

                      <span>
                        Pendientes
                      </span>

                      <strong>
                        {pendientes}
                      </strong>

                    </div>


                    <div>

                      <span>
                        En preparación
                      </span>

                      <strong>
                        {preparacion}
                      </strong>

                    </div>


                    <div>

                      <span>
                        En ruta
                      </span>

                      <strong>
                        {enRuta}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Entregados hoy
                      </span>

                      <strong>
                        {entregadosHoy}
                      </strong>

                    </div>

                  </div>

                </article>


                {/* RESUMEN VENTAS */}

                <article className="dashboard-panel">

                  <header className="dashboard-panel-header">

                    <div>

                      <h3>
                        Resumen de ventas
                      </h3>

                      <span>
                        Movimiento comercial
                      </span>

                    </div>

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

                  </div>

                </article>


                {/* INVENTARIO */}

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
                        {
                          productosActivos
                            .length
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Stock bajo
                      </span>

                      <strong>
                        {
                          stockBajo
                        }
                      </strong>

                    </div>


                    <div>

                      <span>
                        Categorías
                      </span>

                      <strong>
                        {
                          categorias.length
                        }
                      </strong>

                    </div>

                  </div>

                </article>


              </section>

            </>

          )}

        </div>

      </section>

    </AppLayout>

  );

}