import {
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import buscarIcon from "../assets/icons/buscar.png";

import "../styles/module-search.css";


const MODULOS = [
  {
    nombre: "Dashboard",
    ruta: "/",
  },

  {
    nombre: "Clientes",
    ruta: "/clientes",
  },

  {
    nombre: "Categorías",
    ruta: "/categorias",
  },

  {
    nombre: "Productos",
    ruta: "/productos",
  },

  {
    nombre: "Pedidos",
    ruta: "/pedidos",
  },

  {
    nombre: "Facturación",
    ruta: "/facturacion",
  },

  {
    nombre: "Empleados",
    ruta: "/empleados",
  },

  {
    nombre: "Configuración",
    ruta: "/configuracion",

    submodulos: [
      {
        nombre: "Usuarios",
        ruta: "/configuracion/usuarios",
      },
      {
        nombre: "Empresa",
        ruta: "/configuracion/empresa",
      },
      {
        nombre: "Rutas",
        ruta: "/configuracion/rutas",
      },
      {
        nombre: "Zonas de despacho",
        ruta: "/configuracion/zonas-despacho",
      },
      {
        nombre: "Numeración",
        ruta: "/configuracion/numeracion",
      },
      {
        nombre: "Auditoría",
        ruta: "/configuracion/auditoria",
      },
      {
        nombre: "Preferencias",
        ruta: "/configuracion/preferencias",
      },
    ],
  },
];


export default function ModuleSearch() {

  const navigate = useNavigate();

  const [busqueda, setBusqueda] =
    useState("");

  const [enFoco, setEnFoco] =
    useState(false);


  const resultados = useMemo(() => {

    const texto =
      busqueda
        .trim()
        .toLowerCase();

    if (!texto) {
      return [];
    }

    const encontrados = [];

    MODULOS.forEach((modulo) => {

      if (
        modulo.nombre
          .toLowerCase()
          .includes(texto)
      ) {

        encontrados.push({
          nombre: modulo.nombre,
          ruta: modulo.ruta,
          tipo: "Módulo",
          padre: "",
        });

      }

      modulo.submodulos?.forEach(
        (submodulo) => {

          if (
            submodulo.nombre
              .toLowerCase()
              .includes(texto)
          ) {

            encontrados.push({
              nombre: submodulo.nombre,
              ruta: submodulo.ruta,
              tipo: "Submódulo",
              padre: modulo.nombre,
            });

          }

        }
      );

    });

    return encontrados;

  }, [busqueda]);


  function navegar(ruta) {

    navigate(ruta);

    setBusqueda("");
    setEnFoco(false);

  }


  const mostrarResultados =
    enFoco &&
    busqueda.trim().length > 0;


  return (

    <div className="module-search-global">

      {/* BARRA */}

      <div
        className={`module-search-global-box ${
          enFoco ? "active" : ""
        }`}
      >

        <img
          src={buscarIcon}
          alt=""
          className="module-search-global-icon"
        />

        <input
          type="search"
          value={busqueda}
          onFocus={() =>
            setEnFoco(true)
          }
          onChange={(event) =>
            setBusqueda(
              event.target.value
            )
          }
          placeholder="Buscar módulo o submódulo..."
          aria-label="Buscar módulo o submódulo"
        />

        {busqueda && (

          <button
            type="button"
            className="module-search-global-clear"
            onClick={() =>
              setBusqueda("")
            }
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>

        )}

      </div>


      {/* RESULTADOS */}

      {mostrarResultados && (

        <div className="module-search-dropdown">

          {resultados.length === 0 ? (

            <div className="module-search-no-results">
              No se encontraron módulos.
            </div>

          ) : (

            resultados.map(
              (resultado) => (

                <button
                  type="button"
                  key={resultado.ruta}
                  className="module-search-result"
                  onMouseDown={(event) => {
                    event.preventDefault();

                    navegar(
                      resultado.ruta
                    );
                  }}
                >

                  <div className="module-search-result-text">

                    <strong>
                      {resultado.nombre}
                    </strong>

                    <span>
                      {resultado.tipo}

                      {resultado.padre &&
                        ` · ${resultado.padre}`}
                    </span>

                  </div>

                  <span className="module-search-arrow">
                    ›
                  </span>

                </button>

              )
            )

          )}

        </div>

      )}

    </div>

  );

}