import {
  useEffect,
  useState,
} from "react";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import Toast
  from "../components/Toast.jsx";

import guardarIcon
  from "../assets/icons/guardar.png";

import {
  obtenerPreferencias,
  actualizarPreferencias,
} from "../services/preferencia.service.js";

import "../styles/preferencias.css";


const FORM_INICIAL = {
  moneda: "COP",
  simboloMoneda: "$",
  decimales: 0,
  formatoFecha: "DD/MM/YYYY",
  permitirInventarioNegativo: false,
  confirmarAntesEliminar: true,
};


export default function Preferencias() {

  const [
    form,
    setForm,
  ] = useState(
    FORM_INICIAL
  );

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
     CARGAR PREFERENCIAS
  ========================================= */

  useEffect(() => {
    cargarPreferencias();
  }, []);


  useEffect(() => {

    if (
      !mensaje &&
      !error
    ) {
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


  async function cargarPreferencias() {

    try {

      setCargando(true);
      setError("");

      const data =
        await obtenerPreferencias();

      setForm({
        moneda:
          data?.moneda ||
          "COP",

        simboloMoneda:
          data?.simboloMoneda ??
          "$",

        decimales:
          Number(
            data?.decimales ??
            0
          ),

        formatoFecha:
          data?.formatoFecha ||
          "DD/MM/YYYY",

        permitirInventarioNegativo:
          Boolean(
            data?.permitirInventarioNegativo
          ),

        confirmarAntesEliminar:
          data?.confirmarAntesEliminar ??
          true,
      });

    } catch (err) {

      console.error(
        "Error cargando preferencias:",
        err
      );

      setError(
        err.response?.data?.mensaje ||
        "No fue posible cargar las preferencias."
      );

    } finally {

      setCargando(false);

    }

  }


  /* =========================================
     CAMBIAR CAMPOS
  ========================================= */

  function cambiarCampo(
    event
  ) {

    const {
      name,
      value,
      type,
      checked,
    } = event.target;


    setForm(
      (actual) => ({
        ...actual,

        [name]:
          type === "checkbox"
            ? checked
            : name === "decimales"
              ? Number(value)
              : value,
      })
    );

  }


  /* =========================================
     GUARDAR
  ========================================= */

  async function guardarPreferencias() {

    try {

      setGuardando(true);

      setMensaje("");
      setError("");


      const data =
        await actualizarPreferencias(
          form
        );


      setForm({
        moneda:
          data?.preferencias
            ?.moneda ||
          form.moneda,

        simboloMoneda:
          data?.preferencias
            ?.simboloMoneda ??
          form.simboloMoneda,

        decimales:
          Number(
            data?.preferencias
              ?.decimales ??
            form.decimales
          ),

        formatoFecha:
          data?.preferencias
            ?.formatoFecha ||
          form.formatoFecha,

        permitirInventarioNegativo:
          Boolean(
            data?.preferencias
              ?.permitirInventarioNegativo
          ),

        confirmarAntesEliminar:
          data?.preferencias
            ?.confirmarAntesEliminar ??
          form.confirmarAntesEliminar,
      });


      setMensaje(
        data?.mensaje ||
        "Preferencias guardadas correctamente."
      );

    } catch (err) {

      console.error(
        "Error guardando preferencias:",
        err
      );

      setError(
        err.response?.data?.mensaje ||
        "No fue posible guardar las preferencias."
      );

    } finally {

      setGuardando(false);

    }

  }


  return (

    <section className="preferencias-page">

      {/* =====================================
          CABECERA
      ====================================== */}

      <header className="preferencias-header">

        <div className="preferencias-header-left">

          <ModulosMenu />

          <h1>
            Preferencias
          </h1>

        </div>

      </header>


      {/* =====================================
          CONTENIDO
      ====================================== */}

      <main className="preferencias-content">

        <div className="preferencias-panel">


          {/* CABECERA INTERNA */}

          <div className="preferencias-panel-header">

            <div>

              <h2>
                Preferencias generales
              </h2>

            

            </div>


            <button
              type="button"
              className="preferencias-save-btn"
              onClick={
                guardarPreferencias
              }
              disabled={
                cargando ||
                guardando
              }
              data-tooltip="Guardar preferencias"
            >
              <img
                src={guardarIcon}
                alt=""
              />
            </button>

          </div>


          {/* FORMULARIO */}

          <div className="preferencias-form">


            <div className="preferencias-section">

              <h3>
                Moneda y valores
              </h3>


              <div className="preferencias-grid">


                <label className="preferencias-field">

                  <span>
                    Moneda
                  </span>

                  <select
                    name="moneda"
                    value={form.moneda}
                    onChange={
                      cambiarCampo
                    }
                    disabled={
                      cargando
                    }
                  >
                    <option value="COP">
                      COP - Peso colombiano
                    </option>

                    <option value="USD">
                      USD - Dólar
                    </option>

                    <option value="EUR">
                      EUR - Euro
                    </option>
                  </select>

                </label>


                <label className="preferencias-field preferencias-field-small">

                  <span>
                    Símbolo
                  </span>

                  <input
                    type="text"
                    name="simboloMoneda"
                    value={
                      form.simboloMoneda
                    }
                    onChange={
                      cambiarCampo
                    }
                    maxLength="4"
                    disabled={
                      cargando
                    }
                  />

                </label>


                <label className="preferencias-field preferencias-field-small">

                  <span>
                    Decimales
                  </span>

                  <select
                    name="decimales"
                    value={
                      form.decimales
                    }
                    onChange={
                      cambiarCampo
                    }
                    disabled={
                      cargando
                    }
                  >
                    <option value={0}>
                      0
                    </option>

                    <option value={2}>
                      2
                    </option>
                  </select>

                </label>

              </div>

            </div>


            <div className="preferencias-section">

              <h3>
                Fecha
              </h3>


              <label className="preferencias-field preferencias-field-date">

                <span>
                  Formato de fecha
                </span>

                <select
                  name="formatoFecha"
                  value={
                    form.formatoFecha
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    cargando
                  }
                >
                  <option value="DD/MM/YYYY">
                    DD/MM/YYYY
                  </option>

                  <option value="YYYY-MM-DD">
                    YYYY-MM-DD
                  </option>

                  <option value="MM/DD/YYYY">
                    MM/DD/YYYY
                  </option>
                </select>

              </label>

            </div>


            <div className="preferencias-section">

              <h3>
                Comportamiento
              </h3>


              <label className="preferencias-toggle-row">

                <div>
                  <strong>
                    Permitir inventario negativo
                  </strong>

                  <span>
                    Permite registrar
                    movimientos aunque
                    la existencia quede
                    por debajo de cero.
                  </span>
                </div>

                <input
                  type="checkbox"
                  name="permitirInventarioNegativo"
                  checked={
                    form.permitirInventarioNegativo
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    cargando
                  }
                />

              </label>


              <label className="preferencias-toggle-row">

                <div>
                  <strong>
                    Confirmar antes de eliminar
                  </strong>

                  <span>
                    Solicita confirmación
                    antes de eliminar
                    registros.
                  </span>
                </div>

                <input
                  type="checkbox"
                  name="confirmarAntesEliminar"
                  checked={
                    form.confirmarAntesEliminar
                  }
                  onChange={
                    cambiarCampo
                  }
                  disabled={
                    cargando
                  }
                />

              </label>

            </div>

          </div>

        </div>

      </main>


      <Toast
        mensaje={mensaje}
        error={error}
      />

    </section>

  );
}