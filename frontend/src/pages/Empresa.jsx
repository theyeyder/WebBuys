import { useEffect, useRef, useState } from "react";
import AppLayout from "../layouts/AppLayout.jsx";
import SpatialCard from "../components/cards/SpatialCard.jsx";
import Toast from "../components/Toast.jsx"; 

import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  subirLogoEmpresa,
  eliminarLogoEmpresa,
} from "../services/configuracion.service.js";

import subirArchivoIcon from "../assets/icons/subir-archivo.png";
import guardarIcon from "../assets/icons/guardar.png";
import eliminarLogoIcon from "../assets/icons/eliminar-logo.png";
import CalendarInput from "../components/CalendarInput.jsx"; 
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
  fechaResolucionDIAN: "",
  vigenciaDesde: "",
  vigenciaHasta: "",
  rangoAutorizadoDesde: 1,
  rangoAutorizadoHasta: 999999,
  consecutivoActual: 1,
  iva: 19,

  piePaginaFactura: "",
  observacionesFactura: "",
};

const API_ORIGIN = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

export default function Empresa() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [pestana, setPestana] = useState("empresa");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const inputLogoRef = useRef(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  const logoSrc = form.logo
    ? form.logo.startsWith("http")
      ? form.logo
      : `${API_ORIGIN}${form.logo}`
    : "";

  // 👇 TOAST AUTO-CLOSE
  useEffect(() => {
    if (!mensaje && !error) return;

    const timer = setTimeout(() => {
      setMensaje("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [mensaje, error]);

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  async function cargarConfiguracion() {
    try {
      setCargando(true);
      setError("");

      const respuesta = await obtenerConfiguracion();

      const configuracion =
        respuesta?.configuracion || respuesta || {};

      setForm({
        ...FORM_INICIAL,
        ...configuracion,

        fechaResolucionDIAN:
          configuracion.fechaResolucionDIAN
            ? configuracion.fechaResolucionDIAN.substring(0, 10)
            : "",

        vigenciaDesde:
          configuracion.vigenciaDesde
            ? configuracion.vigenciaDesde.substring(0, 10)
            : "",

        vigenciaHasta:
          configuracion.vigenciaHasta
            ? configuracion.vigenciaHasta.substring(0, 10)
            : "",
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

  async function seleccionarLogo(event) {
    const archivo = event.target.files?.[0];

    if (!archivo) return;

    const formatosPermitidos = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!formatosPermitidos.includes(archivo.type)) {
      setError(
        "Solo se permiten imágenes PNG, JPG, JPEG o WEBP."
      );
      event.target.value = "";
      return;
    }

    if (archivo.size > 2 * 1024 * 1024) {
      setError("El logo no puede superar los 2 MB.");
      event.target.value = "";
      return;
    }

    try {
      setSubiendoLogo(true);
      setMensaje("");
      setError("");

      const respuesta = await subirLogoEmpresa(archivo);

      setForm((formActual) => ({
        ...formActual,
        logo: respuesta.logo,
      }));

      setMensaje(
        respuesta.mensaje ||
        "Logo actualizado correctamente."
      );
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No fue posible cargar el logo."
      );
    } finally {
      setSubiendoLogo(false);
      event.target.value = "";
    }
  }

  async function quitarLogo() {
    if (!window.confirm("¿Desea eliminar el logo?")) {
      return;
    }

    try {
      setMensaje("");
      setError("");

      const respuesta = await eliminarLogoEmpresa();

      setForm((actual) => ({
        ...actual,
        logo: "",
      }));

      setMensaje(respuesta.mensaje);

    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
        "No fue posible eliminar el logo."
      );
    }
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
        form.rangoAutorizadoHasta <
        form.rangoAutorizadoDesde
      ) {
        setError(
          "El rango autorizado hasta no puede ser menor que el rango autorizado desde."
        );
        return;
      }

      if (
        form.consecutivoActual <
          form.rangoAutorizadoDesde ||
        form.consecutivoActual >
          form.rangoAutorizadoHasta
      ) {
        setError(
          "El consecutivo actual debe estar dentro del rango autorizado."
        );
        return;
      }

      if (
        form.vigenciaDesde &&
        form.vigenciaHasta &&
        new Date(form.vigenciaHasta) <
          new Date(form.vigenciaDesde)
      ) {
        setError(
          "La fecha final de vigencia no puede ser anterior a la fecha inicial."
        );
        return;
      }

      const respuesta =
        await actualizarConfiguracion(form);

      const configuracion =
        respuesta?.configuracion || respuesta || {};

      setForm({
        ...FORM_INICIAL,
        ...configuracion,

        fechaResolucionDIAN:
          configuracion.fechaResolucionDIAN
            ? configuracion.fechaResolucionDIAN.substring(0, 10)
            : "",

        vigenciaDesde:
          configuracion.vigenciaDesde
            ? configuracion.vigenciaDesde.substring(0, 10)
            : "",

        vigenciaHasta:
          configuracion.vigenciaHasta
            ? configuracion.vigenciaHasta.substring(0, 10)
            : "",
      });

      setMensaje(
        respuesta?.mensaje ||
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

          {logoSrc && (
            <div className="empresa-logo-preview">
              <img
                src={logoSrc}
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

                <div className="empresa-field-full empresa-logo-field">
                  <span className="empresa-logo-label">
                    Logo de la empresa
                  </span>

                  <div className="empresa-logo-uploader">
                    <div className="empresa-logo-image">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt="Logo actual de la empresa"
                        />
                      ) : (
                        <span>Sin logo</span>
                      )}
                    </div>
                    <div className="empresa-logo-actions">

                      <input
                        ref={inputLogoRef}
                        type="file"
                        accept=".png,.jpg,.jpeg,.webp"
                        hidden
                        onChange={seleccionarLogo}
                      />

                      <div className="empresa-logo-buttons">

                        <button
                          type="button"
                          className="logo-upload-btn"
                          disabled={subiendoLogo}
                          onClick={() => inputLogoRef.current?.click()}
                        >
                          <img
                            src={subirArchivoIcon}
                            alt=""
                            className="logo-upload-icon"
                          />

                          <span>
                            {subiendoLogo
                              ? "Cargando..."
                              : logoSrc
                                ? "Cambiar logo"
                                : "Cargar logo"}
                          </span>
                        </button>

                        {logoSrc && (
                          <button
                            type="button"
                            className="empresa-action-icon empresa-delete-logo-button"
                            title="Quitar logo"
                            data-tooltip="Quitar logo"
                            aria-label="Quitar logo"
                            onClick={quitarLogo}
                          >
                            <img
                              src={eliminarLogoIcon}
                              alt=""
                              className="empresa-action-image"
                            />
                          </button>
                        )}

                      </div>

                      <small className="empresa-logo-note">
                        PNG, JPG, JPEG o WEBP. Tamaño máximo: 2 MB.
                      </small>

                    </div>

                  </div>
                </div>
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
                  IVA por defecto (%)
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
                  Número de resolución DIAN
                  <input
                    name="resolucionDIAN"
                    value={form.resolucionDIAN}
                    onChange={cambiar}
                    placeholder="Ejemplo: 18764012345678"
                  />
                </label>

                <label>
                  Fecha de resolución
                  <CalendarInput
                    name="fechaResolucionDIAN"
                    value={form.fechaResolucionDIAN || ""}
                    onChange={cambiar}
                    placeholder="Seleccionar fecha"
                  />
                </label>

                <label>
                  Vigencia desde
                  <CalendarInput
                    name="vigenciaDesde"
                    value={form.vigenciaDesde || ""}
                    onChange={cambiar}
                    placeholder="Seleccionar fecha"
                  />
                </label>

                <label>
                  Vigencia hasta
                  <CalendarInput
                    name="vigenciaHasta"
                    value={form.vigenciaHasta || ""}
                    onChange={cambiar}
                    placeholder="Seleccionar fecha"
                  />
                </label>

                <label>
                  Rango autorizado desde
                  <input
                    type="number"
                    name="rangoAutorizadoDesde"
                    min="1"
                    value={form.rangoAutorizadoDesde}
                    onChange={cambiar}
                  />
                </label>

                <label>
                  Rango autorizado hasta
                  <input
                    type="number"
                    name="rangoAutorizadoHasta"
                    min="1"
                    value={form.rangoAutorizadoHasta}
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
                className="empresa-action-icon empresa-save-button"
                type="submit"
                disabled={guardando}
                title={
                  guardando
                    ? "Guardando configuración"
                    : "Guardar configuración"
                }
                data-tooltip={
                  guardando
                    ? "Guardando configuración"
                    : "Guardar configuración"
                }
                aria-label="Guardar configuración"
              >
                <img
                  src={guardarIcon}
                  alt=""
                  className="empresa-action-image"
                />
              </button>
            </div>
          </form>
        )}

     
        <Toast
          mensaje={mensaje}
          error={error}
        />
      </SpatialCard>
    </AppLayout>
  );
}