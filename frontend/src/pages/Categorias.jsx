import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  listarCategorias,
  obtenerSiguienteCodigoCategoria,
  crearCategoria,
  actualizarCategoria,
  cambiarEstadoCategoria,
  eliminarCategoria,
} from "../services/categoria.service.js";

import { useAuth }
  from "../context/AuthContext.jsx";

import Toast
  from "../components/Toast.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import buscarIcon
  from "../assets/icons/buscar.png";

import editarIcon
  from "../assets/icons/editar-categoria.png";

import bloquearIcon
  from "../assets/icons/bloquear.png";

import desbloquearIcon
  from "../assets/icons/desbloquear.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";

import guardarIcon
  from "../assets/icons/guardar.png";

import eliminarIcon
  from "../assets/icons/eliminar-categoria.png";

import nuevaCategoriaIcon
  from "../assets/icons/nueva-categoria.png";

import imprimirIcon
  from "../assets/icons/imprimir.png";

import categoriasPrintCss
  from "../styles/categorias-print.css?inline";

import "../styles/categorias.css";


const FORM_INICIAL = {
  codigo: "",
  nombre: "",
  descripcion: "",
  estado: "Activa",
};


export default function Categorias() {

  const { usuario } = useAuth();

  const [
    categorias,
    setCategorias,
  ] = useState([]);

  const [
    categoriaSeleccionada,
    setCategoriaSeleccionada,
  ] = useState(null);

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(false);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState(FORM_INICIAL);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
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
     BUSCAR
  ========================================= */

  const [
    modalBuscarAbierto,
    setModalBuscarAbierto,
  ] = useState(false);

  const [
    filtroBuscar,
    setFiltroBuscar,
  ] = useState("");

  const [
    campoBuscar,
    setCampoBuscar,
  ] = useState("todos");

  const modalBuscarRef =
    useRef(null);

  const [
    posicionModal,
    setPosicionModal,
  ] = useState({
    x: 0,
    y: 0,
  });

  const arrastreRef =
    useRef({
      activo: false,
      offsetX: 0,
      offsetY: 0,
    });


  /* =========================================
     CARGAR
  ========================================= */

  async function cargarCategorias() {

    try {

      setCargando(true);

      const data =
        await listarCategorias();

      setCategorias(
        Array.isArray(data)
          ? data
          : data?.categorias ||
            []
      );

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible cargar las categorías."
      );

    } finally {

      setCargando(false);

    }

  }


  useEffect(() => {

    cargarCategorias();

  }, []);


  useEffect(() => {

    if (!mensaje && !error) {
      return;
    }

    const timer =
      setTimeout(() => {

        setMensaje("");
        setError("");

      }, 3000);

    return () =>
      clearTimeout(timer);

  }, [
    mensaje,
    error,
  ]);


  /* =========================================
     FORMULARIO
  ========================================= */

  function cambiar(event) {

    const {
      name,
      value,
    } = event.target;

    setForm(
      (actual) => ({
        ...actual,
        [name]: value,
      })
    );

  }


  async function nuevaCategoria() {

    try {

      setCategoriaSeleccionada(
        null
      );

      setModoEdicion(false);

      setMensaje("");
      setError("");

      const data =
        await obtenerSiguienteCodigoCategoria();

      setForm({
        ...FORM_INICIAL,

        codigo:
          data?.codigo || "",
      });

      setMostrarFormulario(true);

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible obtener el siguiente código."
      );

    }

  }


  function abrirEditarCategoria(
    categoria
  ) {

    setCategoriaSeleccionada(
      categoria
    );

    setModoEdicion(true);

    setForm({
      codigo:
        categoria.codigo || "",

      nombre:
        categoria.nombre || "",

      descripcion:
        categoria.descripcion || "",

      estado:
        categoria.estado || "Activa",
    });

    setMostrarFormulario(true);

    setMensaje("");
    setError("");
  }


  function cerrarFormularioCategoria() {

    setMostrarFormulario(false);

    setCategoriaSeleccionada(null);

    setModoEdicion(false);

    setForm(FORM_INICIAL);
  }


  function cargarCategoriaSeleccionada(
    categoria
  ) {

    setCategoriaSeleccionada(
      categoria
    );

    setForm({
      codigo:
        categoria.codigo || "",

      nombre:
        categoria.nombre || "",

      descripcion:
        categoria.descripcion || "",

      estado:
        categoria.estado || "Activa",
    });

    setModoEdicion(true);

    setModalBuscarAbierto(false);

    setFiltroBuscar("");

    setMensaje(
      `Categoría ${categoria.codigo} cargada correctamente.`
    );

    setError("");

  }


  /* =========================================
     GUARDAR
  ========================================= */

  async function guardarCategoria() {

    setMensaje("");
    setError("");


    if (!form.nombre.trim()) {

      setError(
        "El nombre de la categoría es obligatorio."
      );

      return;
    }


    try {

      setGuardando(true);


      const datos = {
        nombre:
          form.nombre.trim(),

        descripcion:
          form.descripcion.trim(),
      };


      if (
        modoEdicion &&
        categoriaSeleccionada?._id
      ) {

        await actualizarCategoria(
          categoriaSeleccionada._id,
          datos
        );

        setMensaje(
          "Categoría actualizada correctamente."
        );

      } else {

        await crearCategoria(
          datos
        );

        setMensaje(
          "Categoría creada correctamente."
        );

      }


      await cargarCategorias();

      setCategoriaSeleccionada(
        null
      );

      setModoEdicion(false);

      setMostrarFormulario(false);


      const siguiente =
        await obtenerSiguienteCodigoCategoria();

      setForm({
        ...FORM_INICIAL,

        codigo:
          siguiente?.codigo || "",
      });


    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible guardar la categoría."
      );

    } finally {

      setGuardando(false);

    }

  }


  /* =========================================
     ESTADO DIRECTO
  ========================================= */

  async function cambiarEstadoDirecto(
    categoria
  ) {

    try {

      const respuesta =
        await cambiarEstadoCategoria(
          categoria._id
        );

      setMensaje(
        respuesta?.mensaje ||
        "Estado actualizado correctamente."
      );

      await cargarCategorias();

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible cambiar el estado."
      );

    }

  }


  /* =========================================
     ELIMINAR DIRECTO
  ========================================= */

  async function eliminarCategoriaDirecta(
    categoria
  ) {

    const confirmar =
      window.confirm(
        `¿Deseas eliminar la categoría "${categoria.nombre}"?`
      );

    if (!confirmar) return;


    try {

      await eliminarCategoria(
        categoria._id
      );

      setMensaje(
        "Categoría eliminada correctamente."
      );

      await cargarCategorias();

    } catch (err) {

      setError(
        err?.response?.data?.mensaje ||
        "No fue posible eliminar la categoría."
      );

    }

  }


  /* =========================================
     FILTRO
  ========================================= */

  const categoriasBusqueda =
    useMemo(() => {

      const texto =
        filtroBuscar
          .trim()
          .toLowerCase();


      if (!texto) {
        return categorias;
      }


      return categorias.filter(
        (categoria) => {

          const codigo =
            String(
              categoria.codigo || ""
            ).toLowerCase();

          const nombre =
            String(
              categoria.nombre || ""
            ).toLowerCase();

          const descripcion =
            String(
              categoria.descripcion || ""
            ).toLowerCase();

          const estado =
            String(
              categoria.estado || ""
            ).toLowerCase();


          switch (campoBuscar) {

            case "codigo":
              return codigo.includes(
                texto
              );

            case "nombre":
              return nombre.includes(
                texto
              );

            case "descripcion":
              return descripcion.includes(
                texto
              );

            case "estado":
              return estado.includes(
                texto
              );

            default:
              return (
                codigo.includes(texto) ||
                nombre.includes(texto) ||
                descripcion.includes(texto) ||
                estado.includes(texto)
              );

          }

        }
      );

    }, [
      categorias,
      filtroBuscar,
      campoBuscar,
    ]);


  /* =========================================
     ABRIR BUSCAR
  ========================================= */

  function abrirBuscarCategorias() {

    setFiltroBuscar("");
    setCampoBuscar("todos");


    setPosicionModal({
      x: Math.max(
        20,
        (window.innerWidth - 760) / 2
      ),

      y: Math.max(
        20,
        (window.innerHeight - 500) / 2
      ),
    });


    setModalBuscarAbierto(
      true
    );

  }


  /* =========================================
     ARRASTRAR MODAL
  ========================================= */

  function iniciarArrastreModal(
    event
  ) {

    if (!modalBuscarRef.current) {
      return;
    }


    const rect =
      modalBuscarRef.current
        .getBoundingClientRect();


    arrastreRef.current = {
      activo: true,

      offsetX:
        event.clientX -
        rect.left,

      offsetY:
        event.clientY -
        rect.top,
    };


    document.addEventListener(
      "mousemove",
      moverModal
    );

    document.addEventListener(
      "mouseup",
      terminarArrastreModal
    );

  }


  function moverModal(event) {

    if (
      !arrastreRef.current.activo
    ) {
      return;
    }


    const modal =
      modalBuscarRef.current;


    if (!modal) {
      return;
    }


    const ancho =
      modal.offsetWidth;

    const alto =
      modal.offsetHeight;


    let x =
      event.clientX -
      arrastreRef.current.offsetX;

    let y =
      event.clientY -
      arrastreRef.current.offsetY;


    x =
      Math.max(
        10,
        Math.min(
          window.innerWidth -
          ancho -
          10,

          x
        )
      );


    y =
      Math.max(
        10,
        Math.min(
          window.innerHeight -
          alto -
          10,

          y
        )
      );


    setPosicionModal({
      x,
      y,
    });

  }


  function terminarArrastreModal() {

    arrastreRef.current.activo =
      false;


    document.removeEventListener(
      "mousemove",
      moverModal
    );

    document.removeEventListener(
      "mouseup",
      terminarArrastreModal
    );

  }


  /* =========================================
     ESCAPAR HTML
  ========================================= */

  function escaparHtml(valor) {

    return String(valor ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* =========================================
     IMPRIMIR
  ========================================= */

  function imprimirCategorias() {

    if (!categorias.length) {

      setError(
        "No hay categorías para imprimir."
      );

      return;
    }


    const fechaHora =
      new Date().toLocaleString(
        "es-CO",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }
      );


    const usuarioImpresion =
      usuario?.nombres ||
      usuario?.apellidos
        ? `${usuario?.nombres || ""} ${
            usuario?.apellidos || ""
          }`.trim()
        : usuario?.usuario ||
          "Usuario";


    const filas =
      categorias
        .map(
          (categoria) => `
            <tr>

              <td>
                <strong>
                  ${escaparHtml(
                    categoria.codigo || "-"
                  )}
                </strong>
              </td>

              <td>
                ${escaparHtml(
                  categoria.nombre || "-"
                )}
              </td>

              <td>
                ${escaparHtml(
                  categoria.descripcion ||
                  "Sin descripción"
                )}
              </td>

              <td>
                ${escaparHtml(
                  categoria.estado || "-"
                )}
              </td>

            </tr>
          `
        )
        .join("");


    const ventana =
      window.open(
        "",
        "_blank",
        "width=1200,height=800"
      );


    if (!ventana) {

      setError(
        "El navegador bloqueó la ventana de impresión."
      );

      return;
    }


    ventana.document.write(`
      <!DOCTYPE html>

      <html lang="es">

        <head>

          <meta charset="UTF-8" />

          <title>
            Categorías registradas
          </title>

          <style>
            ${categoriasPrintCss}
          </style>

        </head>


        <body>

          <main class="categorias-print-page">


            <header class="categorias-print-header">

              <h1>
                Categorías registradas
              </h1>

              <p>
                WebBuys - Listado de categorías
              </p>


              <div class="categorias-print-info">

                <span>

                  <strong>
                    Fecha y hora de impresión:
                  </strong>

                  ${escaparHtml(
                    fechaHora
                  )}

                </span>


                <span>

                  <strong>
                    Usuario:
                  </strong>

                  ${escaparHtml(
                    usuarioImpresion
                  )}

                </span>

              </div>

            </header>


            <table class="categorias-print-table">

              <thead>

                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Estado</th>
                </tr>

              </thead>


              <tbody>
                ${filas}
              </tbody>

            </table>


            <div class="categorias-print-total">

              Total categorías:

              <strong>
                ${categorias.length}
              </strong>

            </div>


            <footer class="categorias-print-footer">
              WebBuys
            </footer>

          </main>

        </body>

      </html>
    `);


    ventana.document.close();

    ventana.focus();


    setTimeout(
      () => {
        ventana.print();
      },
      300
    );

  }


  /* =========================================
     RENDER
  ========================================= */

  return (

    <section className="categorias-module">

      <Toast
        mensaje={mensaje}
        error={error}
      />


      {/* CABECERA */}

      <div className="categorias-title-bar">

        <div className="categorias-title-left">

          <ModulosMenu />

          <div className="categorias-title-info">

            <h2>
              Categorías
            </h2>

          </div>

        </div>

      </div>


      {/* PANEL PRINCIPAL */}

      <div className="categorias-list-panel">

        <div className="categorias-list-header">

          <div>
            <h3>Categorías registradas</h3>

            <span>
              {categorias.length} categorías
            </span>
          </div>


          <div className="categorias-list-actions">

            {/* NUEVA */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={nuevaCategoria}
              data-tooltip="Nueva categoría"
              aria-label="Nueva categoría"
            >
              <img
                src={nuevaCategoriaIcon}
                alt=""
              />
            </button>


            {/* EDITAR */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={() =>
                abrirEditarCategoria(
                  categoriaSeleccionada
                )
              }
              disabled={!categoriaSeleccionada}
              data-tooltip="Editar categoría"
              aria-label="Editar categoría"
            >
              <img
                src={editarIcon}
                alt=""
              />
            </button>


            {/* ACTIVAR / DESACTIVAR */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={() =>
                cambiarEstadoDirecto(
                  categoriaSeleccionada
                )
              }
              disabled={!categoriaSeleccionada}
              data-tooltip={
                categoriaSeleccionada?.estado === "Activa"
                  ? "Desactivar categoría"
                  : "Activar categoría"
              }
              aria-label={
                categoriaSeleccionada?.estado === "Activa"
                  ? "Desactivar categoría"
                  : "Activar categoría"
              }
            >
              <img
                src={
                  categoriaSeleccionada?.estado === "Activa"
                    ? bloquearIcon
                    : desbloquearIcon
                }
                alt=""
              />
            </button>


            {/* ELIMINAR */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={() =>
                eliminarCategoriaDirecta(
                  categoriaSeleccionada
                )
              }
              disabled={!categoriaSeleccionada}
              data-tooltip="Eliminar categoría"
              aria-label="Eliminar categoría"
            >
              <img
                src={eliminarIcon}
                alt=""
              />
            </button>


            {/* BUSCAR */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={abrirBuscarCategorias}
              data-tooltip="Buscar categoría"
              aria-label="Buscar categoría"
            >
              <img
                src={buscarIcon}
                alt=""
              />
            </button>


            {/* IMPRIMIR */}

            <button
              type="button"
              className="categorias-work-btn"
              onClick={imprimirCategorias}
              disabled={!categorias.length}
              data-tooltip="Imprimir categorías"
              aria-label="Imprimir categorías"
            >
              <img
                src={imprimirIcon}
                alt=""
              />
            </button>

          </div>

        </div>


        {/* TABLA */}

        <div className="categorias-table-wrap">

          <table className="categorias-table">

            <thead>

              <tr>
                <th>Código</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Productos</th>
                <th>Estado</th>
              </tr>

            </thead>


            <tbody>

              {cargando ? (

                <tr>
                  <td
                    colSpan="5"
                    className="categorias-table-empty"
                  >
                    Cargando categorías...
                  </td>
                </tr>

              ) : categorias.length === 0 ? (

                <tr>
                  <td
                    colSpan="5"
                    className="categorias-table-empty"
                  >
                    No hay categorías registradas.
                  </td>
                </tr>

              ) : (

                categorias.map((categoria) => (

                  <tr
                    key={categoria._id}
                    className={
                      categoriaSeleccionada?._id ===
                      categoria._id
                        ? "selected"
                        : ""
                    }
                    onClick={() =>
                      setCategoriaSeleccionada(
                        categoria
                      )
                    }
                  >

                    <td>
                      <strong className="categorias-code">
                        {categoria.codigo}
                      </strong>
                    </td>


                    <td>
                      <strong>
                        {categoria.nombre}
                      </strong>
                    </td>


                    <td>
                      {categoria.descripcion ||
                        "Sin descripción"}
                    </td>


                    <td>
                      {categoria.totalProductos ?? 0}
                    </td>


                    <td>

                      <span
                        className={
                          categoria.estado ===
                          "Activa"
                            ? "categorias-status active"
                            : "categorias-status inactive"
                        }
                      >
                        {categoria.estado}
                      </span>

                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* MODAL NUEVA / EDITAR */}

      {mostrarFormulario && (

        <div
          className="categorias-form-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              cerrarFormularioCategoria();
            }
          }}
        >

          <div className="categorias-form-modal">

            <div className="categorias-form-header">

              <h3>
                {modoEdicion
                  ? "Editar categoría"
                  : "Nueva categoría"}
              </h3>


              <button
                type="button"
                onClick={
                  cerrarFormularioCategoria
                }
              >
                <img
                  src={cerrarIcon}
                  alt=""
                />
              </button>

            </div>


            <div className="categorias-form-body">

              <label>
                Código

                <input
                  value={form.codigo}
                  readOnly
                />
              </label>


              <label>
                Nombre de categoría *

                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={cambiar}
                  placeholder="Ej. Quesos"
                  autoFocus
                />
              </label>


              <label>
                Descripción

                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={cambiar}
                  placeholder="Descripción de la categoría"
                />
              </label>


              <label>
                Estado

                <select
                  value={form.estado}
                  disabled
                >
                  <option value="Activa">
                    Activa
                  </option>

                  <option value="Inactiva">
                    Inactiva
                  </option>
                </select>

              </label>

            </div>


            <div className="categorias-form-actions">

              <button
                type="button"
                className="categorias-form-cancel"
                onClick={
                  cerrarFormularioCategoria
                }
              >
                Cancelar
              </button>


              <button
                type="button"
                className="categorias-form-save"
                onClick={guardarCategoria}
                disabled={guardando}
              >
                Guardar
              </button>

            </div>

          </div>

        </div>

      )}


      {/* MODAL BUSCAR */}

      {modalBuscarAbierto && (

        <div className="categorias-search-modal-overlay">

          <div
            ref={modalBuscarRef}
            className="categorias-search-modal"
            style={{
              left:
                posicionModal.x,

              top:
                posicionModal.y,
            }}
          >

            <div
              className="categorias-search-modal-header"
              onMouseDown={
                iniciarArrastreModal
              }
            >

              <h3>
                Buscar categorías
              </h3>


              <button
                type="button"
                className="categorias-search-modal-close"
                onMouseDown={
                  (event) =>
                    event.stopPropagation()
                }
                onClick={() =>
                  setModalBuscarAbierto(
                    false
                  )
                }
              >

                <img
                  src={cerrarIcon}
                  alt=""
                />

              </button>

            </div>


            <div className="categorias-search-modal-filters">

              <select
                value={campoBuscar}
                onChange={
                  (event) =>
                    setCampoBuscar(
                      event.target.value
                    )
                }
              >

                <option value="todos">
                  Todos
                </option>

                <option value="codigo">
                  Código
                </option>

                <option value="nombre">
                  Nombre
                </option>

                <option value="descripcion">
                  Descripción
                </option>

                <option value="estado">
                  Estado
                </option>

              </select>


              <div className="categorias-search-modal-input">

                <img
                  src={buscarIcon}
                  alt=""
                />

                <input
                  type="text"
                  value={filtroBuscar}
                  onChange={
                    (event) =>
                      setFiltroBuscar(
                        event.target.value
                      )
                  }
                  placeholder="Buscar categoría..."
                  autoFocus
                />

              </div>

            </div>


            <div className="categorias-search-modal-table-wrap">

              <table className="categorias-search-modal-table">

                <thead>

                  <tr>
                    <th>Código</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                  </tr>

                </thead>


                <tbody>

                  {cargando ? (

                    <tr>

                      <td
                        colSpan="4"
                        className="categorias-search-empty"
                      >
                        Cargando categorías...
                      </td>

                    </tr>

                  ) : categoriasBusqueda.length === 0 ? (

                    <tr>

                      <td
                        colSpan="4"
                        className="categorias-search-empty"
                      >
                        No se encontraron categorías.
                      </td>

                    </tr>

                  ) : (

                    categoriasBusqueda.map(
                      (categoria) => (

                        <tr
                          key={
                            categoria._id
                          }
                          onDoubleClick={() =>
                            cargarCategoriaSeleccionada(
                              categoria
                            )
                          }
                        >

                          <td>

                            <strong>
                              {categoria.codigo ||
                                "Sin código"}
                            </strong>

                          </td>


                          <td>
                            {categoria.nombre}
                          </td>


                          <td>
                            {categoria.descripcion ||
                              "Sin descripción"}
                          </td>


                          <td>

                            <span
                              className={
                                categoria.estado ===
                                "Activa"
                                  ? "categorias-search-status active"
                                  : "categorias-search-status inactive"
                              }
                            >
                              {categoria.estado}
                            </span>

                          </td>

                        </tr>

                      )
                    )

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </section>

  );

}