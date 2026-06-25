import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// 全局单例：开发环境下避免热重载创建多个实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  const adapter = new PrismaLibSql({
    url,
    // 云端数据库需要 authToken；本地 SQLite 文件不需要
    ...(authToken ? { authToken } : {}),
  });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
