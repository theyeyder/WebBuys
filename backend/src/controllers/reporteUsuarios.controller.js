import ExcelJS from "exceljs";
import { prisma } from "../config/postgresql.js";
import {
  ACCIONES_PERMISO,
  MODULOS_PERMISOS,
  construirPermisosEfectivos,
  normalizarPermiso,
} from "../utils/permisos.js";

// Solo lectura. La ruta está protegida por proteger + soloAdmin.
const NOMBRES_ACCIONES = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  imprimir: "Imprimir",
  descontar: "Descontar",
  anular: "Anular",
  cambiarEstado: "Cambiar estado",
  registrarMovimientos: "Registrar movimientos",
};

const nombreCompleto = (usuario) =>
  [usuario.nombres, usuario.apellidos].filter(Boolean).join(" ").trim();

function perfilesAsignados(usuario) {
  const asignados = Array.isArray(usuario.perfiles)
    ? usuario.perfiles.map((rel) => rel.perfil).filter(Boolean)
    : [];
  if (asignados.length) return asignados;
  return usuario.perfil ? [usuario.perfil] : [];
}

function permisosFilas(filas) {
  return (Array.isArray(filas) ? filas : []).map((p) => ({
    modulo: p.modulo,
    ...normalizarPermiso(p),
  }));
}

async function consultarDatos() {
  const [usuariosDb, perfilesDb] = await Promise.all([
    prisma.usuario.findMany({
      select: {
        id: true, codigo: true, nombres: true, apellidos: true,
        usuario: true, rol: true, estado: true, ultimoIngreso: true,
        perfil: { select: { id: true, codigo: true, nombre: true, estado: true, permisos: true } },
        perfiles: {
          select: {
            perfil: { select: { id: true, codigo: true, nombre: true, estado: true, permisos: true } },
          },
          orderBy: { asignadoAt: "asc" },
        },
        permisosPersonalizados: true,
      },
      orderBy: [{ nombres: "asc" }, { apellidos: "asc" }],
    }),
    prisma.perfilUsuario.findMany({
      include: { permisos: true },
      orderBy: [{ esSistema: "desc" }, { nombre: "asc" }],
    }),
  ]);

  const usuarios = usuariosDb.map((u) => {
    const asignados = perfilesAsignados(u);
    return {
      id: u.id,
      codigo: u.codigo || "",
      nombres: u.nombres,
      apellidos: u.apellidos,
      nombre: nombreCompleto(u),
      usuario: u.usuario,
      rol: u.rol,
      estado: u.estado,
      ultimoIngreso: u.ultimoIngreso,
      perfiles: asignados.map((p) => ({ id: p.id, nombre: p.nombre, estado: p.estado })),
      permisos: construirPermisosEfectivos(u),
      personalizados: (u.permisosPersonalizados || []).map((p) => ({
        modulo: p.modulo,
        ...Object.fromEntries(ACCIONES_PERMISO.filter((accion) =>
          typeof p[accion] === "boolean"
        ).map((accion) => [accion, p[accion]])),
      })),
    };
  });

  const perfiles = perfilesDb.map((p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    descripcion: p.descripcion || "",
    estado: p.estado,
    esSistema: p.esSistema,
    usuariosAsignados: usuarios.filter((u) => u.perfiles.some((up) => up.id === p.id)).length,
    permisos: permisosFilas(p.permisos),
  }));

  return {
    generadoEn: new Date().toISOString(),
    acciones: ACCIONES_PERMISO,
    nombresAcciones: NOMBRES_ACCIONES,
    modulos: MODULOS_PERMISOS,
    usuarios,
    perfiles,
  };
}

function filtrarDatos(datos, query) {
  const q = String(query.q || "").trim().toLocaleLowerCase("es");
  const estado = String(query.estado || "").trim();
  const perfilId = String(query.perfilId || "").trim();
  const usuarioId = String(query.usuarioId || "").trim();
  const perfilReporteId = String(query.perfilReporteId || "").trim();

  const usuarios = datos.usuarios.filter((u) => {
    if (estado && u.estado !== estado) return false;
    if (perfilId && !u.perfiles.some((p) => p.id === perfilId)) return false;
    if (!q) return true;
    return [u.codigo, u.nombre, u.usuario, u.rol, ...u.perfiles.map((p) => p.nombre)]
      .some((valor) => String(valor || "").toLocaleLowerCase("es").includes(q));
  });

  const perfiles = datos.perfiles.filter((p) => {
    if (estado && p.estado !== estado) return false;
    if (perfilId && p.id !== perfilId) return false;
    if (!q) return true;
    return [p.codigo, p.nombre, p.descripcion]
      .some((valor) => String(valor || "").toLocaleLowerCase("es").includes(q));
  });

  return {
    usuarios,
    perfiles,
    usuariosPermisos: usuarios.filter((u) => !usuarioId || u.id === usuarioId),
    perfilesPermisos: perfiles.filter((p) => !perfilReporteId || p.id === perfilReporteId),
  };
}

