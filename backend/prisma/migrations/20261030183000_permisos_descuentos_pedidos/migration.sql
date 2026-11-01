-- Permiso independiente de descuentos en pedidos.
-- No modifica datos de pedidos ni usuarios existentes.
ALTER TABLE "perfil_permisos"
  ADD COLUMN IF NOT EXISTS "descontar" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "usuario_permisos"
  ADD COLUMN IF NOT EXISTS "descontar" BOOLEAN;
