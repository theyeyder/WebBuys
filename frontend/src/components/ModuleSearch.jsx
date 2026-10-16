import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";
import { puedeVerModulo } from "../utils/permisosUsuario.js";

import buscarIcon from "../assets/icons/buscar.webp";
import "../styles/module-search.css";

const MODULOS = [
  { nombre: "Dashboard", ruta: "/", modulo: "dashboard" },
  { nombre: "Clientes", ruta: "/clientes", modulo: "clientes" },
  { nombre: "Categorías", ruta: "/categorias", modulo: "categorias" },
  { nombre: "Productos", ruta: "/productos", modulo: "productos" },
  { nombre: "Inventario", ruta: "/inventario", modulo: "inventario" },
  { nombre: "Pedidos", ruta: "/pedidos", modulo: "pedidos" },
  { nombre: "Entrega", ruta: "/entregas", modulo: "entregas" },
  { nombre: "Facturación", ruta: "/facturacion", modulo: "facturacion" },
  { nombre: "Caja", ruta: "/caja", modulo: "caja" },
  { nombre: "Cartera", ruta: "/cartera", modulo: "cartera" },
  { nombre: "Empleados", ruta: "/empleados", modulo: "empleados" },

  {
    nombre: "Configuración",
    ruta: "/configuracion",
    modulo: "configuracion",
    submodulos: [
      { nombre: "Usuarios", ruta: "/configuracion/usuarios", modulo: "usuarios" },
      { nombre: "Empresa", ruta: "/configuracion/empresa", modulo: "empresa" },
      { nombre: "Rutas", ruta: "/configuracion/rutas", modulo: "rutas" },
      { nombre: "Zonas de despacho", ruta: "/configuracion/zonas-despacho", modulo: "zonas_despacho" },
      { nombre: "Numeración", ruta: "/configuracion/numeracion", modulo: "numeracion" },
      { nombre: "Auditoría", ruta: "/configuracion/auditoria", modulo: "auditoria" },
      { nombre: "Preferencias", ruta: "/configuracion/preferencias", modulo: "preferencias" },
      { nombre: "Informes", ruta: "/configuracion/informes", modulo: "informes" },
    ],
  },
];

export default function ModuleSearch() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [busqueda, setBusqueda] = useState("");
  const [enFoco, setEnFoco] = useState(false);
  const [hayVentanaEmergente, setHayVentanaEmergente] = useState(false);

  useEffect(() => {
    const selectores = [
      '[class*="modal-overlay"]',
      '[class*="modal-backdrop"]',
      '[class*="detail-overlay"]',
      '[class*="datepicker-overlay"]',
      '[class*="calendar-overlay"]',
      '[role="dialog"]',
      '[aria-modal="true"]',
    ].join(",");

    function estaVisible(elemento) {
      if (!elemento) return false;

      const estilo = window.getComputedStyle(elemento);

      if (
        estilo.display === "none" ||
        estilo.visibility === "hidden" ||
        Number(estilo.opacity) === 0
      ) {
        return false;
      }

      return elemento.getClientRects().length > 0;
    }

    function revisarVentanas() {
      const elementos = document.querySelectorAll(selectores);
      const abierta = Array.from(elementos).some(estaVisible);
      setHayVentanaEmergente(abierta);
    }

    revisarVentanas();

    const observer = new MutationObserver(revisarVentanas);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "hidden", "aria-hidden"],
    });

    return () => observer.disconnect();
  }, []);

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return [];

    const encontrados = [];

    MODULOS.forEach((modulo) => {
      const moduloVisible = puedeVerModulo(usuario, modulo.modulo);

      if (
        moduloVisible &&
        modulo.nombre.toLowerCase().includes(texto)
      ) {
        encontrados.push({
          nombre: modulo.nombre,
          ruta: modulo.ruta,
          tipo: "Módulo",
          padre: "",
        });
      }

      modulo.submodulos?.forEach((submodulo) => {
        if (
          puedeVerModulo(usuario, submodulo.modulo) &&
          submodulo.nombre.toLowerCase().includes(texto)
        ) {
          encontrados.push({
            nombre: submodulo.nombre,
            ruta: submodulo.ruta,
            tipo: "Submódulo",
            padre: modulo.nombre,
          });
        }
      });
    });

    return encontrados;
  }, [busqueda, usuario]);

  function navegar(ruta) {
    navigate(ruta);
    setBusqueda("");
    setEnFoco(false);
  }

  const mostrarResultados = busqueda.trim().length > 0;

  if (hayVentanaEmergente) {
    return null;
  }

  return (
    <div className="module-search-global">
      <div
        className={`module-search-global-box ${enFoco ? "active" : ""}`}
      >
        <img
          src={buscarIcon}
          alt=""
          className="module-search-global-icon"
        />

        <input
          type="search"
          value={busqueda}
          onFocus={() => setEnFoco(true)}
          onChange={(event) => {
            const valor = event.target.value;
            setBusqueda(valor);

            if (valor.trim()) {
              setEnFoco(true);
            }
          }}
          placeholder=""
          aria-label="Buscar módulo o submódulo"
        />

        {busqueda && (
          <button
            type="button"
            className="module-search-global-clear"
            onClick={() => {
              setBusqueda("");
              setEnFoco(true);
            }}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {mostrarResultados && (
        <div className="module-search-dropdown">
          {resultados.length === 0 ? (
            <div className="module-search-no-results">
              No se encontraron módulos.
            </div>
          ) : (
            resultados.map((resultado) => (
              <button
                type="button"
                key={resultado.ruta}
                className="module-search-result"
                onMouseDown={(event) => {
                  event.preventDefault();
                  navegar(resultado.ruta);
                }}
              >
                <div className="module-search-result-text">
                  <strong>{resultado.nombre}</strong>
                  <span>
                    {resultado.tipo}
                    {resultado.padre && ` · ${resultado.padre}`}
                  </span>
                </div>

                <span className="module-search-arrow">›</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
