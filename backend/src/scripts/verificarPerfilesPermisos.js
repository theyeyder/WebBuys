import "dotenv/config";

import {
  connectPostgreSQL,
  disconnectPostgreSQL,
  prisma,
} from "../config/postgresql.js";

async function main() {
  await connectPostgreSQL();

  const perfiles = await prisma.perfilUsuario.findMany({
    include: {
      _count: {
        select: {
          permisos: true,
          usuarios: true,
        },
      },
    },
    orderBy: { nombre: "asc" },
  });

  const usuarios = await prisma.usuario.findMany({
    select: {
      codigo: true,
      usuario: true,
      rol: true,
      perfiles: {
        select: {
          perfil: {
            select: {
              codigo: true,
              nombre: true,
            },
          },
        },
        orderBy: { asignadoAt: "asc" },
      },
      perfil: {
        select: {
          codigo: true,
          nombre: true,
        },
      },
    },
    orderBy: { usuario: "asc" },
  });

  console.log("\nPERFILES DISPONIBLES");
  console.table(
    perfiles.map((perfil) => ({
      codigo: perfil.codigo,
      nombre: perfil.nombre,
      estado: perfil.estado,
      permisos: perfil._count.permisos,
      asignaciones: perfil._count.usuarios,
    }))
  );

  console.log("\nUSUARIOS Y PERFILES ASIGNADOS");
  console.table(
    usuarios.map((usuario) => {
      const nombres = usuario.perfiles
        .map((item) => item.perfil?.nombre)
        .filter(Boolean);

      if (nombres.length === 0 && usuario.perfil?.nombre) {
        nombres.push(usuario.perfil.nombre);
      }

      return {
        codigo: usuario.codigo,
        usuario: usuario.usuario,
        rol: usuario.rol,
        perfiles: nombres.length ? nombres.join(" + ") : "Sin perfiles",
      };
    })
  );

  if (perfiles.length < 6) {
    throw new Error("No se encontraron los 6 perfiles base esperados.");
  }

  console.log("\nOK: múltiples perfiles por usuario habilitados correctamente.");
}

main()
  .catch((error) => {
    console.error("\nERROR VERIFICANDO PERFILES:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPostgreSQL();
  });
