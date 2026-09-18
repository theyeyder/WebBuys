import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarPedidos,
} from "../services/pedido.service.js";

import {
  listarFacturas,
  crearFactura,
  anularFactura,
  revertirFactura,
} from "../services/factura.service.js";

import {
  imprimirFactura,
} from "../utils/facturaImpresion.js";

import "../styles/facturacion.css";


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
   FECHA
========================================= */

function fechaColombia(fecha) {

  if (!fecha) {
    return "-";
  }


  return new Date(
    fecha
  ).toLocaleDateString(
    "es-CO"
  );

}



/* =========================================
   NOMBRE DEL PERSONAL
========================================= */

function obtenerNombrePersonal(
  persona
) {

  if (!persona) {
    return "Sin asignar";
  }


  if (
    typeof persona === "string"
  ) {
    return persona;
  }


  if (
    persona.nombres ||
    persona.apellidos
  ) {

    return `${persona.nombres || ""} ${
      persona.apellidos || ""
    }`.trim();

  }


  return (
    persona.nombre ||
    persona.nombreCompleto ||
    "Sin asignar"
  );

}


/* =========================================
   COMPONENTE
========================================= */

export default function Facturacion() {

  const [
    facturas,
    setFacturas,
  ] = useState([]);


  const [
    pedidos,
    setPedidos,
  ] = useState([]);


  const [
    pedidoSeleccionado,
    setPedidoSeleccionado,
  ] = useState(null);


  const [
    filtro,
    setFiltro,
  ] = useState("");


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    generando,
    setGenerando,
  ] = useState(false);


  const [
    procesandoFactura,
    setProcesandoFactura,
  ] = useState(null);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState("info");


  /* =========================================
     CARGAR DATOS
  ========================================= */

  async function cargarDatos() {

    try {

      setCargando(
        true
      );


      const [
        dataPedidos,
        dataFacturas,
      ] =
        await Promise.all([

          listarPedidos(),

          listarFacturas(),

        ]);


      const listaPedidos =
        Array.isArray(
          dataPedidos
        )
          ? dataPedidos
          : dataPedidos?.pedidos ||
            dataPedidos?.data ||
            [];


      const listaFacturas =
        Array.isArray(
          dataFacturas
        )
          ? dataFacturas
          : dataFacturas?.facturas ||
            dataFacturas?.data ||
            [];


      setPedidos(
        listaPedidos
      );


      setFacturas(
        listaFacturas
      );


    } catch (error) {

      console.error(
        "Error cargando facturación:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible cargar el módulo de facturación."
      );


      setTipoMensaje(
        "error"
      );


    } finally {

      setCargando(
        false
      );

    }

  }


  useEffect(() => {

    cargarDatos();

  }, []);


  /* =========================================
     CERRAR TOAST
  ========================================= */

  useEffect(() => {

    if (!mensaje) {
      return;
    }


    const timer =
      setTimeout(
        () =>
          setMensaje(""),
        3000
      );


    return () =>
      clearTimeout(
        timer
      );

  }, [
    mensaje,
  ]);


  /* =========================================
     PEDIDOS BLOQUEADOS PARA FACTURAR
  ========================================= */

  const pedidosFacturados =
    useMemo(
      () =>
        new Set(
          facturas

            /*
              BLOQUEAMOS EL PEDIDO CUANDO:

              1. Tiene una factura activa.

              2. Tiene una factura anulada
                 pero todavía NO se ha
                 presionado Revertir.

              NO BLOQUEAMOS:

              Factura Anulada +
              fechaReversion existente.

              Eso significa que el pedido
              puede volver a facturarse.
            */

            .filter(
              (factura) =>
                factura.estado !==
                  "Anulada" ||
                !factura.fechaReversion
            )

            .map(
              (factura) =>
                factura.pedido?._id ||
                factura.pedido
            )

            .filter(
              Boolean
            )
        ),

      [
        facturas,
      ]
    );


  /* =========================================
     PEDIDOS DISPONIBLES PARA FACTURAR
  ========================================= */

  const pedidosDisponibles =
    useMemo(() => {

      return pedidos.filter(
        (pedido) =>
          pedido.estado ===
            "Entregado" &&
          !pedidosFacturados.has(
            pedido._id
          )
      );

    }, [
      pedidos,
      pedidosFacturados,
    ]);


  /* =========================================
     FILTRAR PEDIDOS
  ========================================= */

  const pedidosFiltrados =
    useMemo(() => {

      const texto =
        filtro
          .trim()
          .toLowerCase();


      if (!texto) {

        return pedidosDisponibles;

      }


      return pedidosDisponibles.filter(
        (pedido) => {

          const cliente =
            pedido.cliente ||
            {};


          const valores = [

            pedido.codigo,

            cliente.nombre,

            cliente.documento,

            cliente.telefono,

            pedido.total,

          ];


          return valores.some(
            (valor) =>
              String(
                valor || ""
              )
                .toLowerCase()
                .includes(
                  texto
                )
          );

        }
      );

    }, [
      pedidosDisponibles,
      filtro,
    ]);


  /* =========================================
     SELECCIONAR PEDIDO
  ========================================= */

  function seleccionarPedido(
    pedido
  ) {

    setPedidoSeleccionado(
      pedido
    );

  }


  /* =========================================
     GENERAR FACTURA
  ========================================= */

  async function generarFactura() {

    if (
      !pedidoSeleccionado
    ) {

      setMensaje(
        "Seleccione primero un pedido entregado."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    if (
      pedidoSeleccionado.estado !==
      "Entregado"
    ) {

      setMensaje(
        "Solo se pueden facturar pedidos entregados."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    if (
      pedidosFacturados.has(
        pedidoSeleccionado._id
      )
    ) {

      setMensaje(
        "Este pedido ya tiene una factura generada."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const confirmar =
      window.confirm(
        `¿Deseas generar la factura del pedido ${pedidoSeleccionado.codigo}?`
      );


    if (!confirmar) {
      return;
    }


    try {

      setGenerando(
        true
      );


      await crearFactura({

        pedido:
          pedidoSeleccionado._id,

      });


      setMensaje(
        "Factura generada correctamente."
      );


      setTipoMensaje(
        "success"
      );


      setPedidoSeleccionado(
        null
      );


      await cargarDatos();


    } catch (error) {

      console.error(
        "Error generando factura:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible generar la factura."
      );


      setTipoMensaje(
        "error"
      );


    } finally {

      setGenerando(
        false
      );

    }

  }



  /* =========================================
     ANULAR FACTURA
  ========================================= */

  async function manejarAnularFactura(
    factura
  ) {

    const motivo =
      window.prompt(
        `Indique el motivo de anulación de la factura ${factura.codigo}:`
      );


    if (motivo === null) {
      return;
    }


    if (!motivo.trim()) {

      setMensaje(
        "Debe indicar el motivo de anulación."
      );

      setTipoMensaje(
        "error"
      );

      return;
    }


    try {

      setProcesandoFactura(
        factura._id
      );


      await anularFactura(
        factura._id,
        motivo.trim()
      );


      setMensaje(
        `Factura ${factura.codigo} anulada correctamente.`
      );

      setTipoMensaje(
        "success"
      );


      await cargarDatos();


    } catch (error) {

      console.error(
        "Error anulando factura:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible anular la factura."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setProcesandoFactura(
        null
      );

    }

  }


  /* =========================================
     REVERTIR FACTURA
  ========================================= */

  async function manejarRevertirFactura(
    factura
  ) {

    const confirmar =
      window.confirm(
        `¿Deseas habilitar nuevamente el pedido ${factura.pedido?.codigo || factura.pedidoCodigo || ""} para generar una nueva factura?\n\nLa factura ${factura.codigo} continuará anulada.`
      );


    if (!confirmar) {
      return;
    }


    try {

      setProcesandoFactura(
        factura._id
      );


      await revertirFactura(
        factura._id
      );


      setMensaje(
        `El pedido ${
          factura.pedido?.codigo ||
          factura.pedidoCodigo ||
          ""
        } quedó habilitado para generar una nueva factura.`
      );

      setTipoMensaje(
        "success"
      );


      await cargarDatos();


    } catch (error) {

      console.error(
        "Error revirtiendo factura:",
        error
      );


      setMensaje(
        error?.response?.data?.mensaje ||
        "No fue posible revertir la factura."
      );

      setTipoMensaje(
        "error"
      );


    } finally {

      setProcesandoFactura(
        null
      );

    }

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="facturacion-page">


      {/* =====================================
          CABECERA
      ====================================== */}

      <header className="facturacion-header">

        <div className="facturacion-header-left">

          <ModulosMenu />

          <h1>
            Facturación
          </h1>

        </div>

      </header>


      {/* =====================================
          CONTENIDO
      ====================================== */}

      <main className="facturacion-content">


        {/* =====================================
            BARRA DE ACCIONES
        ====================================== */}

        <div className="facturacion-actions-bar">

          <div>

            <h2>
              Pedidos para facturar
            </h2>

            

          </div>


          <button
            type="button"
            className="facturacion-generar-btn"
            disabled={
              !pedidoSeleccionado ||
              generando
            }
            onClick={
              generarFactura
            }
          >

            {generando
              ? "Generando..."
              : "Generar factura"}

          </button>

        </div>


        {/* =====================================
            CONTENIDO
        ===================================== */}

        <div className="facturacion-layout">


          {/* =====================================
              PEDIDOS ENTREGADOS
          ===================================== */}

          <section className="facturacion-panel facturacion-pedidos-panel">

            <div className="facturacion-panel-header">

              <div>

                <h3>
                  Pedidos entregados
                </h3>

                <span>
                  {
                    pedidosDisponibles.length
                  } pendiente(s) por facturar
                </span>

              </div>

            </div>


            {/* BUSCADOR */}

            <div className="facturacion-search">

              <input
                type="search"
                value={
                  filtro
                }
                onChange={
                  (event) =>
                    setFiltro(
                      event.target.value
                    )
                }
                placeholder="Buscar pedido, cliente o documento..."
              />

            </div>


            {/* LISTADO */}

            <div className="facturacion-pedidos-list">

              {cargando ? (

                <div className="facturacion-empty">
                  Cargando pedidos...
                </div>

              ) : pedidosFiltrados.length ===
                0 ? (

                <div className="facturacion-empty">

                  No hay pedidos entregados pendientes por facturar.

                </div>

              ) : (

                pedidosFiltrados.map(
                  (pedido) => {

                    const cliente =
                      pedido.cliente ||
                      {};


                    const seleccionado =
                      pedidoSeleccionado
                        ?._id ===
                      pedido._id;


                    return (

                      <button
                        key={
                          pedido._id
                        }
                        type="button"

                        className={
                          `facturacion-pedido-item ${
                            seleccionado
                              ? "facturacion-pedido-selected"
                              : ""
                          }`
                        }

                        onClick={() =>
                          seleccionarPedido(
                            pedido
                          )
                        }
                      >

                        <div className="facturacion-pedido-top">

                          <strong>
                            {
                              pedido.codigo
                            }
                          </strong>

                          <span>
                            Entregado
                          </span>

                        </div>


                        <h4>

                          {cliente.nombre ||
                            cliente.razonSocial ||
                            "Cliente"}

                        </h4>


                        <small>

                          {cliente.documento ||
                            "Sin documento"}

                        </small>


                        <div className="facturacion-pedido-bottom">

                          <span>

                            {pedido.createdAt
                              ? fechaColombia(
                                  pedido.createdAt
                                )
                              : "-"}

                          </span>


                          <strong>

                            {moneda(
                              pedido.total
                            )}

                          </strong>

                        </div>

                      </button>

                    );

                  }
                )

              )}

            </div>

          </section>


          {/* =====================================
              VISTA PREVIA FACTURA
          ===================================== */}

          <section className="facturacion-panel facturacion-preview-panel">

            {!pedidoSeleccionado ? (

              <div className="facturacion-preview-empty">

                <h3>
                  Selecciona un pedido
                </h3>

               

              </div>

            ) : (

              <>

                <div className="facturacion-preview-header">

                  <div>

                    <span>
                      Nueva factura
                    </span>

                    <h2>
                      Consecutivo automático
                    </h2>

                    <small>
                      Se generará como FAC-0001, FAC-0002...
                    </small>

                  </div>


                  <div className="facturacion-preview-order">

                    <span>
                      Pedido
                    </span>

                    <strong>
                      {
                        pedidoSeleccionado.codigo
                      }
                    </strong>

                  </div>

                </div>


                {/* CLIENTE */}

                <div className="facturacion-info-grid">

                  <div>

                    <span>
                      Cliente
                    </span>

                    <strong>

                      {pedidoSeleccionado
                        .cliente
                        ?.nombre ||
                        "Cliente"}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Documento
                    </span>

                    <strong>

                      {pedidoSeleccionado
                        .cliente
                        ?.documento ||
                        "-"}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Atendido por
                    </span>

                    <strong>

                      {obtenerNombrePersonal(
                        pedidoSeleccionado
                          .empleado
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Repartidor
                    </span>

                    <strong>

                      {obtenerNombrePersonal(
                        pedidoSeleccionado
                          .repartidor
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Empacador
                    </span>

                    <strong>

                      {pedidoSeleccionado
                        .empacador
                        ? obtenerNombrePersonal(
                            pedidoSeleccionado
                              .empacador
                          )
                        : "—"}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Fecha del pedido
                    </span>

                    <strong>

                      {fechaColombia(
                        pedidoSeleccionado
                          .createdAt
                      )}

                    </strong>

                  </div>

                </div>


                {/* PRODUCTOS */}

                <div className="facturacion-products">

                  <h3>
                    Productos
                  </h3>


                  <div className="facturacion-table-wrap">

                    <table className="facturacion-table">

                      <thead>

                        <tr>

                          <th>
                            Producto
                          </th>

                          <th>
                            Cantidad
                          </th>

                          <th>
                            Precio
                          </th>

                          <th>
                            Subtotal
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {(
                          pedidoSeleccionado
                            .items ||
                          []
                        ).map(
                          (
                            item,
                            index
                          ) => (

                            <tr
                              key={
                                item._id ||
                                index
                              }
                            >

                              <td>

                                <strong>
                                  {
                                    item.nombre
                                  }
                                </strong>


                                {item.presentacionNombre && (

                                  <small>

                                    {
                                      item.presentacionNombre
                                    }

                                  </small>

                                )}

                              </td>


                              <td>

                                {
                                  item.cantidad
                                }{" "}

                                {
                                  item.unidad ||
                                  ""
                                }

                              </td>


                              <td>

                                {moneda(
                                  item.precioAplicado
                                )}

                              </td>


                              <td>

                                <strong>

                                  {moneda(
                                    item.subtotal
                                  )}

                                </strong>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>


                {/* TOTALES */}

                <div className="facturacion-totales">

                  <div>

                    <span>
                      Subtotal
                    </span>

                    <strong>

                      {moneda(
                        pedidoSeleccionado
                          .subtotal
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Descuento
                    </span>

                    <strong>

                      {moneda(
                        pedidoSeleccionado
                          .descuento
                      )}

                    </strong>

                  </div>


                  <div className="facturacion-total-final">

                    <span>
                      Total
                    </span>

                    <strong>

                      {moneda(
                        pedidoSeleccionado
                          .total
                      )}

                    </strong>

                  </div>

                </div>

              </>

            )}

          </section>

        </div>


        {/* =====================================
            FACTURAS GENERADAS
        ===================================== */}

        <section className="facturacion-panel facturacion-generadas">

          <div className="facturacion-panel-header">

            <div>

              <h3>
                Facturas generadas
              </h3>

              <span>
                {
                  facturas.length
                } factura(s)
              </span>

            </div>

          </div>


          <div className="facturacion-table-wrap">

            <table className="facturacion-table facturacion-facturas-table">

              <thead>

                <tr>

                  <th>
                    Factura
                  </th>

                  <th>
                    Pedido
                  </th>

                  <th>
                    Cliente
                  </th>

                  <th>
                    Fecha
                  </th>

                  <th>
                    Total
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    Imprimir
                  </th>

                  <th>
                    Acción
                  </th>

                </tr>

              </thead>


              <tbody>

                {facturas.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="8"
                      className="facturacion-empty"
                    >

                      No hay facturas generadas.

                    </td>

                  </tr>

                ) : (

                  facturas.map(
                    (factura) => (

                      <tr
                        key={
                          factura._id
                        }
                      >

                        <td>

                          <strong className="facturacion-code">

                            {
                              factura.codigo
                            }

                          </strong>

                        </td>


                        <td>

                          {factura.pedido
                            ?.codigo ||
                            "-"}

                        </td>


                        <td>

                          {factura.cliente
                            ?.nombre ||
                            factura.clienteNombre ||
                            "-"}

                        </td>


                        <td>

                          {fechaColombia(
                            factura.createdAt
                          )}

                        </td>


                        <td>

                          <strong>

                            {moneda(
                              factura.total
                            )}

                          </strong>

                        </td>


                        <td>

                          <span
                            className={
                              `facturacion-status ${
                                factura.estado ===
                                "Anulada"
                                  ? "facturacion-status-anulada"
                                  : ""
                              }`
                            }
                          >

                            {factura.estado ||
                              "Emitida"}

                          </span>

                        </td>


                        <td className="facturacion-print-cell">

                          <button
                            type="button"
                            className="facturacion-action-btn facturacion-action-print"
                            onClick={() =>
                              imprimirFactura(
                                factura
                              )
                            }
                            title="Imprimir factura"
                            aria-label={`Imprimir factura ${factura.codigo}`}
                          >
                            🖨️
                          </button>

                        </td>


                        <td>

                          <div className="facturacion-row-actions">

                            {factura.estado ===
                              "Anulada" &&
                            !factura.fechaReversion ? (

                              <button
                                type="button"
                                className="facturacion-action-btn facturacion-action-revert"
                                onClick={() =>
                                  manejarRevertirFactura(
                                    factura
                                  )
                                }
                                disabled={
                                  procesandoFactura ===
                                  factura._id
                                }
                                title="Revertir anulación"
                                aria-label={`Revertir factura ${factura.codigo}`}
                              >
                                ↩️
                              </button>

                            ) : factura.estado ===
                              "Anulada" ? (

                              <span
                                className="facturacion-action-placeholder"
                                title="Factura revertida: el pedido ya puede facturarse nuevamente"
                                aria-label="Factura revertida"
                              >
                                ✔️
                              </span>

                            ) : (

                              <button
                                type="button"
                                className="facturacion-action-btn facturacion-action-cancel"
                                onClick={() =>
                                  manejarAnularFactura(
                                    factura
                                  )
                                }
                                disabled={
                                  procesandoFactura ===
                                  factura._id
                                }
                                title="Anular factura"
                                aria-label={`Anular factura ${factura.codigo}`}
                              >
                                🚫
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>


      <Toast
        mensaje={
          mensaje
        }
        tipo={
          tipoMensaje
        }
      />

    </section>

  );

}