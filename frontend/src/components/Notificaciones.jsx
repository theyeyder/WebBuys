import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  listarInventario,
} from "../services/inventario.service.js";

import notificacionIcon
  from "../assets/icons/notificacion.webp";

import cerrarIcon
  from "../assets/icons/cerrar.webp";

import "../styles/notificaciones.css";


function numero(
  valor,
  decimales = 4
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


function construirAlertas(
  inventario = []
) {

  return inventario
    .filter(
      (fila) =>
        fila?.estado ===
          "Agotado" ||
        fila?.estado ===
          "Stock bajo"
    )
    .map(
      (fila) => ({

        id:
          fila.id ||
          `${fila.productoId || "producto"}-${fila.presentacionId || "principal"}`,

        tipo:
          fila.estado,

        titulo:
          fila.estado ===
          "Agotado"
            ? "Producto agotado"
            : "Stock bajo",

        producto:
          fila.producto ||
          fila.nombre ||
          "Producto",

        presentacion:
          fila.presentacion ||
          "",

        codigo:
          fila.codigo ||
          "",

        disponible:
          Number(
            fila.stockDisponible ||
            0
          ),

        minimo:
          Number(
            fila.stockMinimo ||
            0
          ),

        unidad:
          fila.unidad ||
          "",

      })
    )
    .sort(
      (a, b) => {

        if (
          a.tipo !==
          b.tipo
        ) {
          return a.tipo ===
            "Agotado"
            ? -1
            : 1;
        }


        return String(
          a.producto
        ).localeCompare(
          String(
            b.producto
          ),
          "es"
        );

      }
    );

}


const STORAGE_POSICION =
  "webbuys:notificaciones:posicion";

const TAMANO_BOTON = 52;
const MARGEN_PANTALLA = 10;


function limitarPosicion(
  x,
  y
) {

  if (
    typeof window ===
    "undefined"
  ) {
    return {
      x: 20,
      y: 90,
    };
  }


  const maxX =
    Math.max(
      MARGEN_PANTALLA,
      window.innerWidth -
        TAMANO_BOTON -
        MARGEN_PANTALLA
    );

  const maxY =
    Math.max(
      MARGEN_PANTALLA,
      window.innerHeight -
        TAMANO_BOTON -
        MARGEN_PANTALLA
    );


  return {
    x: Math.min(
      Math.max(
        Number(x) ||
          MARGEN_PANTALLA,
        MARGEN_PANTALLA
      ),
      maxX
    ),

    y: Math.min(
      Math.max(
        Number(y) ||
          MARGEN_PANTALLA,
        MARGEN_PANTALLA
      ),
      maxY
    ),
  };

}


function obtenerPosicionInicial() {

  if (
    typeof window ===
    "undefined"
  ) {
    return {
      x: 20,
      y: 90,
    };
  }


  try {

    const guardada =
      JSON.parse(
        window.localStorage.getItem(
          STORAGE_POSICION
        ) ||
          "null"
      );


    if (
      guardada &&
      Number.isFinite(
        Number(guardada.x)
      ) &&
      Number.isFinite(
        Number(guardada.y)
      )
    ) {
      return limitarPosicion(
        guardada.x,
        guardada.y
      );
    }

  } catch (error) {
    console.warn(
      "No fue posible leer la posición de notificaciones:",
      error
    );
  }


  return limitarPosicion(
    window.innerWidth - 84,
    92
  );

}


export default function Notificaciones() {

  const navigate =
    useNavigate();

  const location =
    useLocation();

  const contenedorRef =
    useRef(null);


  const botonRef =
    useRef(null);


  const arrastreRef =
    useRef({
      activo: false,
      pointerId: null,
      inicioX: 0,
      inicioY: 0,
      origenX: 0,
      origenY: 0,
      movio: false,
    });


  const posicionRef =
    useRef(
      obtenerPosicionInicial()
    );


  const [
    posicion,
    setPosicion,
  ] = useState(
    posicionRef.current
  );


  const [
    abierto,
    setAbierto,
  ] = useState(false);


  const [
    alertas,
    setAlertas,
  ] = useState([]);


  const [
    cargando,
    setCargando,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  async function cargarNotificaciones(
    mostrarCarga = false
  ) {

    try {

      if (mostrarCarga) {
        setCargando(true);
      }

      setError("");


      const data =
        await listarInventario();


      const inventario =
        Array.isArray(
          data?.inventario
        )
          ? data.inventario
          : [];


      setAlertas(
        construirAlertas(
          inventario
        )
      );

    } catch (err) {

      console.error(
        "Error cargando notificaciones:",
        err
      );

      setError(
        "No fue posible actualizar las notificaciones."
      );

    } finally {

      if (mostrarCarga) {
        setCargando(false);
      }

    }

  }


  useEffect(() => {

    cargarNotificaciones();

  }, [
    location.pathname,
  ]);


  useEffect(() => {

    const intervalo =
      window.setInterval(
        () =>
          cargarNotificaciones(),
        60000
      );


    function alVolverALaVentana() {
      cargarNotificaciones();
    }


    window.addEventListener(
      "focus",
      alVolverALaVentana
    );


    return () => {

      window.clearInterval(
        intervalo
      );

      window.removeEventListener(
        "focus",
        alVolverALaVentana
      );

    };

  }, []);


  useEffect(() => {

    function cerrarFuera(
      event
    ) {

      if (
        abierto &&
        contenedorRef.current &&
        !contenedorRef.current.contains(
          event.target
        )
      ) {
        setAbierto(false);
      }

    }


    function cerrarConEscape(
      event
    ) {

      if (
        event.key ===
        "Escape"
      ) {
        setAbierto(false);
      }

    }


    document.addEventListener(
      "mousedown",
      cerrarFuera
    );

    document.addEventListener(
      "keydown",
      cerrarConEscape
    );


    return () => {

      document.removeEventListener(
        "mousedown",
        cerrarFuera
      );

      document.removeEventListener(
        "keydown",
        cerrarConEscape
      );

    };

  }, [
    abierto,
  ]);


  useEffect(() => {

    function mantenerEnPantalla() {

      const siguiente =
        limitarPosicion(
          posicionRef.current.x,
          posicionRef.current.y
        );

      posicionRef.current =
        siguiente;

      setPosicion(
        siguiente
      );

      try {
        window.localStorage.setItem(
          STORAGE_POSICION,
          JSON.stringify(
            siguiente
          )
        );
      } catch (error) {
        console.warn(
          "No fue posible guardar la posición de notificaciones:",
          error
        );
      }

    }


    window.addEventListener(
      "resize",
      mantenerEnPantalla
    );


    return () =>
      window.removeEventListener(
        "resize",
        mantenerEnPantalla
      );

  }, []);


  const resumen =
    useMemo(
      () => ({

        agotados:
          alertas.filter(
            (alerta) =>
              alerta.tipo ===
              "Agotado"
          ).length,

        stockBajo:
          alertas.filter(
            (alerta) =>
              alerta.tipo ===
              "Stock bajo"
          ).length,

      }),
      [
        alertas,
      ]
    );


  function iniciarArrastre(
    event
  ) {

    if (
      event.pointerType ===
        "mouse" &&
      event.button !== 0
    ) {
      return;
    }


    arrastreRef.current = {
      activo: true,
      pointerId:
        event.pointerId,
      inicioX:
        event.clientX,
      inicioY:
        event.clientY,
      origenX:
        posicionRef.current.x,
      origenY:
        posicionRef.current.y,
      movio: false,
    };


    event.currentTarget
      ?.setPointerCapture?.(
        event.pointerId
      );

  }


  function moverArrastre(
    event
  ) {

    const arrastre =
      arrastreRef.current;

    if (
      !arrastre.activo ||
      arrastre.pointerId !==
        event.pointerId
    ) {
      return;
    }


    const dx =
      event.clientX -
      arrastre.inicioX;

    const dy =
      event.clientY -
      arrastre.inicioY;


    if (
      Math.abs(dx) > 3 ||
      Math.abs(dy) > 3
    ) {
      arrastre.movio =
        true;

      if (abierto) {
        setAbierto(false);
      }
    }


    if (
      !arrastre.movio
    ) {
      return;
    }


    const siguiente =
      limitarPosicion(
        arrastre.origenX +
          dx,
        arrastre.origenY +
          dy
      );


    posicionRef.current =
      siguiente;

    setPosicion(
      siguiente
    );

  }


  function terminarArrastre(
    event
  ) {

    const arrastre =
      arrastreRef.current;

    if (
      !arrastre.activo ||
      arrastre.pointerId !==
        event.pointerId
    ) {
      return;
    }


    arrastre.activo =
      false;


    try {
      window.localStorage.setItem(
        STORAGE_POSICION,
        JSON.stringify(
          posicionRef.current
        )
      );
    } catch (error) {
      console.warn(
        "No fue posible guardar la posición de notificaciones:",
        error
      );
    }

  }


  function clickNotificaciones() {

    if (
      arrastreRef.current.movio
    ) {
      arrastreRef.current.movio =
        false;
      return;
    }


    abrirCerrar();

  }


  function abrirCerrar() {

    setAbierto(
      (actual) =>
        !actual
    );


    if (!abierto) {
      cargarNotificaciones(
        true
      );
    }

  }


  function irAInventario() {

    setAbierto(false);

    navigate(
      "/inventario"
    );

  }


  return (

    <div
      className="global-notifications"
      ref={contenedorRef}
      style={{
        left: `${posicion.x}px`,
        top: `${posicion.y}px`,
      }}
    >

      <button
        type="button"
        className={`global-notifications-button ${
          abierto
            ? "is-open"
            : ""
        }`}
        ref={botonRef}
        onClick={clickNotificaciones}
        onPointerDown={iniciarArrastre}
        onPointerMove={moverArrastre}
        onPointerUp={terminarArrastre}
        onPointerCancel={terminarArrastre}
        title="Notificaciones · arrastra para mover"
        aria-label={`Notificaciones. ${alertas.length} alertas activas`}
        aria-expanded={abierto}
      >

        <img
          src={notificacionIcon}
          alt=""
        />

        {alertas.length > 0 && (
          <span className="global-notifications-badge">
            {alertas.length > 99
              ? "99+"
              : alertas.length}
          </span>
        )}

      </button>


      {abierto && (

        <div
          className={`global-notifications-panel ${
            posicion.x >
            window.innerWidth / 2
              ? "panel-align-right"
              : "panel-align-left"
          } ${
            posicion.y >
            window.innerHeight / 2
              ? "panel-open-up"
              : "panel-open-down"
          }`}
          role="dialog"
          aria-label="Panel de notificaciones"
        >

          <div className="global-notifications-header">

            <div>
              <span>
                Centro de alertas
              </span>
              <h3>
                Notificaciones
              </h3>
            </div>


            <button
              type="button"
              className="global-notifications-close"
              onClick={() =>
                setAbierto(false)
              }
              aria-label="Cerrar notificaciones"
            >
              <img
                src={cerrarIcon}
                alt=""
              />
            </button>

          </div>


          <div className="global-notifications-summary">

            <div className="notification-summary danger">
              <strong>
                {resumen.agotados}
              </strong>
              <span>
                Agotados
              </span>
            </div>

            <div className="notification-summary warning">
              <strong>
                {resumen.stockBajo}
              </strong>
              <span>
                Stock bajo
              </span>
            </div>

          </div>


          <div className="global-notifications-list">

            {cargando ? (

              <div className="global-notifications-empty">
                Actualizando notificaciones...
              </div>

            ) : error ? (

              <div className="global-notifications-error">
                {error}
                <button
                  type="button"
                  onClick={() =>
                    cargarNotificaciones(
                      true
                    )
                  }
                >
                  Reintentar
                </button>
              </div>

            ) : alertas.length === 0 ? (

              <div className="global-notifications-empty">
                No hay alertas activas de inventario.
              </div>

            ) : (

              alertas.map(
                (alerta) => (

                  <button
                    type="button"
                    key={alerta.id}
                    className={`global-notification-item ${
                      alerta.tipo ===
                      "Agotado"
                        ? "danger"
                        : "warning"
                    }`}
                    onClick={
                      irAInventario
                    }
                  >

                    <span className="global-notification-dot" />

                    <span className="global-notification-content">

                      <strong>
                        {alerta.titulo}
                      </strong>

                      <span className="global-notification-product">
                        {alerta.producto}
                        {alerta.presentacion
                          ? ` · ${alerta.presentacion}`
                          : ""}
                      </span>

                      <small>
                        {alerta.codigo
                          ? `${alerta.codigo} · `
                          : ""}
                        Disponible: {numero(
                          alerta.disponible
                        )} {alerta.unidad}
                        {alerta.tipo ===
                        "Stock bajo"
                          ? ` · Mínimo: ${numero(
                              alerta.minimo
                            )}`
                          : ""}
                      </small>

                    </span>

                    <span className="global-notification-arrow">
                      ›
                    </span>

                  </button>

                )
              )

            )}

          </div>


          <div className="global-notifications-footer">

            <button
              type="button"
              onClick={
                irAInventario
              }
            >
              Ver inventario
            </button>

            <button
              type="button"
              className="refresh"
              onClick={() =>
                cargarNotificaciones(
                  true
                )
              }
              disabled={cargando}
            >
              Actualizar
            </button>

          </div>

        </div>

      )}

    </div>

  );

}
