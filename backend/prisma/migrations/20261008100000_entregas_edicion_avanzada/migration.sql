-- Entregas editables: conserva lo solicitado y registra lo realmente entregado.
ALTER TABLE "entrega_items"
  ALTER COLUMN "pedidoItemId" DROP NOT NULL;

ALTER TABLE "entrega_items"
  ADD COLUMN "cantidadReal" DECIMAL(18,4),
  ADD COLUMN "origen" VARCHAR(20) NOT NULL DEFAULT 'Pedido';

-- Para los históricos por unidad, lo realmente entregado coincide inicialmente
-- con la cantidad solicitada. En productos por peso se conserva "pesoReal".
UPDATE "entrega_items"
SET "cantidadReal" = "cantidadSolicitada"
WHERE "tipoVenta" <> 'Peso'
  AND "cantidadReal" IS NULL;
