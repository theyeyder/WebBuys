import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Download, FileSpreadsheet, Printer, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  consultarReporteUsuarios,
  descargarReporteUsuariosExcel,
} from "../services/reporteUsuarios.service.js";
import "../styles/reporte-usuarios.css";

const NOMBRES_ACCIONES = {
  ver: "Ver", crear: "Crear", editar: "Editar", eliminar: "Eliminar",
  imprimir: "Imprimir", descontar: "Descontar", anular: "Anular",
  cambiarEstado: "Cambiar estado", registrarMovimientos: "Movimientos",
};
const TEXTO_SECCION = {
  usuarios: "Usuarios", perfiles: "Perfiles", permisos: "Permisos",
};

function fechaColombia(valor) {
  if (!valor) return "Nunca";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(fecha);
}

function textoPerfil(usuario) {
  if (usuario.rol === "Administrador") return "Acceso total";
  return (usuario.perfiles || []).map((perfil) => perfil.nombre).join(" / ") || "Sin perfil";
}

function limpiarCeldaCSV(valor) {
  const texto = String(valor ?? "");
  // Evita que Excel interprete nombres ingresados por usuarios como fórmulas.
  const seguro = /^[\s]*[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
}

function descargarCSV(nombre, encabezados, filas) {
  const contenido = [encabezados, ...filas].map((fila) => fila.map(limpiarCeldaCSV).join(";")).join("\r\n");
  const archivo = new Blob(["\ufeff", contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const ReporteUsuarios = forwardRef(function ReporteUsuarios({ autoCargar = true, onEstado }, ref) {
  const { usuario: sesion } = useAuth();
  const contenedorRef = useRef(null);
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");
  const [seccion, setSeccion] = useState("usuarios");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const [perfilId, setPerfilId] = useState("");
  const [origenPermisos, setOrigenPermisos] = useState("usuario");
  const [usuarioId, setUsuarioId] = useState("");
  const [perfilReporteId, setPerfilReporteId] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const respuesta = await consultarReporteUsuarios();
      if (!Array.isArray(respuesta?.usuarios) || !Array.isArray(respuesta?.perfiles)) {
        throw new Error("El servidor devolvió un reporte incompleto.");
      }
      setDatos(respuesta);
    } catch (err) {
      setError(err.response?.data?.mensaje || err.message || "No fue posible cargar el reporte.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { if (autoCargar) cargar(); }, [autoCargar]);

  useEffect(() => {
    onEstado?.({ cargando, disponible: Boolean(datos), exportando, error });
  }, [cargando, datos, exportando, error, onEstado]);

  const usuarios = useMemo(() => {
    if (!datos) return [];
    const q = busqueda.trim().toLocaleLowerCase("es");
    return datos.usuarios.filter((u) => {
      if (estado && u.estado !== estado) return false;
      if (perfilId && !(u.perfiles || []).some((p) => p.id === perfilId)) return false;
      if (!q) return true;
      return [u.codigo, u.nombre, u.usuario, u.rol, ...(u.perfiles || []).map((p) => p.nombre)]
        .some((valor) => String(valor || "").toLocaleLowerCase("es").includes(q));
    });
  }, [datos, busqueda, estado, perfilId]);

  const perfiles = useMemo(() => {
    if (!datos) return [];
    const q = busqueda.trim().toLocaleLowerCase("es");
    return datos.perfiles.filter((p) => {
      if (estado && p.estado !== estado) return false;
      if (perfilId && p.id !== perfilId) return false;
      if (!q) return true;
      return [p.codigo, p.nombre, p.descripcion]
        .some((valor) => String(valor || "").toLocaleLowerCase("es").includes(q));
    });
  }, [datos, busqueda, estado, perfilId]);

  const filasPermisos = useMemo(() => {
    if (!datos) return [];
    const porUsuario = origenPermisos === "usuario";
    const entidades = porUsuario
      ? usuarios.filter((u) => !usuarioId || u.id === usuarioId)
      : perfiles.filter((p) => !perfilReporteId || p.id === perfilReporteId);
    return entidades.flatMap((entidad) => {
      const permisosPerfil = new Map((porUsuario ? [] : entidad.permisos || []).map((p) => [p.modulo, p]));
      const overrides = new Map((porUsuario ? entidad.personalizados || [] : []).map((p) => [p.modulo, p]));
      return (datos.modulos || []).map((modulo) => {
        const excepciones = overrides.get(modulo.clave) || {};
        return {
          id: `${entidad.id}-${modulo.clave}`,
          codigo: entidad.codigo,
          nombre: entidad.nombre,
          referencia: porUsuario ? entidad.usuario : entidad.estado,
          modulo: modulo.nombre,
          grupo: modulo.grupo,
          permisos: porUsuario ? entidad.permisos?.[modulo.clave] || {} : permisosPerfil.get(modulo.clave) || {},
          personalizados: excepciones,
        };
      });
    });
  }, [datos, usuarios, perfiles, origenPermisos, usuarioId, perfilReporteId]);

  const acciones = datos?.acciones || [];
  const totalPersonalizados = (datos?.usuarios || []).filter((u) => (u.personalizados || []).length > 0).length;
  const filtrosActivos = Boolean(busqueda || estado || perfilId || usuarioId || perfilReporteId);

  function prepararCSV() {
    const fecha = new Date().toISOString().slice(0, 10);
    if (seccion === "usuarios") {
      descargarCSV(`WebBuys_Usuarios_${fecha}.csv`,
        ["Código", "Nombre", "Usuario", "Rol", "Estado", "Perfiles", "Último ingreso"],
        usuarios.map((u) => [u.codigo, u.nombre, u.usuario, u.rol, u.estado, textoPerfil(u), fechaColombia(u.ultimoIngreso)]));
    } else if (seccion === "perfiles") {
      descargarCSV(`WebBuys_Perfiles_${fecha}.csv`,
        ["Código", "Perfil", "Descripción", "Estado", "Tipo", "Usuarios asignados"],
        perfiles.map((p) => [p.codigo, p.nombre, p.descripcion, p.estado, p.esSistema ? "Sistema" : "Personalizado", p.usuariosAsignados]));
    } else {
      descargarCSV(`WebBuys_Permisos_${origenPermisos}_${fecha}.csv`,
        ["Código", "Nombre", "Usuario / Estado", "Grupo", "Módulo", ...acciones.map((a) => NOMBRES_ACCIONES[a] || a), "Excepciones individuales"],
        filasPermisos.map((fila) => [
          fila.codigo, fila.nombre, fila.referencia, fila.grupo, fila.modulo,
          ...acciones.map((a) => fila.permisos[a] === true ? "Sí" : "No"),
          acciones.filter((a) => typeof fila.personalizados[a] === "boolean").length,
        ]));
    }
  }

  async function prepararExcel() {
    try {
      setExportando(true);
      setError("");
      const blob = await descargarReporteUsuariosExcel({
        q: busqueda.trim(), estado, perfilId, usuarioId, perfilReporteId,
      });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = `WebBuys_Reporte_Usuarios_Perfiles_Permisos_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError("No fue posible exportar Excel. Verifica que el backend esté reiniciado.");
    } finally {
      setExportando(false);
    }
  }

  // La barra principal de Informes usa las mismas acciones para todos los tipos.
  // El PDF de este reporte se obtiene mediante la impresión nativa del navegador.
  function prepararPDF() {
    if (!datos) {
      setError("Genera primero la vista previa para imprimir este reporte.");
      return;
    }
    const estiloImpresion = document.createElement("style");
    estiloImpresion.textContent = "@page { size: A4 landscape; margin: 10mm; }";
    document.head.appendChild(estiloImpresion);
    const limpiar = () => {
      estiloImpresion.remove();
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    try {
      window.print();
    } finally {
      window.setTimeout(limpiar, 60000);
    }
  }

  function prepararHTML() {
    const tabla = contenedorRef.current?.querySelector(".rpu-table");
    if (!datos || !tabla) {
      setError("Genera primero la vista previa para abrir el reporte HTML.");
      return;
    }
    const titulo = `WebBuys · Reporte de ${TEXTO_SECCION[seccion]}`;
    const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title><style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#19362e;padding:28px;margin:0}
  h1{font-size:22px;margin:0 0 8px}p{color:#536b62;margin:0 0 24px;font-size:13px}
  .rpu-table{width:100%;border-collapse:collapse;font-size:12px}
  .rpu-table th{background:#e9f4ee;color:#285447;text-align:left;padding:10px 8px;border:1px solid #d5e4dc}
  .rpu-table td{padding:9px 8px;border:1px solid #e2eae6;vertical-align:top}
  .rpu-table small{display:block;color:#687c72}.rpu-permission-cell{text-align:center}
  .rpu-permission.yes{color:#0d7b4d;font-weight:bold}.rpu-permission.no{color:#98a6a0}
  .rpu-status.active{color:#0d7b4d}.rpu-status.inactive{color:#a15a31}
  @media print{@page{size:landscape;margin:10mm}body{padding:0}tr{break-inside:avoid}}
</style></head><body>
<h1>${titulo}</h1>
<p>Información actual · Generado: ${fechaColombia(datos.generadoEn)} · Sección: ${TEXTO_SECCION[seccion]}</p>
${tabla.outerHTML}
</body></html>`;
    const ventana = window.open("", "_blank");
    if (!ventana) {
      setError("El navegador bloqueó la ventana HTML. Permite las ventanas emergentes de WebBuys.");
      return;
    }
    ventana.opener = null;
    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  }

  useImperativeHandle(ref, () => ({
    actualizar: cargar,
    excel: prepararExcel,
    pdf: prepararPDF,
    html: prepararHTML,
  }));

  if (sesion?.rol !== "Administrador") {
    return <div className="rpu-acceso-denegado">Acceso exclusivo del Administrador.</div>;
  }

  return (
    <div className={`rpu-page rpu-page--integrado ${autoCargar ? "" : "rpu-page--generador"}`}>
      <div className="rpu-container" ref={contenedorRef}>
        <div className="rpu-print-header">
          <h1>WebBuys · {TEXTO_SECCION[seccion]}</h1>
          <p>Generado: {fechaColombia(datos?.generadoEn)} · {seccion === "permisos" ? `Permisos por ${origenPermisos}` : "Reporte administrativo"}</p>
        </div>

        {autoCargar && <div className="rpu-intro rpu-no-print">
          <div>
            <h2>Reporte de usuarios, perfiles y permisos</h2>
            <p>Información actual de los usuarios y sus permisos. Este reporte es de solo lectura.</p>
          </div>
          <button type="button" className="rpu-btn rpu-btn-outline" onClick={cargar} disabled={cargando}>
            <RefreshCw size={16} /> {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>}

        {error && <div role="alert" className="rpu-error rpu-no-print">{error}</div>}

        {datos && <>
          <div className="rpu-stats rpu-no-print">
            <div className="rpu-stat"><UsersRound size={20} /><div><strong>{datos.usuarios.length}</strong><span>Usuarios registrados</span></div></div>
            <div className="rpu-stat"><ShieldCheck size={20} /><div><strong>{datos.perfiles.length}</strong><span>Perfiles configurados</span></div></div>
            <div className="rpu-stat"><UsersRound size={20} /><div><strong>{datos.usuarios.filter((u) => u.estado === "Activo").length}</strong><span>Usuarios activos</span></div></div>
            <div className="rpu-stat"><ShieldCheck size={20} /><div><strong>{totalPersonalizados}</strong><span>Con permisos individuales</span></div></div>
          </div>

          <div className="rpu-panel">
            <div className="rpu-tabs rpu-no-print" role="tablist" aria-label="Secciones del reporte">
              {Object.entries(TEXTO_SECCION).map(([clave, nombre]) => (
                <button type="button" role="tab" aria-selected={seccion === clave}
                  className={seccion === clave ? "rpu-tab active" : "rpu-tab"}
                  key={clave} onClick={() => setSeccion(clave)}>{nombre}</button>
              ))}
            </div>

            <div className="rpu-filtros rpu-no-print">
              <label className="rpu-filter rpu-filter-search">
                <span>Buscar</span>
                <input type="search" placeholder="Código, nombre, usuario o perfil" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </label>
              <label className="rpu-filter">
                <span>Estado</span>
                <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                  <option value="">Todos</option><option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option><option value="Bloqueado">Bloqueado</option>
                </select>
              </label>
              <label className="rpu-filter">
                <span>Perfil</span>
                <select value={perfilId} onChange={(e) => setPerfilId(e.target.value)}>
                  <option value="">Todos los perfiles</option>
                  {datos.perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </label>
              {seccion === "permisos" && <>
                <label className="rpu-filter">
                  <span>Mostrar permisos de</span>
                  <select value={origenPermisos} onChange={(e) => setOrigenPermisos(e.target.value)}>
                    <option value="usuario">Usuarios (efectivos)</option>
                    <option value="perfil">Perfiles (configurados)</option>
                  </select>
                </label>
                {origenPermisos === "usuario" ?
                  <label className="rpu-filter"><span>Usuario específico</span>
                    <select value={usuarioId} onChange={(e) => setUsuarioId(e.target.value)}>
                      <option value="">Todos los usuarios</option>
                      {datos.usuarios.map((u) => <option key={u.id} value={u.id}>{u.codigo} · {u.nombre}</option>)}
                    </select>
                  </label> :
                  <label className="rpu-filter"><span>Perfil específico</span>
                    <select value={perfilReporteId} onChange={(e) => setPerfilReporteId(e.target.value)}>
                      <option value="">Todos los perfiles</option>
                      {datos.perfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </label>}
              </>}
            </div>

            <div className="rpu-toolbar rpu-no-print">
              <span className="rpu-counter">
                {seccion === "usuarios" ? `${usuarios.length} usuario(s)` : seccion === "perfiles" ? `${perfiles.length} perfil(es)` : `${filasPermisos.length} filas de permisos`}
              </span>
              <div className="rpu-toolbar-actions">
                {filtrosActivos && <button type="button" className="rpu-btn rpu-btn-plain" onClick={() => { setBusqueda(""); setEstado(""); setPerfilId(""); setUsuarioId(""); setPerfilReporteId(""); }}>Limpiar filtros</button>}
                <button type="button" className="rpu-btn rpu-btn-outline" onClick={prepararCSV}><Download size={16} /> CSV visible</button>
                {autoCargar && <>
                  <button type="button" className="rpu-btn rpu-btn-outline" onClick={prepararExcel} disabled={exportando}><FileSpreadsheet size={16} /> {exportando ? "Generando..." : "Excel completo"}</button>
                  <button type="button" className="rpu-btn rpu-btn-primary" onClick={prepararPDF}><Printer size={16} /> Imprimir</button>
                </>}
              </div>
            </div>

            <div className="rpu-table-wrap">
              {seccion === "usuarios" && <table className="rpu-table">
                <thead><tr><th>Código</th><th>Nombre completo</th><th>Usuario</th><th>Rol</th><th>Estado</th><th>Perfil(es)</th><th>Último ingreso</th></tr></thead>
                <tbody>{usuarios.map((u) => <tr key={u.id}>
                  <td className="rpu-code">{u.codigo || "—"}</td><td><strong>{u.nombre}</strong></td><td>{u.usuario}</td><td>{u.rol}</td>
                  <td><span className={`rpu-status ${u.estado === "Activo" ? "active" : "inactive"}`}>{u.estado}</span></td>
                  <td>{textoPerfil(u)}</td><td>{fechaColombia(u.ultimoIngreso)}</td>
                </tr>)}</tbody>
              </table>}
              {seccion === "perfiles" && <table className="rpu-table">
                <thead><tr><th>Código</th><th>Nombre del perfil</th><th>Descripción</th><th>Estado</th><th>Tipo</th><th>Usuarios asignados</th></tr></thead>
                <tbody>{perfiles.map((p) => <tr key={p.id}>
                  <td className="rpu-code">{p.codigo}</td><td><strong>{p.nombre}</strong></td><td>{p.descripcion || "—"}</td>
                  <td><span className={`rpu-status ${p.estado === "Activo" ? "active" : "inactive"}`}>{p.estado}</span></td>
                  <td>{p.esSistema ? "Sistema" : "Personalizado"}</td><td>{p.usuariosAsignados}</td>
                </tr>)}</tbody>
              </table>}
              {seccion === "permisos" && <table className="rpu-table rpu-permissions-table">
                <thead><tr>
                  <th>Código</th><th>{origenPermisos === "usuario" ? "Usuario" : "Perfil"}</th><th>Módulo</th>
                  {acciones.map((a) => <th key={a} title={NOMBRES_ACCIONES[a] || a}>{NOMBRES_ACCIONES[a] || a}</th>)}
                  {origenPermisos === "usuario" && <th>Excepciones</th>}
                </tr></thead>
                <tbody>{filasPermisos.map((fila) => <tr key={fila.id}>
                  <td className="rpu-code">{fila.codigo || "—"}</td>
                  <td><strong>{fila.nombre}</strong><small>{fila.referencia}</small></td>
                  <td><strong>{fila.modulo}</strong><small>{fila.grupo}</small></td>
                  {acciones.map((a) => <td key={a} className="rpu-permission-cell">
                    <span className={`rpu-permission ${fila.permisos[a] === true ? "yes" : "no"} ${typeof fila.personalizados[a] === "boolean" ? "custom" : ""}`}
                      title={typeof fila.personalizados[a] === "boolean" ? "Permiso individual personalizado" : ""}>
                      {fila.permisos[a] === true ? "✓" : "—"}
                    </span>
                  </td>)}
                  {origenPermisos === "usuario" && <td className="rpu-permission-cell">
                    {acciones.filter((a) => typeof fila.personalizados[a] === "boolean").length || "—"}
                  </td>}
                </tr>)}</tbody>
              </table>}
              {(seccion === "usuarios" && usuarios.length === 0 || seccion === "perfiles" && perfiles.length === 0 || seccion === "permisos" && filasPermisos.length === 0) &&
                <div className="rpu-empty">No hay resultados con los filtros seleccionados.</div>}
            </div>
          </div>
          <p className="rpu-note rpu-no-print">
            Los permisos por usuario muestran el acceso efectivo, combinando todos sus perfiles y excepciones individuales. Los permisos por perfil muestran su configuración original. El Administrador tiene acceso total.
          </p>
        </>}
        {autoCargar && cargando && !datos && <div className="rpu-loading">Cargando reporte de usuarios...</div>}
      </div>
    </div>
  );
});

export default ReporteUsuarios;
