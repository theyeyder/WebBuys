import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createPortal,
} from "react-dom";

import AppLayout
  from "../layouts/AppLayout.jsx";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import Toast
  from "../components/Toast.jsx";

import {
  listarEmpleados,
  obtenerSiguienteCodigoEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  cambiarEstadoEmpleado,
  eliminarEmpleado,
} from "../services/empleado.service.js";

import {
  listarRutas,
} from "../services/ruta.service.js";

import {
  imprimirEmpleados,
} from "../utils/empleado.impresion.js";

import empleadosIcon
  from "../assets/icons/nuevo empleado.png";

import editarIcon
  from "../assets/icons/editar.png";

import bloquearIcon
  from "../assets/icons/bloquear.png";

import desbloquearIcon
  from "../assets/icons/desbloquear.png";

import eliminarIcon
  from "../assets/icons/Eliminar ruta.png";

import buscarIcon
  from "../assets/icons/buscar.png";

import imprimirIcon
  from "../assets/icons/imprimir.png";

import guardarIcon
  from "../assets/icons/guardar.png";

import cerrarIcon
  from "../assets/icons/cerrar.png";

import calendarioIcon
  from "../assets/icons/calendario.png";


import "../styles/empleados.css";
const MESES_CALENDARIO = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];


const ANIOS_CALENDARIO =
  Array.from(
    {
      length:
        151,
    },
    (
      _,
      index
    ) =>
      1950 +
      index
  );


const DIAS_SEMANA = [
  "D",
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
];


const FORM_INICIAL = {
  codigo:
    "",
  tipoDocumento:
    "CC",
  documento:
    "",
  nombres:
    "",
  apellidos:
    "",
  telefono:
    "",
  direccion:
    "",
  ciudad:
    "Ibagué",
  cargo:
    "",
  fechaIngreso:
    "",
  salario:
    "",
  rutaAsignada:
    "",
  estado:
    "Activo",
  observaciones:
    "",
};


