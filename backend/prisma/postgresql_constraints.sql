-- =========================================================
-- WEBBUYS - RESTRICCIONES POSTGRESQL COMPLEMENTARIAS
-- Ejecutar DESPUÉS de que Prisma cree las tablas.
-- Mantiene los valores de texto en español para no romper la API actual.
-- =========================================================

-- ---------- USUARIOS ----------
ALTER TABLE usuarios
  ADD CONSTRAINT usuarios_rol_chk
  CHECK (rol IN ('Administrador', 'Empleado')),
  ADD CONSTRAINT usuarios_estado_chk
  CHECK (estado IN ('Activo', 'Bloqueado'));

-- ---------- AUDITORÍA ----------
ALTER TABLE auditorias
  ADD CONSTRAINT auditorias_accion_chk
  CHECK (accion IN (
    'CREAR', 'ACTUALIZAR', 'ELIMINAR', 'ACTIVAR', 'DESACTIVAR',
    'BLOQUEAR', 'DESBLOQUEAR', 'RESET_PASSWORD', 'CAMBIAR_PASSWORD',
    'LOGIN', 'LOGOUT'
  ));

-- ---------- CATÁLOGOS ----------
ALTER TABLE categorias
  ADD CONSTRAINT categorias_estado_chk
  CHECK (estado IN ('Activa', 'Inactiva'));

ALTER TABLE zonas_despacho
  ADD CONSTRAINT zonas_estado_chk
  CHECK (estado IN ('Activa', 'Inactiva'));

ALTER TABLE rutas
  ADD CONSTRAINT rutas_estado_chk
  CHECK (estado IN ('Activa', 'Inactiva'));

ALTER TABLE clientes
  ADD CONSTRAINT clientes_tipo_documento_chk
  CHECK ("tipoDocumento" IN ('CC', 'NIT')),
  ADD CONSTRAINT clientes_tipo_cliente_chk
  CHECK ("tipoCliente" IN ('Tienda', 'Restaurante', 'Supermercado', 'Persona Natural', 'Otro'));

ALTER TABLE empleados
  ADD CONSTRAINT empleados_tipo_documento_chk
  CHECK ("tipoDocumento" IN ('CC', 'CE', 'TI', 'PPT', 'PASAPORTE', 'NIT')),
  ADD CONSTRAINT empleados_estado_chk
  CHECK (estado IN ('Activo', 'Inactivo')),
  ADD CONSTRAINT empleados_salario_chk
  CHECK (salario >= 0);

-- ---------- PRODUCTOS ----------
ALTER TABLE productos
  ADD CONSTRAINT productos_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT productos_estado_chk
  CHECK (estado IN ('Activo', 'Inactivo')),
  ADD CONSTRAINT productos_precios_chk
  CHECK ("precioCompra" >= 0 AND "precioVenta" >= 0 AND "costoPromedio" >= 0),
  ADD CONSTRAINT productos_stock_reservado_chk
  CHECK ("stockReservado" >= 0),
  ADD CONSTRAINT productos_stock_minimo_chk
  CHECK ("stockMinimo" >= 0);

ALTER TABLE producto_presentaciones
  ADD CONSTRAINT presentaciones_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT presentaciones_estado_chk
  CHECK (estado IN ('Activa', 'Inactiva')),
  ADD CONSTRAINT presentaciones_precios_chk
  CHECK ("precioCompra" >= 0 AND "precioVenta" >= 0 AND "costoPromedio" >= 0),
  ADD CONSTRAINT presentaciones_stock_reservado_chk
  CHECK ("stockReservado" >= 0),
  ADD CONSTRAINT presentaciones_stock_minimo_chk
  CHECK ("stockMinimo" >= 0);

-- Una regla pertenece al producto principal O a una presentación, nunca a ambos.
ALTER TABLE reglas_precio
  ADD CONSTRAINT reglas_precio_propietario_chk
  CHECK (num_nonnulls("productoId", "presentacionId") = 1),
  ADD CONSTRAINT reglas_precio_valores_chk
  CHECK (desde >= 0 AND precio >= 0);

-- ---------- PEDIDOS ----------
ALTER TABLE pedidos
  ADD CONSTRAINT pedidos_estado_chk
  CHECK (estado IN ('Borrador', 'En preparación', 'Listo para entrega', 'Cancelado')),
  ADD CONSTRAINT pedidos_totales_chk
  CHECK (subtotal >= 0 AND descuento >= 0 AND total >= 0);

