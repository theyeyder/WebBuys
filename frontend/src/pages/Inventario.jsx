import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listarInventario,
  listarMovimientosInventario,
  registrarEntradaInventario,
  registrarSalidaInventario,
  registrarAjusteInventario,
} from "../services/inventario.service.js";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import "../styles/inventario.css";


const ESTADOS = [
  "Disponible",
  "Stock bajo",
  "Agotado",
  "Sin control de stock",
];


const MOTIVOS_SALIDA = [
  "Daño",
  "Pérdida",
  "Consumo interno",
  "Regalo",
  "Vencimiento",
  "Corrección",
  "Otro",
];


const FORM_INICIAL = {
  cantidad: "",
  costoUnitario: "",
  proveedor: "",
  documentoReferencia: "",
  fechaMovimiento: "",
  motivo: "",
  observaciones: "",
  stockFisico: "",
};


function numero(
  valor,
  decimales = 2
) {
  const n =
    Number(valor);

  if (
    !Number.isFinite(n)
  ) {
    return "0";
  }

  return n.toLocaleString(
    "es-CO",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits:
        decimales,
    }
  );
}


function moneda(
  valor
) {
  const n =
    Number(valor);

  return Number.isFinite(n)
    ? n.toLocaleString(
        "es-CO",
        {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }
      )
    : "$ 0";
}


function fechaHora(
  valor
) {
  if (!valor) {
    return "-";
  }

  const fecha =
    new Date(valor);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "-";
  }

  return fecha.toLocaleString(
    "es-CO"
  );
}


function claseEstado(
  estado
) {
  return String(
    estado || ""
  )
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /\s+/g,
      "-"
    );
}


