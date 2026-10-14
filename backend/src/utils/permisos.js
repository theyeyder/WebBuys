export const ACCIONES_PERMISO = [
  "ver",
  "crear",
  "editar",
  "eliminar",
  "imprimir",
  "anular",
  "cambiarEstado",
  "registrarMovimientos",
];

export const MODULOS_PERMISOS = [
  { clave: "dashboard", nombre: "Dashboard", grupo: "General" },
  { clave: "clientes", nombre: "Clientes", grupo: "Operación" },
  { clave: "categorias", nombre: "Categorías", grupo: "Operación" },
  { clave: "productos", nombre: "Productos", grupo: "Operación" },
  { clave: "inventario", nombre: "Inventario", grupo: "Operación" },
  { clave: "pedidos", nombre: "Pedidos", grupo: "Operación" },
  { clave: "entregas", nombre: "Entregas", grupo: "Operación" },
  { clave: "facturacion", nombre: "Facturación", grupo: "Finanzas" },
  { clave: "caja", nombre: "Caja", grupo: "Finanzas" },
  { clave: "cartera", nombre: "Cartera", grupo: "Finanzas" },
  { clave: "empleados", nombre: "Empleados", grupo: "Administración" },
  { clave: "usuarios", nombre: "Usuarios", grupo: "Configuración" },
  { clave: "empresa", nombre: "Empresa", grupo: "Configuración" },
  { clave: "rutas", nombre: "Rutas", grupo: "Configuración" },
  { clave: "zonas_despacho", nombre: "Zonas de despacho", grupo: "Configuración" },
  { clave: "numeracion", nombre: "Numeración", grupo: "Configuración" },
  { clave: "auditoria", nombre: "Auditoría", grupo: "Configuración" },
  { clave: "preferencias", nombre: "Preferencias", grupo: "Configuración" },
];

export const CLAVES_MODULOS_PERMISOS = new Set(
  MODULOS_PERMISOS.map((modulo) => modulo.clave)
);

export function permisoVacio() {
  return Object.fromEntries(
    ACCIONES_PERMISO.map((accion) => [accion, false])
  );
}

export function normalizarPermiso(permisos = {}) {
  const resultado = permisoVacio();

  for (const accion of ACCIONES_PERMISO) {
    if (typeof permisos?.[accion] === "boolean") {
      resultado[accion] = permisos[accion];
    }
  }

  return resultado;
}

function perfilesConPermisos(usuario) {
  const perfiles = [];

  if (Array.isArray(usuario?.perfiles)) {
    for (const asignacion of usuario.perfiles) {
      const perfil = asignacion?.perfil || asignacion;
      if (perfil && Array.isArray(perfil.permisos)) {
        perfiles.push(perfil);
      }
    }
  }

  // Compatibilidad con usuarios que todavía solo tengan perfilId.
  if (
    perfiles.length === 0 &&
    usuario?.perfil &&
    Array.isArray(usuario.perfil.permisos)
  ) {
    perfiles.push(usuario.perfil);
  }

  return perfiles;
}

export function construirPermisosEfectivos(usuario) {
  const permisos = {};

  for (const modulo of MODULOS_PERMISOS) {
    permisos[modulo.clave] = permisoVacio();
  }

  if (usuario?.rol === "Administrador") {
    for (const modulo of MODULOS_PERMISOS) {
      for (const accion of ACCIONES_PERMISO) {
        permisos[modulo.clave][accion] = true;
      }
    }

    return permisos;
  }

  // Unión de permisos: si CUALQUIERA de los perfiles permite la acción,
  // el usuario la obtiene.
  for (const perfil of perfilesConPermisos(usuario)) {
    for (const permiso of perfil.permisos) {
      if (!CLAVES_MODULOS_PERMISOS.has(permiso.modulo)) continue;

      for (const accion of ACCIONES_PERMISO) {
        if (permiso?.[accion] === true) {
          permisos[permiso.modulo][accion] = true;
        }
      }
    }
  }

  // Las excepciones individuales se aplican al final y pueden conceder
  // o retirar permisos concretos sobre el resultado combinado.
  const personalizados =
    Array.isArray(usuario?.permisosPersonalizados)
      ? usuario.permisosPersonalizados
      : [];

  for (const override of personalizados) {
    if (!CLAVES_MODULOS_PERMISOS.has(override.modulo)) continue;

    for (const accion of ACCIONES_PERMISO) {
      if (typeof override?.[accion] === "boolean") {
        permisos[override.modulo][accion] = override[accion];
      }
    }
  }

  return permisos;
}

export function puede(usuario, modulo, accion = "ver") {
  if (usuario?.rol === "Administrador") return true;
  if (!CLAVES_MODULOS_PERMISOS.has(modulo)) return false;
  if (!ACCIONES_PERMISO.includes(accion)) return false;

  const permisos = usuario?.permisos || construirPermisosEfectivos(usuario);
  return permisos?.[modulo]?.[accion] === true;
}