ALTER TABLE pedido_items
  ADD CONSTRAINT pedido_items_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT pedido_items_cantidad_chk
  CHECK (
    ("tipoVenta" = 'Peso' AND cantidad >= 0)
    OR
    ("tipoVenta" = 'Unidad' AND cantidad >= 1)
  ),
  ADD CONSTRAINT pedido_items_precios_chk
  CHECK ("precioNormal" >= 0 AND "precioAplicado" >= 0 AND subtotal >= 0),
  ADD CONSTRAINT pedido_items_regla_desde_chk
  CHECK ("reglaAplicadaDesde" IS NULL OR "reglaAplicadaDesde" >= 0);

-- ---------- ENTREGAS ----------
ALTER TABLE entregas
  ADD CONSTRAINT entregas_metodo_pago_chk
  CHECK ("metodoPago" IN ('', 'Efectivo', 'Transferencia', 'Crédito')),
  ADD CONSTRAINT entregas_estado_chk
  CHECK (estado IN (
    'Por preparar', 'Pendiente', 'En ruta', 'Entregado', 'Cancelado',
    'Pendiente de entrega', 'No entregado'
  )),
  ADD CONSTRAINT entregas_totales_chk
  CHECK (subtotal >= 0 AND descuento >= 0 AND total >= 0);

ALTER TABLE entrega_items
  ADD CONSTRAINT entrega_items_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT entrega_items_cantidad_chk
  CHECK (
    ("tipoVenta" = 'Peso' AND "cantidadSolicitada" >= 0)
    OR
    ("tipoVenta" = 'Unidad' AND "cantidadSolicitada" >= 1)
  ),
  ADD CONSTRAINT entrega_items_valores_chk
  CHECK (
    "precioUnitario" >= 0
    AND ("pesoReal" IS NULL OR "pesoReal" >= 0)
    AND subtotal >= 0
  );

-- ---------- FACTURAS ----------
ALTER TABLE facturas
  ADD CONSTRAINT facturas_metodo_pago_chk
  CHECK ("metodoPago" IN ('Efectivo', 'Transferencia', 'Crédito')),
  ADD CONSTRAINT facturas_estado_chk
  CHECK (estado IN ('Emitida', 'Pagada', 'Pendiente', 'Anulada')),
  ADD CONSTRAINT facturas_totales_chk
  CHECK (subtotal >= 0 AND descuento >= 0 AND iva >= 0 AND total >= 0);

ALTER TABLE factura_items
  ADD CONSTRAINT factura_items_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT factura_items_valores_chk
  CHECK (
    "cantidadSolicitada" >= 0
    AND ("pesoReal" IS NULL OR "pesoReal" >= 0)
    AND cantidad >= 0
    AND "precioAplicado" >= 0
    AND subtotal >= 0
  );

-- Solo una factura NO anulada por pedido.
-- Se permiten varias históricas anuladas y una nueva activa.
CREATE UNIQUE INDEX IF NOT EXISTS facturas_unica_activa_por_pedido
  ON facturas ("pedidoId")
  WHERE estado <> 'Anulada';

-- Si existe entrega asociada, también debe tener una sola factura activa.
CREATE UNIQUE INDEX IF NOT EXISTS facturas_unica_activa_por_entrega
  ON facturas ("entregaId")
  WHERE "entregaId" IS NOT NULL AND estado <> 'Anulada';

-- ---------- INVENTARIO ----------
ALTER TABLE movimientos_inventario
  ADD CONSTRAINT movimientos_inventario_tipo_chk
  CHECK (tipo IN (
    'ENTRADA', 'SALIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO',
    'RESERVA', 'LIBERACION_RESERVA', 'ENTREGA', 'REVERSION_ENTREGA'
  )),
  ADD CONSTRAINT movimientos_inventario_tipo_venta_chk
  CHECK ("tipoVenta" IN ('Unidad', 'Peso')),
  ADD CONSTRAINT movimientos_inventario_origen_chk
  CHECK (origen IN ('Manual', 'Pedido', 'Entrega', 'Producto', 'Ajuste', 'Inicial')),
  ADD CONSTRAINT movimientos_inventario_valores_chk
  CHECK (
    cantidad >= 0
    AND "reservadoAnterior" >= 0
    AND "reservadoNuevo" >= 0
    AND "costoUnitario" >= 0
    AND "costoPromedioAnterior" >= 0
    AND "costoPromedioNuevo" >= 0
    AND "valorTotal" >= 0
  );

