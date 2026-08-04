import { useEffect, useState } from "react";

import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";

import {
  obtenerConfiguracion,
  actualizarConfiguracion,
} from "../services/configuracion.service.js";

import "../styles/empresa.css";

const FORM_INICIAL = {
  nombreComercial: "",
  razonSocial: "",
  nit: "",
  regimenTributario: "",
  direccion: "",
  ciudad: "",
  departamento: "",
  pais: "Colombia",
  telefono: "",
  celular: "",
  whatsapp: "",
  correo: "",
  paginaWeb: "",
  logo: "",

  prefijoFactura: "FAC",
  resolucionDIAN: "",
  consecutivoInicial: 1,
  consecutivoActual: 1,
  consecutivoFinal: 999999,
  iva: 19,

  piePaginaFactura: "",
  observacionesFactura: "",
};

export default function Empresa() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [pestana, setPestana] = useState("empresa");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      setError("");

      const data = await obtenerConfiguracion();

      setForm({
        ...FORM_INICIAL,
        ...data,
      });
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los datos de la empresa."
      );
    } finally {
      setCargando(false);
    }
  }

  function cambiar(event) {
    const { name, value, type } = event.target;

    setForm((formActual) => ({
      ...formActual,
      [name]: type === "number" ? Number(value) : value,
    }));
  }

  async function guardar(event) {
    event.preventDefault();

    try {
      setGuardando(true);
      setMensaje("");
      setError("");

      if (!form.nombreComercial.trim()) {
        setError("El nombre comercial es obligatorio.");
        return;
      }

      if (
        form.correo &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)
      ) {
        setError("El correo electrónico no es válido.");
        return;
      }

      if (form.iva < 0 || form.iva > 100) {
        setError("El IVA debe estar entre 0 y 100.");
        return;
      }

      if (
        form.consecutivoFinal <
        form.consecutivoInicial
      ) {
        setError(
          "El consecutivo final no puede ser menor que el inicial."
        );
        return;
      }

      const configuracion =
        await actualizarConfiguracion(form);

      setForm({
        ...FORM_INICIAL,
        ...configuracion,
      });

      setMensaje(
        "La configuración de la empresa fue guardada correctamente."
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible guardar la configuración."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <AppLayout title="Empresa">
      <SpatialCard className="empresa-module">
        <div className="empresa-header">
          <div>
            <span className="eyebrow">Información de la empresa</span>
           
          </div>

          {form.logo && (
            <div className="empresa-logo-preview">
              <img
                src={form.logo}
                alt="Logo de la empresa"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>

        <div className="empresa-tabs">
          <button
            type="button"
            className={
              pestana === "empresa"
                ? "empresa-tab active"
                : "empresa-tab"
            }
            onClick={() => setPestana("empresa")}
          >
            Empresa
          </button>

          <button
            type="button"
            className={
              pestana === "facturacion"
                ? "empresa-tab active"
                : "empresa-tab"
            }
            onClick={() => setPestana("facturacion")}
          >
            Facturación
          </button>

          <button
            type="button"
            className={
              pestana === "impresion"
                ? "empresa-tab active"
                : "empresa-tab"
            }
            onClick={() => setPestana("impresion")}
          >
            Impresión
          </button>
        </div>

        {mensaje && (
          <div className="success-message">{mensaje}</div>
        )}

        {error && <div className="error">{error}</div>}

        {cargando ? (
          <div className="empresa-loading">
            Cargando información de la empresa...
          </div>
        ) : (
          <form onSubmit={guardar}>
            {pestana === "empresa" && (
              <div className="empresa-form-grid">
                <label>
                  Nombre comercial
                  <input
                    name="nombreComercial"
                    value={form.nombreComercial}
                    onChange={cambiar}
                    placeholder="Lácteos Del Tolima S.A.S."
                    required
                  />
                </label>

                <label>
                  Razón social
                  <input
                    name="razonSocial"
                    value={form.razonSocial}
                    onChange={cambiar}
                    placeholder="Razón social registrada"
                  />
                </label>

                <label>
                  NIT
                  <input
                    name="nit"
                    value={form.nit}
                    onChange={cambiar}
                    placeholder="Ejemplo: 900123456-7"
                  />
                </label>

                <label>
                  Régimen tributario
                  <select
                    name="regimenTributario"
                    value={form.regimenTributario}
                    onChange={cambiar}
                  >
                    <option value="">
                      Seleccionar régimen
                    </option>

                    <option value="Responsable de IVA">
                      Responsable de IVA
                    </option>

                    <option value="No responsable de IVA">
                      No responsable de IVA
                    </option>

                    <option value="Régimen SIMPLE">
                      Régimen SIMPLE
                    </option>
                  </select>
                </label>

                <label className="empresa-field-full">
                  Dirección
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={cambiar}
                    placeholder="Dirección de la empresa"
                  />
                </label>

                <label>
                  Ciudad
                  <input
                    name="ciudad"
                    value={form.ciudad}
                    onChange={cambiar}
                    placeholder="Ibagué"
                  />
                </label>

                <label>
                  Departamento
                  <input
                    name="departamento"
                    value={form.departamento}
                    onChange={cambiar}
                    placeholder="Tolima"
                  />
                </label>

                <label>
                  País
                  <input
                    name="pais"
                    value={form.pais}
                    onChange={cambiar}
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    name="telefono"
                    value={form.telefono}
                    onChange={cambiar}
                    placeholder="Teléfono fijo"
                  />
                </label>

                <label>
                  Celular
                  <input
                    name="celular"
                    value={form.celular}
                    onChange={cambiar}
                    placeholder="Número celular"
                  />
                </label>

                <label>
                  WhatsApp
                  <input
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={cambiar}
                    placeholder="Número de WhatsApp"
                  />
                </label>

                <label>
                  Correo electrónico
                  <input
                    type="email"
                    name="correo"
                    value={form.correo}
                    onChange={cambiar}
                    placeholder="empresa@correo.com"
                  />
                </label>

                <label>
                  Página web
                  <input
                    type="url"
                    name="paginaWeb"
                    value={form.paginaWeb}
                    onChange={cambiar}
                    placeholder="https://..."
                  />
                </label>

                <label className="empresa-field-full">
                  Dirección web del logo
                  <input
                    type="url"
                    name="logo"
                    value={form.logo}
                    onChange={cambiar}
                    placeholder="https://.../logo.png"
                  />
                </label>
              </div>
            )}

            {pestana === "facturacion" && (
              <div className="empresa-form-grid">
                <label>
                  Prefijo de factura
                  <input
                    name="prefijoFactura"
                    value={form.prefijoFactura}
                    onChange={cambiar}
                    placeholder="FAC"
                  />
                </label>

                <label>
                  IVA por defecto
                  <input
                    type="number"
                    name="iva"
                    min="0"
                    max="100"
                    value={form.iva}
                    onChange={cambiar}
                  />
                </label>

                <label className="empresa-field-full">
                  Resolución DIAN
                  <input
                    name="resolucionDIAN"
                    value={form.resolucionDIAN}
                    onChange={cambiar}
                    placeholder="Número y descripción de la resolución"
                  />
                </label>

                <label>
                  Consecutivo inicial
                  <input
                    type="number"
                    name="consecutivoInicial"
                    min="1"
                    value={form.consecutivoInicial}
                    onChange={cambiar}
                  />
                </label>

                <label>
                  Consecutivo actual
                  <input
                    type="number"
                    name="consecutivoActual"
                    min="1"
                    value={form.consecutivoActual}
                    onChange={cambiar}
                  />
                </label>

                <label>
                  Consecutivo final
                  <input
                    type="number"
                    name="consecutivoFinal"
                    min="1"
                    value={form.consecutivoFinal}
                    onChange={cambiar}
                  />
                </label>
              </div>
            )}

            {pestana === "impresion" && (
              <div className="empresa-form-grid">
                <label className="empresa-field-full">
                  Pie de página de la factura
                  <textarea
                    name="piePaginaFactura"
                    value={form.piePaginaFactura}
                    onChange={cambiar}
                    rows="4"
                    placeholder="Mensaje que aparecerá al final de las facturas."
                  />
                </label>

                <label className="empresa-field-full">
                  Observaciones predeterminadas
                  <textarea
                    name="observacionesFactura"
                    value={form.observacionesFactura}
                    onChange={cambiar}
                    rows="5"
                    placeholder="Observaciones generales para facturas."
                  />
                </label>
              </div>
            )}

            <div className="empresa-footer">
              <button
                className="primary-btn"
                type="submit"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar configuración"}
              </button>
            </div>
          </form>
        )}
      </SpatialCard>
    </AppLayout>
  );
}