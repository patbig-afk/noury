import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { pooledDatabaseUrl } from "../../db-url.mjs";

// Un seul client réutilisé entre les rechargements à chaud en dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaPg({ connectionString: pooledDatabaseUrl() }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
