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
  listarFacturas,
} from "../services/factura.service.js";

import buscarIcon
  from "../assets/icons/buscar.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";

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
    facturas,
    setFacturas,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    buscarAbierto,
    setBuscarAbierto,
  ] = useState(false);


  const [
    textoBuscar,
    setTextoBuscar,
  ] = useState("");


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

            listarFacturas(),

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


        /* FACTURAS */

        if (
          resultados[4].status ===
          "fulfilled"
        ) {

          const data =
            resultados[4].value;

          setFacturas(
            Array.isArray(data)
              ? data
              : data?.facturas ||
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
     FACTURAS VÁLIDAS DE HOY
  ========================================= */

  const facturasHoy =
    useMemo(
      () =>
        facturas.filter(
          (factura) => {

            if (
              !factura.createdAt ||
              factura.estado ===
                "Anulada"
            ) {
              return false;
            }


            const fecha =
              new Date(
                factura.createdAt
              );


            return (
              fecha >= hoy.inicio &&
              fecha <= hoy.fin
            );

          }
        ),

      [
        facturas,
        hoy,
      ]
    );


  /* =========================================
     VENTAS DEL DÍA
  ========================================= */

  const ventasHoy =
    useMemo(
      () =>
        facturasHoy.reduce(
          (
            total,
            factura
          ) =>
            total +
            Number(
              factura.total || 0
            ),

          0
        ),

      [facturasHoy]
    );


  /* =========================================
     VENTAS DE HOY POR TIPO DE PAGO
  ========================================= */

  const ventasHoyPorPago =
    useMemo(() => {

      const resultado = {
        Efectivo: 0,
        Transferencia: 0,
        Crédito: 0,
      };


      facturasHoy.forEach(
        (factura) => {

          const metodo =
            factura.metodoPago ||
            "Efectivo";


          if (
            Object.prototype
              .hasOwnProperty.call(
                resultado,
                metodo
              )
          ) {

            resultado[metodo] +=
              Number(
                factura.total || 0
              );

          }

        }
      );


      return resultado;

    }, [facturasHoy]);


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


      inicio.setHours(
        0,
        0,
        0,
        0
      );


      return facturas
        .filter(
          (factura) => {

            if (
              !factura.createdAt ||
              factura.estado ===
                "Anulada"
            ) {
              return false;
            }


            return (
              new Date(
                factura.createdAt
              ) >= inicio
            );

          }
        )
        .reduce(
          (
            total,
            factura
          ) =>
            total +
            Number(
              factura.total || 0
            ),

          0
        );

    }, [facturas]);


  /* =========================================
     MES
  ========================================= */

  const ventasMes =
    useMemo(() => {

      const ahora =
        new Date();


      return facturas
        .filter(
          (factura) => {

            if (
              !factura.createdAt ||
              factura.estado ===
                "Anulada"
            ) {
              return false;
            }


            const fecha =
              new Date(
                factura.createdAt
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
            factura
          ) =>
            total +
            Number(
              factura.total || 0
            ),

          0
        );

    }, [facturas]);


  /* =========================================
     BÚSQUEDA GLOBAL
  ========================================= */

  const resultadosBusqueda =
    useMemo(() => {

      const texto =
        textoBuscar
          .trim()
          .toLowerCase();

      if (!texto) {
        return [];
      }


      const resultados = [];


      clientes.forEach(
        (cliente) => {

          const nombre =
            String(
              cliente.nombre ||
              `${cliente.nombres || ""} ${cliente.apellidos || ""}`
            )
              .trim()
              .toLowerCase();

          const documento =
            String(
              cliente.documento || ""
            ).toLowerCase();

          if (
            nombre.includes(texto) ||
            documento.includes(texto)
          ) {

            resultados.push({
              id: `cliente-${cliente._id}`,
              tipo: "Cliente",
              titulo:
                cliente.nombre ||
                `${cliente.nombres || ""} ${cliente.apellidos || ""}`.trim() ||
                "Cliente",
              detalle:
                cliente.documento
                  ? `Documento: ${cliente.documento}`
                  : "Cliente registrado",
              ruta: "/clientes",
            });

          }

        }
      );


      productos.forEach(
        (producto) => {

          const codigo =
            String(
              producto.codigo || ""
            ).toLowerCase();

          const nombre =
            String(
              producto.nombre || ""
            ).toLowerCase();

          if (
            codigo.includes(texto) ||
            nombre.includes(texto)
          ) {

            resultados.push({
              id: `producto-${producto._id}`,
              tipo: "Producto",
              titulo:
                producto.nombre ||
                "Producto",
              detalle:
                producto.codigo
                  ? `Código: ${producto.codigo}`
                  : "Producto registrado",
              ruta: "/productos",
            });

          }

        }
      );


      pedidos.forEach(
        (pedido) => {

          const codigo =
            String(
              pedido.codigo || ""
            ).toLowerCase();

          const cliente =
            String(
              pedido.cliente?.nombre ||
              pedido.cliente?.nombres ||
              ""
            ).toLowerCase();

          if (
            codigo.includes(texto) ||
            cliente.includes(texto)
          ) {

            resultados.push({
              id: `pedido-${pedido._id}`,
              tipo: "Pedido",
              titulo:
                pedido.codigo ||
                "Pedido",
              detalle:
                pedido.cliente?.nombre ||
                pedido.cliente?.nombres ||
                pedido.estado ||
                "Pedido registrado",
              ruta: "/pedidos",
            });

          }

        }
      );


      categorias.forEach(
        (categoria) => {

          const nombre =
            String(
              categoria.nombre || ""
            ).toLowerCase();

          if (
            nombre.includes(texto)
          ) {

            resultados.push({
              id: `categoria-${categoria._id}`,
              tipo: "Categoría",
              titulo:
                categoria.nombre ||
                "Categoría",
              detalle:
                categoria.estado ||
                "Categoría registrada",
              ruta: "/categorias",
            });

          }

        }
      );


      return resultados.slice(
        0,
        30
      );

    }, [
      textoBuscar,
      clientes,
      productos,
      pedidos,
      categorias,
    ]);


  function abrirBuscarGlobal() {

    setTextoBuscar("");
    setBuscarAbierto(true);

  }


  function irAResultado(
    resultado
  ) {

    setBuscarAbierto(false);
    setTextoBuscar("");

    navigate(
      resultado.ruta
    );

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="dashboard-page">


        {/* CABECERA */}

        <div className="dashboard-title-bar">

          <div className="dashboard-title-left">

            <ModulosMenu />

            <div className="dashboard-title-info">

              <h2>
                Dashboard
              </h2>

            </div>

          </div>


          <div className="dashboard-title-actions">

            <button
              type="button"
              className="dashboard-search-btn"
              onClick={abrirBuscarGlobal}
              aria-label="Buscar"
              data-tooltip="Buscar"
            >
              <img
                src={buscarIcon}
                alt=""
              />
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
                    Facturas emitidas hoy
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


        {/* MODAL BUSCAR GLOBAL */}

        {buscarAbierto && (

          <div className="dashboard-search-overlay">

            <div className="dashboard-search-modal">

              <div className="dashboard-search-header">

                <h3>
                  Buscar en WebBuys
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setBuscarAbierto(false)
                  }
                >
                  <img
                    src={cerrarIcon}
                    alt=""
                  />
                </button>

              </div>


              <div className="dashboard-search-box">

                <img
                  src={buscarIcon}
                  alt=""
                />

                <input
                  type="text"
                  value={textoBuscar}
                  onChange={(event) =>
                    setTextoBuscar(
                      event.target.value
                    )
                  }
                  placeholder="Buscar cliente, producto, pedido o categoría..."
                  autoFocus
                />

              </div>


              <div className="dashboard-search-results">

                {!textoBuscar.trim() ? (

                  <div className="dashboard-search-empty">
                    Escribe para buscar en WebBuys.
                  </div>

                ) : resultadosBusqueda.length === 0 ? (

                  <div className="dashboard-search-empty">
                    No se encontraron resultados.
                  </div>

                ) : (

                  resultadosBusqueda.map(
                    (resultado) => (

                      <button
                        type="button"
                        key={resultado.id}
                        className="dashboard-search-result"
                        onClick={() =>
                          irAResultado(
                            resultado
                          )
                        }
                      >

                        <span className="dashboard-search-result-type">
                          {resultado.tipo}
                        </span>

                        <strong>
                          {resultado.titulo}
                        </strong>

                        <small>
                          {resultado.detalle}
                        </small>

                      </button>

                    )
                  )

                )}

              </div>

            </div>

          </div>

        )}

    </section>

  );

}