export async function obtenerReporteUsuarios(_req, res) {
  try {
    return res.json(await consultarDatos());
  } catch (error) {
    console.error("Error en reporte de usuarios:", error);
    return res.status(500).json({ mensaje: "No fue posible generar el reporte de usuarios." });
  }
}

function formatoFecha(fecha) {
  if (!fecha) return "Nunca";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota", day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(valor);
}

function estiloHoja(hoja, encabezados, filas) {
  hoja.addRow(encabezados);
  hoja.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  hoja.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF116B62" } };
  hoja.getRow(1).alignment = { vertical: "middle", wrapText: true };
  hoja.getRow(1).height = 30;
  for (const fila of filas) hoja.addRow(fila);
  hoja.views = [{ state: "frozen", ySplit: 1 }];
  hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: encabezados.length } };
  hoja.columns.forEach((columna, indice) => {
    const largo = Math.max(encabezados[indice].length,
      ...filas.slice(0, 300).map((fila) => String(fila[indice] ?? "").length));
    columna.width = Math.max(13, Math.min(44, largo + 3));
  });
}

function matrizPermisos(items, modulos, acciones, origen) {
  const filas = [];
  for (const item of items) {
    const mapaPerfil = new Map((Array.isArray(item.permisos) ? item.permisos : []).map((p) => [p.modulo, p]));
    const personalizados = new Map((item.personalizados || []).map((p) => [p.modulo, p]));
    for (const modulo of modulos) {
      const permiso = origen === "usuario"
        ? item.permisos?.[modulo.clave] || {}
        : mapaPerfil.get(modulo.clave) || {};
      const excepciones = personalizados.get(modulo.clave) || {};
      filas.push([
        item.codigo || "", origen === "usuario" ? item.nombre : item.nombre,
        origen === "usuario" ? item.usuario : item.estado,
        modulo.grupo, modulo.nombre,
        ...acciones.map((accion) => permiso[accion] === true ? "Sí" : "No"),
        origen === "usuario" ? acciones.filter((accion) => typeof excepciones[accion] === "boolean").length : "",
      ]);
    }
  }
  return filas;
}

export async function exportarReporteUsuariosExcel(req, res) {
  try {
    const datos = await consultarDatos();
    const filtrados = filtrarDatos(datos, req.query);
    const wb = new ExcelJS.Workbook();
    wb.creator = "WebBuys V13";
    wb.created = new Date();

    const hojaUsuarios = wb.addWorksheet("Usuarios");
    estiloHoja(hojaUsuarios,
      ["Código", "Nombre completo", "Usuario", "Rol", "Estado", "Perfiles", "Último ingreso"],
      filtrados.usuarios.map((u) => [
        u.codigo, u.nombre, u.usuario, u.rol, u.estado,
        u.rol === "Administrador" ? "Acceso total" : u.perfiles.map((p) => p.nombre).join(" / ") || "Sin perfil",
        formatoFecha(u.ultimoIngreso),
      ]));

    const hojaPerfiles = wb.addWorksheet("Perfiles");
    estiloHoja(hojaPerfiles,
      ["Código", "Perfil", "Descripción", "Estado", "Tipo", "Usuarios asignados"],
      filtrados.perfiles.map((p) => [
        p.codigo, p.nombre, p.descripcion, p.estado,
        p.esSistema ? "Sistema" : "Personalizado", p.usuariosAsignados,
      ]));

    const encabezadosPermisos = [
      "Código", "Nombre", "Usuario / Estado", "Grupo", "Módulo",
      ...datos.acciones.map((a) => NOMBRES_ACCIONES[a] || a), "Excepciones individuales",
    ];
    const hojaPermisosUsuarios = wb.addWorksheet("Permisos usuarios");
    estiloHoja(hojaPermisosUsuarios, encabezadosPermisos,
      matrizPermisos(filtrados.usuariosPermisos, datos.modulos, datos.acciones, "usuario"));

    const hojaPermisosPerfiles = wb.addWorksheet("Permisos perfiles");
    estiloHoja(hojaPermisosPerfiles, encabezadosPermisos,
      matrizPermisos(filtrados.perfilesPermisos, datos.modulos, datos.acciones, "perfil"));

    const nombre = `WebBuys_Reporte_Usuarios_Perfiles_Permisos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${nombre}"`);
    res.setHeader("Cache-Control", "no-store");
    await wb.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error("Error exportando reporte de usuarios:", error);
    if (!res.headersSent) {
      return res.status(500).json({ mensaje: "No fue posible exportar el reporte Excel." });
    }
    return res.end();
  }
}
