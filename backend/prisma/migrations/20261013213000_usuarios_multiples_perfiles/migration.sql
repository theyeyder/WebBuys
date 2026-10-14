-- =========================================================
-- WEBBUYS - USUARIOS CON MÚLTIPLES PERFILES
-- Conserva perfilId como perfil principal/compatibilidad y
-- crea una relación N:M real para combinar permisos.
-- =========================================================

CREATE TABLE "usuario_perfiles" (
    "usuarioId" UUID NOT NULL,
    "perfilId" UUID NOT NULL,
    "asignadoAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_perfiles_pkey" PRIMARY KEY ("usuarioId", "perfilId")
);

CREATE INDEX "usuario_perfiles_perfilId_idx"
  ON "usuario_perfiles"("perfilId");

ALTER TABLE "usuario_perfiles"
  ADD CONSTRAINT "usuario_perfiles_usuarioId_fkey"
  FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "usuario_perfiles"
  ADD CONSTRAINT "usuario_perfiles_perfilId_fkey"
  FOREIGN KEY ("perfilId") REFERENCES "perfiles_usuario"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Migra cualquier perfil único que ya estuviera asignado.
INSERT INTO "usuario_perfiles" ("usuarioId", "perfilId", "asignadoAt")
SELECT "id", "perfilId", CURRENT_TIMESTAMP
FROM "usuarios"
WHERE "perfilId" IS NOT NULL
ON CONFLICT ("usuarioId", "perfilId") DO NOTHING;
