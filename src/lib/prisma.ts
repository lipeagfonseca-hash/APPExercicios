import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// O `pg` trata sslmode=require como verify-full e avisa no log a cada conexão que isso vai mudar
// na próxima versão. Declarar verify-full mantém o comportamento atual (certificado verificado)
// e silencia o aviso.
function urlDoBanco() {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  const u = new URL(url);
  if (u.searchParams.get("sslmode") === "require") u.searchParams.set("sslmode", "verify-full");
  return u.toString();
}

const adapter = new PrismaPg({ connectionString: urlDoBanco() });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
