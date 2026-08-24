import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "../context/AuthContext.jsx";

import SpatialCard from "../components/cards/SpatialCard.jsx";
import CambiarPasswordModal from "../components/CambiarPasswordModal.jsx";
import Toast from "../components/Toast.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import editarIcon from "../assets/icons/editar.png";
import resetearIcon from "../assets/icons/resetear.png";
import bloquearIcon from "../assets/icons/bloquear.png";
import desbloquearIcon from "../assets/icons/desbloquear.png";
import nuevoUsuarioIcon from "../assets/icons/nuevo-usuario.png";
import cambiarPasswordIcon from "../assets/icons/cambiar-password.png";
import guardarIcon from "../assets/icons/guardar.png";
import buscarIcon from "../assets/icons/buscar.png";
import cerrarIcon from "../assets/icons/cerrar.png";

import "../styles/usuarios.css";

import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  resetearPassword,
  cambiarPassword,
  cambiarEstadoUsuario,
  obtenerSiguienteCodigoUsuario,
} from "../services/usuario.service.js";

const FORM_INICIAL = {
  codigo: "",
  documento: "",
  nombres: "",
  apellidos: "",
  usuario: "",
  rol: "Empleado",
  password: "",
  repetirPassword: "",
};

export default function Usuarios() {
  const { usuario: usuarioSesion } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [usuarioPassword, setUsuarioPassword] = useState(null);

  const [modalBuscarAbierto, setModalBuscarAbierto] = useState(false);
  const [filtroBuscar, setFiltroBuscar] = useState("");
  const [campoBuscar, setCampoBuscar] = useState("todos");

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const modalBuscarRef = useRef(null);

  const [posicionModal, setPosicionModal] = useState({
    x: 0,
    y: 0,
  });

  const arrastreRef = useRef({
    activo: false,
    offsetX: 0,
    offsetY: 0,
  });

  // =========================================================
  // CARGAR USUARIOS Y OBTENER SIGUIENTE CÓDIGO
  // =========================================================
  useEffect(() => {
    async function iniciar() {
      await cargarUsuarios();

      try {
        const data =
          await obtenerSiguienteCodigoUsuario();

        setForm({
          ...FORM_INICIAL,
          codigo: data?.codigo || "",
        });
      } catch (err) {
        console.error(
          "No fue posible cargar el siguiente código:",
          err
        );
      }
    }

    iniciar();
  }, []);

  useEffect(() => {
    if (!mensaje && !error) return;

    const timer = setTimeout(() => {
      setMensaje("");
      setError("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [mensaje, error]);

  async function cargarUsuarios() {
    try {
      setCargando(true);
      setError("");

      const data = await listarUsuarios();
      setUsuarios(data);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los usuarios."
      );
    } finally {
      setCargando(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  // =========================================================
  // NUEVO USUARIO - CON CÓDIGO
  // =========================================================
  async function nuevoUsuario() {
    try {
      setUsuarioSeleccionado(null);
      setModoEdicion(false);
      setMensaje("");
      setError("");

      const data =
        await obtenerSiguienteCodigoUsuario();

      setForm({
        ...FORM_INICIAL,
        codigo: data?.codigo || "",
      });
    } catch (err) {
      console.error(err);

      setForm(FORM_INICIAL);

      setError(
        err.response?.data?.mensaje ||
          "No fue posible obtener el código del usuario."
      );
    }
  }

  function seleccionarUsuario(usuario) {
    setUsuarioSeleccionado(usuario);
    setMensaje("");
    setError("");
  }

  // =========================================================
  // SELECCIONAR DESDE BÚSQUEDA - CON CÓDIGO
  // =========================================================
  function seleccionarDesdeBusqueda(usuario) {
    setUsuarioSeleccionado(usuario);

    setForm({
      codigo: usuario.codigo || "",
      documento: usuario.documento || "",
      nombres: usuario.nombres || "",
      apellidos: usuario.apellidos || "",
      usuario: usuario.usuario || "",
      rol: usuario.rol || "Empleado",
      password: "",
      repetirPassword: "",
    });

    setModoEdicion(true);

    setModalBuscarAbierto(false);
    setFiltroBuscar("");

    setMensaje(`Usuario ${usuario.usuario} cargado correctamente.`);
    setError("");
  }

  // =========================================================
  // EDITAR USUARIO SELECCIONADO - CON CÓDIGO
  // =========================================================
  function editarUsuarioSeleccionado() {
    if (!usuarioSeleccionado) {
      setError("Seleccione primero un usuario.");
      return;
    }

    setForm({
      codigo: usuarioSeleccionado.codigo || "",
      documento: usuarioSeleccionado.documento || "",
      nombres: usuarioSeleccionado.nombres || "",
      apellidos: usuarioSeleccionado.apellidos || "",
      usuario: usuarioSeleccionado.usuario || "",
      rol: usuarioSeleccionado.rol || "Empleado",
      password: "",
      repetirPassword: "",
    });

    setModoEdicion(true);
  }

  function resetearUsuarioSeleccionado() {
    if (!usuarioSeleccionado) {
      setError("Seleccione primero un usuario.");
      return;
    }

    resetear(usuarioSeleccionado);
  }

  function cambiarPasswordSeleccionado() {
    if (!usuarioSeleccionado) {
      setError("Seleccione primero un usuario.");
      return;
    }

    abrirCambiarPassword(usuarioSeleccionado);
  }

  function cambiarEstadoSeleccionado() {
    if (!usuarioSeleccionado) {
      setError("Seleccione primero un usuario.");
      return;
    }

    cambiarEstado(usuarioSeleccionado);
  }

  function abrirCambiarPassword(usuario) {
    setUsuarioPassword(usuario);
    setModalPasswordAbierto(true);
    setMensaje("");
    setError("");
  }

  function cerrarCambiarPassword() {
    setModalPasswordAbierto(false);
    setUsuarioPassword(null);
  }

  function iniciarArrastreModal(event) {
    if (!modalBuscarRef.current) return;

    const rect = modalBuscarRef.current.getBoundingClientRect();

    arrastreRef.current = {
      activo: true,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    document.addEventListener("mousemove", moverModal);
    document.addEventListener("mouseup", terminarArrastreModal);
  }

  function moverModal(event) {
    if (!arrastreRef.current.activo) {
      return;
    }

    const modal = modalBuscarRef.current;

    if (!modal) return;

    const ancho = modal.offsetWidth;
    const alto = modal.offsetHeight;

    let x = event.clientX - arrastreRef.current.offsetX;
    let y = event.clientY - arrastreRef.current.offsetY;

    x = Math.max(10, Math.min(window.innerWidth - ancho - 10, x));
    y = Math.max(10, Math.min(window.innerHeight - alto - 10, y));

    setPosicionModal({
      x,
      y,
    });
  }

  function terminarArrastreModal() {
    arrastreRef.current.activo = false;

    document.removeEventListener("mousemove", moverModal);
    document.removeEventListener("mouseup", terminarArrastreModal);
  }

  function abrirBuscarUsuarios() {
    setFiltroBuscar("");
    setCampoBuscar("todos");

    setPosicionModal({
      x: Math.max(20, (window.innerWidth - 900) / 2),
      y: Math.max(20, (window.innerHeight - 560) / 2),
    });

    setModalBuscarAbierto(true);
  }

  async function guardarUsuario() {
    try {
      setError("");
      setMensaje("");

      if (!form.documento.trim()) {
        setError("El documento es obligatorio.");
        return;
      }

      if (!form.nombres.trim()) {
        setError("Los nombres son obligatorios.");
        return;
      }

      if (!form.apellidos.trim()) {
        setError("Los apellidos son obligatorios.");
        return;
      }

      if (!form.usuario.trim()) {
        setError("El usuario es obligatorio.");
        return;
      }

      if (!modoEdicion) {
        if (!form.password) {
          setError("La contraseña es obligatoria.");
          return;
        }

        if (form.password.length < 6) {
          setError("La contraseña debe tener mínimo 6 caracteres.");
          return;
        }

        if (form.password !== form.repetirPassword) {
          setError("Las contraseñas no coinciden.");
          return;
        }

        await crearUsuario(form);
        setMensaje("Usuario creado correctamente.");
      } else {
        await actualizarUsuario(usuarioSeleccionado._id, {
          documento: form.documento.trim(),
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          usuario: form.usuario.trim(),
          rol: form.rol,
        });

        setMensaje("Usuario actualizado correctamente.");
      }

      await cargarUsuarios();

      // =========================================================
      // OBTENER SIGUIENTE CÓDIGO DESPUÉS DE GUARDAR
      // =========================================================
      let siguienteCodigo = "";

      try {
        const data =
          await obtenerSiguienteCodigoUsuario();

        siguienteCodigo =
          data?.codigo || "";
      } catch (err) {
        console.error(
          "No fue posible obtener el siguiente código:",
          err
        );
      }

      setForm({
        ...FORM_INICIAL,
        codigo: siguienteCodigo,
      });

      setUsuarioSeleccionado(null);
      setModoEdicion(false);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible guardar el usuario."
      );
    }
  }

  async function guardarNuevaPassword(form) {
    try {
      setError("");
      setMensaje("");

      if (!usuarioPassword?._id) {
        setError("No se seleccionó un usuario.");
        return;
      }

      if (!form.password || !form.repetirPassword) {
        setError("Debes ingresar y repetir la nueva contraseña.");
        return;
      }

      if (form.password.length < 6) {
        setError("La contraseña debe tener mínimo 6 caracteres.");
        return;
      }

      if (form.password !== form.repetirPassword) {
        setError("Las contraseñas no coinciden.");
        return;
      }

      await cambiarPassword(usuarioPassword._id, form);

      setMensaje(
        `La contraseña de ${usuarioPassword.usuario} fue actualizada correctamente.`
      );

      cerrarCambiarPassword();
      setUsuarioSeleccionado(null);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cambiar la contraseña."
      );
    }
  }

  async function resetear(usuario) {
    const confirmar = window.confirm(
      `La contraseña de ${usuario.usuario} quedará en 123456. ¿Deseas continuar?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await resetearPassword(usuario._id);

      setMensaje(
        `La contraseña de ${usuario.usuario} fue restablecida a 123456.`
      );
      setUsuarioSeleccionado(null);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible restablecer la contraseña."
      );
    }
  }

  async function cambiarEstado(usuario) {
    const accion = usuario.estado === "Activo" ? "bloquear" : "desbloquear";

    const confirmar = window.confirm(
      `¿Deseas ${accion} al usuario ${usuario.usuario}?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await cambiarEstadoUsuario(usuario._id);

      setMensaje("Estado del usuario actualizado.");
      await cargarUsuarios();
      setUsuarioSeleccionado(null);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cambiar el estado del usuario."
      );
    }
  }

  // =========================================================
  // BÚSQUEDA - INCLUYE CÓDIGO
  // =========================================================
  const usuariosBusqueda = usuarios.filter((usuario) => {
    const texto = filtroBuscar.trim().toLowerCase();

    if (!texto) {
      return true;
    }

    const codigo =
      String(usuario.codigo || "")
        .toLowerCase();

    const documento =
      String(usuario.documento || "")
        .toLowerCase();

    const username =
      String(usuario.usuario || "")
        .toLowerCase();

    const nombres =
      String(usuario.nombres || "")
        .toLowerCase();

    const apellidos =
      String(usuario.apellidos || "")
        .toLowerCase();

    switch (campoBuscar) {
      case "codigo":
        return codigo.includes(texto);

      case "documento":
        return documento.includes(texto);

      case "usuario":
        return username.includes(texto);

      case "nombres":
        return nombres.includes(texto);

      case "apellidos":
        return apellidos.includes(texto);

      default:
        return (
          codigo.includes(texto) ||
          documento.includes(texto) ||
          username.includes(texto) ||
          nombres.includes(texto) ||
          apellidos.includes(texto)
        );
    }
  });

  return (
    <section className="usuarios-module">

      {/* =========================================
          CABECERA USUARIOS - CON MODULOS MENU
      ========================================= */}

      <div className="usuarios-title-bar">

        <div className="usuarios-title-left">

          <ModulosMenu />

          <div className="usuarios-title-info">
            <h2>Usuarios</h2>
          </div>

        </div>

      </div>

      {/* =========================================
          PANEL DE TRABAJO
      ========================================= */}

      <div className="usuarios-work-panel">

        {/* =========================================
            CABECERA DE ACCIONES
        ========================================= */}

        <div className="usuarios-actions-header">

          <div className="usuarios-actions-title">
            
          </div>

          <div className="usuarios-work-actions">

            {/* NUEVO */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={nuevoUsuario}
              data-tooltip="Nuevo usuario"
            >
              <img
                src={nuevoUsuarioIcon}
                alt=""
              />
            </button>

            {/* EDITAR */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={editarUsuarioSeleccionado}
              data-tooltip="Editar usuario"
              disabled={!usuarioSeleccionado}
            >
              <img
                src={editarIcon}
                alt=""
              />
            </button>

            {/* RESETEAR CONTRASEÑA */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={resetearUsuarioSeleccionado}
              data-tooltip="Resetear contraseña"
              disabled={!usuarioSeleccionado}
            >
              <img
                src={resetearIcon}
                alt=""
              />
            </button>

            {/* CAMBIAR CONTRASEÑA */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={cambiarPasswordSeleccionado}
              data-tooltip="Cambiar contraseña"
              disabled={!usuarioSeleccionado}
            >
              <img
                src={cambiarPasswordIcon}
                alt=""
              />
            </button>

            {/* BLOQUEAR / DESBLOQUEAR */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={cambiarEstadoSeleccionado}
              data-tooltip={
                usuarioSeleccionado?.estado === "Activo"
                  ? "Bloquear usuario"
                  : "Desbloquear usuario"
              }
              disabled={
                !usuarioSeleccionado ||
                usuarioSesion?._id ===
                  usuarioSeleccionado?._id
              }
            >
              <img
                src={
                  usuarioSeleccionado?.estado === "Activo"
                    ? bloquearIcon
                    : desbloquearIcon
                }
                alt=""
              />
            </button>

            {/* BUSCAR */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={abrirBuscarUsuarios}
              data-tooltip="Buscar usuario"
            >
              <img
                src={buscarIcon}
                alt=""
              />
            </button>

            {/* GUARDAR */}

            <button
              type="button"
              className="usuarios-work-btn"
              onClick={guardarUsuario}
              data-tooltip={
                modoEdicion
                  ? "Guardar cambios"
                  : "Guardar usuario"
              }
            >
              <img
                src={guardarIcon}
                alt=""
              />
            </button>

          </div>

        </div>

        {/* =========================================
            CAMPOS DEL FORMULARIO
        ========================================= */}

        <div className="usuarios-form-grid">

          {/* =========================================
              CÓDIGO - CAMPO (readonly)
          ========================================= */}

          <div className="usuarios-field usuarios-field-codigo">
            <label>Código</label>

            <input
              type="text"
              name="codigo"
              value={form.codigo}
              readOnly
              placeholder=""
            />
          </div>

          {/* =========================================
              DOCUMENTO
          ========================================= */}

          <div className="usuarios-field usuarios-field-documento">
            <label>Documento *</label>

            <input
              type="text"
              name="documento"
              value={form.documento}
              onChange={handleChange}
              placeholder=""
            />
          </div>

          {/* =========================================
              NOMBRES
          ========================================= */}

          <div className="usuarios-field usuarios-field-nombres">
            <label>Nombres *</label>

            <input
              name="nombres"
              value={form.nombres}
              onChange={handleChange}
              placeholder=""
            />
          </div>

          {/* =========================================
              APELLIDOS
          ========================================= */}

          <div className="usuarios-field usuarios-field-apellidos">
            <label>Apellidos *</label>

            <input
              name="apellidos"
              value={form.apellidos}
              onChange={handleChange}
              placeholder=""
            />
          </div>

          {/* =========================================
              USUARIO
          ========================================= */}

          <div className="usuarios-field usuarios-field-usuario">
            <label>Usuario *</label>

            <input
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              placeholder=""
            />
          </div>

          {/* =========================================
              ROL
          ========================================= */}

          <div className="usuarios-field usuarios-field-rol">
            <label>Rol</label>

            <select
              name="rol"
              value={form.rol}
              onChange={handleChange}
            >
              <option value="Administrador">
                Administrador
              </option>

              <option value="Empleado">
                Empleado
              </option>
            </select>
          </div>

          {/* =========================================
              CONTRASEÑAS - SOLO EN MODO NUEVO
          ========================================= */}

          {!modoEdicion && (
            <>
              <div className="usuarios-field usuarios-field-password">
                <label>Contraseña *</label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder=""
                />
              </div>

              <div className="usuarios-field usuarios-field-password">
                <label>Repetir contraseña *</label>

                <input
                  type="password"
                  name="repetirPassword"
                  value={form.repetirPassword}
                  onChange={handleChange}
                  placeholder=""
                />
              </div>
            </>
          )}

        </div>

        {/* =========================================
            ÚLTIMO ACCESO - DENTRO DEL PANEL
        ========================================= */}

        {modoEdicion && usuarioSeleccionado && (
          <div className="usuarios-access-info">
            <div className="usuarios-access-header">
              <center>Último acceso</center>
            </div>

            <div className="usuarios-access-grid">
              <div className="usuarios-access-field">
                <span>Fecha</span>
                <strong>
                  {usuarioSeleccionado.ultimoIngreso
                    ? new Date(usuarioSeleccionado.ultimoIngreso).toLocaleDateString("es-CO")
                    : "Sin ingresos"}
                </strong>
              </div>

              <div className="usuarios-access-field">
                <span>Hora</span>
                <strong>
                  {usuarioSeleccionado.ultimoIngreso
                    ? new Date(usuarioSeleccionado.ultimoIngreso).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </strong>
              </div>
            </div>
          </div>
        )}

      </div>

      <Toast mensaje={mensaje} error={error} />

      {/* =========================================
          MODAL BUSCAR USUARIOS
      ========================================= */}

      {modalBuscarAbierto && (
        <div
          className="usuarios-search-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalBuscarAbierto(false);
            }
          }}
        >
          <div
            ref={modalBuscarRef}
            className="usuarios-search-modal"
            style={{
              left: posicionModal.x,
              top: posicionModal.y,
            }}
          >
            {/* CABECERA */}
            <div
              className="usuarios-search-modal-header"
              onMouseDown={iniciarArrastreModal}
            >
              <h3>Buscar usuarios</h3>
              <button
                type="button"
                className="usuarios-search-modal-close"
                onMouseDown={(event) => event.stopPropagation()}
                onClick={() => setModalBuscarAbierto(false)}
                data-tooltip="Cerrar"
                aria-label="Cerrar"
              >
                <img src={cerrarIcon} alt="" />
              </button>
            </div>

            {/* BUSCADOR */}
            <div className="usuarios-search-modal-filters">
              <select
                value={campoBuscar}
                onChange={(event) => setCampoBuscar(event.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="codigo">Código</option>
                <option value="documento">Documento</option>
                <option value="usuario">Usuario</option>
                <option value="nombres">Nombres</option>
                <option value="apellidos">Apellidos</option>
              </select>

              <div className="usuarios-search-modal-input">
                <img src={buscarIcon} alt="" />
                <input
                  type="search"
                  value={filtroBuscar}
                  onChange={(event) => setFiltroBuscar(event.target.value)}
                  placeholder="Buscar usuario..."
                  autoFocus
                />
                {filtroBuscar && (
                  <button
                    type="button"
                    onClick={() => setFiltroBuscar("")}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* RESULTADOS */}
            <div className="usuarios-search-modal-table-wrap">
              <table className="usuarios-search-modal-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Documento</th>
                    <th>Usuario</th>
                    <th>Nombre completo</th>
                    <th>Rol</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosBusqueda.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="usuarios-search-empty">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  ) : (
                    usuariosBusqueda.map((usuario) => (
                      <tr
                        key={usuario._id}
                        onDoubleClick={() => seleccionarDesdeBusqueda(usuario)}
                      >
                        <td>
                          <strong className="usuarios-modal-codigo">
                            {usuario.codigo || "Sin código"}
                          </strong>
                        </td>

                        <td>
                          <span className="usuarios-modal-documento">
                            {usuario.documento || "-"}
                          </span>
                        </td>

                        <td>
                          <strong className="usuarios-modal-username">
                            {usuario.usuario}
                          </strong>
                        </td>

                        <td>
                          <div className="usuarios-modal-nombre">
                            <strong>{usuario.nombres}</strong>
                            <span>{usuario.apellidos}</span>
                          </div>
                        </td>

                        <td>
                          <span className="usuarios-modal-rol">
                            {usuario.rol}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              usuario.estado === "Activo"
                                ? "usuarios-modal-status active"
                                : "usuarios-modal-status blocked"
                            }
                          >
                            <i></i>
                            {usuario.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <CambiarPasswordModal
        abierto={modalPasswordAbierto}
        usuario={usuarioPassword}
        onClose={cerrarCambiarPassword}
        onGuardar={guardarNuevaPassword}
      />

    </section>
  );
}