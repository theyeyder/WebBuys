import {
  useEffect,
  useMemo,
  useState,
} from "react";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";

import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../services/cliente.service.js";

import {
  listarZonasDespacho,
} from "../services/zonaDespacho.service.js";

import "../styles/clientes.css";

const FORM_INICIAL = {
  documento: "",
  nombre: "",
  razonSocial: "",
  telefono: "",
  direccion: "",
  barrio: "",
  zonaDespacho: "",
  ciudad: "Ibagué",
  tipoCliente: "Tienda",
  estado: true,
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [zonas, setZonas] = useState([]);

  const [busqueda, setBusqueda] = useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [modalAbierto, setModalAbierto] =
    useState(false);

  const [clienteEditando, setClienteEditando] =
    useState(null);

  const [form, setForm] =
    useState(FORM_INICIAL);

  const [mensaje, setMensaje] =
    useState("");

  const [error, setError] =
    useState("");

  /* =========================
     CARGAR CLIENTES
  ========================= */

  async function cargarClientes() {
    try {
      setCargando(true);

      const data = await listarClientes();

      setClientes(
        Array.isArray(data)
          ? data
          : data?.clientes || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible cargar los clientes."
      );
    } finally {
      setCargando(false);
    }
  }

  /* =========================
     CARGAR ZONAS
  ========================= */

  async function cargarZonas() {
    try {
      const data =
        await listarZonasDespacho();

      setZonas(
        Array.isArray(data)
          ? data
          : data?.zonas || []
      );
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          "No fue posible cargar las zonas de despacho."
      );
    }
  }

  useEffect(() => {
    cargarClientes();
    cargarZonas();
  }, []);

  /* =========================
     FILTRAR CLIENTES
  ========================= */

  const clientesFiltrados = useMemo(() => {
    const texto =
      busqueda.trim().toLowerCase();

    if (!texto) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      const zona =
        cliente.zonaDespacho?.nombre || "";

      return [
        cliente.documento,
        cliente.nombre,
        cliente.razonSocial,
        cliente.telefono,
        cliente.direccion,
        cliente.barrio,
        cliente.ciudad,
        cliente.tipoCliente,
        zona,
      ]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [clientes, busqueda]);

  return (
    <AppLayout title="Clientes">
      <SpatialCard className="clientes-module">
        <div className="clientes-header">
          <div>
            <span className="eyebrow">
              Gestión de clientes
            </span>

            <h2>Clientes</h2>

            <p>
              Administra clientes y sus zonas
              de despacho.
            </p>
          </div>

          <div className="clientes-header-actions">
            <input
              type="search"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(
                  event.target.value
                )
              }
              placeholder="Buscar cliente..."
            />

            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                setClienteEditando(null);
                setForm(FORM_INICIAL);
                setModalAbierto(true);
              }}
            >
              + Nuevo cliente
            </button>
          </div>
        </div>

        <div className="clientes-count">
          {clientesFiltrados.length}{" "}
          {clientesFiltrados.length === 1
            ? "cliente"
            : "clientes"}
        </div>

        {cargando ? (
          <div className="clientes-loading">
            Cargando clientes...
          </div>
        ) : (
          <div className="clientes-table-wrapper">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Barrio</th>
                  <th>Zona de despacho</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {clientesFiltrados.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="clientes-empty"
                    >
                      No hay clientes registrados.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map(
                    (cliente) => (
                      <tr key={cliente._id}>
                        <td>
                          {cliente.documento}
                        </td>

                        <td>
                          <strong>
                            {cliente.nombre}
                          </strong>
                        </td>

                        <td>
                          {cliente.telefono ||
                            "—"}
                        </td>

                        <td>
                          {cliente.barrio ||
                            "—"}
                        </td>

                        <td>
                          <span className="cliente-zona">
                            {cliente
                              .zonaDespacho
                              ?.nombre ||
                              "Sin zona"}
                          </span>
                        </td>

                        <td>
                          {cliente.tipoCliente}
                        </td>

                        <td>
                          <span
                            className={
                              cliente.estado
                                ? "cliente-activo"
                                : "cliente-inactivo"
                            }
                          >
                            {cliente.estado
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>

                        <td>
                          Próximamente
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </SpatialCard>
    </AppLayout>
  );
}