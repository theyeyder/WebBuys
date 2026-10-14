
import {
  prisma, idCompatibilidad, numero, texto, resolverCompat, usuarioIdReq,
  incrementarConsecutivoTx, registrarAuditoriaPostgreSQL, responderError
} from "./_transactional.js";

function salidaUsuario(u) {
  if (!u) return null;
  return { _id: idCompatibilidad(u), id: idCompatibilidad(u), postgresId: u.id, nombres: u.nombres, apellidos: u.apellidos, usuario: u.usuario };
}
function salidaMovimiento(m) {
  if (!m) return null;
  return {
    _id: idCompatibilidad(m), id: idCompatibilidad(m), postgresId: m.id, legacyMongoId: m.legacyMongoId || null,
    caja: m.caja ? { _id: idCompatibilidad(m.caja), id: idCompatibilidad(m.caja), postgresId: m.caja.id, codigo: m.caja.codigo, estado: m.caja.estado } : m.cajaId,
    tipo: m.tipo, origen: m.origen, concepto: m.concepto, valor: numero(m.valor),
    pedido: m.pedido ? { _id: idCompatibilidad(m.pedido), id: idCompatibilidad(m.pedido), postgresId: m.pedido.id, codigo: m.pedido.codigo } : null,
    pedidoCodigo: m.pedidoCodigo, entregaCodigo: m.entregaCodigo, clienteNombre: m.clienteNombre,
    metodoPago: m.metodoPago, afectaEfectivo: m.afectaEfectivo, facturaCodigo: m.facturaCodigo,
    observacion: m.observacion, usuario: salidaUsuario(m.usuario), estado: m.estado, createdAt: m.createdAt,
  };
}
function salidaCaja(c) {
  if (!c) return null;
  return {
    _id: idCompatibilidad(c), id: idCompatibilidad(c), postgresId: c.id, legacyMongoId: c.legacyMongoId || null,
    codigo: c.codigo, fechaApertura: c.fechaApertura, fechaCierre: c.fechaCierre,
    saldoInicial: numero(c.saldoInicial), cantidadPedidosEntregados: c.cantidadPedidosEntregados,
    totalVentasEntregadas: numero(c.totalVentasEntregadas), totalEfectivoPedidos: numero(c.totalEfectivoPedidos),
    totalTransferencias: numero(c.totalTransferencias), totalCredito: numero(c.totalCredito),
    totalIngresos: numero(c.totalIngresos), totalIngresosManuales: numero(c.totalIngresosManuales),
    totalEgresos: numero(c.totalEgresos), saldoEsperado: numero(c.saldoEsperado),
    efectivoContado: c.efectivoContado === null ? null : numero(c.efectivoContado),
    billetesDosMil: c.billetesDosMil, billetesCincoMil: c.billetesCincoMil, billetesDiezMil: c.billetesDiezMil,
    billetesVeinteMil: c.billetesVeinteMil, billetesCincuentaMil: c.billetesCincuentaMil, billetesCienMil: c.billetesCienMil,
    diferencia: c.diferencia === null ? null : numero(c.diferencia), estado: c.estado,
    observacionesApertura: c.observacionesApertura, observacionesCierre: c.observacionesCierre,
    abiertoPor: salidaUsuario(c.abiertoPor), cerradoPor: salidaUsuario(c.cerradoPor),
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

async function totales(cajaId) {
  const movs = await prisma.movimientoCaja.findMany({ where: { cajaId, estado: "Activo" } });
  let totalIngresos=0,totalEgresos=0,totalIngresosManuales=0,totalEfectivoPedidos=0,totalTransferencias=0,totalCredito=0,totalVentasEntregadas=0;
  const pedidos = new Set();
  for (const m of movs) {
    const v=numero(m.valor);
    if (m.tipo==="Ingreso") totalIngresos+=v;
    if (m.tipo==="Egreso") totalEgresos+=v;
    if (m.tipo==="Ingreso" && m.origen==="Manual") totalIngresosManuales+=v;
    if (m.origen==="Pedido") {
      if (m.pedidoId) pedidos.add(m.pedidoId);
      totalVentasEntregadas+=v;
      if (m.metodoPago==="Efectivo") totalEfectivoPedidos+=v;
      if (m.metodoPago==="Transferencia") totalTransferencias+=v;
      if (m.metodoPago==="Crédito") totalCredito+=v;
    }
  }
  return {
    cantidadPedidosEntregados: pedidos.size,
    totalVentasEntregadas:Number(totalVentasEntregadas.toFixed(2)),
    totalEfectivoPedidos:Number(totalEfectivoPedidos.toFixed(2)),
    totalTransferencias:Number(totalTransferencias.toFixed(2)),
    totalCredito:Number(totalCredito.toFixed(2)),
    totalIngresos:Number(totalIngresos.toFixed(2)),
    totalIngresosManuales:Number(totalIngresosManuales.toFixed(2)),
    totalEgresos:Number(totalEgresos.toFixed(2)),
  };
}

async function construirResumen(caja) {
  if (!caja) return { abierta: false, caja: null, resumen: { saldoInicial:0,totalIngresos:0,totalEgresos:0,saldoActual:0,saldoEsperado:0 }, movimientos: [] };
  const t=await totales(caja.id);
  const saldoEsperado=Number((numero(caja.saldoInicial)+t.totalIngresos-t.totalEgresos).toFixed(2));
  const movimientos=await prisma.movimientoCaja.findMany({
    where:{cajaId:caja.id,estado:"Activo"},
    include:{usuario:true,pedido:true,entrega:true,factura:true,cartera:true},
    orderBy:{createdAt:"desc"},
  });
  return {
    abierta: caja.estado === "Abierta",
    caja: salidaCaja(caja),
    resumen: {
      saldoInicial:numero(caja.saldoInicial), ...t, saldoActual:saldoEsperado, saldoEsperado,
      efectivoContado:caja.efectivoContado===null?null:numero(caja.efectivoContado),
      diferencia:caja.diferencia===null?null:numero(caja.diferencia),
    },
    movimientos: movimientos.map(salidaMovimiento),
  };
}

async function resumen(_req,res){
  try{
    let caja=await prisma.caja.findFirst({where:{estado:"Abierta"},include:{abiertoPor:true,cerradoPor:true},orderBy:{fechaApertura:"desc"}});
    if(!caja) caja=await prisma.caja.findFirst({include:{abiertoPor:true,cerradoPor:true},orderBy:{fechaApertura:"desc"}});
    return res.json(await construirResumen(caja));
  }catch(e){return responderError(res,e,"No fue posible cargar el resumen de caja.");}
}

async function abrir(req,res){
  try{
    const abierta=await prisma.caja.findFirst({where:{estado:"Abierta"}});
    if(abierta) return res.status(400).json({mensaje:`La caja ${abierta.codigo} ya se encuentra abierta.`});
    const saldo=Number(req.body?.saldoInicial||0);
    if(!Number.isFinite(saldo)||saldo<0) return res.status(400).json({mensaje:"El saldo inicial no es válido."});
    const uid=await usuarioIdReq(req);
    const caja=await prisma.$transaction(async tx=>{
      const c=await incrementarConsecutivoTx(tx,"cajas");
      const codigo=`CAJ-${String(c.ultimoNumero).padStart(4,"0")}`;
      return tx.caja.create({data:{codigo,saldoInicial:saldo,estado:"Abierta",observacionesApertura:texto(req.body?.observaciones),abiertoPorId:uid},include:{abiertoPor:true,cerradoPor:true}});
    });
    await registrarAuditoriaPostgreSQL({req,modulo:"Caja",accion:"ABRIR",registroId:caja.id,codigoRegistro:caja.codigo,descripcion:`Se abrió la caja ${caja.codigo}.`});
    return res.status(201).json(await construirResumen(caja));
  }catch(e){return responderError(res,e,"No fue posible abrir la caja.");}
}

async function listarMovimientos(req,res){
  try{
    let caja=null;
    if(req.query?.caja) caja=await resolverCompat(prisma.caja,req.query.caja,true,"Caja");
    if(!caja) caja=await prisma.caja.findFirst({where:{estado:"Abierta"},orderBy:{fechaApertura:"desc"}});
    if(!caja) caja=await prisma.caja.findFirst({orderBy:{fechaApertura:"desc"}});
    if(!caja) return res.json([]);
    const where={cajaId:caja.id};
    if(["Ingreso","Egreso"].includes(req.query?.tipo)) where.tipo=req.query.tipo;
    if(["Efectivo","Transferencia","Crédito"].includes(req.query?.metodoPago)) where.metodoPago=req.query.metodoPago;
    const rows=await prisma.movimientoCaja.findMany({where,include:{usuario:true,pedido:true,entrega:true,factura:true,cartera:true},orderBy:{createdAt:"desc"}});
    return res.json(rows.map(salidaMovimiento));
  }catch(e){return responderError(res,e,"No fue posible cargar los movimientos.");}
}

async function crearMovimiento(req,res){
  try{
    const caja=await prisma.caja.findFirst({where:{estado:"Abierta"},orderBy:{fechaApertura:"desc"}});
    if(!caja) return res.status(400).json({mensaje:"Debe abrir la caja antes de registrar movimientos."});
    const tipo=texto(req.body?.tipo), concepto=texto(req.body?.concepto), valor=Number(req.body?.valor);
    if(!["Ingreso","Egreso"].includes(tipo)) return res.status(400).json({mensaje:"Seleccione un tipo de movimiento válido."});
    if(!concepto) return res.status(400).json({mensaje:"Debe indicar el concepto del movimiento."});
    if(!Number.isFinite(valor)||valor<=0) return res.status(400).json({mensaje:"El valor del movimiento debe ser mayor que cero."});
    if(tipo==="Egreso"){
      const t=await totales(caja.id);
      const saldo=numero(caja.saldoInicial)+t.totalIngresos-t.totalEgresos;
      if(valor>saldo) return res.status(400).json({mensaje:"El egreso supera el efectivo disponible en caja."});
    }
    const uid=await usuarioIdReq(req);
    const m=await prisma.movimientoCaja.create({
      data:{cajaId:caja.id,tipo,origen:"Manual",concepto,valor,metodoPago:"",afectaEfectivo:true,observacion:texto(req.body?.observacion),usuarioId:uid,estado:"Activo"},
      include:{usuario:true,pedido:true,entrega:true,factura:true,cartera:true},
    });
    await registrarAuditoriaPostgreSQL({req,modulo:"Caja",accion:"MOVIMIENTO",registroId:m.id,codigoRegistro:caja.codigo,descripcion:`Movimiento manual en ${caja.codigo}: ${concepto}.`});
    return res.status(201).json(salidaMovimiento(m));
  }catch(e){return responderError(res,e,"No fue posible registrar el movimiento.");}
}

async function cerrar(req,res){
  try{
    const caja=await prisma.caja.findFirst({where:{estado:"Abierta"},include:{abiertoPor:true,cerradoPor:true},orderBy:{fechaApertura:"desc"}});
    if(!caja) return res.status(400).json({mensaje:"No hay una caja abierta para cerrar."});
    const t=await totales(caja.id);
    const saldoEsperado=Number((numero(caja.saldoInicial)+t.totalIngresos-t.totalEgresos).toFixed(2));
    const c=req.body?.conteoBilletes;
    let efectivo=0,b={billetesDosMil:0,billetesCincoMil:0,billetesDiezMil:0,billetesVeinteMil:0,billetesCincuentaMil:0,billetesCienMil:0};
    if(c&&typeof c==="object"){
      const map=[["dosMil",2000,"billetesDosMil"],["cincoMil",5000,"billetesCincoMil"],["diezMil",10000,"billetesDiezMil"],["veinteMil",20000,"billetesVeinteMil"],["cincuentaMil",50000,"billetesCincuentaMil"],["cienMil",100000,"billetesCienMil"]];
      for(const [k,den,campo] of map){const q=Number(c[k]||0);if(!Number.isInteger(q)||q<0)return res.status(400).json({mensaje:"La cantidad de billetes debe ser un número entero igual o mayor que cero."});b[campo]=q;efectivo+=q*den;}
    }else{
      efectivo=Number(req.body?.efectivoContado);
      if(!Number.isFinite(efectivo)||efectivo<0)return res.status(400).json({mensaje:"Debe indicar el efectivo contado al cerrar la caja."});
    }
    const uid=await usuarioIdReq(req);
    const cerrada=await prisma.caja.update({
      where:{id:caja.id},
      data:{...t,saldoEsperado,efectivoContado:efectivo,...b,diferencia:efectivo-saldoEsperado,fechaCierre:new Date(),estado:"Cerrada",observacionesCierre:texto(req.body?.observaciones),cerradoPorId:uid},
      include:{abiertoPor:true,cerradoPor:true},
    });
    await registrarAuditoriaPostgreSQL({req,modulo:"Caja",accion:"CERRAR",registroId:cerrada.id,codigoRegistro:cerrada.codigo,descripcion:`Se cerró la caja ${cerrada.codigo}.`});
    return res.json(await construirResumen(cerrada));
  }catch(e){return responderError(res,e,"No fue posible cerrar la caja.");}
}

async function listarHistorial(req,res){
  try{
    const pagina=Math.max(1,Number(req.query?.pagina||1)),limite=Math.min(100,Math.max(1,Number(req.query?.limite||20)));
    const where={};
    if(req.query?.desde||req.query?.hasta){
      where.fechaApertura={};
      if(req.query.desde)where.fechaApertura.gte=new Date(req.query.desde);
      if(req.query.hasta){const h=new Date(req.query.hasta);h.setHours(23,59,59,999);where.fechaApertura.lte=h;}
    }
    const [total,rows]=await Promise.all([
      prisma.caja.count({where}),
      prisma.caja.findMany({where,include:{abiertoPor:true,cerradoPor:true},orderBy:{fechaApertura:"desc"},skip:(pagina-1)*limite,take:limite}),
    ]);
    return res.json({cajas:rows.map(salidaCaja),paginacion:{pagina,limite,total,totalPaginas:Math.ceil(total/limite)}});
  }catch(e){return responderError(res,e,"No fue posible cargar el historial de caja.");}
}

async function obtenerDetalle(req,res){
  try{
    const c=await resolverCompat(prisma.caja,req.params?.id,true,"Caja");
    const caja=await prisma.caja.findUnique({where:{id:c.id},include:{abiertoPor:true,cerradoPor:true}});

    const cajaAbierta=await prisma.caja.findFirst({
      where:{estado:"Abierta"},
      select:{id:true,codigo:true},
    });

    const esAdministrador=req.usuario?.rol==="Administrador";
    let puedeRevertirCierre=false;
    let motivoBloqueoReversion="";

    if(caja.estado!=="Cerrada"){
      motivoBloqueoReversion="Solo se puede revertir una caja cerrada.";
    }else if(!esAdministrador){
      motivoBloqueoReversion="Solo un Administrador puede revertir el cierre.";
    }else if(cajaAbierta){
      motivoBloqueoReversion=`No se puede revertir mientras exista la caja ${cajaAbierta.codigo} abierta.`;
    }else{
      puedeRevertirCierre=true;
    }

    return res.json({
      ...(await construirResumen(caja)),
      puedeRevertirCierre,
      motivoBloqueoReversion,
    });
  }catch(e){return responderError(res,e,"No fue posible consultar el detalle de caja.");}
}


async function revertirCierre(req,res){
  try{
    if(req.usuario?.rol!=="Administrador"){
      return res.status(403).json({mensaje:"Acceso permitido solo para Administrador"});
    }

    const motivo=texto(req.body?.motivo);

    if(motivo.length<5){
      return res.status(400).json({mensaje:"Debe indicar un motivo de reversión de al menos 5 caracteres."});
    }

    const uid=await usuarioIdReq(req);
    const usuario=req.usuario||{};
    const nombreUsuario=[usuario.nombres,usuario.apellidos].filter(Boolean).join(" ").trim()||usuario.usuario||"";
    const forwarded=req?.headers?.["x-forwarded-for"];
    const ip=forwarded?String(forwarded).split(",")[0].trim():(req?.ip||req?.socket?.remoteAddress||"");

    const reabierta=await prisma.$transaction(async tx=>{
      const ref=await resolverCompat(tx.caja,req.params?.id,true,"Caja");
      const caja=await tx.caja.findUnique({
        where:{id:ref.id},
        include:{abiertoPor:true,cerradoPor:true},
      });

      if(!caja||caja.estado!=="Cerrada"){
        const error=new Error("Solo se puede revertir una caja que esté cerrada.");
        error.status=400;
        throw error;
      }

      const otraAbierta=await tx.caja.findFirst({
        where:{estado:"Abierta"},
        select:{id:true,codigo:true},
      });

      if(otraAbierta){
        const error=new Error(`No se puede revertir mientras exista la caja ${otraAbierta.codigo} abierta.`);
        error.status=400;
        throw error;
      }

      const cajasPosteriores=await tx.caja.count({
        where:{
          fechaApertura:{gt:caja.fechaApertura},
        },
      });

      const datosAnteriores={
        estado:caja.estado,
        fechaApertura:caja.fechaApertura?.toISOString?.()||caja.fechaApertura,
        fechaCierre:caja.fechaCierre?.toISOString?.()||caja.fechaCierre,
        saldoInicial:numero(caja.saldoInicial),
        cantidadPedidosEntregados:caja.cantidadPedidosEntregados,
        totalVentasEntregadas:numero(caja.totalVentasEntregadas),
        totalEfectivoPedidos:numero(caja.totalEfectivoPedidos),
        totalTransferencias:numero(caja.totalTransferencias),
        totalCredito:numero(caja.totalCredito),
        totalIngresos:numero(caja.totalIngresos),
        totalIngresosManuales:numero(caja.totalIngresosManuales),
        totalEgresos:numero(caja.totalEgresos),
        saldoEsperado:numero(caja.saldoEsperado),
        efectivoContado:caja.efectivoContado===null?null:numero(caja.efectivoContado),
        billetesDosMil:caja.billetesDosMil,
        billetesCincoMil:caja.billetesCincoMil,
        billetesDiezMil:caja.billetesDiezMil,
        billetesVeinteMil:caja.billetesVeinteMil,
        billetesCincuentaMil:caja.billetesCincuentaMil,
        billetesCienMil:caja.billetesCienMil,
        diferencia:caja.diferencia===null?null:numero(caja.diferencia),
        observacionesCierre:caja.observacionesCierre,
        cerradoPor:caja.cerradoPor?{
          id:caja.cerradoPor.id,
          codigo:caja.cerradoPor.codigo,
          usuario:caja.cerradoPor.usuario,
          nombres:caja.cerradoPor.nombres,
          apellidos:caja.cerradoPor.apellidos,
        }:null,
      };

      const actualizada=await tx.caja.update({
        where:{id:caja.id},
        data:{
          fechaCierre:null,
          efectivoContado:null,
          billetesDosMil:0,
          billetesCincoMil:0,
          billetesDiezMil:0,
          billetesVeinteMil:0,
          billetesCincuentaMil:0,
          billetesCienMil:0,
          diferencia:null,
          estado:"Abierta",
          observacionesCierre:"",
          cerradoPorId:null,
        },
        include:{abiertoPor:true,cerradoPor:true},
      });

      await tx.auditoria.create({
        data:{
          usuarioId:uid,
          codigoUsuario:usuario.codigo||"",
          nombreUsuario,
          modulo:"Caja",
          accion:"REVERTIR_CIERRE",
          registroId:caja.id,
          codigoRegistro:caja.codigo,
          descripcion:`Se revirtió el cierre de la caja ${caja.codigo}. Motivo: ${motivo}`,
          datosAnteriores,
          datosNuevos:{
            estado:"Abierta",
            motivoReversion:motivo,
            fechaReversion:new Date().toISOString(),
            datosCierreLimpiados:true,
            cajasPosterioresExistentes:cajasPosteriores,
          },
          ip,
        },
      });

      return actualizada;
    },{
      isolationLevel:"Serializable",
    });

    return res.json({
      ...(await construirResumen(reabierta)),
      mensaje:`El cierre de ${reabierta.codigo} fue revertido correctamente.`,
    });

  }catch(e){
    if(e?.status){
      return res.status(e.status).json({mensaje:e.message});
    }
    return responderError(res,e,"No fue posible revertir el cierre de la caja.");
  }
}

export const cajaController={resumen,abrir,listarMovimientos,crearMovimiento,cerrar,listarHistorial,obtenerDetalle,revertirCierre};
