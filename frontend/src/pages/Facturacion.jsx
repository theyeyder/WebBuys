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
  listarFacturas,
  listarEntregasFacturables,
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
    Number(
      valor ||
      0
    )
  );

}


/* =========================================
   FECHA
========================================= */

function fechaColombia(valor) {

  if (!valor) {
    return "-";
  }


  return new Date(
    valor
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
    typeof persona ===
    "string"
  ) {
    return persona;
  }


  return (
    [
      persona.nombres,
      persona.apellidos,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    persona.nombre ||
    persona.nombreCompleto ||
    persona.codigo ||
    "Sin asignar"
  );

}


/* =========================================
   ID DE REFERENCIA
========================================= */

function idReferencia(
  valor
) {

  if (!valor) {
    return "";
  }


  if (
    typeof valor ===
    "string"
  ) {
    return valor;
  }


  return String(
    valor._id ||
    ""
  );

}


/* =========================================
   CANTIDAD FINAL FACTURABLE
========================================= */

function cantidadFacturableItem(
  item
) {

  if (
    item.tipoVenta ===
    "Peso"
  ) {

    return {
      cantidad:
        Number(
          item.pesoReal ||
          0
        ),

      unidad:
        "KG",
    };

  }


  return {
    cantidad:
      Number(
        item.cantidadSolicitada ||
        0
      ),

    unidad:
      item.unidad ||
      "",
  };

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
    entregas,
    setEntregas,
  ] = useState([]);


  const [
    entregaSeleccionada,
    setEntregaSeleccionada,
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
    generandoMultiples,
    setGenerandoMultiples,
  ] = useState(false);


  const [
    entregasSeleccionadas,
    setEntregasSeleccionadas,
  ] = useState([]);


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
        dataEntregas,
        dataFacturas,
      ] =
        await Promise.all([

          listarEntregasFacturables(),

          listarFacturas(),

        ]);


      const listaEntregas =
        Array.isArray(
          dataEntregas
        )
          ? dataEntregas
          : dataEntregas?.entregas ||
            dataEntregas?.data ||
            [];


      const listaFacturas =
        Array.isArray(
          dataFacturas
        )
          ? dataFacturas
          : dataFacturas?.facturas ||
            dataFacturas?.data ||
            [];


      setEntregas(
        listaEntregas
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


  useEffect(
    () => {

      cargarDatos();

    },
    []
  );


  /* =========================================
     CERRAR TOAST
  ========================================= */

  useEffect(
    () => {

      if (!mensaje) {
        return undefined;
      }


      const timer =
        setTimeout(
          () =>
            setMensaje(
              ""
            ),
          3000
        );


      return () =>
        clearTimeout(
          timer
        );

    },
    [
      mensaje,
    ]
  );


  /* =========================================
     ENTREGAS BLOQUEADAS POR FACTURA
  ========================================= */

  const referenciasFacturadas =
    useMemo(
      () => {

        const entregasFacturadas =
          new Set();


        const pedidosFacturados =
          new Set();


        facturas

          /*
            BLOQUEA CUANDO:
            - factura activa
            - factura anulada sin Revertir

            PERMITE NUEVAMENTE:
            - factura Anulada + fechaReversion
          */

          .filter(
            (factura) =>
              factura.estado !==
                "Anulada" ||
              !factura.fechaReversion
          )

          .forEach(
            (factura) => {

              const entregaId =
                idReferencia(
                  factura.entrega
                );


              const pedidoId =
                idReferencia(
                  factura.pedido
                );


              if (entregaId) {

                entregasFacturadas.add(
                  entregaId
                );

              }


              if (pedidoId) {

                pedidosFacturados.add(
                  pedidoId
                );

              }

            }
          );


        return {
          entregasFacturadas,
          pedidosFacturados,
        };

      },
      [
        facturas,
      ]
    );


  /* =========================================
     ENTREGAS DISPONIBLES PARA FACTURAR
  ========================================= */

  const entregasDisponibles =
    useMemo(
      () => {

        return entregas.filter(
          (entrega) => {

            if (
              entrega.estado !==
              "Entregado"
            ) {
              return false;
            }


            const entregaId =
              idReferencia(
                entrega
              );


            const pedidoId =
              idReferencia(
                entrega.pedido
              );


            return (
              !referenciasFacturadas
                .entregasFacturadas
                .has(
                  entregaId
                ) &&
              !referenciasFacturadas
                .pedidosFacturados
                .has(
                  pedidoId
                )
            );

          }
        );

      },
      [
        entregas,
        referenciasFacturadas,
      ]
    );


  useEffect(
    () => {

      const disponibles =
        new Set(
          entregasDisponibles.map(
            (entrega) =>
              entrega._id
          )
        );


      setEntregasSeleccionadas(
        (actuales) =>
          actuales.filter(
            (id) =>
              disponibles.has(
                id
              )
          )
      );

    },
    [
      entregasDisponibles,
    ]
  );


  /* =========================================
     FILTRAR ENTREGAS
  ========================================= */

  const entregasFiltradas =
    useMemo(
      () => {

        const texto =
          filtro
            .trim()
            .toLowerCase();


        if (!texto) {

          return entregasDisponibles;

        }


        return entregasDisponibles.filter(
          (entrega) => {

            const valores = [

              entrega.pedidoCodigo,

              entrega.clienteCodigo,

              entrega.clienteNombre,

              entrega.cliente
                ?.documento,

              entrega.clienteTelefono,

              entrega.rutaNombre,

              entrega.zonaDespachoNombre,

              entrega.total,

            ];


            return valores.some(
              (valor) =>
                String(
                  valor ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    texto
                  )
            );

          }
        );

      },
      [
        entregasDisponibles,
        filtro,
      ]
    );


  /* =========================================
     SELECCIONAR ENTREGA
  ========================================= */

  function seleccionarEntrega(
    entrega
  ) {

    setEntregaSeleccionada(
      entrega
    );

  }


  /* =========================================
     SELECCIÓN MÚLTIPLE
  ========================================= */

  function alternarEntregaMultiple(
    entregaId
  ) {

    setEntregasSeleccionadas(
      (actuales) => {

        if (
          actuales.includes(
            entregaId
          )
        ) {

          return actuales.filter(
            (id) =>
              id !==
              entregaId
          );

        }


        return [
          ...actuales,
          entregaId,
        ];

      }
    );

  }


  function seleccionarTodasVisibles() {

    const ids =
      entregasFiltradas.map(
        (entrega) =>
          entrega._id
      );


    setEntregasSeleccionadas(
      ids
    );

  }


  function limpiarSeleccionMultiple() {

    setEntregasSeleccionadas(
      []
    );

  }


  /* =========================================
     GENERAR FACTURA
  ========================================= */

  async function generarFactura() {

    if (
      !entregaSeleccionada
    ) {

      setMensaje(
        "Seleccione primero una entrega finalizada."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    if (
      entregaSeleccionada.estado !==
      "Entregado"
    ) {

      setMensaje(
        "Solo se pueden facturar entregas con estado Entregado."
      );

      setTipoMensaje(
        "error"
      );

      return;

    }


    const entregaId =
      idReferencia(
        entregaSeleccionada
      );


    const pedidoId =
      idReferencia(
        entregaSeleccionada
          .pedido
      );


    if (
      referenciasFacturadas
        .entregasFacturadas
        .has(
          entregaId
        ) ||
      referenciasFacturadas
        .pedidosFacturados
        .has(
          pedidoId
        )
    ) {

      setMensaje(
        "Esta entrega ya tiene una factura generada."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const confirmar =
      window.confirm(
        `¿Deseas generar la factura de la entrega del pedido ${entregaSeleccionada.pedidoCodigo}?`
      );


    if (!confirmar) {
      return;
    }


    try {

      setGenerando(
        true
      );


      await crearFactura({

        entrega:
          entregaSeleccionada._id,

      });


      setMensaje(
        "Factura generada correctamente."
      );


      setTipoMensaje(
        "success"
      );


      setEntregaSeleccionada(
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
     GENERAR FACTURAS MÚLTIPLES
  ========================================= */

  async function generarFacturasMultiples() {

    const seleccionadas =
      entregasDisponibles.filter(
        (entrega) =>
          entregasSeleccionadas.includes(
            entrega._id
          )
      );


    if (
      seleccionadas.length ===
      0
    ) {

      setMensaje(
        "Seleccione al menos una entrega para generar facturas múltiples."
      );

      setTipoMensaje(
        "info"
      );

      return;

    }


    const confirmar =
      window.confirm(
        `¿Deseas generar ${seleccionadas.length} factura(s)?\n\nCada entrega recibirá su propio consecutivo FAC.`
      );


    if (!confirmar) {
      return;
    }


    try {

      setGenerandoMultiples(
        true
      );


      let creadas =
        0;


      const errores =
        [];


      for (
        const entrega
        of seleccionadas
      ) {

        try {

          await crearFactura({
            entrega:
              entrega._id,
          });


          creadas +=
            1;


        } catch (error) {

          errores.push({
            codigo:
              entrega.pedidoCodigo ||
              "Entrega",

            mensaje:
              error?.response?.data?.mensaje ||
              "No fue posible generar la factura.",
          });

        }

      }


      if (
        errores.length ===
        0
      ) {

        setMensaje(
          `${creadas} factura(s) generada(s) correctamente.`
        );

        setTipoMensaje(
          "success"
        );


      } else if (
        creadas >
        0
      ) {

        setMensaje(
          `${creadas} factura(s) generada(s). ${errores.length} no pudieron generarse.`
        );

        setTipoMensaje(
          "info"
        );


      } else {

        setMensaje(
          errores[0]?.mensaje ||
          "No fue posible generar las facturas seleccionadas."
        );

        setTipoMensaje(
          "error"
        );

      }


      setEntregasSeleccionadas(
        []
      );


      setEntregaSeleccionada(
        null
      );


      await cargarDatos();


    } finally {

      setGenerandoMultiples(
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


    if (
      motivo ===
      null
    ) {
      return;
    }


    if (
      !motivo.trim()
    ) {

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

    const pedidoCodigo =
      factura.entrega
        ?.pedidoCodigo ||
      factura.pedido
        ?.codigo ||
      factura.pedidoCodigo ||
      "";


    const confirmar =
      window.confirm(
        `¿Deseas habilitar nuevamente la entrega del pedido ${pedidoCodigo} para generar una nueva factura?\n\nLa factura ${factura.codigo} continuará anulada.`
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
        `La entrega del pedido ${pedidoCodigo} quedó habilitada para generar una nueva factura.`
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


      {/* CABECERA */}

      <header className="facturacion-header">

        <div className="facturacion-header-left">

          <ModulosMenu />

          <h1>
            Facturación
          </h1>

        </div>

      </header>


      <main className="facturacion-content">


        {/* BARRA DE ACCIONES */}

        <div className="facturacion-actions-bar">

          <div>

            <h2>
              Entregas para facturar
            </h2>

            <p>
              La factura es opcional. Solo aparecen entregas finalizadas.
            </p>

          </div>


          <div className="facturacion-actions-buttons">

            <button
              type="button"
              className="facturacion-generar-multiple-btn"
              disabled={
                entregasSeleccionadas.length ===
                  0 ||
                generandoMultiples ||
                generando
              }
              onClick={
                generarFacturasMultiples
              }
            >

              <span className="facturacion-btn-icon">
                ▦
              </span>

              {generandoMultiples
                ? "Generando..."
                : `Generar múltiples (${entregasSeleccionadas.length})`}

            </button>


            <button
              type="button"
              className="facturacion-generar-btn"
              disabled={
                !entregaSeleccionada ||
                generando ||
                generandoMultiples
              }
              onClick={
                generarFactura
              }
            >

              <span className="facturacion-btn-icon">
                +
              </span>

              {generando
                ? "Generando..."
                : "Generar factura"}

            </button>

          </div>

        </div>


        <div className="facturacion-layout">


          {/* ENTREGAS FINALIZADAS */}

          <section className="facturacion-panel facturacion-pedidos-panel">

            <div className="facturacion-panel-header facturacion-pendientes-header">

              <div>

                <h3>
                  Entregas finalizadas
                </h3>

                <span>
                  {
                    entregasDisponibles.length
                  } sin factura
                </span>

              </div>


              <div className="facturacion-selection-tools">

                <button
                  type="button"
                  className="facturacion-selection-btn"
                  onClick={
                    seleccionarTodasVisibles
                  }
                  disabled={
                    entregasFiltradas.length ===
                    0
                  }
                >
                  Seleccionar todas
                </button>


                {entregasSeleccionadas.length >
                  0 && (

                  <button
                    type="button"
                    className="facturacion-selection-btn facturacion-selection-clear"
                    onClick={
                      limpiarSeleccionMultiple
                    }
                  >
                    Limpiar
                  </button>

                )}

              </div>

            </div>


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
                placeholder="Buscar pedido, cliente, documento o ruta..."
              />

            </div>


            <div className="facturacion-selection-summary">

              <span>
                {
                  entregasSeleccionadas.length
                } seleccionada(s)
              </span>

              <strong>
                {
                  entregasFiltradas.length
                } visible(s)
              </strong>

            </div>


            <div className="facturacion-pedidos-list">

              {cargando ? (

                <div className="facturacion-empty">
                  Cargando entregas...
                </div>

              ) : entregasFiltradas.length ===
                0 ? (

                <div className="facturacion-empty">

                  No hay entregas finalizadas pendientes por facturar.

                </div>

              ) : (

                entregasFiltradas.map(
                  (entrega) => {

                    const seleccionado =
                      entregaSeleccionada
                        ?._id ===
                      entrega._id;


                    const seleccionadoMultiple =
                      entregasSeleccionadas.includes(
                        entrega._id
                      );


                    return (

                      <article
                        key={
                          entrega._id
                        }
                        className={
                          `facturacion-pedido-item ${
                            seleccionado
                              ? "facturacion-pedido-selected"
                              : ""
                          } ${
                            seleccionadoMultiple
                              ? "facturacion-pedido-multi-selected"
                              : ""
                          }`
                        }
                      >

                        <button
                          type="button"
                          className={
                            `facturacion-multi-check ${
                              seleccionadoMultiple
                                ? "active"
                                : ""
                            }`
                          }
                          onClick={() =>
                            alternarEntregaMultiple(
                              entrega._id
                            )
                          }
                          title={
                            seleccionadoMultiple
                              ? "Quitar de facturación múltiple"
                              : "Agregar a facturación múltiple"
                          }
                          aria-label={
                            seleccionadoMultiple
                              ? `Quitar ${entrega.pedidoCodigo} de selección múltiple`
                              : `Seleccionar ${entrega.pedidoCodigo} para facturación múltiple`
                          }
                        >
                          {seleccionadoMultiple
                            ? "✓"
                            : ""}
                        </button>


                        <button
                          type="button"
                          className="facturacion-pedido-content"
                          onClick={() =>
                            seleccionarEntrega(
                              entrega
                            )
                          }
                        >

                        <div className="facturacion-pedido-top">

                          <strong>
                            {
                              entrega.pedidoCodigo
                            }
                          </strong>

                          <span>
                            Sin factura
                          </span>

                        </div>


                        <h4>

                          {entrega.clienteNombre ||
                            entrega.cliente
                              ?.nombre ||
                            "Cliente"}

                        </h4>


                        <small>

                          {entrega.cliente
                            ?.documento ||
                            entrega.clienteCodigo ||
                            "Sin documento"}

                        </small>


                        <div className="facturacion-pedido-bottom">

                          <span>

                            {fechaColombia(
                              entrega.fechaEntregaReal ||
                              entrega.updatedAt ||
                              entrega.fechaProgramada
                            )}

                          </span>


                          <strong>

                            {moneda(
                              entrega.total
                            )}

                          </strong>

                        </div>

                        </button>

                      </article>

                    );

                  }
                )

              )}

            </div>

          </section>


          {/* VISTA PREVIA */}

          <section className="facturacion-panel facturacion-preview-panel">

            {!entregaSeleccionada ? (

              <div className="facturacion-preview-empty">

                <h3>
                  Selecciona una entrega
                </h3>

                <p>
                  Se usarán los valores finales registrados en Entrega.
                </p>

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
                        entregaSeleccionada
                          .pedidoCodigo
                      }
                    </strong>

                  </div>

                </div>


                {/* CLIENTE Y ENTREGA */}

                <div className="facturacion-info-grid">

                  <div>

                    <span>
                      Cliente
                    </span>

                    <strong>

                      {entregaSeleccionada
                        .clienteNombre ||
                        entregaSeleccionada
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

                      {entregaSeleccionada
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
                        entregaSeleccionada
                          .pedido
                          ?.empleado
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Repartidor
                    </span>

                    <strong>

                      {obtenerNombrePersonal(
                        entregaSeleccionada
                          .repartidor
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Empacador
                    </span>

                    <strong>

                      {entregaSeleccionada
                        .empacador
                        ? obtenerNombrePersonal(
                            entregaSeleccionada
                              .empacador
                          )
                        : "—"}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Fecha de entrega
                    </span>

                    <strong>

                      {fechaColombia(
                        entregaSeleccionada
                          .fechaEntregaReal ||
                        entregaSeleccionada
                          .updatedAt ||
                        entregaSeleccionada
                          .fechaProgramada
                      )}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Tipo de pago
                    </span>

                    <strong>

                      {entregaSeleccionada
                        .metodoPago ||
                        "-"}

                    </strong>

                  </div>


                  <div>

                    <span>
                      Estado
                    </span>

                    <strong>
                      Entregado
                    </strong>

                  </div>

                </div>


                {/* PRODUCTOS */}

                <div className="facturacion-products">

                  <h3>
                    Productos finales
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
                          entregaSeleccionada
                            .items ||
                          []
                        ).map(
                          (
                            item,
                            index
                          ) => {

                            const final =
                              cantidadFacturableItem(
                                item
                              );


                            return (

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
                                    final.cantidad
                                  }{" "}

                                  {
                                    final.unidad
                                  }

                                </td>


                                <td>

                                  {moneda(
                                    item.precioUnitario
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

                            );

                          }
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
                        entregaSeleccionada
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
                        entregaSeleccionada
                          .descuento
                      )}

                    </strong>

                  </div>


                  <div className="facturacion-total-final">

                    <span>
                      Total final
                    </span>

                    <strong>

                      {moneda(
                        entregaSeleccionada
                          .total
                      )}

                    </strong>

                  </div>

                </div>

              </>

            )}

          </section>

        </div>


        {/* FACTURAS GENERADAS */}

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
                    (factura) => {

                      const pedidoCodigo =
                        factura.entrega
                          ?.pedidoCodigo ||
                        factura.pedido
                          ?.codigo ||
                        factura.pedidoCodigo ||
                        "-";


                      return (

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

                            {pedidoCodigo}

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
                                  title="Factura revertida: la entrega ya puede facturarse nuevamente"
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

                      );

                    }
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
