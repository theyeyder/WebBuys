import { prisma } from "../../config/postgresql.js";

export { prisma };

export function pareceObjectIdMongo(valor) {
  return /^[a-f\d]{24}$/i.test(String(valor || ""));
}

export function pareceUuid(valor) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(valor || ""));
}

export function valorId(valor) {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") {
    return String(
      valor.postgresId ||
      valor.legacyMongoId ||
      valor._id ||
      valor.id ||
      ""
    );
  }
  return String(valor);
}

export function idCompatibilidad(registro) {
  if (!registro) return null;
  return registro.legacyMongoId || registro.id || null;
}

export function numero(valor, fallback = 0) {
  const n = Number(valor ?? fallback);
  return Number.isFinite(n) ? n : fallback;
}

export function texto(valor) {
  return String(valor ?? "").trim();
}

export async function buscarPorIdOlegacy(delegate, valor, args = {}) {
  const id = valorId(valor);
  if (!id) return null;

  const where = pareceObjectIdMongo(id)
    ? { legacyMongoId: id }
    : { id };

  return delegate.findUnique({
    where,
    ...args,
  });
}

export async function resolverUsuarioPostgreSQL(valor) {
  const id = valorId(valor);
  if (!id) return null;

  const usuario = pareceObjectIdMongo(id)
    ? await prisma.usuario.findUnique({ where: { legacyMongoId: id } })
    : await prisma.usuario.findUnique({ where: { id } });

  if (!usuario) {
    throw new Error("El usuario seleccionado no existe.");
  }
  return usuario;
}

export async function siguienteCodigoLectura(clave, prefijo, ancho) {
  const c = await prisma.consecutivo.findUnique({ where: { clave } });
  const siguiente = Number(c?.ultimoNumero || 0) + 1;
  return `${prefijo}${String(siguiente).padStart(ancho, "0")}`;
}

export async function incrementarConsecutivoTx(tx, clave) {
  return tx.consecutivo.upsert({
    where: { clave },
    update: { ultimoNumero: { increment: 1 } },
    create: { clave, ultimoNumero: 1 },
  });
}

function obtenerIp(req) {
  const forwarded = req?.headers?.["x-forwarded-for"];
  return forwarded
    ? String(forwarded).split(",")[0].trim()
    : req?.ip || req?.socket?.remoteAddress || "";
}

export async function registrarAuditoriaPostgreSQL({
  req,
  modulo,
  accion,
  registroId = null,
  codigoRegistro = "",
  descripcion = "",
  datosAnteriores = null,
  datosNuevos = null,
}) {
  try {
    const usuario = req?.usuario || req?.user || null;
    const candidato = valorId(usuario);
    let usuarioId = usuario?.postgresId || null;

    if (!usuarioId && candidato) {
      const registroUsuario = pareceObjectIdMongo(candidato)
        ? await prisma.usuario.findUnique({ where: { legacyMongoId: candidato }, select: { id: true } })
        : pareceUuid(candidato)
          ? await prisma.usuario.findUnique({ where: { id: candidato }, select: { id: true } })
          : null;
      usuarioId = registroUsuario?.id || null;
    }

    const codigoUsuario = usuario?.codigo || "";
    const nombreUsuario =
      [usuario?.nombres, usuario?.apellidos].filter(Boolean).join(" ").trim() ||
      usuario?.usuario ||
      "";

    await prisma.auditoria.create({
      data: {
        usuarioId,
        codigoUsuario,
        nombreUsuario,
        modulo,
        accion,
        registroId: registroId ? String(registroId) : null,
        codigoRegistro,
        descripcion,
        datosAnteriores,
        datosNuevos,
        ip: obtenerIp(req),
      },
    });
  } catch (error) {
    console.error("Error registrando auditoría PostgreSQL-only:", error?.message || error);
  }
}

export function responderError(res, error, fallback) {
  const mensaje = error?.message || fallback;
  const conocidas = [
    "obligatorio",
    "obligatoria",
    "no existe",
    "no válido",
    "no válida",
    "ya existe",
    "no puedes",
    "debe",
  ];
  const status = conocidas.some((x) => mensaje.toLowerCase().includes(x)) ? 400 : 500;
  return res.status(status).json({ mensaje });
}