-- NO se impone stock >= 0 a nivel DB porque Preferencia.permitirInventarioNegativo
-- debe poder habilitarlo en el futuro. Esa regla queda en la capa de servicio.

-- ---------- CAJA ----------
ALTER TABLE cajas
  ADD CONSTRAINT cajas_estado_chk
  CHECK (estado IN ('Abierta', 'Cerrada')),
  ADD CONSTRAINT cajas_valores_chk
  CHECK (
    "saldoInicial" >= 0
    AND "cantidadPedidosEntregados" >= 0
    AND "totalVentasEntregadas" >= 0
    AND "totalEfectivoPedidos" >= 0
    AND "totalTransferencias" >= 0
    AND "totalCredito" >= 0
    AND "totalIngresos" >= 0
    AND "totalIngresosManuales" >= 0
    AND "totalEgresos" >= 0
    AND "saldoEsperado" >= 0
    AND ("efectivoContado" IS NULL OR "efectivoContado" >= 0)
    AND "billetesDosMil" >= 0
    AND "billetesCincoMil" >= 0
    AND "billetesDiezMil" >= 0
    AND "billetesVeinteMil" >= 0
    AND "billetesCincuentaMil" >= 0
    AND "billetesCienMil" >= 0
  );

-- Equivalente al índice parcial de MongoDB: solo una caja abierta.
CREATE UNIQUE INDEX IF NOT EXISTS cajas_solo_una_abierta
  ON cajas (estado)
  WHERE estado = 'Abierta';

ALTER TABLE movimientos_caja
  ADD CONSTRAINT movimientos_caja_tipo_chk
  CHECK (tipo IN ('Ingreso', 'Egreso')),
  ADD CONSTRAINT movimientos_caja_origen_chk
  CHECK (origen IN ('Manual', 'Cartera', 'Entrega', 'Pedido', 'Factura', 'Anulación factura', 'Ajuste')),
  ADD CONSTRAINT movimientos_caja_metodo_pago_chk
  CHECK ("metodoPago" IN ('', 'Efectivo', 'Transferencia', 'Crédito')),
  ADD CONSTRAINT movimientos_caja_estado_chk
  CHECK (estado IN ('Activo', 'Anulado')),
  ADD CONSTRAINT movimientos_caja_valor_chk
  CHECK (valor > 0);

-- ---------- CARTERA ----------
ALTER TABLE carteras
  ADD CONSTRAINT carteras_metodo_chk
  CHECK ("metodoPagoOriginal" = 'Crédito'),
  ADD CONSTRAINT carteras_estado_chk
  CHECK (estado IN ('Pendiente', 'Abonada', 'Pagada')),
  ADD CONSTRAINT carteras_valores_chk
  CHECK (
    "valorOriginal" > 0
    AND "totalAbonado" >= 0
    AND "saldoPendiente" >= 0
  );

ALTER TABLE pagos_cartera
  ADD CONSTRAINT pagos_cartera_metodo_chk
  CHECK ("metodoPago" IN ('Efectivo', 'Transferencia')),
  ADD CONSTRAINT pagos_cartera_estado_chk
  CHECK (estado IN ('Activo', 'Anulado')),
  ADD CONSTRAINT pagos_cartera_valor_chk
  CHECK (valor > 0);

-- ---------- CONFIGURACIÓN ----------
ALTER TABLE configuraciones
  ADD CONSTRAINT configuracion_rangos_chk
  CHECK (
    "rangoAutorizadoDesde" >= 1
    AND "rangoAutorizadoHasta" >= 1
    AND "consecutivoActual" >= 1
    AND iva >= 0
    AND iva <= 100
    AND "consecutivoRuta" >= 0
  );

ALTER TABLE preferencias
  ADD CONSTRAINT preferencias_moneda_chk
  CHECK (moneda IN ('COP', 'USD', 'EUR')),
  ADD CONSTRAINT preferencias_decimales_chk
  CHECK (decimales IN (0, 2)),
  ADD CONSTRAINT preferencias_formato_fecha_chk
  CHECK ("formatoFecha" IN ('DD/MM/YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY'));

ALTER TABLE consecutivos
  ADD CONSTRAINT consecutivos_numero_chk
  CHECK ("ultimoNumero" >= 0);
