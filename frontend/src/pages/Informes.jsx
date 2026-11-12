import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ReporteUsuarios from "./ReporteUsuarios.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import {
  obtenerArchivoInforme,
  obtenerInforme,
  obtenerOpcionesRepartidoresInforme,
  obtenerOpcionesCajasInforme,
} from "../services/informe.service.js";

import calendarioIcon from "../assets/icons/calendario.webp";

import "../styles/configuracion-cabecera.css";
import "../styles/informes.css";
import "../styles/informes-calendario.css";


import informeVentanaCss
  from "../styles/impresiones/informes-ventana.css?raw";


const TIPOS_INFORME = [
  {
    valor: "resumen",
    nombre: "Resumen general",
  },
  {
    valor: "ventas",
    nombre: "Ventas",
  },
  {
    valor: "facturas",
    nombre: "Facturas",
  },
  {
    valor: "pedidos",
    nombre: "Pedidos",
  },
  {
    valor: "entregas",
    nombre: "Entregas",
  },
  {
    valor: "inventario",
    nombre: "Inventario",
  },
  {
    valor: "productos",
    nombre: "Productos vendidos",
  },
  {
    valor: "clientes",
    nombre: "Clientes",
  },
  {
    valor: "caja",
    nombre: "Caja",
  },
  {
    valor: "cartera",
    nombre: "Cartera",
  },
  {
    valor: "rutas-zonas",
    nombre: "Rutas y zonas",
  },
  {
    valor: "repartidores",
    nombre: "Repartidores y recaudos",
  },
  {
    valor: "usuarios",
    nombre: "Reporte de usuarios",
    soloAdministrador: true,
  },
];


/* =========================================================
   CAMBIO: se elimina "mes" del retorno.
   Se mantiene desde y hasta con el mes actual.
========================================================= */

function obtenerPeriodoMesActual() {
  const fecha =
    new Date();

  const anio =
    fecha.getFullYear();

  const numeroMes =
    fecha.getMonth() + 1;

  const mesTexto =
    String(numeroMes)
      .padStart(2, "0");

  const ultimoDia =
    new Date(
      anio,
      numeroMes,
      0
    ).getDate();

  return {
    desde:
      `${anio}-${mesTexto}-01`,

    hasta:
      `${anio}-${mesTexto}-${String(
        ultimoDia
      ).padStart(2, "0")}`,
  };
}


/* =========================================================
   CAMBIO: se elimina periodoDesdeMes()
========================================================= */


function formatearMoneda(
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
    Number(valor || 0)
  );
}


function esCampoDinero(
  campo
) {
  return [
    "valor",
    "valorPedidos",
    "totalVentas",
    "valorFacturado",
    "ingresosCaja",
    "egresosCaja",
    "carteraGenerada",
    "saldoCartera",
    "pagosCartera",
    "subtotal",
    "descuento",
    "iva",
    "total",
    "valorOriginal",
    "abonado",
    "saldo",
    "totalComprado",
    "totalFacturado",
    "totalDescuentos",
    "valorAnulado",
    "efectivo",
    "transferencia",
    "credito",
    "sinClasificar",
    "totalVendido",
    "ingresos", "egresos", "neto", "efectivoIngresado", "transferencias",
    "recaudosCartera", "diferenciaCierres", "abonadoHistorico",
    "saldoPendiente", "saldoVencido", "pagosPeriodo", "efectivoPeriodo",
    "transferenciaPeriodo", "vencido", "saldoInicial", "saldoCierre", "contado", "diferencia",
  ].includes(campo);
}


function formatearValor(
  campo,
  valor,
  tipoInforme = ""
) {
  if (
    tipoInforme === "cartera" &&
    ["fechaEntrega", "vencimiento"].includes(campo) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ""))
  ) {
    return `${valor.slice(8, 10)}/${valor.slice(5, 7)}/${valor.slice(0, 4)}`;
  }
  if (
    esCampoDinero(campo) &&
    typeof valor === "number"
  ) {
    return formatearMoneda(
      valor
    );
  }

  return valor ?? "";
}


const NOMBRES_INDICADORES_FACTURAS = {
  totalFacturas:
    "Facturas",

  facturasVigentes:
    "Vigentes",

  facturasAnuladas:
    "Anuladas",

  totalFacturado:
    "Total facturado",

  totalDescuentos:
    "Descuentos",

  valorAnulado:
    "Valor anulado",
};


const NOMBRES_INDICADORES_FINANCIEROS = {
  cajas: "Cajas registradas", movimientos: "Movimientos", ingresos: "Ingresos",
  egresos: "Egresos", neto: "Movimiento neto", efectivoIngresado: "Ingresos en efectivo",
  transferencias: "Transferencias", recaudosCartera: "Recaudos de cartera",
  cierres: "Cierres del período", diferenciaCierres: "Diferencia de cierres",
  cuentas: "Cuentas", valorOriginal: "Valor original", abonadoHistorico: "Total abonado actual",
  saldoPendiente: "Saldo pendiente actual", saldoVencido: "Saldo vencido actual",
  pagosPeriodo: "Abonos del período", efectivoPeriodo: "Abonos en efectivo",
  transferenciaPeriodo: "Abonos por transferencia",
};

