import {
  useEffect,
  useRef,
  useState,
} from "react";

import useAutoRefresh
  from "../hooks/useAutoRefresh.js";

import { useAuth } from "../context/AuthContext.jsx";

import SpatialCard from "../components/cards/SpatialCard.jsx";
import CambiarPasswordModal from "../components/CambiarPasswordModal.jsx";
import Toast from "../components/Toast.jsx";
import ModulosMenu from "../components/ModulosMenu.jsx";

import editarIcon from "../assets/icons/editar.webp";
import resetearIcon from "../assets/icons/resetear.webp";
import bloquearIcon from "../assets/icons/bloquear.webp";
import desbloquearIcon from "../assets/icons/desbloquear.webp";
import nuevoUsuarioIcon from "../assets/icons/nuevo-usuario.webp";
import cambiarPasswordIcon from "../assets/icons/cambiar-password.webp";
import guardarIcon from "../assets/icons/guardar.webp";
import buscarIcon from "../assets/icons/buscar.webp";
import cerrarIcon from "../assets/icons/cerrar.webp";

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

import {
  listarPerfiles,
  listarModulosPermisos,
  obtenerPermisosUsuario,
  actualizarPermisosPersonalizados,
} from "../services/perfilUsuario.service.js";

const FORM_INICIAL = {
  codigo: "",
  documento: "",
  nombres: "",
  apellidos: "",
  usuario: "",
  rol: "Empleado",
  perfilIds: [],
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

  const [perfiles, setPerfiles] = useState([]);
  const [catalogoPermisos, setCatalogoPermisos] = useState({
    acciones: [],
    modulos: [],
  });

  /*
    Permisos extras: son excepciones SOLO para este usuario.
    No modifican los perfiles Bodega, Caja, Ventas, etc.
  */
  const [permisosExtras, setPermisosExtras] = useState({});
  const [perfilPermisosActivo, setPerfilPermisosActivo] = useState("combinados");
  const [cargandoPermisosUsuario, setCargandoPermisosUsuario] = useState(false);

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
      await cargarPerfiles();

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

  useAutoRefresh(
    () => cargarUsuarios(),
    {
      intervalMs: 0,
      shouldRefresh: ({ url = "" } = {}) =>
        String(url).includes("/usuarios"),
    }
  );

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

  async function cargarPerfiles() {
    try {
      const [listaPerfiles, catalogo] = await Promise.all([
        listarPerfiles(),
        listarModulosPermisos(),
      ]);

      setPerfiles(
        Array.isArray(listaPerfiles)
          ? listaPerfiles
          : []
      );

      setCatalogoPermisos({
        acciones: Array.isArray(catalogo?.acciones)
          ? catalogo.acciones
          : [],
        modulos: Array.isArray(catalogo?.modulos)
          ? catalogo.modulos
          : [],
      });
    } catch (err) {
      console.error("No fue posible cargar perfiles y permisos:", err);

      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los perfiles de usuario."
      );
    }
  }

  function normalizarPermisosExtras(personalizados = []) {
    const mapa = {};

    for (const fila of Array.isArray(personalizados) ? personalizados : []) {
      const modulo = String(fila?.modulo || "").trim();
      if (!modulo) continue;

      for (const accion of catalogoPermisos.acciones) {
        if (fila?.[accion] === true) {
          if (!mapa[modulo]) mapa[modulo] = {};
          mapa[modulo][accion] = true;
        }
      }
    }

    return mapa;
  }

  async function cargarPermisosPersonalizadosUsuario(usuarioId) {
    if (!usuarioId) {
      setPermisosExtras({});
      return;
    }

    try {
      setCargandoPermisosUsuario(true);

      const data = await obtenerPermisosUsuario(usuarioId);
      setPermisosExtras(
        normalizarPermisosExtras(data?.personalizados)
      );
    } catch (err) {
      console.error("No fue posible cargar los permisos personalizados:", err);
      setPermisosExtras({});
      setError(
        err.response?.data?.mensaje ||
          "No fue posible cargar los permisos personalizados del usuario."
      );
    } finally {
      setCargandoPermisosUsuario(false);
    }
  }

  function construirPayloadPermisosExtras() {
    return Object.entries(permisosExtras)
      .map(([modulo, acciones]) => {
        const fila = { modulo };
        let tieneExtras = false;

        for (const accion of catalogoPermisos.acciones) {
          if (acciones?.[accion] === true) {
            fila[accion] = true;
            tieneExtras = true;
          }
        }

        return tieneExtras ? fila : null;
      })
      .filter(Boolean);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "rol" && value === "Administrador") {
      setPermisosExtras({});
      setPerfilPermisosActivo("combinados");
    }

    setForm((actual) => {
      if (name === "rol") {
        return {
          ...actual,
          rol: value,
          perfilIds:
            value === "Administrador"
              ? []
              : actual.perfilIds,
        };
      }

      return {
        ...actual,
        [name]: value,
      };
    });
  }

  function obtenerPerfilIdsUsuario(usuario = {}) {
    if (Array.isArray(usuario?.perfilIds)) {
      return usuario.perfilIds.filter(Boolean);
    }

    if (Array.isArray(usuario?.perfiles)) {
      return usuario.perfiles
        .map((perfil) => perfil?.id)
        .filter(Boolean);
    }

    const unico =
      usuario?.perfilId ||
      usuario?.perfil?.id ||
      "";

    return unico ? [unico] : [];
  }

  function alternarPerfil(perfilId) {
    setForm((actual) => {
      const seleccionados = Array.isArray(actual.perfilIds)
        ? actual.perfilIds
        : [];

      const existe = seleccionados.includes(perfilId);

      return {
        ...actual,
        perfilIds: existe
          ? seleccionados.filter((id) => id !== perfilId)
          : [...seleccionados, perfilId],
      };
    });
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
      setPermisosExtras({});
      setPerfilPermisosActivo("combinados");

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
  async function seleccionarDesdeBusqueda(usuario) {
    setUsuarioSeleccionado(usuario);

    setForm({
      codigo: usuario.codigo || "",
      documento: usuario.documento || "",
      nombres: usuario.nombres || "",
      apellidos: usuario.apellidos || "",
      usuario: usuario.usuario || "",
      rol: usuario.rol || "Empleado",
      perfilIds: obtenerPerfilIdsUsuario(usuario),
      password: "",
      repetirPassword: "",
    });

    setModoEdicion(true);
    setPerfilPermisosActivo("combinados");
    await cargarPermisosPersonalizadosUsuario(usuario._id || usuario.id);

    setModalBuscarAbierto(false);
    setFiltroBuscar("");

    setMensaje(`Usuario ${usuario.usuario} cargado correctamente.`);
    setError("");
  }

  // =========================================================
  // EDITAR USUARIO SELECCIONADO - CON CÓDIGO
  // =========================================================
  async function editarUsuarioSeleccionado() {
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
      perfilIds: obtenerPerfilIdsUsuario(usuarioSeleccionado),
      password: "",
      repetirPassword: "",
    });

    setModoEdicion(true);
    setPerfilPermisosActivo("combinados");
    await cargarPermisosPersonalizadosUsuario(
      usuarioSeleccionado._id || usuarioSeleccionado.id
    );
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

      if (
        form.rol === "Empleado" &&
        (!Array.isArray(form.perfilIds) || form.perfilIds.length === 0)
      ) {
        setError(
          "Seleccione al menos un perfil para el usuario empleado."
        );
        return;
      }

      let usuarioIdGuardado =
        usuarioSeleccionado?._id ||
        usuarioSeleccionado?.id ||
        null;

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

        const respuesta = await crearUsuario({
          ...form,
          perfilIds:
            form.rol === "Empleado"
              ? form.perfilIds
              : [],
        });

        usuarioIdGuardado =
          respuesta?.usuario?._id ||
          respuesta?.usuario?.id ||
          respuesta?._id ||
          respuesta?.id ||
          null;

        if (form.rol === "Empleado" && usuarioIdGuardado) {
          await actualizarPermisosPersonalizados(
            usuarioIdGuardado,
            construirPayloadPermisosExtras()
          );
        }

        setMensaje("Usuario y permisos guardados correctamente.");
      } else {
        /*
          Si se convierte un Empleado en Administrador, limpiamos antes
          sus permisos personalizados para que no queden excepciones antiguas.
        */
        if (
          form.rol === "Administrador" &&
          usuarioSeleccionado?.rol === "Empleado" &&
          usuarioIdGuardado
        ) {
          await actualizarPermisosPersonalizados(
            usuarioIdGuardado,
            []
          );
        }

        const respuesta = await actualizarUsuario(usuarioIdGuardado, {
          documento: form.documento.trim(),
          nombres: form.nombres.trim(),
          apellidos: form.apellidos.trim(),
          usuario: form.usuario.trim(),
          rol: form.rol,
          perfilIds:
            form.rol === "Empleado"
              ? form.perfilIds
              : [],
        });

        usuarioIdGuardado =
          respuesta?._id ||
          respuesta?.id ||
          usuarioIdGuardado;

        if (form.rol === "Empleado" && usuarioIdGuardado) {
          await actualizarPermisosPersonalizados(
            usuarioIdGuardado,
            construirPayloadPermisosExtras()
          );
        }

        setMensaje("Usuario y permisos actualizados correctamente.");
      }

      await cargarUsuarios();

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

      setPermisosExtras({});
      setPerfilPermisosActivo("combinados");
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

  const perfilesActivos = perfiles.filter(
    (perfil) => perfil.estado === "Activo"
  );

  const perfilesSeleccionados = perfiles.filter(
    (perfil) =>
      Array.isArray(form.perfilIds) &&
      form.perfilIds.includes(perfil.id)
  );

  const nombreAccion = {
    ver: "Ver",
    crear: "Crear",
    editar: "Editar",
    eliminar: "Eliminar",
    imprimir: "Imprimir",
    anular: "Anular",
    cambiarEstado: "Cambiar estado",
    registrarMovimientos: "Movimientos",
  };

  function permisoPerfil(perfil, moduloClave, accion) {
    const fila = perfil?.permisos?.find(
      (permiso) => permiso.modulo === moduloClave
    );

    return fila?.[accion] === true;
  }

  function permisoPerfiles(moduloClave, accion) {
    return perfilesSeleccionados.some((perfil) =>
      permisoPerfil(perfil, moduloClave, accion)
    );
  }

  function permisoExtra(moduloClave, accion) {
    return permisosExtras?.[moduloClave]?.[accion] === true;
  }

  function permisoEfectivo(moduloClave, accion) {
    return (
      permisoPerfiles(moduloClave, accion) ||
      permisoExtra(moduloClave, accion)
    );
  }

  function permisoPerfilActivo(moduloClave, accion) {
    if (perfilPermisosActivo === "combinados") {
      return permisoPerfiles(moduloClave, accion);
    }

    const perfil = perfilesSeleccionados.find(
      (item) => item.id === perfilPermisosActivo
    );

    return permisoPerfil(perfil, moduloClave, accion);
  }

  function alternarPermisoExtra(moduloClave, accion) {
    /*
      Un permiso heredado de cualquiera de los perfiles asignados
      no se puede retirar aquí. Para retirarlo se debe quitar el perfil.
      Esta pantalla sirve para AGREGAR permisos individuales al usuario.
    */
    if (permisoPerfiles(moduloClave, accion)) {
      return;
    }

    setPermisosExtras((actual) => {
      const filaActual = actual?.[moduloClave] || {};
      const yaExiste = filaActual?.[accion] === true;
      const nuevaFila = {
        ...filaActual,
        [accion]: !yaExiste,
      };

      const tieneAlguno = Object.values(nuevaFila).some(
        (valor) => valor === true
      );

      if (!tieneAlguno) {
        const copia = { ...actual };
        delete copia[moduloClave];
        return copia;
      }

      return {
        ...actual,
        [moduloClave]: nuevaFila,
      };
    });
  }

  const perfilActivoNombre =
    perfilPermisosActivo === "combinados"
      ? "Permisos combinados"
      : perfilesSeleccionados.find(
          (perfil) => perfil.id === perfilPermisosActivo
        )?.nombre || "Perfil";

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

          {form.rol === "Empleado" ? (
            <div className="usuarios-field usuarios-field-perfil">
              <div className="usuarios-perfiles-heading">
                <div>
                  <label>Perfiles del empleado *</label>
                  <small>
                    Puedes asignar uno o varios. Los permisos se combinan automáticamente.
                  </small>
                </div>

                <span className="usuarios-perfiles-contador">
                  {perfilesSeleccionados.length} seleccionado{perfilesSeleccionados.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="usuarios-perfiles-grid" role="group" aria-label="Perfiles del empleado">
                {perfilesActivos.map((perfil) => {
                  const seleccionado = form.perfilIds.includes(perfil.id);

                  return (
                    <button
                      key={perfil.id}
                      type="button"
                      className={`usuarios-perfil-card ${seleccionado ? "seleccionado" : ""}`}
                      onClick={() => alternarPerfil(perfil.id)}
                      aria-pressed={seleccionado}
                    >
                      <span className="usuarios-perfil-card-check" aria-hidden="true">
                        {seleccionado ? "✓" : ""}
                      </span>

                      <span className="usuarios-perfil-card-contenido">
                        <strong>{perfil.nombre}</strong>
                        <small>{perfil.descripcion || "Perfil operativo de WebBuys."}</small>
                      </span>
                    </button>
                  );
                })}
              </div>

              {perfilesActivos.length === 0 && (
                <div className="usuarios-perfiles-vacio">
                  No hay perfiles activos disponibles.
                </div>
              )}
            </div>
          ) : (
            <div className="usuarios-admin-access-note">
              <strong>Administrador</strong>
              <span>
                Acceso total a WebBuys. No requiere perfiles de empleado.
              </span>
            </div>
          )}

          {form.rol === "Empleado" && perfilesSeleccionados.length > 0 && (
            <details className="usuarios-perfil-permisos">
              <summary>
                Administrar permisos de este usuario
              </summary>

              <div className="usuarios-permisos-tabs" role="tablist" aria-label="Perfiles asignados">
                <button
                  type="button"
                  className={`usuarios-permisos-tab ${
                    perfilPermisosActivo === "combinados" ? "activo" : ""
                  }`}
                  onClick={() => setPerfilPermisosActivo("combinados")}
                  aria-pressed={perfilPermisosActivo === "combinados"}
                >
                  Combinados
                </button>

                {perfilesSeleccionados.map((perfil) => (
                  <button
                    key={perfil.id}
                    type="button"
                    className={`usuarios-permisos-tab ${
                      perfilPermisosActivo === perfil.id ? "activo" : ""
                    }`}
                    onClick={() => setPerfilPermisosActivo(perfil.id)}
                    aria-pressed={perfilPermisosActivo === perfil.id}
                  >
                    {perfil.nombre}
                  </button>
                ))}
              </div>

              <div className="usuarios-permisos-editor-cabecera">
                <div>
                  <strong>{perfilActivoNombre}</strong>
                  <span>
                    Los permisos heredados del perfil aparecen marcados.
                    Los checks que agregues serán extras solo para este usuario.
                  </span>
                </div>

                {cargandoPermisosUsuario && (
                  <span className="usuarios-permisos-cargando">
                    Cargando permisos...
                  </span>
                )}
              </div>

              <div className="usuarios-permisos-leyenda">
                <span>
                  <i className="usuarios-leyenda-check heredado" aria-hidden="true">✓</i>
                  Heredado de perfiles
                </span>
                <span>
                  <i className="usuarios-leyenda-check extra" aria-hidden="true">✓</i>
                  Extra para este usuario
                </span>
                <span>
                  <i className="usuarios-leyenda-check disponible" aria-hidden="true"></i>
                  Puedes habilitarlo
                </span>
              </div>

              <div className="usuarios-perfil-permisos-table-wrap">
                <table className="usuarios-perfil-permisos-table usuarios-permisos-editable">
                  <thead>
                    <tr>
                      <th>Módulo</th>

                      {catalogoPermisos.acciones.map((accion) => (
                        <th key={accion}>
                          {nombreAccion[accion] || accion}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {catalogoPermisos.modulos.map((modulo) => (
                      <tr key={modulo.clave}>
                        <td>
                          <strong>{modulo.nombre}</strong>
                          <small>{modulo.grupo}</small>
                        </td>

                        {catalogoPermisos.acciones.map((accion) => {
                          const heredadoCombinado =
                            permisoPerfiles(modulo.clave, accion);
                          const heredadoVista =
                            permisoPerfilActivo(modulo.clave, accion);
                          const extra =
                            permisoExtra(modulo.clave, accion);
                          const efectivo =
                            permisoEfectivo(modulo.clave, accion);

                          let titulo =
                            "Haz clic para habilitar este permiso solo para el usuario.";

                          if (heredadoVista) {
                            titulo =
                              "Este permiso viene incluido en el perfil seleccionado.";
                          } else if (heredadoCombinado) {
                            titulo =
                              "Este permiso ya viene incluido en otro de los perfiles asignados.";
                          } else if (extra) {
                            titulo =
                              "Permiso extra de este usuario. Haz clic para retirarlo.";
                          }

                          return (
                            <td
                              key={`${modulo.clave}-${accion}`}
                              className={`usuarios-permiso-celda ${
                                heredadoCombinado
                                  ? "heredado"
                                  : extra
                                    ? "extra"
                                    : "disponible"
                              } ${
                                heredadoVista ? "heredado-vista" : ""
                              }`}
                              title={titulo}
                            >
                              <label className="usuarios-permiso-check">
                                <input
                                  type="checkbox"
                                  checked={efectivo}
                                  disabled={heredadoCombinado || cargandoPermisosUsuario}
                                  onChange={() =>
                                    alternarPermisoExtra(modulo.clave, accion)
                                  }
                                  aria-label={`${modulo.nombre} - ${nombreAccion[accion] || accion}`}
                                />
                                <span aria-hidden="true"></span>
                              </label>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="usuarios-perfil-permisos-info">
                Puedes cambiar entre Bodega, Caja, Ventas y los demás perfiles asignados
                usando las pestañas superiores. Los permisos extra que marques se guardan
                únicamente para este usuario y no cambian el perfil de los demás empleados.
              </p>
            </details>
          )}

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
                    <th>Perfil</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosBusqueda.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="usuarios-search-empty">
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
                          {usuario.rol === "Administrador" ? (
                            <span className="usuarios-modal-perfil">
                              Acceso total
                            </span>
                          ) : (
                            <div className="usuarios-modal-perfiles">
                              {(Array.isArray(usuario.perfiles) && usuario.perfiles.length > 0
                                ? usuario.perfiles
                                : usuario.perfil
                                  ? [usuario.perfil]
                                  : []
                              ).map((perfil) => (
                                <span
                                  key={perfil.id || perfil.nombre}
                                  className="usuarios-modal-perfil"
                                >
                                  {perfil.nombre}
                                </span>
                              ))}

                              {(!usuario.perfiles?.length && !usuario.perfil) && (
                                <span className="usuarios-modal-perfil">Sin perfiles</span>
                              )}
                            </div>
                          )}
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