/**
 * Singleton de Prisma Client para Next.js
 *
 * En desarrollo, Next.js recarga módulos con hot-reload, lo que crea
 * múltiples instancias de PrismaClient si no se usa este patrón singleton.
 * En producción, cada instancia del servidor tiene su propia instancia.
 */

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