const NOMBRES_INDICADORES_RECAUDOS = {
  pedidosEntregados: "Pedidos entregados",
  repartidores: "Repartidores",
  totalVendido: "Total vendido",
  efectivo: "Efectivo registrado",
  transferencia: "Transferencia registrada",
  credito: "Ventas a crédito",
  sinClasificar: "Sin clasificar",
};


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

const DIAS_CALENDARIO = [
  "D",
  "L",
  "M",
  "M",
  "J",
  "V",
  "S",
];

function fechaDesdeValor(valor) {
  if (!valor) {
    return null;
  }

  const partes = String(valor)
    .split("-")
    .map(Number);

  if (partes.length !== 3 || partes.some((parte) => !Number.isFinite(parte))) {
    return null;
  }

  return new Date(
    partes[0],
    partes[1] - 1,
    partes[2]
  );
}

function fechaAValor(fecha) {
  if (!fecha) {
    return "";
  }

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

function fechaVisible(valor) {
  const fecha = fechaDesdeValor(valor);

  if (!fecha) {
    return "Seleccionar fecha";
  }

  return fecha.toLocaleDateString(
    "es-CO",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function mesVisible(valor) {
  if (!valor) {
    return "Seleccionar mes";
  }

  const [anio, mes] = String(valor)
    .split("-")
    .map(Number);

  if (!anio || !mes) {
    return "Seleccionar mes";
  }

  return `${MESES_CALENDARIO[mes - 1]} de ${anio}`;
}

function mismaFecha(a, b) {
  if (!a || !b) {
    return false;
  }

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function construirSemanas(anio, mes) {
  const primerDia = new Date(anio, mes, 1);
  const inicio = new Date(anio, mes, 1 - primerDia.getDay());
  const semanas = [];

  for (let semana = 0; semana < 6; semana += 1) {
    const dias = [];

    for (let dia = 0; dia < 7; dia += 1) {
      const fecha = new Date(inicio);
      fecha.setDate(inicio.getDate() + semana * 7 + dia);
      dias.push(fecha);
    }

    semanas.push(dias);
  }

  return semanas;
}

function WebBuysCalendario({
  modo = "fecha",
  valor,
  onConfirmar,
  alineacion = "izquierda",
}) {
  const contenedorRef = useRef(null);
  const hoy = useMemo(() => new Date(), []);

  const fechaInicial = useMemo(
    () => {
      if (modo === "mes" && valor) {
        const [anio, mes] = String(valor)
          .split("-")
          .map(Number);

        if (anio && mes) {
          return new Date(anio, mes - 1, 1);
        }
      }

      return fechaDesdeValor(valor) || new Date();
    },
    [modo, valor]
  );

  const [abierto, setAbierto] = useState(false);
  const [anioVista, setAnioVista] = useState(fechaInicial.getFullYear());
  const [mesVista, setMesVista] = useState(fechaInicial.getMonth());
  const [fechaTemporal, setFechaTemporal] = useState(fechaInicial);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    function cerrarFuera(event) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(event.target)
      ) {
        setAbierto(false);
      }
    }

    function cerrarEscape(event) {
      if (event.key === "Escape") {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);

    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierto]);

  function abrirCalendario() {
    let base = new Date();

    if (modo === "mes" && valor) {
      const [anio, mes] = String(valor)
        .split("-")
        .map(Number);

      if (anio && mes) {
        base = new Date(anio, mes - 1, 1);
      }
    } else {
      base = fechaDesdeValor(valor) || new Date();
    }

    setAnioVista(base.getFullYear());
    setMesVista(base.getMonth());
    setFechaTemporal(base);
    setAbierto((actual) => !actual);
  }

  function moverMes(delta) {
    const nueva = new Date(anioVista, mesVista + delta, 1);
    setAnioVista(nueva.getFullYear());
    setMesVista(nueva.getMonth());
  }

  function seleccionarDia(fecha) {
    setFechaTemporal(new Date(fecha));
    setAnioVista(fecha.getFullYear());
    setMesVista(fecha.getMonth());
  }

  function seleccionarMes(indiceMes) {
    setMesVista(indiceMes);
    setFechaTemporal(new Date(anioVista, indiceMes, 1));
  }

  function confirmar() {
    if (modo === "mes") {
      onConfirmar(
        `${anioVista}-${String(mesVista + 1).padStart(2, "0")}`
      );
    } else {
      onConfirmar(fechaAValor(fechaTemporal));
    }

    setAbierto(false);
  }

  const semanas = construirSemanas(anioVista, mesVista);
  const anioActual = hoy.getFullYear();
  const anios = Array.from(
    { length: 31 },
    (_, indice) => anioActual - 20 + indice
  );

  return (
    <div
      className="informes-calendar-control"
      ref={contenedorRef}
    >
      <button
        type="button"
        className={
          abierto
            ? "informes-calendar-trigger activo"
            : "informes-calendar-trigger"
        }
        onClick={abrirCalendario}
        aria-expanded={abierto}
      >
        <span>
          {modo === "mes"
            ? mesVisible(valor)
            : fechaVisible(valor)}
        </span>

        <span className="informes-calendar-trigger-icon">
          <img src={calendarioIcon} alt="" />
        </span>
      </button>

      {abierto && (
        <div
          className={
            `informes-calendar-popover informes-calendar-popover--${alineacion}`
          }
        >
          <div className="informes-calendar-top">
            <button
              type="button"
              className="informes-calendar-nav"
              onClick={() => moverMes(-1)}
              aria-label="Mes anterior"
            >
              ‹
            </button>

            <div className="informes-calendar-selects">
              <label className="informes-calendar-select-wrap">
                <span className="sr-only">Mes</span>
                <select
                  value={mesVista}
                  onChange={(event) => {
                    const nuevoMes = Number(event.target.value);
                    setMesVista(nuevoMes);

                    if (modo === "mes") {
                      setFechaTemporal(new Date(anioVista, nuevoMes, 1));
                    }
                  }}
                >
                  {MESES_CALENDARIO.map((nombre, indice) => (
                    <option key={nombre} value={indice}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="informes-calendar-select-wrap informes-calendar-select-wrap--year">
                <span className="sr-only">Año</span>
                <select
                  value={anioVista}
                  onChange={(event) => {
                    const nuevoAnio = Number(event.target.value);
                    setAnioVista(nuevoAnio);

                    if (modo === "mes") {
                      setFechaTemporal(new Date(nuevoAnio, mesVista, 1));
                    }
                  }}
                >
                  {anios.map((anio) => (
                    <option key={anio} value={anio}>
                      {anio}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="informes-calendar-nav"
              onClick={() => moverMes(1)}
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          {modo === "fecha" ? (
            <>
              <div className="informes-calendar-dias-nombre">
                {DIAS_CALENDARIO.map((dia, indice) => (
                  <span key={`${dia}-${indice}`}>
                    {dia}
                  </span>
                ))}
              </div>

              <div className="informes-calendar-semanas">
                {semanas.map((semana, indiceSemana) => {
                  const inicioSemana = semana[0];
                  const esSemanaActual = semana.some(
                    (fecha) => mismaFecha(fecha, hoy)
                  );

                  return (
                    <div
                      key={fechaAValor(inicioSemana)}
                      className={
                        esSemanaActual
                          ? "informes-calendar-semana informes-calendar-semana--actual"
                          : "informes-calendar-semana"
                      }
                    >
                      {semana.map((fecha) => {
                        const esOtroMes = fecha.getMonth() !== mesVista;
                        const esSeleccionado = mismaFecha(fecha, fechaTemporal);
                        const esHoy = mismaFecha(fecha, hoy);

                        const clases = [
                          "informes-calendar-dia",
                          esOtroMes ? "otro-mes" : "",
                          esSeleccionado ? "seleccionado" : "",
                          esHoy ? "hoy" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <button
                            key={fechaAValor(fecha)}
                            type="button"
                            className={clases}
                            onClick={() => seleccionarDia(fecha)}
                            aria-label={fecha.toLocaleDateString("es-CO", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          >
                            {fecha.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="informes-calendar-meses-grid">
              {MESES_CALENDARIO.map((nombre, indice) => {
                const esSeleccionado = indice === mesVista;
                const esMesActual =
                  indice === hoy.getMonth() &&
                  anioVista === hoy.getFullYear();

                return (
                  <button
                    key={nombre}
                    type="button"
                    className={[
                      "informes-calendar-mes-btn",
                      esSeleccionado ? "seleccionado" : "",
                      esMesActual ? "actual" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => seleccionarMes(indice)}
                  >
                    {nombre.slice(0, 3)}.
                  </button>
                );
              })}
            </div>
          )}

          <div className="informes-calendar-footer">
            <button
              type="button"
              className="informes-calendar-cancelar"
              onClick={() => setAbierto(false)}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="informes-calendar-listo"
              onClick={confirmar}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function Informes() {
  const { usuario: usuarioSesion } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const esAdministrador = usuarioSesion?.rol === "Administrador";
  const reporteUsuariosRef = useRef(null);
  const [estadoReporteUsuarios, setEstadoReporteUsuarios] = useState({
    cargando: false,
    disponible: false,
    exportando: false,
    error: "",
  });
  const sincronizarEstadoReporteUsuarios = useCallback((siguiente) => {
    setEstadoReporteUsuarios((actual) =>
      actual.cargando === siguiente.cargando &&
      actual.disponible === siguiente.disponible &&
      actual.exportando === siguiente.exportando &&
      actual.error === siguiente.error ? actual : siguiente
    );
  }, []);

  const periodoInicial =
    useMemo(
      () =>
        obtenerPeriodoMesActual(),
      []
    );


  const [
    tipo,
    setTipo,
  ] =
    useState(() => searchParams.get("tipo") === "usuarios" ? "usuarios" : "resumen");


  /* =========================================================
     CAMBIO: se elimina el estado "mes"
  ========================================================= */


  const [
    desde,
    setDesde,
  ] =
    useState(
      periodoInicial.desde
    );


  const [
    hasta,
    setHasta,
  ] =
    useState(
      periodoInicial.hasta
    );


  const [
    datos,
    setDatos,
  ] =
    useState(null);

  useEffect(() => {
    if (!usuarioSesion) return;
    if (searchParams.get("tipo") === "usuarios" && esAdministrador) {
      setTipo("usuarios");
    } else {
      setTipo((actual) => actual === "usuarios" ? "resumen" : actual);
    }
  }, [searchParams, usuarioSesion, esAdministrador]);

  useEffect(() => {
    if (tipo === "usuarios" && usuarioSesion && !esAdministrador) {
      setTipo("resumen");
      setSearchParams({}, { replace: true });
    }
  }, [tipo, usuarioSesion, esAdministrador, setSearchParams]);

  const [repartidorId, setRepartidorId] = useState("");
  const [cajaId, setCajaId] = useState("");
  const [opcionesCajas, setOpcionesCajas] = useState([]);
  const [cargandoCajas, setCargandoCajas] = useState(false);
  const [carteraEstado, setCarteraEstado] = useState("");
  const [carteraPeriodo, setCarteraPeriodo] = useState("entrega");
  const [opcionesRepartidores, setOpcionesRepartidores] = useState([]);
  const [cargandoRepartidores, setCargandoRepartidores] = useState(false);




  const [
    cargando,
    setCargando,
  ] =
    useState(false);


  const [
    exportando,
    setExportando,
  ] =
    useState("");


  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    if (tipo !== "repartidores") return undefined;

    let activo = true;
    setCargandoRepartidores(true);
    obtenerOpcionesRepartidoresInforme()
      .then((opciones) => {
        if (activo) setOpcionesRepartidores(Array.isArray(opciones) ? opciones : []);
      })
      .catch((error) => {
        console.error("No se pudieron cargar los repartidores:", error);
        if (activo) setError("No se pudo cargar la lista de repartidores.");
      })
      .finally(() => {
        if (activo) setCargandoRepartidores(false);
      });

    return () => { activo = false; };
  }, [tipo]);


  useEffect(() => {
    if (tipo !== "caja") return undefined;
    let activo = true;
    setCargandoCajas(true);
    obtenerOpcionesCajasInforme()
      .then((opciones) => {
        if (activo) setOpcionesCajas(Array.isArray(opciones) ? opciones : []);
      })
      .catch((error) => {
        console.error("No se pudieron cargar las cajas:", error);
        if (activo) setError("No se pudo cargar la lista de cajas.");
      })
      .finally(() => { if (activo) setCargandoCajas(false); });
    return () => { activo = false; };
  }, [tipo]);

  /* =========================================================
     CAMBIO: se elimina cambiarMes()
  ========================================================= */


  function cambiarDesde(
    valor
  ) {
    setDesde(
      valor
    );

    setDatos(null);
    setError("");
  }


  function cambiarHasta(
    valor
  ) {
    setHasta(
      valor
    );

    setDatos(null);
    setError("");
  }


  function validarPeriodo() {

    if (
      !desde ||
      !hasta
    ) {
      setError(
        "Debe seleccionar la fecha inicial y la fecha final."
      );

      return false;
    }


    if (
      desde > hasta
    ) {
      setError(
        "La fecha inicial no puede ser mayor que la fecha final."
      );

      return false;
    }


    return true;
  }


  async function verInforme() {

    if (
      !validarPeriodo()
    ) {
      return;
    }


    try {

      setCargando(true);
      setError("");


      const resultado =
        await obtenerInforme({
          tipo,
          desde,
          hasta,
          repartidorId,
          cajaId,
          carteraEstado,
          carteraPeriodo,
        });


      setDatos(
        resultado
      );

    } catch (err) {

      console.error(
        err
      );


      setError(
        err.response?.data?.mensaje ||
        "No fue posible consultar el informe."
      );

    } finally {

      setCargando(false);

    }

  }


  async function exportarInforme(formato) {
    if (!validarPeriodo()) {
      return;
    }

    let ventana = null;

    try {
      setExportando(formato);
      setError("");

      /*
        Abrimos la ventana inmediatamente para que Chrome
        la reconozca como una ventana emergente iniciada
        directamente por el usuario.
      */
      ventana = window.open(
        "",
        `WebBuys_Informe_${formato}`,
        [
          "width=1250",
          "height=820",
          "left=120",
          "top=70",
          "resizable=yes",
          "scrollbars=yes",
          "toolbar=no",
          "menubar=no",
          "location=no",
          "status=no",
        ].join(",")
      );

      if (!ventana) {
        throw new Error(
          "El navegador bloqueó la ventana emergente. Permite ventanas emergentes para WebBuys."
        );
      }

      /*
        Pantalla temporal mientras se genera el archivo.
        Los estilos vienen de:
        styles/impresiones/informes-ventana.css
      */
      ventana.document.open();

      ventana.document.write(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Generando informe - WebBuys</title>

            <style>
              ${informeVentanaCss}
            </style>
          </head>

          <body class="informe-ventana-body informe-ventana-body--cargando">
            <main class="informe-ventana-cargando">
              <div class="informe-ventana-marca">
                WebBuys
              </div>

              <p class="informe-ventana-mensaje">
                Generando informe...
              </p>
            </main>
          </body>
        </html>
      `);

      ventana.document.close();


      const response =
        await obtenerArchivoInforme({
          tipo,
          desde,
          hasta,
          formato,
          repartidorId,
          cajaId,
          carteraEstado,
          carteraPeriodo,
        });


      /* =========================================
         HTML
      ========================================= */

      if (formato === "html") {
        const html =
          await response.data.text();

        ventana.document.open();

        ventana.document.write(html);

        ventana.document.close();

        ventana.focus();

        return;
      }


      /* =========================================
         PDF
      ========================================= */

      if (formato === "pdf") {
        const url =
          URL.createObjectURL(
            response.data
          );

        ventana.location.href =
          url;

        ventana.focus();

        /*
          El visor del navegador necesita conservar
          temporalmente la URL del Blob.
        */
        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 60000);

        return;
      }


      /* =========================================
         EXCEL
      ========================================= */

      if (
        formato === "xlsx" ||
        formato === "excel"
      ) {
        const url =
          URL.createObjectURL(
            response.data
          );

        const nombre =
          `informe-${tipo}-${desde}-${hasta}.xlsx`;


        ventana.document.open();

        ventana.document.write(`
          <!DOCTYPE html>
          <html lang="es">
            <head>
              <meta charset="UTF-8" />
              <meta
                name="viewport"
                content="width=device-width, initial-scale=1.0"
              />
              <title>Informe Excel - WebBuys</title>

              <style>
                ${informeVentanaCss}
              </style>
            </head>

            <body class="informe-ventana-body">
              <header class="informe-ventana-header">
                <h1>Informe Excel</h1>
                <p>WebBuys</p>
              </header>

              <main class="informe-ventana-contenido">
                <section class="informe-ventana-card">
                  <div class="informe-ventana-xlsx">
                    XLSX
                  </div>

                  <h2>
                    Archivo preparado
                  </h2>

                  <div class="informe-ventana-periodo">
                    ${desde} al ${hasta}
                  </div>

                  <a
                    class="informe-ventana-descarga"
                    href="${url}"
                    download="${nombre}"
                  >
                    Descargar Excel
                  </a>
                </section>
              </main>
            </body>
          </html>
        `);

        ventana.document.close();

        ventana.focus();

        setTimeout(() => {
          URL.revokeObjectURL(url);
        }, 120000);

        return;
      }

    } catch (err) {
      console.error(err);

      if (
        ventana &&
        !ventana.closed
      ) {
        ventana.close();
      }

      setError(
        err.message ||
        "No fue posible generar el informe."
      );

    } finally {
      setExportando("");
    }
  }

  const esResumen =
    tipo === "resumen";


  const esFacturas =
    tipo === "facturas";

  const esRecaudos = tipo === "repartidores" || tipo === "rutas-zonas";
  const esFinanciero = tipo === "caja" || tipo === "cartera";


  const indicadores =
    datos?.indicadores
      ? Object.entries(
          datos.indicadores
        )
      : [];


  return (
    <AppLayout title="Informes">

      <section className={`informes-page ${tipo === "usuarios" ? "informes-page--usuarios" : ""}`}>

        <ModulosMenu />


        <header className="configuracion-topbar">

          <div className="configuracion-topbar-copy">

            <h1>
              Informes
            </h1>

            <p>
              Consulta y exporta la información de WebBuys.
            </p>

          </div>

        </header>


        <div className="informes-content">


          <section className="informes-panel">


            <div className="informes-panel-title">

              <div>
                <span className="eyebrow">
                  Generador de informes
                </span>

                <h2>
                  Selecciona la información
                </h2>
              </div>

            </div>


            {/* =========================================================
                CAMBIO: se elimina el control "Mes".
                La fila ahora tiene solo Tipo, Desde y Hasta.
            ========================================================= */}

            <div className={`informes-filtros ${["repartidores", "caja", "cartera"].includes(tipo) ? "informes-filtros--ampliados" : ""}`}>

              <div className="informes-control informes-control--select">
                <span className="informes-control-label">
                  Tipo de informe
                </span>

                <div className="informes-select-shell">
                  <select
                    value={tipo}
                    onChange={(event) => {
                      const siguienteTipo = event.target.value;
                      setTipo(siguienteTipo);
                      setSearchParams(siguienteTipo === "usuarios" ? { tipo: "usuarios" } : {}, { replace: true });
                      setRepartidorId("");
                      setCajaId("");
                      setCarteraEstado("");
                      setCarteraPeriodo("entrega");
                      setDatos(null);
                      setError("");
                      setEstadoReporteUsuarios({ cargando: false, disponible: false, exportando: false, error: "" });
                    }}
                  >
                    {TIPOS_INFORME.filter((opcion) => !opcion.soloAdministrador || esAdministrador).map((opcion) => (
                      <option
                        key={opcion.valor}
                        value={opcion.valor}
                      >
                        {opcion.nombre}
                      </option>
                    ))}
                  </select>

                  <span
                    className="informes-select-arrow"
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </div>
              </div>


              {tipo !== "usuarios" && <>
              {tipo === "repartidores" && (
                <div className="informes-control informes-control--select">
                  <span className="informes-control-label">Repartidor</span>
                  <div className="informes-select-shell">
                    <select
                      value={repartidorId}
                      onChange={(event) => {
                        setRepartidorId(event.target.value);
                        setDatos(null);
                        setError("");
                      }}
                      disabled={cargandoRepartidores}
                    >
                      <option value="">Todos los repartidores</option>
                      {opcionesRepartidores.map((empleado) => (
                        <option key={empleado.id} value={empleado.id}>
                          {empleado.nombre}
                        </option>
                      ))}
                    </select>
                    <span className="informes-select-arrow" aria-hidden="true">▾</span>
                  </div>
                </div>
              )}

              {tipo === "caja" && (
                <div className="informes-control informes-control--select">
                  <span className="informes-control-label">Caja</span>
                  <div className="informes-select-shell">
                    <select value={cajaId} disabled={cargandoCajas}
                      onChange={(event) => { setCajaId(event.target.value); setDatos(null); setError(""); }}>
                      <option value="">Todas las cajas</option>
                      {opcionesCajas.map((caja) => (
                        <option key={caja.id} value={caja.id}>
                          {caja.codigo} · {caja.estado}
                        </option>
                      ))}
                    </select>
                    <span className="informes-select-arrow" aria-hidden="true">▾</span>
                  </div>
                </div>
              )}

              {tipo === "cartera" && (
                <>
                  <div className="informes-control informes-control--select">
                    <span className="informes-control-label">Alcance de cuentas</span>
                    <div className="informes-select-shell">
                      <select value={carteraPeriodo} onChange={(event) => {
                        setCarteraPeriodo(event.target.value); setDatos(null); setError("");
                      }}>
                        <option value="entrega">Cuentas originadas en el período</option>
                        <option value="todas">Todas las cuentas actuales</option>
                      </select>
                      <span className="informes-select-arrow" aria-hidden="true">▾</span>
                    </div>
                  </div>
                  <div className="informes-control informes-control--select">
                    <span className="informes-control-label">Estado de cartera</span>
                    <div className="informes-select-shell">
                      <select value={carteraEstado} onChange={(event) => {
                        setCarteraEstado(event.target.value); setDatos(null); setError("");
                      }}>
                        <option value="">Todos los estados</option>
                        <option value="Pendiente">Pendientes sin abonos</option>
                        <option value="Abonada">Abonadas parcialmente</option>
                        <option value="Pagada">Pagadas</option>
                        <option value="Vencida">Vencidas</option>
                        <option value="Sin vencimiento">Sin fecha de vencimiento</option>
                      </select>
                      <span className="informes-select-arrow" aria-hidden="true">▾</span>
                    </div>
                  </div>
                </>
              )}

              <div className="informes-control">
                <span className="informes-control-label">
                  Desde
                </span>

                <WebBuysCalendario
                  valor={desde}
                  onConfirmar={cambiarDesde}
                />
              </div>


              <div className="informes-control">
                <span className="informes-control-label">
                  Hasta
                </span>

                <WebBuysCalendario
                  valor={hasta}
                  onConfirmar={cambiarHasta}
                  alineacion="derecha"
                />
              </div>
              </>}

              {tipo === "usuarios" && (
                <>
                  <div className="informes-control">
                    <span className="informes-control-label">Alcance</span>
                    <div className="informes-control-informativo">Usuarios, perfiles y permisos actuales</div>
                  </div>
                  <div className="informes-control">
                    <span className="informes-control-label">Período</span>
                    <div className="informes-control-informativo">No aplica (información actual)</div>
                  </div>
                </>
              )}

            </div>


            {tipo !== "usuarios" && <>
            <div className="informes-actions">

              <button
                type="button"
                className="informes-preview-btn"
                onClick={verInforme}
                disabled={cargando}
              >
                <span className="informes-preview-btn-icon">
                  ◉
                </span>

                <span>
                  {cargando
                    ? "Consultando..."
                    : "Vista previa"}
                </span>
              </button>


              <div className="informes-export-group">

                <span className="informes-export-label">
                  Exportar informe
                </span>


                <div className="informes-formatos">

                  <button
                    type="button"
                    className="informes-formato-btn informes-formato-pdf"
                    onClick={() =>
                      exportarInforme("pdf")
                    }
                    disabled={Boolean(exportando)}
                  >
                    <span className="informes-formato-extension">
                      PDF
                    </span>

                    <span className="informes-formato-copy">
                      <strong>
                        Documento PDF
                      </strong>

                      <small>
                        Ver o imprimir
                      </small>
                    </span>
                  </button>


                  <button
                    type="button"
                    className="informes-formato-btn informes-formato-excel"
                    onClick={() =>
                      exportarInforme("xlsx")
                    }
                    disabled={Boolean(exportando)}
                  >
                    <span className="informes-formato-extension">
                      XLSX
                    </span>

                    <span className="informes-formato-copy">
                      <strong>
                        Excel
                      </strong>

                      <small>
                        Hoja de cálculo
                      </small>
                    </span>
                  </button>


                  <button
                    type="button"
                    className="informes-formato-btn informes-formato-html"
                    onClick={() =>
                      exportarInforme("html")
                    }
                    disabled={Boolean(exportando)}
                  >
                    <span className="informes-formato-extension">
                      HTML
                    </span>

                    <span className="informes-formato-copy">
                      <strong>
                        Página web
                      </strong>

                      <small>
                        Abrir en navegador
                      </small>
                    </span>
                  </button>

                </div>

              </div>

            </div>


            {error && (

              <div className="informes-error">
                {error}
              </div>

            )}
            </>}

            {tipo === "usuarios" && (
              <div className="informes-actions">
                <button
                  type="button"
                  className="informes-preview-btn"
                  onClick={() => reporteUsuariosRef.current?.actualizar()}
                  disabled={estadoReporteUsuarios.cargando}
                >
                  <span className="informes-preview-btn-icon">◉</span>
                  <span>{estadoReporteUsuarios.cargando ? "Consultando..." : "Vista previa"}</span>
                </button>
                <div className="informes-export-group">
                  <span className="informes-export-label">Exportar informe</span>
                  <div className="informes-formatos">
                    <button
                      type="button"
                      className="informes-formato-btn informes-formato-pdf"
                      onClick={() => reporteUsuariosRef.current?.pdf()}
                      disabled={!estadoReporteUsuarios.disponible || estadoReporteUsuarios.cargando}
                      title="Imprimir o guardar como PDF desde el navegador"
                    >
                      <span className="informes-formato-extension">PDF</span>
                      <span className="informes-formato-copy"><strong>Documento PDF</strong><small>Ver o imprimir</small></span>
                    </button>
                    <button
                      type="button"
                      className="informes-formato-btn informes-formato-excel"
                      onClick={() => reporteUsuariosRef.current?.excel()}
                      disabled={estadoReporteUsuarios.exportando}
                    >
                      <span className="informes-formato-extension">XLSX</span>
                      <span className="informes-formato-copy"><strong>Excel</strong><small>Hoja de cálculo</small></span>
                    </button>
                    <button
                      type="button"
                      className="informes-formato-btn informes-formato-html"
                      onClick={() => reporteUsuariosRef.current?.html()}
                      disabled={!estadoReporteUsuarios.disponible || estadoReporteUsuarios.cargando}
                    >
                      <span className="informes-formato-extension">HTML</span>
                      <span className="informes-formato-copy"><strong>Página web</strong><small>Abrir en navegador</small></span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </section>


          {tipo === "usuarios" ? (
            <section className="informes-preview">
              <div className="informes-preview-header">
                <div>
                  <span className="eyebrow">Vista previa</span>
                  <h2>{estadoReporteUsuarios.disponible ? "Reporte de usuarios, perfiles y permisos" : "Sin informe generado"}</h2>
                </div>
                {estadoReporteUsuarios.disponible && <span className="informes-periodo">Información actual</span>}
              </div>
              {!estadoReporteUsuarios.disponible && !estadoReporteUsuarios.cargando && !estadoReporteUsuarios.error && (
                <div className="informes-empty">Pulsa <strong>Vista previa</strong> para consultar los usuarios, perfiles y permisos.</div>
              )}
              {estadoReporteUsuarios.cargando && !estadoReporteUsuarios.disponible && (
                <div className="informes-empty">Consultando información...</div>
              )}
              <ReporteUsuarios
                ref={reporteUsuariosRef}
                autoCargar={false}
                onEstado={sincronizarEstadoReporteUsuarios}
              />
            </section>
          ) : (
          <section className="informes-preview">


            <div className="informes-preview-header">

              <div>

                <span className="eyebrow">
                  Vista previa
                </span>

                <h2>
                  {datos?.titulo ||
                    "Sin informe generado"}
                </h2>

              </div>


              {datos && (

                <span className="informes-periodo">
                  {esFinanciero ? fechaVisible(desde) : desde} — {esFinanciero ? fechaVisible(hasta) : hasta}
                </span>

              )}

            </div>


            {!datos && !cargando && (

              <div className="informes-empty">
                Selecciona el período y pulsa
                <strong> Vista previa</strong>.
              </div>

            )}


            {cargando && (

              <div className="informes-empty">
                Consultando información...
              </div>

            )}


            {datos &&
              esResumen && (

                <>

                  <div className="informes-indicadores">

                    {indicadores.map(
                      ([clave, valor]) => (

                        <article
                          key={clave}
                          className="informes-kpi"
                        >

                          <span>
                            {clave}
                          </span>

                          <strong>
                            {formatearValor(
                              clave,
                              valor
                            )}
                          </strong>

                        </article>

                      )
                    )}

                  </div>


                  {Array.isArray(
                    datos.inventarioPorTipo
                  ) &&
                    datos
                      .inventarioPorTipo
                      .length > 0 && (

                      <div className="informes-table-wrap">

                        <table className="informes-table">

                          <thead>
                            <tr>
                              <th>
                                Movimiento
                              </th>

                              <th>
                                Registros
                              </th>

                              <th>
                                Cantidad
                              </th>

                              <th>
                                Valor
                              </th>
                            </tr>
                          </thead>


                          <tbody>

                            {datos
                              .inventarioPorTipo
                              .map(
                                (
                                  item
                                ) => (

                                  <tr
                                    key={
                                      item.tipo
                                    }
                                  >

                                    <td>
                                      {item.tipo}
                                    </td>

                                    <td>
                                      {item.movimientos}
                                    </td>

                                    <td>
                                      {item.cantidad}
                                    </td>

                                    <td>
                                      {formatearMoneda(
                                        item.valor
                                      )}
                                    </td>

                                  </tr>

                                )
                              )}

                          </tbody>

                        </table>

                      </div>

                    )}

                </>

              )}


            {datos &&
              (esFacturas || esRecaudos || esFinanciero) &&
              indicadores.length > 0 && (

                <div className="informes-indicadores">

                  {indicadores.map(
                    ([clave, valor]) => (

                      <article
                        key={clave}
                        className="informes-kpi"
                      >

                        <span>
                          {esFacturas
                            ? (NOMBRES_INDICADORES_FACTURAS[clave] || clave)
                            : esFinanciero
                              ? (NOMBRES_INDICADORES_FINANCIEROS[clave] || clave)
                              : (NOMBRES_INDICADORES_RECAUDOS[clave] || clave)}
                        </span>

                        <strong>
                          {formatearValor(
                            clave,
                            valor
                          )}
                        </strong>

                      </article>

                    )
                  )}

                </div>

              )}


            {datos?.nota && (
              <p className="informes-nota">{datos.nota}</p>
            )}

            {datos &&
              !esResumen &&
              Array.isArray(
                datos.columnas
              ) && (

                <div className="informes-table-wrap">

                  <table className="informes-table">

                    <thead>

                      <tr>

                        {datos.columnas.map(
                          (
                            columna
                          ) => (

                            <th
                              key={
                                columna.campo
                              }
                            >
                              {columna.titulo}
                            </th>

                          )
                        )}

                      </tr>

                    </thead>


                    <tbody>

                      {(datos.filas || [])
                        .map(
                          (
                            fila,
                            indice
                          ) => (

                            <tr
                              key={
                                indice
                              }
                            >

                              {datos.columnas.map(
                                (
                                  columna
                                ) => (

                                  <td
                                    key={
                                      columna.campo
                                    }
                                  >

                                    {formatearValor(
                                      columna.campo,
                                      fila[
                                        columna.campo
                                      ],
                                      tipo
                                    )}

                                  </td>

                                )
                              )}

                            </tr>

                          )
                        )}

                    </tbody>

                  </table>


                  {(datos.filas || [])
                    .length === 0 && (

                    <div className="informes-empty">
                      No hay registros para el período seleccionado.
                    </div>

                  )}

                </div>

              )}

            {datos && esFinanciero && Array.isArray(datos.secciones) &&
              datos.secciones.map((seccion, indice) => (
                <div className="informes-seccion-adicional" key={`${seccion.titulo}-${indice}`}>
                  <div className="informes-seccion-titulo">
                    <h3>{seccion.titulo}</h3>
                    <span>{(seccion.filas || []).length} registros</span>
                  </div>
                  <div className="informes-table-wrap">
                    <table className="informes-table">
                      <thead><tr>{(seccion.columnas || []).map((columna) => (
                        <th key={columna.campo}>{columna.titulo}</th>
                      ))}</tr></thead>
                      <tbody>{(seccion.filas || []).map((fila, filaIndice) => (
                        <tr key={filaIndice}>{(seccion.columnas || []).map((columna) => (
                          <td key={columna.campo}>{formatearValor(columna.campo, fila[columna.campo], tipo)}</td>
                        ))}</tr>
                      ))}</tbody>
                    </table>
                    {!(seccion.filas || []).length && (
                      <div className="informes-empty">No hay registros en esta sección.</div>
                    )}
                  </div>
                </div>
              ))}

          </section>
          )}

        </div>

      </section>

    </AppLayout>
  );
}