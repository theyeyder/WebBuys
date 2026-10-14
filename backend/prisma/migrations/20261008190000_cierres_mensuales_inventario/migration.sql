-- WebBuys - cierres mensuales de inventario

CREATE TABLE "cierres_inventario" (
    "id" UUID NOT NULL,
    "periodo" VARCHAR(7) NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "fechaCierre" TIMESTAMPTZ(3),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    "cerradoPorId" UUID,
    "cerradoPorNombre" VARCHAR(250) NOT NULL DEFAULT '',
    "totalRegistros" INTEGER NOT NULL DEFAULT 0,
    "totalProductos" INTEGER NOT NULL DEFAULT 0,
    "totalEntradas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalEntregas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalReversiones" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalVendidoNeto" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalOtrasSalidas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalAjustesPositivos" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "totalAjustesNegativos" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "valorInventarioInicial" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorInventarioFinal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cierres_inventario_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cierre_inventario_detalles" (
    "id" UUID NOT NULL,
    "cierreId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "presentacionId" UUID,
    "codigo" VARCHAR(40) NOT NULL DEFAULT '',
    "producto" VARCHAR(180) NOT NULL,
    "presentacion" VARCHAR(180) NOT NULL DEFAULT '',
    "marca" VARCHAR(120) NOT NULL DEFAULT '',
    "categoria" VARCHAR(180) NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL DEFAULT 'Unidad',
    "unidad" VARCHAR(40) NOT NULL DEFAULT '',
    "controlInventario" BOOLEAN NOT NULL DEFAULT true,
    "stockInicial" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservadoInicial" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "entradas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "entregas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reversiones" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "vendidoNeto" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "otrasSalidas" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "ajustesPositivos" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "ajustesNegativos" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockFinal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservadoFinal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costoPromedioInicial" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costoPromedioFinal" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "valorInventarioInicial" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "valorInventarioFinal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cierre_inventario_detalles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cierres_inventario_periodo_key"
ON "cierres_inventario"("periodo");

CREATE INDEX "cierres_inventario_anio_mes_idx"
ON "cierres_inventario"("anio", "mes");

CREATE INDEX "cierres_inventario_estado_idx"
ON "cierres_inventario"("estado");

CREATE INDEX "cierre_inventario_detalles_cierreId_productoId_presentacionId_idx"
ON "cierre_inventario_detalles"("cierreId", "productoId", "presentacionId");

CREATE INDEX "cierre_inventario_detalles_cierreId_idx"
ON "cierre_inventario_detalles"("cierreId");

CREATE INDEX "cierre_inventario_detalles_productoId_presentacionId_idx"
ON "cierre_inventario_detalles"("productoId", "presentacionId");

ALTER TABLE "cierre_inventario_detalles"
ADD CONSTRAINT "cierre_inventario_detalles_cierreId_fkey"
FOREIGN KEY ("cierreId") REFERENCES "cierres_inventario"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