export default function Inventario() {

  const {
    usuario,
  } = useAuth();


  const esAdmin =
    usuario?.rol ===
    "Administrador";


  const [
    inventario,
    setInventario,
  ] = useState([]);


  const [
    resumen,
    setResumen,
  ] = useState({
    productosEnInventario: 0,
    stockBajo: 0,
    agotados: 0,
    sinControl: 0,
    valorTotalInventario: 0,
    totalRegistros: 0,
  });


  const [
    cargando,
    setCargando,
  ] = useState(true);


  const [
    busqueda,
    setBusqueda,
  ] = useState("");


  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("");


  const [
    filtroCategoria,
    setFiltroCategoria,
  ] = useState("");


  const [
    seleccionado,
    setSeleccionado,
  ] = useState(null);


  const [
    modal,
    setModal,
  ] = useState("");


  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL
  );


  const [
    guardando,
    setGuardando,
  ] = useState(false);


  const [
    movimientos,
    setMovimientos,
  ] = useState([]);


  const [
    cargandoMovimientos,
    setCargandoMovimientos,
  ] = useState(false);


  const [
    mensaje,
    setMensaje,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     CARGAR INVENTARIO
  ========================================= */

  async function cargarInventario() {

    try {

      setCargando(true);
      setError("");


      const data =
        await listarInventario();


      setInventario(
        Array.isArray(
          data?.inventario
        )
          ? data.inventario
          : []
      );


      setResumen({
        productosEnInventario:
          Number(
            data?.resumen
              ?.productosEnInventario ||
            0
          ),

        stockBajo:
          Number(
            data?.resumen
              ?.stockBajo ||
            0
          ),

        agotados:
          Number(
            data?.resumen
              ?.agotados ||
            0
          ),

        sinControl:
          Number(
            data?.resumen
              ?.sinControl ||
            0
          ),

        valorTotalInventario:
          Number(
            data?.resumen
              ?.valorTotalInventario ||
            0
          ),

        totalRegistros:
          Number(
            data?.resumen
              ?.totalRegistros ||
            0
          ),
      });


      setSeleccionado(
        (actual) => {

          if (!actual) {
            return null;
          }

          return (
            data?.inventario ||
            []
          ).find(
            (fila) =>
              fila.id ===
              actual.id
          ) || null;

        }
      );


    } catch (err) {

      setError(
        err?.response?.data
          ?.mensaje ||
        "No fue posible cargar el inventario."
      );


    } finally {

      setCargando(false);

    }

  }


  useEffect(() => {

    cargarInventario();

  }, []);


  useEffect(() => {

    if (
      !mensaje &&
      !error
    ) {
      return undefined;
    }


    const timer =
      setTimeout(
        () => {
          setMensaje("");
          setError("");
        },
        3500
      );


    return () =>
      clearTimeout(
        timer
      );

  }, [
    mensaje,
    error,
  ]);


  /* =========================================
     FILTROS
  ========================================= */

  const categorias =
    useMemo(
      () => {

        const mapa =
          new Map();


        inventario.forEach(
          (fila) => {

            const categoria =
              fila.categoria;

            if (
              categoria?._id
            ) {

              mapa.set(
                String(
                  categoria._id
                ),
                categoria
              );

            }

          }
        );


        return Array
          .from(
            mapa.values()
          )
          .sort(
            (a, b) =>
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
        inventario,
      ]
    );


  const filasFiltradas =
    useMemo(
      () => {

        const texto =
          busqueda
            .trim()
            .toLowerCase();


        return inventario
          .filter(
            (fila) => {

              if (
                filtroEstado &&
                fila.estado !==
                  filtroEstado
              ) {
                return false;
              }


              if (
                filtroCategoria &&
                String(
                  fila.categoria?._id ||
                  ""
                ) !==
                  filtroCategoria
              ) {
                return false;
              }


              if (!texto) {
                return true;
              }


              return [
                fila.codigo,
                fila.producto,
                fila.presentacion,
                fila.nombre,
                fila.marca,
                fila.categoria
                  ?.nombre,
                fila.unidad,
              ].some(
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
        inventario,
        busqueda,
        filtroEstado,
        filtroCategoria,
      ]
    );


  /* =========================================
     MODALES
  ========================================= */

  function abrirOperacion(
    tipo,
    fila
  ) {

    if (
      !esAdmin &&
      [
        "entrada",
        "salida",
        "ajuste",
      ].includes(
        tipo
      )
    ) {

      setError(
        "Solo el administrador puede registrar movimientos manuales de inventario."
      );

      return;

    }


    if (
      fila
        ?.controlInventario ===
        false &&
      [
        "entrada",
        "salida",
        "ajuste",
      ].includes(
        tipo
      )
    ) {

      setError(
        "Este producto está configurado sin control de stock."
      );

      return;

    }


    setSeleccionado(
      fila
    );


    setForm({
      ...FORM_INICIAL,

      costoUnitario:
        tipo === "entrada"
          ? String(
              fila
                ?.costoPromedio ||
              fila
                ?.precioCompra ||
              ""
            )
          : "",

      motivo:
        tipo === "salida"
          ? "Daño"
          : tipo ===
              "ajuste"
            ? "Conteo físico"
            : "",

      stockFisico:
        tipo === "ajuste"
          ? String(
              fila?.stock ??
              ""
            )
          : "",
    });


    setModal(
      tipo
    );

  }


  function cerrarModal() {

    if (guardando) {
      return;
    }

    setModal("");
    setForm(
      FORM_INICIAL
    );

  }


  function cambiarCampo(
    event
  ) {

    const {
      name,
      value,
    } = event.target;


    setForm(
      (actual) => ({
        ...actual,
        [name]:
          value,
      })
    );

  }


  function datosObjetivo() {

    return {
      productoId:
        seleccionado
          ?.productoId,

      presentacionId:
        seleccionado
          ?.presentacionId ||
        null,
    };

  }


  function validarCantidad(
    valor,
    etiqueta
  ) {

    const cantidad =
      Number(valor);


    if (
      !Number.isFinite(
        cantidad
      ) ||
      cantidad <= 0
    ) {

      setError(
        `${etiqueta} debe ser mayor que cero.`
      );

      return null;

    }


    if (
      seleccionado
        ?.tipoVenta ===
        "Unidad" &&
      !Number.isInteger(
        cantidad
      )
    ) {

      setError(
        `${etiqueta} debe ser un número entero para productos por unidad.`
      );

      return null;

    }


    return cantidad;

  }


  /* =========================================
     GUARDAR ENTRADA
  ========================================= */

  async function guardarEntrada(
    event
  ) {

    event.preventDefault();


    const cantidad =
      validarCantidad(
        form.cantidad,
        "La cantidad"
      );


    if (
      cantidad === null
    ) {
      return;
    }


    const costo =
      Number(
        form.costoUnitario ||
        0
      );


    if (
      !Number.isFinite(
        costo
      ) ||
      costo < 0
    ) {

      setError(
        "El costo unitario no es válido."
      );

      return;

    }


    try {

      setGuardando(true);
      setError("");


      const respuesta =
        await registrarEntradaInventario({
          ...datosObjetivo(),

          cantidad,

          costoUnitario:
            costo,

          proveedor:
            form.proveedor
              .trim(),

          documentoReferencia:
            form
              .documentoReferencia
              .trim(),

          fechaMovimiento:
            form.fechaMovimiento ||
            null,

          motivo:
            "Entrada de inventario",

          observaciones:
            form.observaciones
              .trim(),
        });


      setMensaje(
        respuesta?.mensaje ||
        "Entrada registrada correctamente."
      );


      cerrarModal();
      await cargarInventario();


    } catch (err) {

      setError(
        err?.response?.data
          ?.mensaje ||
        "No fue posible registrar la entrada."
      );


    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     GUARDAR SALIDA
  ========================================= */

  async function guardarSalida(
    event
  ) {

    event.preventDefault();


    const cantidad =
      validarCantidad(
        form.cantidad,
        "La cantidad"
      );


    if (
      cantidad === null
    ) {
      return;
    }


    if (
      !form.motivo
        .trim()
    ) {

      setError(
        "Debe seleccionar un motivo de salida."
      );

      return;

    }


    try {

      setGuardando(true);
      setError("");


      const respuesta =
        await registrarSalidaInventario({
          ...datosObjetivo(),

          cantidad,

          motivo:
            form.motivo
              .trim(),

          observaciones:
            form.observaciones
              .trim(),

          fechaMovimiento:
            form.fechaMovimiento ||
            null,
        });


      setMensaje(
        respuesta?.mensaje ||
        "Salida registrada correctamente."
      );


      cerrarModal();
      await cargarInventario();


    } catch (err) {

      setError(
        err?.response?.data
          ?.mensaje ||
        "No fue posible registrar la salida."
      );


    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     GUARDAR AJUSTE
  ========================================= */

  async function guardarAjuste(
    event
  ) {

    event.preventDefault();


    const stockFisico =
      Number(
        form.stockFisico
      );


    if (
      !Number.isFinite(
        stockFisico
      ) ||
      stockFisico < 0
    ) {

      setError(
        "El conteo físico no es válido."
      );

      return;

    }


    if (
      seleccionado
        ?.tipoVenta ===
        "Unidad" &&
      !Number.isInteger(
        stockFisico
      )
    ) {

      setError(
        "El conteo físico debe ser entero para productos por unidad."
      );

      return;

    }


    try {

      setGuardando(true);
      setError("");


      const respuesta =
        await registrarAjusteInventario({
          ...datosObjetivo(),

          stockFisico,

          motivo:
            form.motivo
              .trim() ||
            "Conteo físico",

          observaciones:
            form.observaciones
              .trim(),

          fechaMovimiento:
            form.fechaMovimiento ||
            null,
        });


      setMensaje(
        respuesta?.mensaje ||
        "Ajuste registrado correctamente."
      );


      cerrarModal();
      await cargarInventario();


    } catch (err) {

      setError(
        err?.response?.data
          ?.mensaje ||
        "No fue posible registrar el ajuste."
      );


    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     MOVIMIENTOS
  ========================================= */

  async function abrirMovimientos(
    fila
  ) {

    setSeleccionado(
      fila
    );

    setMovimientos(
      []
    );

    setModal(
      "movimientos"
    );


    try {

      setCargandoMovimientos(
        true
      );

      setError("");


      const data =
        await listarMovimientosInventario({
          productoId:
            fila.productoId,

          ...(fila.presentacionId
            ? {
                presentacionId:
                  fila.presentacionId,
              }
            : {}),

          limite:
            200,
        });


      setMovimientos(
        Array.isArray(
          data?.movimientos
        )
          ? data.movimientos
          : []
      );


    } catch (err) {

      setError(
        err?.response?.data
          ?.mensaje ||
        "No fue posible cargar los movimientos."
      );


    } finally {

      setCargandoMovimientos(
        false
      );

    }

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="inventario-page">

      <Toast
        mensaje={mensaje}
        error={error}
      />


      <div className="inventario-title-bar">

        <div className="inventario-title-left">

          <ModulosMenu />

          <div className="inventario-title-info">

            <h2>
              Inventario
            </h2>

            <p>
              Control de existencias, reservas y movimientos.
            </p>

          </div>

        </div>


        <button
          type="button"
          className="inventario-refresh-btn"
          onClick={
            cargarInventario
          }
          disabled={
            cargando
          }
        >
          {cargando
            ? "Cargando..."
            : "Actualizar"}
        </button>

      </div>


      <main className="inventario-content">

        <section className="inventario-summary-grid">

          <article className="inventario-summary-card">
            <span>
              Productos en inventario
            </span>
            <strong>
              {resumen.productosEnInventario}
            </strong>
          </article>

          <article className="inventario-summary-card warning">
            <span>
              Stock bajo
            </span>
            <strong>
              {resumen.stockBajo}
            </strong>
          </article>

          <article className="inventario-summary-card danger">
            <span>
              Productos agotados
            </span>
            <strong>
              {resumen.agotados}
            </strong>
          </article>

          <article className="inventario-summary-card value">
            <span>
              Valor total inventario
            </span>
            <strong>
              {moneda(
                resumen
                  .valorTotalInventario
              )}
            </strong>
          </article>

        </section>


        <section className="inventario-panel">

          <div className="inventario-toolbar">

            <div className="inventario-search">

              <input
                type="search"
                value={busqueda}
                onChange={
                  (event) =>
                    setBusqueda(
                      event.target.value
                    )
                }
                placeholder="Buscar por código, producto, marca o categoría..."
                aria-label="Buscar inventario"
              />

            </div>


            <select
              value={
                filtroCategoria
              }
              onChange={
                (event) =>
                  setFiltroCategoria(
                    event.target.value
                  )
              }
              aria-label="Filtrar por categoría"
            >
              <option value="">
                Todas las categorías
              </option>

              {categorias.map(
                (categoria) => (
                  <option
                    key={
                      categoria._id
                    }
                    value={
                      categoria._id
                    }
                  >
                    {categoria.nombre}
                  </option>
                )
              )}
            </select>


            <select
              value={
                filtroEstado
              }
              onChange={
                (event) =>
                  setFiltroEstado(
                    event.target.value
                  )
              }
              aria-label="Filtrar por estado"
            >
              <option value="">
                Todos los estados
              </option>

              {ESTADOS.map(
                (estado) => (
                  <option
                    key={estado}
                    value={estado}
                  >
                    {estado}
                  </option>
                )
              )}
            </select>


            <div className="inventario-toolbar-count">
              {filasFiltradas.length}
              {" "}
              registros
            </div>

          </div>


          <div className="inventario-table-wrap">

            <table className="inventario-table">

              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Stock físico</th>
                  <th>Reservado</th>
                  <th>Disponible</th>
                  <th>Stock mínimo</th>
                  <th>Costo promedio</th>
                  <th>Valor inventario</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>


              <tbody>

                {cargando ? (

                  <tr>
                    <td
                      colSpan="11"
                      className="inventario-empty"
                    >
                      Cargando inventario...
                    </td>
                  </tr>

                ) : filasFiltradas.length === 0 ? (

                  <tr>
                    <td
                      colSpan="11"
                      className="inventario-empty"
                    >
                      No se encontraron registros de inventario.
                    </td>
                  </tr>

                ) : (

                  filasFiltradas.map(
                    (fila) => (

                      <tr
                        key={fila.id}
                        className={
                          seleccionado
                            ?.id ===
                            fila.id
                            ? "selected"
                            : ""
                        }
                        onClick={
                          () =>
                            setSeleccionado(
                              fila
                            )
                        }
                      >

                        <td>
                          <strong className="inventario-code">
                            {fila.codigo}
                          </strong>
                        </td>


                        <td className="inventario-product-cell">

                          <strong>
                            {fila.producto}
                          </strong>

                          {fila.presentacion && (
                            <small>
                              {fila.presentacion}
                            </small>
                          )}

                          {fila.marca && (
                            <small>
                              {fila.marca}
                            </small>
                          )}

                        </td>


                        <td>
                          {fila.categoria
                            ?.nombre ||
                            "-"}
                        </td>


                        <td>
                          {numero(
                            fila.stock,
                            4
                          )}
                          {" "}
                          <small>
                            {fila.unidad}
                          </small>
                        </td>


                        <td>
                          {numero(
                            fila.stockReservado,
                            4
                          )}
                        </td>


                        <td>
                          <strong className="inventario-available">
                            {numero(
                              fila.stockDisponible,
                              4
                            )}
                          </strong>
                        </td>


                        <td>
                          {numero(
                            fila.stockMinimo,
                            4
                          )}
                        </td>


                        <td className="inventario-money">
                          {moneda(
                            fila.costoPromedio
                          )}
                        </td>


                        <td className="inventario-money inventario-value">
                          {moneda(
                            fila.valorInventario
                          )}
                        </td>


                        <td>
                          <span
                            className={`inventario-status ${claseEstado(
                              fila.estado
                            )}`}
                          >
                            {fila.estado}
                          </span>
                        </td>


                        <td>

                          <div
                            className="inventario-actions"
                            onClick={
                              (event) =>
                                event.stopPropagation()
                            }
                          >

                            {esAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      abrirOperacion(
                                        "entrada",
                                        fila
                                      )
                                  }
                                  disabled={
                                    !fila.controlInventario
                                  }
                                >
                                  Entrada
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      abrirOperacion(
                                        "salida",
                                        fila
                                      )
                                  }
                                  disabled={
                                    !fila.controlInventario
                                  }
                                >
                                  Salida
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      abrirOperacion(
                                        "ajuste",
                                        fila
                                      )
                                  }
                                  disabled={
                                    !fila.controlInventario
                                  }
                                >
                                  Ajuste
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={
                                () =>
                                  abrirMovimientos(
                                    fila
                                  )
                              }
                            >
                              Movimientos
                            </button>

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


      {/* =====================================
          MODAL ENTRADA
      ===================================== */}

      {modal === "entrada" && seleccionado && (

        <div className="inventario-modal-overlay">

          <form
            className="inventario-modal"
            onSubmit={
              guardarEntrada
            }
          >

            <div className="inventario-modal-header">

              <div>
                <span>
                  Entrada de inventario
                </span>
                <h3>
                  {seleccionado.nombre}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="inventario-modal-body">

              <div className="inventario-current-stock">

                <div>
                  <span>
                    Stock actual
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stock,
                      4
                    )}
                    {" "}
                    {seleccionado.unidad}
                  </strong>
                </div>

                <div>
                  <span>
                    Disponible
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stockDisponible,
                      4
                    )}
                  </strong>
                </div>

              </div>


              <div className="inventario-form-grid">

                <label>
                  Cantidad *
                  <input
                    type="number"
                    name="cantidad"
                    min="0"
                    step={
                      seleccionado.tipoVenta ===
                      "Unidad"
                        ? "1"
                        : "0.0001"
                    }
                    value={
                      form.cantidad
                    }
                    onChange={
                      cambiarCampo
                    }
                    required
                  />
                </label>


                <label>
                  Costo unitario
                  <input
                    type="number"
                    name="costoUnitario"
                    min="0"
                    step="0.01"
                    value={
                      form.costoUnitario
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label>
                  Proveedor
                  <input
                    type="text"
                    name="proveedor"
                    value={
                      form.proveedor
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label>
                  Factura / remisión
                  <input
                    type="text"
                    name="documentoReferencia"
                    value={
                      form.documentoReferencia
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label>
                  Fecha
                  <input
                    type="date"
                    name="fechaMovimiento"
                    value={
                      form.fechaMovimiento
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label className="full">
                  Observaciones
                  <textarea
                    name="observaciones"
                    value={
                      form.observaciones
                    }
                    onChange={
                      cambiarCampo
                    }
                    rows="3"
                  />
                </label>

              </div>

            </div>


            <div className="inventario-modal-footer">

              <button
                type="button"
                className="secondary"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : "Registrar entrada"}
              </button>

            </div>

          </form>

        </div>

      )}


      {/* =====================================
          MODAL SALIDA
      ===================================== */}

      {modal === "salida" && seleccionado && (

        <div className="inventario-modal-overlay">

          <form
            className="inventario-modal"
            onSubmit={
              guardarSalida
            }
          >

            <div className="inventario-modal-header">

              <div>
                <span>
                  Salida manual
                </span>
                <h3>
                  {seleccionado.nombre}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="inventario-modal-body">

              <div className="inventario-current-stock">

                <div>
                  <span>
                    Stock físico
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stock,
                      4
                    )}
                    {" "}
                    {seleccionado.unidad}
                  </strong>
                </div>

                <div>
                  <span>
                    Disponible
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stockDisponible,
                      4
                    )}
                  </strong>
                </div>

              </div>


              <div className="inventario-form-grid">

                <label>
                  Cantidad *
                  <input
                    type="number"
                    name="cantidad"
                    min="0"
                    step={
                      seleccionado.tipoVenta ===
                      "Unidad"
                        ? "1"
                        : "0.0001"
                    }
                    value={
                      form.cantidad
                    }
                    onChange={
                      cambiarCampo
                    }
                    required
                  />
                </label>


                <label>
                  Motivo *
                  <select
                    name="motivo"
                    value={
                      form.motivo
                    }
                    onChange={
                      cambiarCampo
                    }
                    required
                  >
                    {MOTIVOS_SALIDA.map(
                      (motivo) => (
                        <option
                          key={
                            motivo
                          }
                          value={
                            motivo
                          }
                        >
                          {motivo}
                        </option>
                      )
                    )}
                  </select>
                </label>


                <label>
                  Fecha
                  <input
                    type="date"
                    name="fechaMovimiento"
                    value={
                      form.fechaMovimiento
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label className="full">
                  Observaciones
                  <textarea
                    name="observaciones"
                    value={
                      form.observaciones
                    }
                    onChange={
                      cambiarCampo
                    }
                    rows="3"
                  />
                </label>

              </div>

            </div>


            <div className="inventario-modal-footer">

              <button
                type="button"
                className="secondary"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary danger"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : "Registrar salida"}
              </button>

            </div>

          </form>

        </div>

      )}


      {/* =====================================
          MODAL AJUSTE
      ===================================== */}

      {modal === "ajuste" && seleccionado && (

        <div className="inventario-modal-overlay">

          <form
            className="inventario-modal"
            onSubmit={
              guardarAjuste
            }
          >

            <div className="inventario-modal-header">

              <div>
                <span>
                  Ajuste por conteo físico
                </span>
                <h3>
                  {seleccionado.nombre}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="inventario-modal-body">

              <div className="inventario-current-stock">

                <div>
                  <span>
                    Stock del sistema
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stock,
                      4
                    )}
                    {" "}
                    {seleccionado.unidad}
                  </strong>
                </div>

                <div>
                  <span>
                    Reservado
                  </span>
                  <strong>
                    {numero(
                      seleccionado.stockReservado,
                      4
                    )}
                  </strong>
                </div>

              </div>


              <div className="inventario-form-grid">

                <label>
                  Conteo físico *
                  <input
                    type="number"
                    name="stockFisico"
                    min="0"
                    step={
                      seleccionado.tipoVenta ===
                      "Unidad"
                        ? "1"
                        : "0.0001"
                    }
                    value={
                      form.stockFisico
                    }
                    onChange={
                      cambiarCampo
                    }
                    required
                  />
                </label>


                <label>
                  Motivo
                  <input
                    type="text"
                    name="motivo"
                    value={
                      form.motivo
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label>
                  Fecha
                  <input
                    type="date"
                    name="fechaMovimiento"
                    value={
                      form.fechaMovimiento
                    }
                    onChange={
                      cambiarCampo
                    }
                  />
                </label>


                <label className="full">
                  Observaciones
                  <textarea
                    name="observaciones"
                    value={
                      form.observaciones
                    }
                    onChange={
                      cambiarCampo
                    }
                    rows="3"
                  />
                </label>

              </div>

            </div>


            <div className="inventario-modal-footer">

              <button
                type="button"
                className="secondary"
                onClick={
                  cerrarModal
                }
                disabled={
                  guardando
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary"
                disabled={
                  guardando
                }
              >
                {guardando
                  ? "Guardando..."
                  : "Registrar ajuste"}
              </button>

            </div>

          </form>

        </div>

      )}


      {/* =====================================
          MODAL MOVIMIENTOS
      ===================================== */}

      {modal === "movimientos" && seleccionado && (

        <div className="inventario-modal-overlay">

          <div className="inventario-modal inventario-modal-large">

            <div className="inventario-modal-header">

              <div>
                <span>
                  Historial de movimientos
                </span>
                <h3>
                  {seleccionado.nombre}
                </h3>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModal
                }
                aria-label="Cerrar"
              >
                ×
              </button>

            </div>


            <div className="inventario-modal-body">

              <div className="inventario-movements-wrap">

                <table className="inventario-movements-table">

                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Cantidad</th>
                      <th>Stock anterior</th>
                      <th>Stock nuevo</th>
                      <th>Reservado anterior</th>
                      <th>Reservado nuevo</th>
                      <th>Motivo</th>
                      <th>Usuario</th>
                    </tr>
                  </thead>


                  <tbody>

                    {cargandoMovimientos ? (

                      <tr>
                        <td
                          colSpan="9"
                          className="inventario-empty"
                        >
                          Cargando movimientos...
                        </td>
                      </tr>

                    ) : movimientos.length === 0 ? (

                      <tr>
                        <td
                          colSpan="9"
                          className="inventario-empty"
                        >
                          Este producto todavía no tiene movimientos registrados.
                        </td>
                      </tr>

                    ) : (

                      movimientos.map(
                        (
                          movimiento
                        ) => (

                          <tr
                            key={
                              movimiento._id
                            }
                          >

                            <td>
                              {fechaHora(
                                movimiento
                                  .fechaMovimiento ||
                                movimiento
                                  .createdAt
                              )}
                            </td>

                            <td>
                              <strong>
                                {movimiento.tipo}
                              </strong>
                            </td>

                            <td>
                              {numero(
                                movimiento.cantidad,
                                4
                              )}
                            </td>

                            <td>
                              {numero(
                                movimiento.stockAnterior,
                                4
                              )}
                            </td>

                            <td>
                              {numero(
                                movimiento.stockNuevo,
                                4
                              )}
                            </td>

                            <td>
                              {numero(
                                movimiento.reservadoAnterior,
                                4
                              )}
                            </td>

                            <td>
                              {numero(
                                movimiento.reservadoNuevo,
                                4
                              )}
                            </td>

                            <td>
                              {movimiento.motivo ||
                                "-"}
                            </td>

                            <td>
                              {[
                                movimiento
                                  .usuario
                                  ?.nombres,
                                movimiento
                                  .usuario
                                  ?.apellidos,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                ) ||
                                movimiento
                                  .usuario
                                  ?.usuario ||
                                "-"}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            <div className="inventario-modal-footer">

              <button
                type="button"
                className="secondary"
                onClick={
                  cerrarModal
                }
              >
                Cerrar
              </button>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}
