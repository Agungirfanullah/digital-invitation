import { PrismaClient } from "@prisma/client";

// Serverless-safe singleton: reuse a single PrismaClient across hot reloads
// in development and across warm serverless invocations, instead of opening
// a new database connection on every import. See docs/DATABASE.md §0.4.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
