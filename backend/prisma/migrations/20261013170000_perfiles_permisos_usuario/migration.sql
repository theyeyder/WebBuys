-- =========================================================
-- WEBBUYS - PERFILES Y PERMISOS DE USUARIO
-- Fase 1: estructura base sin activar todavía restricciones
-- en los módulos existentes. Los usuarios actuales continúan
-- funcionando hasta la fase de aplicación de permisos.
-- =========================================================

CREATE TABLE "perfiles_usuario" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "esSistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "perfiles_usuario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "perfil_permisos" (
    "perfilId" UUID NOT NULL,
    "modulo" VARCHAR(60) NOT NULL,
    "ver" BOOLEAN NOT NULL DEFAULT false,
    "crear" BOOLEAN NOT NULL DEFAULT false,
    "editar" BOOLEAN NOT NULL DEFAULT false,
    "eliminar" BOOLEAN NOT NULL DEFAULT false,
    "imprimir" BOOLEAN NOT NULL DEFAULT false,
    "anular" BOOLEAN NOT NULL DEFAULT false,
    "cambiarEstado" BOOLEAN NOT NULL DEFAULT false,
    "registrarMovimientos" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "perfil_permisos_pkey" PRIMARY KEY ("perfilId", "modulo")
);

CREATE TABLE "usuario_permisos" (
    "usuarioId" UUID NOT NULL,
    "modulo" VARCHAR(60) NOT NULL,
    "ver" BOOLEAN,
    "crear" BOOLEAN,
    "editar" BOOLEAN,
    "eliminar" BOOLEAN,
    "imprimir" BOOLEAN,
    "anular" BOOLEAN,
    "cambiarEstado" BOOLEAN,
    "registrarMovimientos" BOOLEAN,

    CONSTRAINT "usuario_permisos_pkey" PRIMARY KEY ("usuarioId", "modulo")
);

ALTER TABLE "usuarios" ADD COLUMN "perfilId" UUID;

CREATE UNIQUE INDEX "perfiles_usuario_codigo_key" ON "perfiles_usuario"("codigo");
CREATE UNIQUE INDEX "perfiles_usuario_nombre_key" ON "perfiles_usuario"("nombre");
CREATE INDEX "perfiles_usuario_estado_idx" ON "perfiles_usuario"("estado");
CREATE INDEX "perfil_permisos_modulo_idx" ON "perfil_permisos"("modulo");
CREATE INDEX "usuario_permisos_modulo_idx" ON "usuario_permisos"("modulo");
CREATE INDEX "usuarios_perfilId_idx" ON "usuarios"("perfilId");

ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_perfilId_fkey"
  FOREIGN KEY ("perfilId") REFERENCES "perfiles_usuario"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "perfil_permisos" ADD CONSTRAINT "perfil_permisos_perfilId_fkey"
  FOREIGN KEY ("perfilId") REFERENCES "perfiles_usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Perfiles base del sistema
INSERT INTO "perfiles_usuario"
  ("id", "codigo", "nombre", "descripcion", "estado", "esSistema", "createdAt", "updatedAt")
VALUES
  ('10000000-0000-4000-8000-000000000001', 'VENTAS', 'Ventas', 'Gestión comercial de clientes y pedidos.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000002', 'CAJA', 'Caja', 'Operación de caja, pagos y consulta financiera.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000003', 'BODEGA', 'Bodega', 'Control operativo de inventario y preparación.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000004', 'DESPACHOS', 'Despachos', 'Gestión de entregas, rutas y despacho de pedidos.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000005', 'FACTURACION', 'Facturación', 'Facturación, cartera y documentos de venta.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('10000000-0000-4000-8000-000000000006', 'CONSULTA', 'Consulta', 'Acceso de solo consulta e impresión a información operativa.', 'Activo', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Matriz inicial de permisos por perfil
INSERT INTO "perfil_permisos"
  ("perfilId", "modulo", "ver", "crear", "editar", "eliminar", "imprimir", "anular", "cambiarEstado", "registrarMovimientos")
VALUES
  ('10000000-0000-4000-8000-000000000001', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'clientes', true, true, true, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'categorias', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'productos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'inventario', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'pedidos', true, true, true, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'entregas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'facturacion', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'caja', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'cartera', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'rutas', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'zonas_despacho', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000001', 'preferencias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'clientes', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'categorias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'productos', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'inventario', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'pedidos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'entregas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'facturacion', true, true, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'caja', true, true, true, false, true, false, true, true),
  ('10000000-0000-4000-8000-000000000002', 'cartera', true, true, true, false, true, false, false, true),
  ('10000000-0000-4000-8000-000000000002', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'rutas', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'zonas_despacho', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000002', 'preferencias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'clientes', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'categorias', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'productos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'inventario', true, false, false, false, true, false, false, true),
  ('10000000-0000-4000-8000-000000000003', 'pedidos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'entregas', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'facturacion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'caja', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'cartera', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'rutas', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'zonas_despacho', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000003', 'preferencias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'clientes', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'categorias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'productos', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'inventario', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'pedidos', true, false, true, false, true, false, true, false),
  ('10000000-0000-4000-8000-000000000004', 'entregas', true, true, true, false, true, false, true, false),
  ('10000000-0000-4000-8000-000000000004', 'facturacion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'caja', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'cartera', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'rutas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'zonas_despacho', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000004', 'preferencias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'clientes', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'categorias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'productos', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'inventario', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'pedidos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'entregas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'facturacion', true, true, true, false, true, true, false, false),
  ('10000000-0000-4000-8000-000000000005', 'caja', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'cartera', true, true, true, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'rutas', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'zonas_despacho', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000005', 'preferencias', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'dashboard', true, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'clientes', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'categorias', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'productos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'inventario', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'pedidos', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'entregas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'facturacion', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'caja', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'cartera', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'empleados', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'usuarios', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'empresa', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'rutas', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'zonas_despacho', true, false, false, false, true, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'numeracion', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'auditoria', false, false, false, false, false, false, false, false),
  ('10000000-0000-4000-8000-000000000006', 'preferencias', false, false, false, false, false, false, false, false);

-- Los usuarios existentes quedan sin perfil asignado por seguridad.
-- El administrador podrá asignarlos desde Configuración en la siguiente fase.
