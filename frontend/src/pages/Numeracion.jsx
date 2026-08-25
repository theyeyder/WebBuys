import {
  useEffect,
  useState,
} from "react";

import ModulosMenu
  from "../components/ModulosMenu.jsx";

import {
  listarNumeraciones,
} from "../services/numeracion.service.js";

import "../styles/numeracion.css";


export default function Numeracion() {

  const [
    numeraciones,
    setNumeraciones,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /* =========================================
     CARGAR NUMERACIÓN
  ========================================= */

  useEffect(() => {
    cargarNumeraciones();
  }, []);


  async function cargarNumeraciones() {

    try {

      setCargando(true);
      setError("");

      const data =
        await listarNumeraciones();

      setNumeraciones(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {

      console.error(
        "Error cargando numeración:",
        err
      );

      setError(
        err.response?.data?.mensaje ||
        "No fue posible cargar la numeración."
      );

    } finally {

      setCargando(false);

    }

  }


  return (

    <section className="numeracion-page">

      {/* =====================================
          CABECERA
      ===================================== */}

      <header className="numeracion-header">

        <div className="numeracion-header-left">

          <ModulosMenu />

          <h1>
            Numeración
          </h1>

        </div>

      </header>


      {/* =====================================
          CONTENIDO
      ===================================== */}

      <main className="numeracion-content">

        <div className="numeracion-panel">

          <div className="numeracion-panel-header">

            <div>
              <h2>
                Consecutivos del sistema
              </h2>

              
            </div>

          </div>


          {error && (

            <div className="numeracion-error">
              {error}
            </div>

          )}


          <div className="numeracion-table-wrapper">

            <table className="numeracion-table">

              <thead>

                <tr>
                  <th>Módulo</th>
                  <th>Prefijo</th>
                  <th>Último número</th>
                  <th>Último código</th>
                  <th>Próximo código</th>
                </tr>

              </thead>


              <tbody>

                {cargando ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="numeracion-empty"
                    >
                      Cargando numeración...
                    </td>

                  </tr>

                ) : numeraciones.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="numeracion-empty"
                    >
                      No hay numeraciones
                      disponibles.
                    </td>

                  </tr>

                ) : (

                  numeraciones.map(
                    (item) => {

                      const ultimoCodigo =
                        item.ultimoNumero > 0
                          ? `${item.prefijo}-${item.ultimoFormateado}`
                          : "Sin registros";

                      return (

                        <tr key={item.clave}>

                          <td>
                            <strong>
                              {item.modulo}
                            </strong>
                          </td>

                          <td>
                            {item.prefijo}
                          </td>

                          <td>
                            {item.ultimoNumero}
                          </td>

                          <td>
                            <span className="numeracion-code">
                              {ultimoCodigo}
                            </span>
                          </td>

                          <td>
                            <span className="numeracion-next-code">
                              {item.siguienteCodigo}
                            </span>
                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </section>

  );
}