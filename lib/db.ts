import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db: PrismaClient = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

export async function ensureDatabaseConnection(): Promise<void> {
  // Simple ping to verify MySQL connectivity
  await db.$queryRaw`SELECT 1`;
}


