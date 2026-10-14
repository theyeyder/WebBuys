export const MODULOS_CONFIGURACION = [
  "usuarios",
  "empresa",
  "rutas",
  "zonas_despacho",
  "numeracion",
  "auditoria",
  "preferencias",
];

export function tienePermisoUsuario(
  usuario,
  modulo,
  accion = "ver"
) {
  if (!usuario) return false;

  if (usuario.rol === "Administrador") {
    return true;
  }

  return usuario?.permisos?.[modulo]?.[accion] === true;
}

export function puedeVerModulo(usuario, modulo) {
  if (!usuario) return false;

  if (usuario.rol === "Administrador") {
    return true;
  }

  if (modulo === "configuracion") {
    return MODULOS_CONFIGURACION.some((clave) =>
      tienePermisoUsuario(usuario, clave, "ver")
    );
  }

  return tienePermisoUsuario(usuario, modulo, "ver");
}

export function rutaInicialPermitida(usuario) {
  const opciones = [
    ["dashboard", "/"],
    ["clientes", "/clientes"],
    ["categorias", "/categorias"],
    ["productos", "/productos"],
    ["inventario", "/inventario"],
    ["pedidos", "/pedidos"],
    ["entregas", "/entregas"],
    ["facturacion", "/facturacion"],
    ["caja", "/caja"],
    ["cartera", "/cartera"],
    ["empleados", "/empleados"],
    ["configuracion", "/configuracion"],
  ];

  const encontrada = opciones.find(([modulo]) =>
    puedeVerModulo(usuario, modulo)
  );

  return encontrada?.[1] || "/sin-acceso";
}
