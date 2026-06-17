// 一键设置管理员账号
// 用法: npx tsx prisma/set-admin.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import "dotenv/config";

async function main() {
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  });
  const prisma = new PrismaClient({ adapter });

  const email = process.argv[2] || "abc076980@gmail.com";

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ 用户 ${email} 不存在，请先注册`);
    await prisma.$disconnect();
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: { role: "admin", emailVerified: user.emailVerified || new Date() },
  });

  console.log(`✅ ${email} 已设为管理员（含邮箱验证）`);

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true, role: true },
  });
  console.log("当前管理员:", admins.map((a) => a.email).join(", "));

  await prisma.$disconnect();
}

main().catch(console.error);
