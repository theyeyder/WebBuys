import { PrismaClient } from "@prisma/client";

const globalPrisma = globalThis;

export const prisma =
  globalPrisma.__webbuysPrisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalPrisma.__webbuysPrisma = prisma;
}

export async function connectPostgreSQL() {
  await prisma.$connect();

  const [estado] = await prisma.$queryRaw`
    SELECT
      current_database() AS database,
      current_user AS usuario,
      version() AS version
  `;

  console.log(
    `PostgreSQL conectado: ${estado?.database || "webbuys"}`
  );

  return estado;
}

export async function disconnectPostgreSQL() {
  await prisma.$disconnect();
}
