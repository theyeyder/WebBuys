-- Permite conservar cartera y pagos históricos cuyos documentos padre
-- fueron eliminados en MongoDB. Las relaciones actuales siguen usando FK;
-- cuando el padre ya no existe se guarda NULL y se conserva el ObjectId
-- original en los campos legacy*MongoId.

ALTER TABLE "carteras"
  ADD COLUMN "legacyEntregaMongoId" VARCHAR(24),
  ADD COLUMN "legacyPedidoMongoId" VARCHAR(24),
  ALTER COLUMN "entregaId" DROP NOT NULL,
  ALTER COLUMN "pedidoId" DROP NOT NULL;

ALTER TABLE "pagos_cartera"
  ADD COLUMN "legacyEntregaMongoId" VARCHAR(24),
  ADD COLUMN "legacyPedidoMongoId" VARCHAR(24),
  ADD COLUMN "legacyCajaMongoId" VARCHAR(24),
  ADD COLUMN "legacyMovimientoCajaMongoId" VARCHAR(24),
  ALTER COLUMN "entregaId" DROP NOT NULL,
  ALTER COLUMN "pedidoId" DROP NOT NULL,
  ALTER COLUMN "cajaId" DROP NOT NULL;
