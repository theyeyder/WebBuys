
import {
  prisma, idCompatibilidad, numero, texto, resolverCompat, usuarioIdReq,
  registrarAuditoriaPostgreSQL, responderError
} from "./_transactional.js";

function salidaUsuario(u) {
  if (!u) return null;
  return { _id:idCompatibilidad(u), id:idCompatibilidad(u), postgresId:u.id, nombres:u.nombres, apellidos:u.apellidos, usuario:u.usuario };
}
function salidaPago(p) {
  if (!p) return null;
  return {
    _id:idCompatibilidad(p), id:idCompatibilidad(p), postgresId:p.id, legacyMongoId:p.legacyMongoId||null,
    valor:numero(p.valor), metodoPago:p.metodoPago, referencia:p.referencia, observacion:p.observacion,
    fechaPago:p.fechaPago, estado:p.estado,
    caja:p.caja?{_id:idCompatibilidad(p.caja),id:idCompatibilidad(p.caja),postgresId:p.caja.id,codigo:p.caja.codigo,estado:p.caja.estado}:null,
    usuario:salidaUsuario(p.usuario),
  };
}
function salidaCartera(c) {
  if (!c) return null;
  return {
    _id:idCompatibilidad(c), id:idCompatibilidad(c), postgresId:c.id, legacyMongoId:c.legacyMongoId||null,
    codigo:c.codigo, pedidoCodigo:c.pedidoCodigo,
    pedido:c.pedido?{_id:idCompatibilidad(c.pedido),id:idCompatibilidad(c.pedido),postgresId:c.pedido.id,codigo:c.pedido.codigo}:null,
    entrega:c.entrega?{_id:idCompatibilidad(c.entrega),id:idCompatibilidad(c.entrega),postgresId:c.entrega.id,pedidoCodigo:c.entrega.pedidoCodigo}:null,
    cliente:c.cliente?{_id:idCompatibilidad(c.cliente),id:idCompatibilidad(c.cliente),postgresId:c.cliente.id,codigo:c.cliente.codigo,nombre:c.cliente.nombre,documento:c.cliente.documento,telefono:c.cliente.telefono}:null,
    clienteCodigo:c.clienteCodigo,clienteNombre:c.clienteNombre,clienteDocumento:c.clienteDocumento,clienteTelefono:c.clienteTelefono,
    fechaEntrega:c.fechaEntrega,fechaVencimiento:c.fechaVencimiento,valorOriginal:numero(c.valorOriginal),
    totalAbonado:numero(c.totalAbonado),saldoPendiente:numero(c.saldoPendiente),metodoPagoOriginal:c.metodoPagoOriginal,
    estado:c.estado,observaciones:c.observaciones,createdAt:c.createdAt,updatedAt:c.updatedAt,
  };
}
const includeCartera={pedido:true,entrega:true,cliente:true,creadoPor:true,actualizadoPor:true};

async function listar(_req,res){
  try{
    const rows=await prisma.cartera.findMany({include:includeCartera,orderBy:[{estado:"asc"},{fechaEntrega:"desc"}]});
    return res.json(rows.map(salidaCartera));
  }catch(e){return responderError(res,e,"No fue posible listar la cartera.");}
}

async function resumen(_req,res){
  try{
    const rows=await prisma.cartera.findMany({select:{valorOriginal:true,totalAbonado:true,saldoPendiente:true,estado:true}});
    const out={valorOriginal:0,totalAbonado:0,saldoPendiente:0,cuentas:rows.length,pendientes:0,pagadas:0};
    for(const c of rows){
      out.valorOriginal+=numero(c.valorOriginal);out.totalAbonado+=numero(c.totalAbonado);out.saldoPendiente+=numero(c.saldoPendiente);
      if(c.estado==="Pagada")out.pagadas++;else out.pendientes++;
    }
    out.valorOriginal=Number(out.valorOriginal.toFixed(2));out.totalAbonado=Number(out.totalAbonado.toFixed(2));out.saldoPendiente=Number(out.saldoPendiente.toFixed(2));
    return res.json(out);
  }catch(e){return responderError(res,e,"No fue posible obtener el resumen de cartera.");}
}

async function obtenerPorId(req,res){
  try{
    const base=await resolverCompat(prisma.cartera,req.params?.id,true,"Cuenta de cartera");
    const c=await prisma.cartera.findUnique({where:{id:base.id},include:includeCartera});
    const pagos=await prisma.pagoCartera.findMany({where:{carteraId:c.id,estado:"Activo"},include:{caja:true,usuario:true},orderBy:[{fechaPago:"desc"},{createdAt:"desc"}]});
    return res.json({cartera:salidaCartera(c),pagos:pagos.map(salidaPago)});
  }catch(e){return responderError(res,e,"No fue posible consultar la cuenta de cartera.");}
}