function fechaParaInput(
  valor
) {

  if (!valor) {
    return "";
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
    return "";
  }


  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function fechaAStringCalendario(
  fecha
) {

  const year =
    fecha.getFullYear();

  const month =
    String(
      fecha.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


function mostrarFechaCalendario(
  valor
) {

  if (!valor) {
    return "dd/mm/aaaa";
  }


  const fecha =
    new Date(
      `${valor}T00:00:00`
    );


  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return "dd/mm/aaaa";
  }


  return fecha
    .toLocaleDateString(
      "es-CO",
      {
        day:
          "2-digit",
        month:
          "2-digit",
        year:
          "numeric",
      }
    );

}


function obtenerDiasCalendario(
  mes
) {

  const year =
    mes.getFullYear();

  const month =
    mes.getMonth();

  const primerDia =
    new Date(
      year,
      month,
      1
    );

  const inicio =
    new Date(
      primerDia
    );


  inicio.setDate(
    primerDia.getDate() -
    primerDia.getDay()
  );


  return Array.from(
    {
      length:
        42,
    },
    (
      _,
      index
    ) => {

      const fecha =
        new Date(
          inicio
        );


      fecha.setDate(
        inicio.getDate() +
        index
      );


      return fecha;

    }
  );

}


function nombreCompleto(
  empleado
) {

  return [
    empleado?.nombres,
    empleado?.apellidos,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

}


function nombreRuta(
  empleado
) {

  if (
    typeof empleado
      ?.rutaAsignada ===
    "object"
  ) {

    return (
      empleado
        .rutaAsignada
        ?.nombre ||
      empleado
        .rutaAsignada
        ?.codigo ||
      "Sin asignar"
    );

  }


  return "Sin asignar";

}


function moneda(
  valor
) {

  return new Intl.NumberFormat(
    "es-CO",
    {
      style:
        "currency",
      currency:
        "COP",
      maximumFractionDigits:
        0,
    }
  ).format(
    Number(
      valor ||
      0
    )
  );

}


export default function Empleados() {

  const [
    empleados,
    setEmpleados,
  ] = useState([]);

  const [
    rutas,
    setRutas,
  ] = useState([]);

  const [
    empleadoSeleccionado,
    setEmpleadoSeleccionado,
  ] = useState(
    null
  );

  const [
    modoEdicion,
    setModoEdicion,
  ] = useState(
    false
  );

  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL
  );

  const [
    cargando,
    setCargando,
  ] = useState(
    true
  );

  const [
    guardando,
    setGuardando,
  ] = useState(
    false
  );

  const [
    mensaje,
    setMensaje,
  ] = useState(
    ""
  );

  const [
    tipoMensaje,
    setTipoMensaje,
  ] = useState(
    "info"
  );


  /* FILTROS DE LA TABLA */

  const [
    filtro,
    setFiltro,
  ] = useState(
    ""
  );

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState(
    "Todos"
  );


  /* MODAL BUSCAR */

  const [
    modalBuscarAbierto,
    setModalBuscarAbierto,
  ] = useState(
    false
  );

  const [
    buscarTexto,
    setBuscarTexto,
  ] = useState(
    ""
  );

  const [
    buscarCampo,
    setBuscarCampo,
  ] = useState(
    "todos"
  );


  /* VISTA PREVIA DE IMPRESIÓN */

  const [
    modalImpresionAbierto,
    setModalImpresionAbierto,
  ] = useState(
    false
  );


  /* CALENDARIO FECHA DE INGRESO */

  const [
    calendarioIngresoAbierto,
    setCalendarioIngresoAbierto,
  ] = useState(
    false
  );

  const [
    mesCalendarioIngreso,
    setMesCalendarioIngreso,
  ] = useState(
    new Date()
  );

  const [
    fechaTemporalIngreso,
    setFechaTemporalIngreso,
  ] = useState(
    ""
  );


  useEffect(
    () => {

      if (
        !modalImpresionAbierto
      ) {
        return;
      }


      const overflowAnterior =
        document.body.style.overflow;


      document.body.style.overflow =
        "hidden";


      return () => {

        document.body.style.overflow =
          overflowAnterior;

      };

    },
    [
      modalImpresionAbierto,
    ]
  );


  /* =========================================================
     MENSAJES
  ========================================================= */

  function mostrarMensaje(
    texto,
    tipo =
      "info"
  ) {

    setMensaje(
      texto
    );

    setTipoMensaje(
      tipo
    );

  }


  useEffect(
    () => {

      if (!mensaje) {
        return;
      }


      const timer =
        window.setTimeout(
          () => {
            setMensaje(
              ""
            );
          },
          3200
        );


      return () =>
        window.clearTimeout(
          timer
        );

    },
    [
      mensaje,
    ]
  );


  /* =========================================================
     CARGAR
  ========================================================= */

  async function cargarEmpleados() {

    try {

      setCargando(
        true
      );


      const respuesta =
        await listarEmpleados();


      const lista =
        Array.isArray(
          respuesta
        )
          ? respuesta
          : respuesta
              ?.empleados ||
            [];


      setEmpleados(
        lista
      );


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible cargar los empleados.",
        "error"
      );


    } finally {

      setCargando(
        false
      );

    }

  }


  async function cargarRutas() {

    try {

      const respuesta =
        await listarRutas();


      const lista =
        Array.isArray(
          respuesta
        )
          ? respuesta
          : respuesta
              ?.rutas ||
            [];


      setRutas(
        lista
      );


    } catch (error) {

      console.error(
        "No fue posible cargar las rutas:",
        error
      );

    }

  }


  async function cargarSiguienteCodigo() {

    try {

      const respuesta =
        await obtenerSiguienteCodigoEmpleado();


      setForm(
        (
          actual
        ) => ({
          ...actual,
          codigo:
            respuesta
              ?.codigo ||
            "",
        })
      );


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible obtener el siguiente código de empleado.",
        "error"
      );

    }

  }


  useEffect(
    () => {

      cargarEmpleados();

      cargarRutas();

      cargarSiguienteCodigo();

    },
    []
  );


  /* =========================================================
     FORMULARIO
  ========================================================= */

  function cambiarCampo(
    event
  ) {

    const {
      name,
      value,
    } =
      event.target;


    setForm(
      (
        actual
      ) => ({
        ...actual,
        [name]:
          value,
      })
    );

  }


  async function nuevoEmpleado() {

    setEmpleadoSeleccionado(
      null
    );

    setModoEdicion(
      false
    );

    setForm({
      ...FORM_INICIAL,
      fechaIngreso:
        fechaParaInput(
          new Date()
        ),
    });


    try {

      const respuesta =
        await obtenerSiguienteCodigoEmpleado();


      setForm(
        (
          actual
        ) => ({
          ...actual,
          codigo:
            respuesta
              ?.codigo ||
            "",
        })
      );


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible preparar un nuevo empleado.",
        "error"
      );

    }

  }


  function cargarEnFormulario(
    empleado,
    editar =
      false
  ) {

    if (!empleado) {
      return;
    }


    const rutaId =
      typeof empleado
        .rutaAsignada ===
      "object"
        ? empleado
            .rutaAsignada
            ?._id ||
          ""
        : empleado
            .rutaAsignada ||
          "";


    setEmpleadoSeleccionado(
      empleado
    );

    setModoEdicion(
      editar
    );

    setForm({
      codigo:
        empleado
          .codigo ||
        "",
      tipoDocumento:
        empleado
          .tipoDocumento ||
        "CC",
      documento:
        empleado
          .documento ||
        "",
      nombres:
        empleado
          .nombres ||
        "",
      apellidos:
        empleado
          .apellidos ||
        "",
      telefono:
        empleado
          .telefono ||
        "",
      direccion:
        empleado
          .direccion ||
        "",
      ciudad:
        empleado
          .ciudad ||
        "",
      cargo:
        empleado
          .cargo ||
        "",
      fechaIngreso:
        fechaParaInput(
          empleado
            .fechaIngreso
        ),
      salario:
        empleado
          .salario ??
        "",
      rutaAsignada:
        rutaId,
      estado:
        empleado
          .estado ||
        "Activo",
      observaciones:
        empleado
          .observaciones ||
        "",
    });

  }


  function editarSeleccionado() {

    if (
      !empleadoSeleccionado
    ) {

      mostrarMensaje(
        "Seleccione primero un empleado.",
        "warning"
      );

      return;

    }


    setModoEdicion(
      true
    );

  }


  async function guardarEmpleado() {

    if (
      !form
        .documento
        .trim()
    ) {

      mostrarMensaje(
        "El documento es obligatorio.",
        "warning"
      );

      return;

    }


    if (
      !form
        .nombres
        .trim()
    ) {

      mostrarMensaje(
        "Los nombres son obligatorios.",
        "warning"
      );

      return;

    }


    if (
      !form
        .apellidos
        .trim()
    ) {

      mostrarMensaje(
        "Los apellidos son obligatorios.",
        "warning"
      );

      return;

    }


    if (
      !form
        .cargo
        .trim()
    ) {

      mostrarMensaje(
        "El cargo es obligatorio.",
        "warning"
      );

      return;

    }


    if (
      Number(
        form.salario ||
        0
      ) < 0
    ) {

      mostrarMensaje(
        "El salario no puede ser negativo.",
        "warning"
      );

      return;

    }


    const datos = {
      tipoDocumento:
        form
          .tipoDocumento,
      documento:
        form
          .documento
          .trim(),
      nombres:
        form
          .nombres
          .trim(),
      apellidos:
        form
          .apellidos
          .trim(),
      telefono:
        form
          .telefono
          .trim(),
      direccion:
        form
          .direccion
          .trim(),
      ciudad:
        form
          .ciudad
          .trim(),
      cargo:
        form
          .cargo
          .trim(),
      fechaIngreso:
        form
          .fechaIngreso ||
        undefined,
      salario:
        Number(
          form.salario ||
          0
        ),
      rutaAsignada:
        form
          .rutaAsignada ||
        null,
      observaciones:
        form
          .observaciones
          .trim(),
    };


    try {

      setGuardando(
        true
      );


      if (
        empleadoSeleccionado
          ?._id &&
        modoEdicion
      ) {

        await actualizarEmpleado(
          empleadoSeleccionado
            ._id,
          datos
        );


        mostrarMensaje(
          "Empleado actualizado correctamente.",
          "success"
        );


      } else {

        await crearEmpleado(
          datos
        );


        mostrarMensaje(
          "Empleado creado correctamente.",
          "success"
        );

      }


      await cargarEmpleados();

      await nuevoEmpleado();


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible guardar el empleado.",
        "error"
      );


    } finally {

      setGuardando(
        false
      );

    }

  }


  /* =========================================================
     ESTADO
  ========================================================= */

  async function cambiarEstadoSeleccionado() {

    if (
      !empleadoSeleccionado
        ?._id
    ) {

      mostrarMensaje(
        "Seleccione primero un empleado.",
        "warning"
      );

      return;

    }


    const accion =
      empleadoSeleccionado
        .estado ===
      "Activo"
        ? "desactivar"
        : "activar";


    const confirmar =
      window.confirm(
        `¿Deseas ${accion} a ${nombreCompleto(
          empleadoSeleccionado
        )}?`
      );


    if (!confirmar) {
      return;
    }


    try {

      const respuesta =
        await cambiarEstadoEmpleado(
          empleadoSeleccionado
            ._id
        );


      mostrarMensaje(
        respuesta
          ?.mensaje ||
        "Estado actualizado correctamente.",
        "success"
      );


      setEmpleadoSeleccionado(
        null
      );

      setModoEdicion(
        false
      );


      await cargarEmpleados();

      await nuevoEmpleado();


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible cambiar el estado.",
        "error"
      );

    }

  }


  /* =========================================================
     ELIMINAR
  ========================================================= */

  async function eliminarSeleccionado() {

    if (
      !empleadoSeleccionado
        ?._id
    ) {

      mostrarMensaje(
        "Seleccione primero un empleado.",
        "warning"
      );

      return;

    }


    const confirmar =
      window.confirm(
        `¿Deseas eliminar al empleado "${nombreCompleto(
          empleadoSeleccionado
        )}"?`
      );


    if (!confirmar) {
      return;
    }


    try {

      const respuesta =
        await eliminarEmpleado(
          empleadoSeleccionado
            ._id
        );


      mostrarMensaje(
        respuesta
          ?.mensaje ||
        "Empleado eliminado correctamente.",
        "success"
      );


      await cargarEmpleados();

      await nuevoEmpleado();


    } catch (error) {

      mostrarMensaje(
        error
          ?.response
          ?.data
          ?.mensaje ||
          "No fue posible eliminar el empleado.",
        "error"
      );

    }

  }


  /* =========================================================
     CALENDARIO FECHA DE INGRESO
  ========================================================= */

  function abrirCalendarioIngreso() {

    if (
      formularioBloqueado ||
      guardando
    ) {
      return;
    }


    const fechaBase =
      form.fechaIngreso ||
      fechaAStringCalendario(
        new Date()
      );


    setFechaTemporalIngreso(
      form.fechaIngreso ||
      ""
    );


    setMesCalendarioIngreso(
      new Date(
        `${fechaBase}T00:00:00`
      )
    );


    setCalendarioIngresoAbierto(
      true
    );

  }


  function cerrarCalendarioIngreso() {

    setCalendarioIngresoAbierto(
      false
    );

  }


  function aplicarCalendarioIngreso() {

    setForm(
      (
        actual
      ) => ({
        ...actual,
        fechaIngreso:
          fechaTemporalIngreso ||
          "",
      })
    );


    setCalendarioIngresoAbierto(
      false
    );

  }


  function moverMesCalendarioIngreso(
    cantidad
  ) {

    setMesCalendarioIngreso(
      (
        actual
      ) =>
        new Date(
          actual.getFullYear(),
          actual.getMonth() +
          cantidad,
          1
        )
    );

  }


  function cambiarMesCalendarioIngreso(
    event
  ) {

    const mes =
      Number(
        event.target.value
      );


    setMesCalendarioIngreso(
      (
        actual
      ) =>
        new Date(
          actual.getFullYear(),
          mes,
          1
        )
    );

  }


  function cambiarAnioCalendarioIngreso(
    event
  ) {

    const year =
      Number(
        event.target.value
      );


    setMesCalendarioIngreso(
      (
        actual
      ) =>
        new Date(
          year,
          actual.getMonth(),
          1
        )
    );

  }


  /* =========================================================
     FILTRADO GENERAL
  ========================================================= */

  const empleadosFiltrados =
    useMemo(
      () => {

        const texto =
          filtro
            .trim()
            .toLowerCase();


        return empleados.filter(
          (
            empleado
          ) => {

            if (
              filtroEstado !==
                "Todos" &&
              empleado.estado !==
                filtroEstado
            ) {
              return false;
            }


            if (!texto) {
              return true;
            }


            const ruta =
              nombreRuta(
                empleado
              );


            const bolsa =
              [
                empleado
                  ?.codigo,
                empleado
                  ?.tipoDocumento,
                empleado
                  ?.documento,
                empleado
                  ?.nombres,
                empleado
                  ?.apellidos,
                empleado
                  ?.telefono,
                empleado
                  ?.ciudad,
                empleado
                  ?.cargo,
                ruta,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            return bolsa.includes(
              texto
            );

          }
        );

      },
      [
        empleados,
        filtro,
        filtroEstado,
      ]
    );


  /* =========================================================
     BÚSQUEDA DEL MODAL
  ========================================================= */

  const resultadosBusqueda =
    useMemo(
      () => {

        const texto =
          buscarTexto
            .trim()
            .toLowerCase();


        if (!texto) {
          return empleados;
        }


        return empleados.filter(
          (
            empleado
          ) => {

            const mapa = {
              codigo:
                empleado
                  ?.codigo,
              documento:
                `${empleado?.tipoDocumento || ""} ${empleado?.documento || ""}`,
              nombre:
                nombreCompleto(
                  empleado
                ),
              cargo:
                empleado
                  ?.cargo,
            };


            if (
              buscarCampo !==
              "todos"
            ) {

              return String(
                mapa[
                  buscarCampo
                ] ||
                ""
              )
                .toLowerCase()
                .includes(
                  texto
                );

            }


            return Object
              .values(
                mapa
              )
              .some(
                (
                  valor
                ) =>
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
        empleados,
        buscarTexto,
        buscarCampo,
      ]
    );


  function abrirBuscar() {

    setBuscarTexto(
      ""
    );

    setBuscarCampo(
      "todos"
    );

    setModalBuscarAbierto(
      true
    );

  }


  function seleccionarDesdeBusqueda(
    empleado
  ) {

    cargarEnFormulario(
      empleado,
      false
    );

    setModalBuscarAbierto(
      false
    );

  }


  /* =========================================================
     IMPRESIÓN
     Vista previa emergente dentro del mismo módulo.
  ========================================================= */

  function manejarImpresion(
    event
  ) {

    event?.preventDefault?.();
    event?.stopPropagation?.();


    if (
      empleadosFiltrados.length ===
      0
    ) {

      mostrarMensaje(
        "No hay empleados para imprimir.",
        "warning"
      );

      return;

    }


    /*
      IMPORTANTE:
      Este botón SOLO abre la vista previa.
      Aquí no se llama window.print().
    */
    setModalImpresionAbierto(
      true
    );

  }


  function cerrarVistaPreviaImpresion() {

    setModalImpresionAbierto(
      false
    );

  }


  function imprimirVistaPrevia(
    event
  ) {

    event?.preventDefault?.();
    event?.stopPropagation?.();


    const resultado =
      imprimirEmpleados({
        empleados:
          empleadosFiltrados,

        filtros: {
          busqueda:
            filtro,

          estado:
            filtroEstado,
        },
      });


    if (
      !resultado
        ?.ok
    ) {

      mostrarMensaje(
        resultado
          ?.mensaje ||
          "No fue posible abrir la ventana de impresión.",
        resultado
          ?.tipo ||
          "error"
      );

    }

  }


  /* =========================================================
     RESUMEN
  ========================================================= */

  const resumen =
    useMemo(
      () => {

        const activos =
          empleados.filter(
            (
              empleado
            ) =>
              empleado
                .estado ===
              "Activo"
          )
            .length;


        const inactivos =
          empleados.length -
          activos;


        const conRuta =
          empleados.filter(
            (
              empleado
            ) =>
              Boolean(
                empleado
                  .rutaAsignada
              )
          )
            .length;


        return {
          total:
            empleados.length,
          activos,
          inactivos,
          conRuta,
        };

      },
      [
        empleados,
      ]
    );


  const formularioBloqueado =
    Boolean(
      empleadoSeleccionado &&
      !modoEdicion
    );


  /* =========================================================
     RENDER
  ========================================================= */

  return (

    <AppLayout title="Empleados">

      <section className="empleados-page">

        <Toast
          mensaje={
            mensaje
          }
          tipo={
            tipoMensaje
          }
        />


        <ModulosMenu />


        {/* CABECERA */}

        <header className="empleados-title-bar">

          <div className="empleados-title-info">

            <h2>
              {modoEdicion
                ? "Editar Empleado"
                : "Empleados"}
            </h2>

           

          </div>


          <div className="empleados-title-actions">

            {/* NUEVO */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                nuevoEmpleado
              }
              data-tooltip="Nuevo empleado"
              aria-label="Nuevo empleado"
            >
              <img
                src={
                  empleadosIcon
                }
                alt=""
              />
            </button>


            {/* EDITAR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                editarSeleccionado
              }
              data-tooltip="Editar empleado"
              aria-label="Editar empleado"
              disabled={
                !empleadoSeleccionado
              }
            >
              <img
                src={
                  editarIcon
                }
                alt=""
              />
            </button>


            {/* ACTIVAR / DESACTIVAR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                cambiarEstadoSeleccionado
              }
              data-tooltip={
                empleadoSeleccionado
                  ?.estado ===
                "Activo"
                  ? "Desactivar empleado"
                  : "Activar empleado"
              }
              aria-label="Cambiar estado del empleado"
              disabled={
                !empleadoSeleccionado
              }
            >
              <img
                src={
                  empleadoSeleccionado
                    ?.estado ===
                  "Activo"
                    ? bloquearIcon
                    : desbloquearIcon
                }
                alt=""
              />
            </button>


            {/* ELIMINAR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                eliminarSeleccionado
              }
              data-tooltip="Eliminar empleado"
              aria-label="Eliminar empleado"
              disabled={
                !empleadoSeleccionado
              }
            >
              <img
                src={
                  eliminarIcon
                }
                alt=""
              />
            </button>


            {/* BUSCAR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                abrirBuscar
              }
              data-tooltip="Buscar empleado"
              aria-label="Buscar empleado"
            >
              <img
                src={
                  buscarIcon
                }
                alt=""
              />
            </button>


            {/* IMPRIMIR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                manejarImpresion
              }
              data-tooltip="Vista previa de impresión"
              aria-label="Imprimir empleados"
              disabled={
                empleadosFiltrados
                  .length ===
                0
              }
            >
              <img
                src={
                  imprimirIcon
                }
                alt=""
              />
            </button>


            {/* GUARDAR */}

            <button
              type="button"
              className="empleados-top-icon-btn"
              onClick={
                guardarEmpleado
              }
              data-tooltip={
                modoEdicion
                  ? "Guardar cambios"
                  : "Guardar empleado"
              }
              aria-label="Guardar empleado"
              disabled={
                guardando ||
                (
                  empleadoSeleccionado &&
                  !modoEdicion
                )
              }
            >
              <img
                src={
                  guardarIcon
                }
                alt=""
              />
            </button>

          </div>

        </header>


        <main className="empleados-content">


          {/* RESUMEN */}

          <section className="empleados-summary-grid">

            <article className="empleados-summary-card">
              <span>
                Total empleados
              </span>
              <strong>
                {resumen.total}
              </strong>
            </article>

            <article className="empleados-summary-card is-active">
              <span>
                Activos
              </span>
              <strong>
                {resumen.activos}
              </strong>
            </article>

            <article className="empleados-summary-card is-inactive">
              <span>
                Inactivos
              </span>
              <strong>
                {resumen.inactivos}
              </strong>
            </article>

            <article className="empleados-summary-card is-route">
              <span>
                Con ruta
              </span>
              <strong>
                {resumen.conRuta}
              </strong>
            </article>

          </section>


          {/* FORMULARIO */}

          <section className="empleados-form-card">

            <div className="empleados-card-header">

              <div>
                <h3>
                  {modoEdicion
                    ? "Datos del empleado en edición"
                    : empleadoSeleccionado
                      ? "Empleado seleccionado"
                      : "Nuevo empleado"}
                </h3>
              </div>


              {empleadoSeleccionado && (

                <span className="empleados-selected-banner">

                  {empleadoSeleccionado.codigo}

                  ·

                  {empleadoSeleccionado.estado}

                </span>

              )}

            </div>


            <div className="empleados-form-grid">


              <div className="empleados-field span-2">

                <span>
                  Código
                </span>

                <input
                  name="codigo"
                  value={
                    form.codigo
                  }
                  readOnly
                  placeholder="EMP-0001"
                />

              </div>


              <div className="empleados-field span-2">

                <span>
                  Tipo documento
                </span>

                <select
                  name="tipoDocumento"
                  value={
                    form.tipoDocumento
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                >
                  <option value="CC">
                    Cédula
                  </option>

                  <option value="CE">
                    Cédula extranjería
                  </option>

                  <option value="TI">
                    Tarjeta identidad
                  </option>

                  <option value="PPT">
                    PPT
                  </option>

                  <option value="PASAPORTE">
                    Pasaporte
                  </option>

                  <option value="NIT">
                    NIT
                  </option>
                </select>

              </div>


              <div className="empleados-field span-4">

                <span>
                  Número de documento *
                </span>

                <input
                  name="documento"
                  value={
                    form.documento
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  autoComplete="off"
                  placeholder="Documento"
                />

              </div>


              <div className="empleados-field span-4">

                <span>
                  Nombres *
                </span>

                <input
                  name="nombres"
                  value={
                    form.nombres
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  autoComplete="off"
                  placeholder="Nombres"
                />

              </div>


              <div className="empleados-field span-4">

                <span>
                  Apellidos *
                </span>

                <input
                  name="apellidos"
                  value={
                    form.apellidos
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  autoComplete="off"
                  placeholder="Apellidos"
                />

              </div>


              <div className="empleados-field">

                <span>
                  Teléfono
                </span>

                <input
                  name="telefono"
                  value={
                    form.telefono
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  inputMode="tel"
                  autoComplete="off"
                  placeholder="Teléfono"
                />

              </div>


              <div className="empleados-field">

                <span>
                  Ciudad
                </span>

                <input
                  name="ciudad"
                  value={
                    form.ciudad
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  autoComplete="off"
                  placeholder="Ciudad"
                />

              </div>


              <div className="empleados-field span-6">

                <span>
                  Dirección
                </span>

                <input
                  name="direccion"
                  value={
                    form.direccion
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  autoComplete="off"
                  placeholder="Dirección"
                />

              </div>


              <div className="empleados-field">

                <span>
                  Cargo *
                </span>

                <select
                  name="cargo"
                  value={
                    form.cargo
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                >

                  <option value="">
                    Seleccione un cargo
                  </option>

                  <option value="Empleado">
                    Empleado
                  </option>

                  <option value="Repartidor">
                    Repartidor
                  </option>

                  <option value="Empacador">
                    Empacador
                  </option>
                  

                </select>

              </div>


              <div className="empleados-field empleados-field-calendario">

                <span>
                  Fecha de ingreso
                </span>

                <button
                  type="button"
                  className="empleados-calendar-trigger"
                  onClick={
                    abrirCalendarioIngreso
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                >

                  <span
                    className={
                      form.fechaIngreso
                        ? "empleados-calendar-value"
                        : "empleados-calendar-placeholder"
                    }
                  >
                    {mostrarFechaCalendario(
                      form.fechaIngreso
                    )}
                  </span>

                  <img
                    src={
                      calendarioIcon
                    }
                    alt=""
                  />

                </button>

              </div>


              <div className="empleados-field">

                <span>
                  Salario
                </span>

                <input
                  type="number"
                  min="0"
                  step="1000"
                  name="salario"
                  value={
                    form.salario
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  placeholder="0"
                />

              </div>


              <div className="empleados-field">

                <span>
                  Ruta asignada
                </span>

                <select
                  name="rutaAsignada"
                  value={
                    form.rutaAsignada
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                >

                  <option value="">
                    Sin ruta asignada
                  </option>

                  {rutas.map(
                    (
                      ruta
                    ) => (

                      <option
                        key={
                          ruta._id
                        }
                        value={
                          ruta._id
                        }
                      >
                        {ruta.codigo
                          ? `${ruta.codigo} · `
                          : ""}
                        {ruta.nombre}
                        {ruta.estado ===
                        "Inactiva"
                          ? " (Inactiva)"
                          : ""}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="empleados-field">

                <span>
                  Estado
                </span>

                <input
                  value={
                    form.estado
                  }
                  readOnly
                />

              </div>


              <div className="empleados-field span-12">

                <span>
                  Observaciones
                </span>

                <textarea
                  name="observaciones"
                  value={
                    form.observaciones
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    formularioBloqueado ||
                    guardando
                  }
                  placeholder="Información adicional del empleado..."
                />

              </div>

            </div>

          </section>


          {/* LISTADO */}

          <section className="empleados-list-card">

            <div className="empleados-card-header">

              <h3>
                Listado de empleados
              </h3>

              <small>
                Selecciona una fila para consultar el empleado
              </small>

            </div>


            <div className="empleados-filters">

              <div className="empleados-search-input">

                <img
                  src={
                    buscarIcon
                  }
                  alt=""
                />

                <input
                  type="search"
                  value={
                    filtro
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setFiltro(
                        event.target.value
                      )
                  }
                  placeholder="Buscar por nombre, documento, cargo, ruta..."
                />

              </div>


              <select
                value={
                  filtroEstado
                }
                onChange={
                  (
                    event
                  ) =>
                    setFiltroEstado(
                      event.target.value
                    )
                }
                aria-label="Filtrar por estado"
              >
                <option value="Todos">
                  Todos los estados
                </option>

                <option value="Activo">
                  Activos
                </option>

                <option value="Inactivo">
                  Inactivos
                </option>
              </select>


              <div className="empleados-filter-total">

                <strong>
                  {empleadosFiltrados.length}
                </strong>

                empleado(s)

              </div>

            </div>


            {cargando ? (

              <div className="empleados-loading">
                Cargando empleados...
              </div>

            ) : empleadosFiltrados.length ===
              0 ? (

              <div className="empleados-empty">
                No hay empleados para mostrar.
              </div>

            ) : (

              <div className="empleados-table-wrap">

                <table className="empleados-table">

                  <thead>
                    <tr>
                      <th>
                        Código
                      </th>

                      <th>
                        Documento
                      </th>

                      <th>
                        Empleado
                      </th>

                      <th>
                        Cargo
                      </th>

                      <th>
                        Teléfono
                      </th>

                      <th>
                        Ruta
                      </th>

                      <th>
                        Ingreso
                      </th>

                      <th>
                        Salario
                      </th>

                      <th>
                        Estado
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {empleadosFiltrados.map(
                      (
                        empleado
                      ) => {

                        const seleccionado =
                          empleadoSeleccionado
                            ?._id ===
                          empleado._id;


                        return (

                          <tr
                            key={
                              empleado._id
                            }
                            className={
                              seleccionado
                                ? "is-selected"
                                : ""
                            }
                            onClick={
                              () =>
                                cargarEnFormulario(
                                  empleado,
                                  false
                                )
                            }
                          >

                            <td className="empleados-table-code">
                              {empleado.codigo ||
                                "—"}
                            </td>

                            <td>
                              {empleado.tipoDocumento ||
                                ""}
                              {" "}
                              {empleado.documento ||
                                "—"}
                            </td>

                            <td>
                              <div className="empleados-table-name">

                                <strong>
                                  {nombreCompleto(
                                    empleado
                                  ) ||
                                    "—"}
                                </strong>

                                <small>
                                  {empleado.ciudad ||
                                    "Sin ciudad"}
                                </small>

                              </div>
                            </td>

                            <td>
                              {empleado.cargo ||
                                "—"}
                            </td>

                            <td>
                              {empleado.telefono ||
                                "—"}
                            </td>

                            <td>
                              {nombreRuta(
                                empleado
                              )}
                            </td>

                            <td>
                              {empleado.fechaIngreso
                                ? new Date(
                                    empleado.fechaIngreso
                                  ).toLocaleDateString(
                                    "es-CO"
                                  )
                                : "—"}
                            </td>

                            <td>
                              {moneda(
                                empleado.salario
                              )}
                            </td>

                            <td>

                              <span
                                className={
                                  `empleados-state ${
                                    empleado.estado ===
                                    "Activo"
                                      ? "is-active"
                                      : "is-inactive"
                                  }`
                                }
                              >
                                {empleado.estado}
                              </span>

                            </td>

                          </tr>

                        );

                      }
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </section>

        </main>


        {/* =================================================
            VISTA PREVIA DE IMPRESIÓN
            Se monta sobre document.body para quedar encima
            de todo el layout.
        ================================================= */}

        {modalImpresionAbierto &&
          typeof document !== "undefined" &&
          createPortal(

            <div className="empleados-print-portal">

              <div
                className="empleados-print-modal-overlay"
                role="presentation"
              >

                <section
                  className="empleados-print-modal"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Vista previa de impresión de empleados"
                >

                  <header className="empleados-print-modal-header">

                    <div>

                      <span className="empleados-print-modal-eyebrow">
                        Vista previa
                      </span>

                      <h3>
                        Listado de Empleados
                      </h3>

                    </div>


                    <button
                      type="button"
                      className="empleados-print-modal-close"
                      onClick={
                        cerrarVistaPreviaImpresion
                      }
                      aria-label="Cerrar vista previa"
                    >
                      <img
                        src={
                          cerrarIcon
                        }
                        alt=""
                      />
                    </button>

                  </header>


                  <div className="empleados-print-preview">

                    <div className="empleados-print-preview-header">

                      <div>

                        <strong className="empleados-print-brand">
                          WEBBUYS
                        </strong>

                        <h2>
                          Listado de Empleados
                        </h2>

                      </div>


                      <div className="empleados-print-preview-meta">

                        <span>
                          Fecha:{" "}
                          {new Date().toLocaleDateString(
                            "es-CO"
                          )}
                        </span>

                        <span>
                          Total:{" "}
                          <strong>
                            {empleadosFiltrados.length}
                          </strong>
                        </span>

                      </div>

                    </div>


                    <div className="empleados-print-preview-filters">

                      <span>
                        Búsqueda:{" "}
                        <strong>
                          {filtro.trim() ||
                            "Todas"}
                        </strong>
                      </span>

                      <span>
                        Estado:{" "}
                        <strong>
                          {filtroEstado}
                        </strong>
                      </span>

                    </div>


                    <div className="empleados-print-preview-table-wrap">

                      <table className="empleados-print-preview-table">

                        <colgroup>
                          <col className="print-col-codigo" />
                          <col className="print-col-documento" />
                          <col className="print-col-empleado" />
                          <col className="print-col-cargo" />
                          <col className="print-col-telefono" />
                          <col className="print-col-ciudad" />
                          <col className="print-col-ruta" />
                          <col className="print-col-ingreso" />
                          <col className="print-col-estado" />
                        </colgroup>

                        <thead>

                          <tr>

                            <th>
                              Código
                            </th>

                            <th>
                              Documento
                            </th>

                            <th>
                              Empleado
                            </th>

                            <th>
                              Cargo
                            </th>

                            <th>
                              Teléfono
                            </th>

                            <th>
                              Ciudad
                            </th>

                            <th>
                              Ruta
                            </th>

                            <th>
                              Ingreso
                            </th>

                            <th>
                              Estado
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {empleadosFiltrados.map(
                            (
                              empleado
                            ) => (

                              <tr
                                key={
                                  empleado._id
                                }
                              >

                                <td>
                                  {empleado.codigo ||
                                    "—"}
                                </td>

                                <td>
                                  {empleado.tipoDocumento ||
                                    ""}
                                  {" "}
                                  {empleado.documento ||
                                    "—"}
                                </td>

                                <td>
                                  {nombreCompleto(
                                    empleado
                                  ) ||
                                    "—"}
                                </td>

                                <td>
                                  {empleado.cargo ||
                                    "—"}
                                </td>

                                <td>
                                  {empleado.telefono ||
                                    "—"}
                                </td>

                                <td>
                                  {empleado.ciudad ||
                                    "—"}
                                </td>

                                <td>
                                  {nombreRuta(
                                    empleado
                                  )}
                                </td>

                                <td>
                                  {empleado.fechaIngreso
                                    ? new Date(
                                        empleado.fechaIngreso
                                      ).toLocaleDateString(
                                        "es-CO"
                                      )
                                    : "—"}
                                </td>

                                <td>
                                  {empleado.estado ||
                                    "—"}
                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>


                    <footer className="empleados-print-preview-footer">
                      WebBuys · Módulo de Empleados
                    </footer>

                  </div>


                  <footer className="empleados-print-modal-actions">

                    <button
                      type="button"
                      className="empleados-print-action empleados-print-action-secondary"
                      onClick={
                        cerrarVistaPreviaImpresion
                      }
                    >
                      Cerrar
                    </button>


                    <button
                      type="button"
                      className="empleados-print-action empleados-print-action-primary"
                      onClick={
                        imprimirVistaPrevia
                      }
                    >

                      <img
                        src={
                          imprimirIcon
                        }
                        alt=""
                      />

                      Imprimir

                    </button>

                  </footer>

                </section>

              </div>

            </div>,

            document.body

          )
        }


        {/* =================================================
            CALENDARIO FECHA DE INGRESO
            No se cierra haciendo clic fuera.
        ================================================= */}

        {calendarioIngresoAbierto && (

          <div
            className="empleados-calendar-overlay"
            role="presentation"
          >

            <section
              className="empleados-calendar-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Seleccionar fecha de ingreso"
            >

              <header className="empleados-calendar-header">

                <div>
                  <span>
                    Fecha de ingreso
                  </span>

                  <strong>
                    {fechaTemporalIngreso
                      ? mostrarFechaCalendario(
                          fechaTemporalIngreso
                        )
                      : "Selecciona una fecha"}
                  </strong>
                </div>

                <button
                  type="button"
                  className="empleados-calendar-close"
                  onClick={
                    cerrarCalendarioIngreso
                  }
                  aria-label="Cerrar calendario"
                >
                  <img
                    src={
                      cerrarIcon
                    }
                    alt=""
                  />
                </button>

              </header>


              <div className="empleados-calendar-nav">

                <button
                  type="button"
                  className="empleados-calendar-arrow"
                  onClick={
                    () =>
                      moverMesCalendarioIngreso(
                        -1
                      )
                  }
                  aria-label="Mes anterior"
                >
                  ‹
                </button>


                <select
                  value={
                    mesCalendarioIngreso
                      .getMonth()
                  }
                  onChange={
                    cambiarMesCalendarioIngreso
                  }
                  aria-label="Mes"
                >

                  {MESES_CALENDARIO.map(
                    (
                      mes,
                      index
                    ) => (

                      <option
                        key={
                          mes
                        }
                        value={
                          index
                        }
                      >
                        {mes}
                      </option>

                    )
                  )}

                </select>


                <select
                  value={
                    mesCalendarioIngreso
                      .getFullYear()
                  }
                  onChange={
                    cambiarAnioCalendarioIngreso
                  }
                  aria-label="Año"
                >

                  {ANIOS_CALENDARIO.map(
                    (
                      year
                    ) => (

                      <option
                        key={
                          year
                        }
                        value={
                          year
                        }
                      >
                        {year}
                      </option>

                    )
                  )}

                </select>


                <button
                  type="button"
                  className="empleados-calendar-arrow"
                  onClick={
                    () =>
                      moverMesCalendarioIngreso(
                        1
                      )
                  }
                  aria-label="Mes siguiente"
                >
                  ›
                </button>

              </div>


              <div className="empleados-calendar-weekdays">

                {DIAS_SEMANA.map(
                  (
                    dia,
                    index
                  ) => (

                    <span
                      key={
                        `${dia}-${index}`
                      }
                    >
                      {dia}
                    </span>

                  )
                )}

              </div>


              <div className="empleados-calendar-grid">

                {obtenerDiasCalendario(
                  mesCalendarioIngreso
                ).map(
                  (
                    fecha
                  ) => {

                    const valor =
                      fechaAStringCalendario(
                        fecha
                      );

                    const esMesActual =
                      fecha.getMonth() ===
                      mesCalendarioIngreso
                        .getMonth();

                    const seleccionado =
                      fechaTemporalIngreso ===
                      valor;

                    const hoy =
                      valor ===
                      fechaAStringCalendario(
                        new Date()
                      );


                    return (

                      <button
                        key={
                          valor
                        }
                        type="button"
                        className={
                          [
                            "empleados-calendar-day",
                            !esMesActual
                              ? "is-other-month"
                              : "",
                            seleccionado
                              ? "is-selected"
                              : "",
                            hoy
                              ? "is-today"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")
                        }
                        onClick={
                          () =>
                            setFechaTemporalIngreso(
                              valor
                            )
                        }
                      >
                        {fecha.getDate()}
                      </button>

                    );

                  }
                )}

              </div>


              <footer className="empleados-calendar-footer">

                <button
                  type="button"
                  className="empleados-calendar-btn empleados-calendar-btn-clear"
                  onClick={
                    () =>
                      setFechaTemporalIngreso(
                        ""
                      )
                  }
                >
                  Limpiar
                </button>


                <div>

                  <button
                    type="button"
                    className="empleados-calendar-btn"
                    onClick={
                      cerrarCalendarioIngreso
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    className="empleados-calendar-btn empleados-calendar-btn-primary"
                    onClick={
                      aplicarCalendarioIngreso
                    }
                  >
                    Aplicar
                  </button>

                </div>

              </footer>

            </section>

          </div>

        )}


        {/* =================================================
            MODAL BUSCAR
            No cierra al hacer clic fuera.
        ================================================= */}

        {modalBuscarAbierto && (

          <div
            className="empleados-modal-overlay"
            role="presentation"
          >

            <section
              className="empleados-search-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Buscar empleado"
            >

              <header className="empleados-modal-header">

                <h3>
                  Buscar empleado
                </h3>

                <button
                  type="button"
                  className="empleados-modal-close"
                  onClick={
                    () =>
                      setModalBuscarAbierto(
                        false
                      )
                  }
                  aria-label="Cerrar búsqueda"
                >
                  <img
                    src={
                      cerrarIcon
                    }
                    alt=""
                  />
                </button>

              </header>


              <div className="empleados-modal-search">

                <select
                  value={
                    buscarCampo
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setBuscarCampo(
                        event.target.value
                      )
                  }
                >
                  <option value="todos">
                    Todos los campos
                  </option>

                  <option value="codigo">
                    Código
                  </option>

                  <option value="documento">
                    Documento
                  </option>

                  <option value="nombre">
                    Nombre
                  </option>

                  <option value="cargo">
                    Cargo
                  </option>
                </select>


                <input
                  type="search"
                  value={
                    buscarTexto
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setBuscarTexto(
                        event.target.value
                      )
                  }
                  placeholder="Escribe para buscar..."
                  autoFocus
                />

              </div>


              <div className="empleados-modal-results">

                {resultadosBusqueda.length ===
                0 ? (

                  <div className="empleados-modal-empty">
                    No se encontraron empleados.
                  </div>

                ) : (

                  resultadosBusqueda.map(
                    (
                      empleado
                    ) => (

                      <button
                        key={
                          empleado._id
                        }
                        type="button"
                        className="empleados-result-row"
                        onClick={
                          () =>
                            seleccionarDesdeBusqueda(
                              empleado
                            )
                        }
                      >

                        <span>
                          {empleado.codigo}
                        </span>

                        <span>
                          {empleado.tipoDocumento}
                          {" "}
                          {empleado.documento}
                        </span>

                        <strong>
                          {nombreCompleto(
                            empleado
                          )}
                        </strong>

                        <span>
                          {empleado.cargo ||
                            "—"}
                        </span>

                        <span
                          className={
                            `empleados-state ${
                              empleado.estado ===
                              "Activo"
                                ? "is-active"
                                : "is-inactive"
                            }`
                          }
                        >
                          {empleado.estado}
                        </span>

                      </button>

                    )
                  )

                )}

              </div>

            </section>

          </div>

        )}

      </section>

    </AppLayout>

  );

}
