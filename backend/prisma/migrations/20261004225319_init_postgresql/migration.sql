-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40),
    "nombres" VARCHAR(120) NOT NULL,
    "documento" VARCHAR(40) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "usuario" VARCHAR(80) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "rol" VARCHAR(30) NOT NULL DEFAULT 'Empleado',
    "estado" VARCHAR(30) NOT NULL DEFAULT 'Activo',
    "debeCambiarPassword" BOOLEAN NOT NULL DEFAULT false,
    "ultimoIngreso" TIMESTAMPTZ(3),
    "creadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditorias" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "usuarioId" UUID,
    "codigoUsuario" VARCHAR(40) NOT NULL DEFAULT '',
    "nombreUsuario" VARCHAR(250) NOT NULL DEFAULT '',
    "modulo" VARCHAR(80) NOT NULL,
    "accion" VARCHAR(40) NOT NULL,
    "registroId" VARCHAR(64),
    "codigoRegistro" VARCHAR(80) NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "ip" VARCHAR(64) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "auditorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activa',
    "creadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_despacho" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40),
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activa',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "zonas_despacho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "usuarioResponsableId" UUID,
    "diasAtencion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activa',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruta_zonas" (
    "id" UUID NOT NULL,
    "rutaId" UUID NOT NULL,
    "zonaId" UUID NOT NULL,

    CONSTRAINT "ruta_zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40),
    "tipoDocumento" VARCHAR(10) NOT NULL DEFAULT 'CC',
    "documento" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(180) NOT NULL,
    "razonSocial" VARCHAR(200) NOT NULL DEFAULT '',
    "telefono" VARCHAR(40) NOT NULL DEFAULT '',
    "direccion" VARCHAR(250) NOT NULL DEFAULT '',
    "barrio" VARCHAR(120) NOT NULL DEFAULT '',
    "zonaDespachoId" UUID,
    "ciudad" VARCHAR(120) NOT NULL DEFAULT '',
    "tipoCliente" VARCHAR(40) NOT NULL DEFAULT 'Tienda',
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "tipoDocumento" VARCHAR(20) NOT NULL DEFAULT 'CC',
    "documento" VARCHAR(40) NOT NULL,
    "nombres" VARCHAR(120) NOT NULL,
    "apellidos" VARCHAR(120) NOT NULL,
    "telefono" VARCHAR(40) NOT NULL DEFAULT '',
    "direccion" VARCHAR(250) NOT NULL DEFAULT '',
    "ciudad" VARCHAR(120) NOT NULL DEFAULT 'Ibagué',
    "cargo" VARCHAR(120) NOT NULL,
    "fechaIngreso" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salario" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "rutaAsignadaId" UUID,
    "usuarioId" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "observaciones" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(180) NOT NULL,
    "categoriaId" UUID NOT NULL,
    "marca" VARCHAR(120) NOT NULL DEFAULT '',
    "descripcion" TEXT NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL DEFAULT 'Unidad',
    "unidad" VARCHAR(40) NOT NULL DEFAULT 'Unidad',
    "precioCompra" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "precioVenta" DECIMAL(18,2) NOT NULL,
    "stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockReservado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "controlInventario" BOOLEAN NOT NULL DEFAULT true,
    "costoPromedio" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "sabores" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "imagen" TEXT NOT NULL DEFAULT '',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "creadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_presentaciones" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "productoId" UUID NOT NULL,
    "nombre" VARCHAR(180) NOT NULL,
    "tipoVenta" VARCHAR(20) NOT NULL DEFAULT 'Unidad',
    "unidad" VARCHAR(40) NOT NULL,
    "precioCompra" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "precioVenta" DECIMAL(18,2) NOT NULL,
    "stock" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockReservado" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockMinimo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "controlInventario" BOOLEAN NOT NULL DEFAULT true,
    "costoPromedio" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activa',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "producto_presentaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_precio" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "productoId" UUID,
    "presentacionId" UUID,
    "desde" DECIMAL(18,4) NOT NULL,
    "precio" DECIMAL(18,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "reglas_precio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "clienteId" UUID,
    "clienteCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "clienteRazonSocial" VARCHAR(200) NOT NULL DEFAULT '',
    "clienteTelefono" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteDireccion" VARCHAR(250) NOT NULL DEFAULT '',
    "clienteBarrio" VARCHAR(120) NOT NULL DEFAULT '',
    "clienteCiudad" VARCHAR(120) NOT NULL DEFAULT '',
    "clienteTipo" VARCHAR(40) NOT NULL DEFAULT '',
    "zonaDespachoId" UUID,
    "zonaDespachoCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "zonaDespachoNombre" VARCHAR(120) NOT NULL DEFAULT '',
    "rutaId" UUID,
    "rutaCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "rutaNombre" VARCHAR(120) NOT NULL DEFAULT '',
    "rutaDiasAtencion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "empleadoId" UUID NOT NULL,
    "empacadorId" UUID,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "estado" VARCHAR(40) NOT NULL DEFAULT 'Borrador',
    "inventarioReservado" BOOLEAN NOT NULL DEFAULT false,
    "fechaReservaInventario" TIMESTAMPTZ(3),
    "fechaEntrega" DATE,
    "observaciones" TEXT NOT NULL DEFAULT '',
    "creadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedido_items" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "pedidoId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "codigoProducto" VARCHAR(40) NOT NULL DEFAULT '',
    "nombre" VARCHAR(180) NOT NULL,
    "marca" VARCHAR(120) NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL,
    "unidad" VARCHAR(40) NOT NULL,
    "presentacionId" UUID,
    "presentacionNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "cantidad" INTEGER NOT NULL,
    "precioNormal" DECIMAL(18,2) NOT NULL,
    "precioAplicado" DECIMAL(18,2) NOT NULL,
    "aplicoPrecioCantidad" BOOLEAN NOT NULL DEFAULT false,
    "reglaAplicadaDesde" DECIMAL(18,4),
    "subtotal" DECIMAL(18,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pedido_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entregas" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "pedidoId" UUID NOT NULL,
    "pedidoCodigo" VARCHAR(40) NOT NULL,
    "clienteId" UUID,
    "clienteCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "clienteTelefono" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteDireccion" VARCHAR(250) NOT NULL DEFAULT '',
    "clienteBarrio" VARCHAR(120) NOT NULL DEFAULT '',
    "clienteCiudad" VARCHAR(120) NOT NULL DEFAULT '',
    "zonaDespachoId" UUID,
    "zonaDespachoNombre" VARCHAR(120) NOT NULL DEFAULT '',
    "rutaId" UUID,
    "rutaNombre" VARCHAR(120) NOT NULL DEFAULT '',
    "rutaDiasAtencion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fechaProgramada" DATE,
    "empacadorId" UUID,
    "repartidorId" UUID,
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "metodoPago" VARCHAR(30) NOT NULL DEFAULT '',
    "confirmada" BOOLEAN NOT NULL DEFAULT false,
    "preparacionGuardada" BOOLEAN NOT NULL DEFAULT false,
    "inventarioPesoReservado" BOOLEAN NOT NULL DEFAULT false,
    "inventarioDescontado" BOOLEAN NOT NULL DEFAULT false,
    "fechaReservaInventario" TIMESTAMPTZ(3),
    "fechaSalidaInventario" TIMESTAMPTZ(3),
    "fechaPreparacion" TIMESTAMPTZ(3),
    "fechaConfirmacion" TIMESTAMPTZ(3),
    "confirmadoPorId" UUID,
    "estado" VARCHAR(40) NOT NULL DEFAULT 'Por preparar',
    "motivoCancelacion" TEXT NOT NULL DEFAULT '',
    "motivoNoEntrega" TEXT NOT NULL DEFAULT '',
    "observaciones" TEXT NOT NULL DEFAULT '',
    "fechaSalida" TIMESTAMPTZ(3),
    "fechaEntregaReal" TIMESTAMPTZ(3),
    "actualizadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "entregas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entrega_items" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "entregaId" UUID NOT NULL,
    "pedidoItemId" UUID NOT NULL,
    "productoId" UUID NOT NULL,
    "codigoProducto" VARCHAR(40) NOT NULL DEFAULT '',
    "nombre" VARCHAR(180) NOT NULL,
    "presentacionId" UUID,
    "presentacionNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL,
    "unidad" VARCHAR(40) NOT NULL DEFAULT '',
    "cantidadSolicitada" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(18,2) NOT NULL,
    "pesoReal" DECIMAL(18,4),
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "entrega_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "consecutivo" INTEGER NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "pedidoId" UUID NOT NULL,
    "pedidoCodigo" VARCHAR(40) NOT NULL,
    "entregaId" UUID,
    "entregaCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteId" UUID NOT NULL,
    "clienteNombre" VARCHAR(180) NOT NULL,
    "clienteDocumento" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteTelefono" VARCHAR(40) NOT NULL DEFAULT '',
    "empleadoId" UUID,
    "empleadoNombre" VARCHAR(250) NOT NULL DEFAULT '',
    "repartidorId" UUID,
    "repartidorNombre" VARCHAR(250) NOT NULL DEFAULT '',
    "empacadorId" UUID,
    "empacadorNombre" VARCHAR(250) NOT NULL DEFAULT '',
    "subtotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "descuento" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "iva" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "metodoPago" VARCHAR(30) NOT NULL DEFAULT 'Efectivo',
    "estado" VARCHAR(30) NOT NULL DEFAULT 'Emitida',
    "motivoAnulacion" TEXT NOT NULL DEFAULT '',
    "fechaAnulacion" TIMESTAMPTZ(3),
    "fechaReversion" TIMESTAMPTZ(3),
    "observaciones" TEXT NOT NULL DEFAULT '',
    "creadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "facturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factura_items" (
    "id" UUID NOT NULL,
    "facturaId" UUID NOT NULL,
    "productoId" UUID,
    "nombre" VARCHAR(180) NOT NULL,
    "presentacionNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "unidad" VARCHAR(40) NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL DEFAULT 'Unidad',
    "cantidadSolicitada" INTEGER NOT NULL DEFAULT 0,
    "pesoReal" DECIMAL(18,4),
    "cantidad" DECIMAL(18,4) NOT NULL,
    "precioAplicado" DECIMAL(18,2) NOT NULL,
    "subtotal" DECIMAL(18,2) NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "factura_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "productoId" UUID NOT NULL,
    "codigoProducto" VARCHAR(40) NOT NULL DEFAULT '',
    "nombreProducto" VARCHAR(180) NOT NULL DEFAULT '',
    "presentacionId" UUID,
    "presentacionNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "tipo" VARCHAR(40) NOT NULL,
    "cantidad" DECIMAL(18,4) NOT NULL,
    "unidad" VARCHAR(40) NOT NULL DEFAULT '',
    "tipoVenta" VARCHAR(20) NOT NULL DEFAULT 'Unidad',
    "stockAnterior" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "stockNuevo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservadoAnterior" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "reservadoNuevo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costoUnitario" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costoPromedioAnterior" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "costoPromedioNuevo" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "valorTotal" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "origen" VARCHAR(30) NOT NULL DEFAULT 'Manual',
    "pedidoId" UUID,
    "pedidoCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "entregaId" UUID,
    "entregaCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "proveedor" VARCHAR(180) NOT NULL DEFAULT '',
    "documentoReferencia" VARCHAR(120) NOT NULL DEFAULT '',
    "fechaMovimiento" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo" TEXT NOT NULL DEFAULT '',
    "observaciones" TEXT NOT NULL DEFAULT '',
    "usuarioId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "fechaApertura" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMPTZ(3),
    "saldoInicial" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cantidadPedidosEntregados" INTEGER NOT NULL DEFAULT 0,
    "totalVentasEntregadas" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEfectivoPedidos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalTransferencias" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalCredito" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalIngresos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalIngresosManuales" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalEgresos" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoEsperado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "efectivoContado" DECIMAL(18,2),
    "billetesDosMil" INTEGER NOT NULL DEFAULT 0,
    "billetesCincoMil" INTEGER NOT NULL DEFAULT 0,
    "billetesDiezMil" INTEGER NOT NULL DEFAULT 0,
    "billetesVeinteMil" INTEGER NOT NULL DEFAULT 0,
    "billetesCincuentaMil" INTEGER NOT NULL DEFAULT 0,
    "billetesCienMil" INTEGER NOT NULL DEFAULT 0,
    "diferencia" DECIMAL(18,2),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Abierta',
    "observacionesApertura" TEXT NOT NULL DEFAULT '',
    "observacionesCierre" TEXT NOT NULL DEFAULT '',
    "abiertoPorId" UUID,
    "cerradoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "cajaId" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "origen" VARCHAR(40) NOT NULL DEFAULT 'Manual',
    "concepto" TEXT NOT NULL,
    "valor" DECIMAL(18,2) NOT NULL,
    "pedidoId" UUID,
    "pedidoCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "entregaId" UUID,
    "entregaCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteId" UUID,
    "clienteNombre" VARCHAR(180) NOT NULL DEFAULT '',
    "metodoPago" VARCHAR(30) NOT NULL DEFAULT '',
    "afectaEfectivo" BOOLEAN NOT NULL DEFAULT true,
    "carteraId" UUID,
    "facturaId" UUID,
    "facturaCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "observacion" TEXT NOT NULL DEFAULT '',
    "claveUnica" VARCHAR(120),
    "usuarioId" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carteras" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "codigo" VARCHAR(40) NOT NULL,
    "entregaId" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "pedidoCodigo" VARCHAR(40) NOT NULL,
    "clienteId" UUID,
    "clienteCodigo" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteNombre" VARCHAR(180) NOT NULL DEFAULT 'Cliente',
    "clienteDocumento" VARCHAR(40) NOT NULL DEFAULT '',
    "clienteTelefono" VARCHAR(40) NOT NULL DEFAULT '',
    "fechaEntrega" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaVencimiento" DATE,
    "valorOriginal" DECIMAL(18,2) NOT NULL,
    "totalAbonado" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL(18,2) NOT NULL,
    "metodoPagoOriginal" VARCHAR(30) NOT NULL DEFAULT 'Crédito',
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    "observaciones" TEXT NOT NULL DEFAULT '',
    "creadoPorId" UUID,
    "actualizadoPorId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "carteras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_cartera" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "carteraId" UUID NOT NULL,
    "entregaId" UUID NOT NULL,
    "pedidoId" UUID NOT NULL,
    "clienteId" UUID,
    "cajaId" UUID NOT NULL,
    "movimientoCajaId" UUID,
    "valor" DECIMAL(18,2) NOT NULL,
    "metodoPago" VARCHAR(30) NOT NULL,
    "referencia" VARCHAR(120) NOT NULL DEFAULT '',
    "observacion" TEXT NOT NULL DEFAULT '',
    "fechaPago" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" UUID,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'Activo',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "pagos_cartera_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuraciones" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "clave" VARCHAR(30) NOT NULL DEFAULT 'principal',
    "nombreComercial" VARCHAR(180) NOT NULL DEFAULT '',
    "razonSocial" VARCHAR(200) NOT NULL DEFAULT '',
    "nit" VARCHAR(40) NOT NULL DEFAULT '',
    "regimenTributario" VARCHAR(120) NOT NULL DEFAULT '',
    "direccion" VARCHAR(250) NOT NULL DEFAULT '',
    "ciudad" VARCHAR(120) NOT NULL DEFAULT '',
    "departamento" VARCHAR(120) NOT NULL DEFAULT '',
    "pais" VARCHAR(120) NOT NULL DEFAULT 'Colombia',
    "telefono" VARCHAR(40) NOT NULL DEFAULT '',
    "celular" VARCHAR(40) NOT NULL DEFAULT '',
    "whatsapp" VARCHAR(40) NOT NULL DEFAULT '',
    "correo" VARCHAR(180) NOT NULL DEFAULT '',
    "paginaWeb" VARCHAR(250) NOT NULL DEFAULT '',
    "logo" TEXT NOT NULL DEFAULT '',
    "prefijoFactura" VARCHAR(20) NOT NULL DEFAULT 'FAC',
    "resolucionDIAN" VARCHAR(120) NOT NULL DEFAULT '',
    "fechaResolucionDIAN" DATE,
    "vigenciaDesde" DATE,
    "vigenciaHasta" DATE,
    "rangoAutorizadoDesde" INTEGER NOT NULL DEFAULT 1,
    "rangoAutorizadoHasta" INTEGER NOT NULL DEFAULT 999999,
    "consecutivoActual" INTEGER NOT NULL DEFAULT 1,
    "iva" DECIMAL(5,2) NOT NULL DEFAULT 19,
    "piePaginaFactura" TEXT NOT NULL DEFAULT '',
    "observacionesFactura" TEXT NOT NULL DEFAULT '',
    "consecutivoRuta" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "configuraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferencias" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "clave" VARCHAR(30) NOT NULL DEFAULT 'principal',
    "moneda" VARCHAR(10) NOT NULL DEFAULT 'COP',
    "simboloMoneda" VARCHAR(10) NOT NULL DEFAULT '$',
    "decimales" INTEGER NOT NULL DEFAULT 0,
    "formatoFecha" VARCHAR(20) NOT NULL DEFAULT 'DD/MM/YYYY',
    "permitirInventarioNegativo" BOOLEAN NOT NULL DEFAULT false,
    "confirmarAntesEliminar" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "preferencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consecutivos" (
    "id" UUID NOT NULL,
    "legacyMongoId" VARCHAR(24),
    "clave" VARCHAR(80) NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "consecutivos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_legacyMongoId_key" ON "usuarios"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_codigo_key" ON "usuarios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_key" ON "usuarios"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

-- CreateIndex
CREATE INDEX "usuarios_estado_idx" ON "usuarios"("estado");

-- CreateIndex
CREATE INDEX "usuarios_rol_idx" ON "usuarios"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "auditorias_legacyMongoId_key" ON "auditorias"("legacyMongoId");

-- CreateIndex
CREATE INDEX "auditorias_createdAt_idx" ON "auditorias"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "auditorias_modulo_idx" ON "auditorias"("modulo");

-- CreateIndex
CREATE INDEX "auditorias_accion_idx" ON "auditorias"("accion");

-- CreateIndex
CREATE INDEX "auditorias_usuarioId_idx" ON "auditorias"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_legacyMongoId_key" ON "categorias"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_codigo_key" ON "categorias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE INDEX "categorias_estado_idx" ON "categorias"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_despacho_legacyMongoId_key" ON "zonas_despacho"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_despacho_codigo_key" ON "zonas_despacho"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_despacho_nombre_key" ON "zonas_despacho"("nombre");

-- CreateIndex
CREATE INDEX "zonas_despacho_estado_idx" ON "zonas_despacho"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_legacyMongoId_key" ON "rutas"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "rutas_codigo_key" ON "rutas"("codigo");

-- CreateIndex
CREATE INDEX "rutas_nombre_idx" ON "rutas"("nombre");

-- CreateIndex
CREATE INDEX "rutas_usuarioResponsableId_idx" ON "rutas"("usuarioResponsableId");

-- CreateIndex
CREATE INDEX "rutas_estado_idx" ON "rutas"("estado");

-- CreateIndex
CREATE INDEX "ruta_zonas_zonaId_idx" ON "ruta_zonas"("zonaId");

-- CreateIndex
CREATE UNIQUE INDEX "ruta_zonas_rutaId_zonaId_key" ON "ruta_zonas"("rutaId", "zonaId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_legacyMongoId_key" ON "clientes"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_documento_key" ON "clientes"("documento");

-- CreateIndex
CREATE INDEX "clientes_zonaDespachoId_idx" ON "clientes"("zonaDespachoId");

-- CreateIndex
CREATE INDEX "clientes_estado_idx" ON "clientes"("estado");

-- CreateIndex
CREATE INDEX "clientes_nombre_idx" ON "clientes"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_legacyMongoId_key" ON "empleados"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_codigo_key" ON "empleados"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_documento_key" ON "empleados"("documento");

-- CreateIndex
CREATE INDEX "empleados_nombres_apellidos_idx" ON "empleados"("nombres", "apellidos");

-- CreateIndex
CREATE INDEX "empleados_cargo_estado_idx" ON "empleados"("cargo", "estado");

-- CreateIndex
CREATE INDEX "empleados_rutaAsignadaId_idx" ON "empleados"("rutaAsignadaId");

-- CreateIndex
CREATE INDEX "empleados_usuarioId_idx" ON "empleados"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_legacyMongoId_key" ON "productos"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_codigo_key" ON "productos"("codigo");

-- CreateIndex
CREATE INDEX "productos_categoriaId_nombre_idx" ON "productos"("categoriaId", "nombre");

-- CreateIndex
CREATE INDEX "productos_estado_idx" ON "productos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "producto_presentaciones_legacyMongoId_key" ON "producto_presentaciones"("legacyMongoId");

-- CreateIndex
CREATE INDEX "producto_presentaciones_productoId_estado_idx" ON "producto_presentaciones"("productoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "producto_presentaciones_productoId_nombre_key" ON "producto_presentaciones"("productoId", "nombre");

-- CreateIndex
CREATE INDEX "reglas_precio_productoId_desde_idx" ON "reglas_precio"("productoId", "desde");

-- CreateIndex
CREATE INDEX "reglas_precio_presentacionId_desde_idx" ON "reglas_precio"("presentacionId", "desde");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_legacyMongoId_key" ON "pedidos"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "pedidos_codigo_key" ON "pedidos"("codigo");

-- CreateIndex
CREATE INDEX "pedidos_clienteId_createdAt_idx" ON "pedidos"("clienteId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "pedidos_empleadoId_createdAt_idx" ON "pedidos"("empleadoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "pedidos_empacadorId_createdAt_idx" ON "pedidos"("empacadorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "pedidos_estado_createdAt_idx" ON "pedidos"("estado", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "pedidos_rutaId_idx" ON "pedidos"("rutaId");

-- CreateIndex
CREATE INDEX "pedidos_zonaDespachoId_idx" ON "pedidos"("zonaDespachoId");

-- CreateIndex
CREATE UNIQUE INDEX "pedido_items_legacyMongoId_key" ON "pedido_items"("legacyMongoId");

-- CreateIndex
CREATE INDEX "pedido_items_pedidoId_orden_idx" ON "pedido_items"("pedidoId", "orden");

-- CreateIndex
CREATE INDEX "pedido_items_productoId_idx" ON "pedido_items"("productoId");

-- CreateIndex
CREATE INDEX "pedido_items_presentacionId_idx" ON "pedido_items"("presentacionId");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_legacyMongoId_key" ON "entregas"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "entregas_pedidoId_key" ON "entregas"("pedidoId");

-- CreateIndex
CREATE INDEX "entregas_estado_fechaProgramada_idx" ON "entregas"("estado", "fechaProgramada");

-- CreateIndex
CREATE INDEX "entregas_repartidorId_estado_idx" ON "entregas"("repartidorId", "estado");

-- CreateIndex
CREATE INDEX "entregas_clienteId_idx" ON "entregas"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_items_legacyMongoId_key" ON "entrega_items"("legacyMongoId");

-- CreateIndex
CREATE INDEX "entrega_items_productoId_idx" ON "entrega_items"("productoId");

-- CreateIndex
CREATE INDEX "entrega_items_presentacionId_idx" ON "entrega_items"("presentacionId");

-- CreateIndex
CREATE UNIQUE INDEX "entrega_items_entregaId_pedidoItemId_key" ON "entrega_items"("entregaId", "pedidoItemId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_legacyMongoId_key" ON "facturas"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_consecutivo_key" ON "facturas"("consecutivo");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_codigo_key" ON "facturas"("codigo");

-- CreateIndex
CREATE INDEX "facturas_createdAt_idx" ON "facturas"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_pedidoId_createdAt_idx" ON "facturas"("pedidoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_entregaId_createdAt_idx" ON "facturas"("entregaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_clienteId_createdAt_idx" ON "facturas"("clienteId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_empleadoId_createdAt_idx" ON "facturas"("empleadoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_repartidorId_createdAt_idx" ON "facturas"("repartidorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_empacadorId_createdAt_idx" ON "facturas"("empacadorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "facturas_estado_idx" ON "facturas"("estado");

-- CreateIndex
CREATE INDEX "factura_items_facturaId_orden_idx" ON "factura_items"("facturaId", "orden");

-- CreateIndex
CREATE INDEX "factura_items_productoId_idx" ON "factura_items"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_inventario_legacyMongoId_key" ON "movimientos_inventario"("legacyMongoId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_productoId_fechaMovimiento_idx" ON "movimientos_inventario"("productoId", "fechaMovimiento" DESC);

-- CreateIndex
CREATE INDEX "movimientos_inventario_productoId_presentacionId_fechaMovim_idx" ON "movimientos_inventario"("productoId", "presentacionId", "fechaMovimiento" DESC);

-- CreateIndex
CREATE INDEX "movimientos_inventario_pedidoId_idx" ON "movimientos_inventario"("pedidoId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_entregaId_idx" ON "movimientos_inventario"("entregaId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipo_idx" ON "movimientos_inventario"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_legacyMongoId_key" ON "cajas"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "cajas_codigo_key" ON "cajas"("codigo");

-- CreateIndex
CREATE INDEX "cajas_createdAt_idx" ON "cajas"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "cajas_estado_idx" ON "cajas"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_caja_legacyMongoId_key" ON "movimientos_caja"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_caja_claveUnica_key" ON "movimientos_caja"("claveUnica");

-- CreateIndex
CREATE INDEX "movimientos_caja_cajaId_createdAt_idx" ON "movimientos_caja"("cajaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_pedidoId_createdAt_idx" ON "movimientos_caja"("pedidoId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_entregaId_createdAt_idx" ON "movimientos_caja"("entregaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_facturaId_createdAt_idx" ON "movimientos_caja"("facturaId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_carteraId_createdAt_idx" ON "movimientos_caja"("carteraId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_metodoPago_createdAt_idx" ON "movimientos_caja"("metodoPago", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "movimientos_caja_tipo_createdAt_idx" ON "movimientos_caja"("tipo", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "carteras_legacyMongoId_key" ON "carteras"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "carteras_codigo_key" ON "carteras"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "carteras_entregaId_key" ON "carteras"("entregaId");

-- CreateIndex
CREATE INDEX "carteras_estado_fechaEntrega_idx" ON "carteras"("estado", "fechaEntrega" DESC);

-- CreateIndex
CREATE INDEX "carteras_clienteId_estado_idx" ON "carteras"("clienteId", "estado");

-- CreateIndex
CREATE INDEX "carteras_pedidoCodigo_idx" ON "carteras"("pedidoCodigo");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_cartera_legacyMongoId_key" ON "pagos_cartera"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_cartera_movimientoCajaId_key" ON "pagos_cartera"("movimientoCajaId");

-- CreateIndex
CREATE INDEX "pagos_cartera_carteraId_fechaPago_idx" ON "pagos_cartera"("carteraId", "fechaPago" DESC);

-- CreateIndex
CREATE INDEX "pagos_cartera_cajaId_fechaPago_idx" ON "pagos_cartera"("cajaId", "fechaPago" DESC);

-- CreateIndex
CREATE INDEX "pagos_cartera_pedidoId_idx" ON "pagos_cartera"("pedidoId");

-- CreateIndex
CREATE INDEX "pagos_cartera_entregaId_idx" ON "pagos_cartera"("entregaId");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_legacyMongoId_key" ON "configuraciones"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuraciones_clave_key" ON "configuraciones"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_legacyMongoId_key" ON "preferencias"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "preferencias_clave_key" ON "preferencias"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "consecutivos_legacyMongoId_key" ON "consecutivos"("legacyMongoId");

-- CreateIndex
CREATE UNIQUE INDEX "consecutivos_clave_key" ON "consecutivos"("clave");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditorias" ADD CONSTRAINT "auditorias_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias" ADD CONSTRAINT "categorias_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_usuarioResponsableId_fkey" FOREIGN KEY ("usuarioResponsableId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_zonas" ADD CONSTRAINT "ruta_zonas_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_zonas" ADD CONSTRAINT "ruta_zonas_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas_despacho"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_zonaDespachoId_fkey" FOREIGN KEY ("zonaDespachoId") REFERENCES "zonas_despacho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_rutaAsignadaId_fkey" FOREIGN KEY ("rutaAsignadaId") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_presentaciones" ADD CONSTRAINT "producto_presentaciones_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_precio" ADD CONSTRAINT "reglas_precio_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_precio" ADD CONSTRAINT "reglas_precio_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "producto_presentaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_zonaDespachoId_fkey" FOREIGN KEY ("zonaDespachoId") REFERENCES "zonas_despacho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empacadorId_fkey" FOREIGN KEY ("empacadorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "producto_presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_zonaDespachoId_fkey" FOREIGN KEY ("zonaDespachoId") REFERENCES "zonas_despacho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_rutaId_fkey" FOREIGN KEY ("rutaId") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_empacadorId_fkey" FOREIGN KEY ("empacadorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_confirmadoPorId_fkey" FOREIGN KEY ("confirmadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_items" ADD CONSTRAINT "entrega_items_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_items" ADD CONSTRAINT "entrega_items_pedidoItemId_fkey" FOREIGN KEY ("pedidoItemId") REFERENCES "pedido_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_items" ADD CONSTRAINT "entrega_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entrega_items" ADD CONSTRAINT "entrega_items_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "producto_presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_repartidorId_fkey" FOREIGN KEY ("repartidorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_empacadorId_fkey" FOREIGN KEY ("empacadorId") REFERENCES "empleados"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas" ADD CONSTRAINT "facturas_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura_items" ADD CONSTRAINT "factura_items_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "factura_items" ADD CONSTRAINT "factura_items_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_presentacionId_fkey" FOREIGN KEY ("presentacionId") REFERENCES "producto_presentaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_abiertoPorId_fkey" FOREIGN KEY ("abiertoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_cerradoPorId_fkey" FOREIGN KEY ("cerradoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "carteras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_facturaId_fkey" FOREIGN KEY ("facturaId") REFERENCES "facturas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteras" ADD CONSTRAINT "carteras_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_carteraId_fkey" FOREIGN KEY ("carteraId") REFERENCES "carteras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_entregaId_fkey" FOREIGN KEY ("entregaId") REFERENCES "entregas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_movimientoCajaId_fkey" FOREIGN KEY ("movimientoCajaId") REFERENCES "movimientos_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos_cartera" ADD CONSTRAINT "pagos_cartera_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