async function actualizar(req,res){
  try{
    const base=await resolverCompat(prisma.cartera,req.params?.id,true,"Cuenta de cartera");
    const uid=await usuarioIdReq(req);
    const data={actualizadoPorId:uid};
    if(req.body?.fechaVencimiento!==undefined)data.fechaVencimiento=req.body.fechaVencimiento?new Date(req.body.fechaVencimiento):null;
    if(req.body?.observaciones!==undefined)data.observaciones=texto(req.body.observaciones);
    const c=await prisma.cartera.update({where:{id:base.id},data,include:includeCartera});
    await registrarAuditoriaPostgreSQL({req,modulo:"Cartera",accion:"ACTUALIZAR",registroId:c.id,codigoRegistro:c.codigo,descripcion:`Se actualizó la cartera ${c.codigo}.`});
    return res.json(salidaCartera(c));
  }catch(e){return responderError(res,e,"No fue posible actualizar la cuenta de cartera.");}
}

async function registrarPago(req,res){
  try{
    const base=await resolverCompat(prisma.cartera,req.params?.id,true,"Cuenta de cartera");
    const cartera=await prisma.cartera.findUnique({where:{id:base.id},include:includeCartera});
    if(cartera.estado==="Pagada"||numero(cartera.saldoPendiente)<=0)return res.status(400).json({mensaje:"Esta cuenta ya se encuentra pagada."});
    const valor=Number(req.body?.valor);
    if(!Number.isFinite(valor)||valor<=0)return res.status(400).json({mensaje:"El valor del abono debe ser mayor que cero."});
    if(valor>numero(cartera.saldoPendiente))return res.status(400).json({mensaje:"El abono no puede superar el saldo pendiente."});
    const metodoPago=texto(req.body?.metodoPago);
    if(!["Efectivo","Transferencia"].includes(metodoPago))return res.status(400).json({mensaje:"Seleccione Efectivo o Transferencia para registrar el abono."});
    const caja=await prisma.caja.findFirst({where:{estado:"Abierta"},orderBy:{fechaApertura:"desc"}});
    if(!caja)return res.status(400).json({mensaje:"Debe abrir la caja antes de registrar un abono de cartera."});
    const uid=await usuarioIdReq(req);

    const result=await prisma.$transaction(async tx=>{
      const pago=await tx.pagoCartera.create({
        data:{
          carteraId:cartera.id,entregaId:cartera.entregaId,pedidoId:cartera.pedidoId,clienteId:cartera.clienteId,cajaId:caja.id,
          valor,metodoPago,referencia:texto(req.body?.referencia),observacion:texto(req.body?.observacion),usuarioId:uid,estado:"Activo",
        },
      });
      const mov=await tx.movimientoCaja.create({
        data:{
          cajaId:caja.id,tipo:"Ingreso",origen:"Cartera",concepto:`Abono cartera ${cartera.codigo} - ${cartera.pedidoCodigo}`,
          valor,pedidoId:cartera.pedidoId,pedidoCodigo:cartera.pedidoCodigo,entregaId:cartera.entregaId,entregaCodigo:cartera.pedidoCodigo,
          clienteId:cartera.clienteId,clienteNombre:cartera.clienteNombre,metodoPago,afectaEfectivo:metodoPago==="Efectivo",
          carteraId:cartera.id,observacion:texto(req.body?.observacion)||"Abono de cartera",claveUnica:`CARTERA_PAGO:${pago.id}`,usuarioId:uid,estado:"Activo",
        },
      });
      await tx.pagoCartera.update({where:{id:pago.id},data:{movimientoCajaId:mov.id}});
      const totalAbonado=Number((numero(cartera.totalAbonado)+valor).toFixed(2));
      const saldoPendiente=Number(Math.max(0,numero(cartera.valorOriginal)-totalAbonado).toFixed(2));
      const estado=saldoPendiente<=0?"Pagada":totalAbonado>0?"Abonada":"Pendiente";
      const c=await tx.cartera.update({where:{id:cartera.id},data:{totalAbonado,saldoPendiente,estado,actualizadoPorId:uid},include:includeCartera});
      return {cartera:c,pago};
    });

    await registrarAuditoriaPostgreSQL({req,modulo:"Cartera",accion:"PAGO",registroId:result.cartera.id,codigoRegistro:result.cartera.codigo,descripcion:`Se registró un abono en ${result.cartera.codigo}.`});
    const detalle=await prisma.cartera.findUnique({where:{id:result.cartera.id},include:includeCartera});
    const pagos=await prisma.pagoCartera.findMany({where:{carteraId:detalle.id,estado:"Activo"},include:{caja:true,usuario:true},orderBy:[{fechaPago:"desc"},{createdAt:"desc"}]});
    return res.status(201).json({mensaje:detalle.estado==="Pagada"?"Pago registrado. La cuenta quedó pagada completamente.":"Abono registrado correctamente.",cartera:salidaCartera(detalle),pagos:pagos.map(salidaPago)});
  }catch(e){return responderError(res,e,"No fue posible registrar el abono de cartera.");}
}

export const carteraController={listar,resumen,obtenerPorId,actualizar,registrarPago};
