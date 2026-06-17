import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // 清空旧数据
  await prisma.tagOnPost.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();

  console.log("✓ 已清空旧数据");

  // 密码哈希
  const passwordHash = await bcrypt.hash("password123", 10);

  // 创建用户（已标注 emailVerified 以通过登录）
  const alice = await prisma.user.create({
    data: {
      email: "alice@example.com",
      password: passwordHash,
      name: "Alice（管理员）",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Alice",
      bio: "全栈开发者，热爱 Next.js 和 TypeScript",
      role: "admin",
      emailVerified: new Date(),
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: "bob@example.com",
      password: passwordHash,
      name: "Bob",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Bob",
      bio: "前端工程师，专注用户体验设计",
      emailVerified: new Date(),
    },
  });

  console.log("✓ 已创建用户 (密码: password123)");

  // 创建标签
  const tags = await Promise.all(
    ["Next.js", "TypeScript", "React", "Prisma", "SQLite", "Web开发"].map(
      (name) => prisma.tag.create({ data: { name } })
    )
  );

  console.log("✓ 已创建标签");

  // 创建文章
  const post1 = await prisma.post.create({
    data: {
      title: "Next.js 14 新特性速览",
      slug: "nextjs-14-whats-new",
      content: `Next.js 14 带来了很多令人兴奋的新特性：

## Server Actions（稳定版）
Server Actions 现在已经是稳定版，让你可以在服务器上运行异步代码，无需手动创建 API 路由。

## 部分预渲染（Preview）
新的部分预渲染功能让你可以同时享受静态和动态渲染的优点。

## Turbopack 改进
Turbopack 通过了更多的测试，现在更加稳定和快速。`,
      excerpt: "Next.js 14 带来了 Server Actions 稳定版、部分预渲染等重磅新特性。",
      category: "tech",
      published: true,
      viewCount: 1240,
      authorId: alice.id,
      tags: {
        create: [{ tagId: tags[0].id }, { tagId: tags[2].id }],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Prisma 入门指南：从零到一",
      slug: "prisma-getting-started",
      content: `Prisma 是一个现代化的 ORM，让你可以用类型安全的方式操作数据库。

## 为什么选择 Prisma？

1. **类型安全**：自动生成的类型让你远离运行时错误
2. **直观的 API**：链式调用，符合直觉
3. **强大的迁移工具**：\`prisma migrate\` 帮你管理数据库变更
4. **可视化工具**：Prisma Studio 让你直接查看和编辑数据`,
      excerpt: "通过这篇指南，你将学会如何使用 Prisma 来管理你的数据库。",
      category: "tech",
      published: true,
      viewCount: 890,
      authorId: alice.id,
      tags: {
        create: [{ tagId: tags[3].id }, { tagId: tags[4].id }, { tagId: tags[1].id }],
      },
    },
  });

  const post3 = await prisma.post.create({
    data: {
      title: "为什么我推荐用 SQLite 做开发数据库",
      slug: "why-sqlite-for-dev",
      content: `SQLite 是世界上最流行的数据库引擎，它非常适合开发和小型项目：

- **零配置**：不需要安装服务器，一个文件就是整个数据库
- **快速**：对于中小型应用，SQLite 的性能绰绰有余
- **便携**：数据库文件可以随时备份、复制、分享`,
      excerpt: "SQLite 零配置、快速、便携，是开发环境和小型项目的理想选择。",
      category: "tech",
      published: true,
      viewCount: 567,
      authorId: bob.id,
      tags: {
        create: [{ tagId: tags[4].id }, { tagId: tags[5].id }],
      },
    },
  });

  console.log("✓ 已创建文章");

  // 创建生活类文章
  await prisma.post.create({
    data: {
      title: "周末骑行日记：城市周边的隐藏美景",
      slug: "weekend-cycling-hidden-views",
      content: `上周末天气特别好，决定骑车去探索城市周边的风景。

## 出发

早上七点就出门了，带上水壶和相机。路线是从市中心出发，沿着河边的小路一路向东。

1. **第一站**：城东的湿地公园，拍到了几只白鹭
2. **第二站**：废弃的铁路桥，现在是网红打卡点
3. **终点**：山脚下的小村庄，吃了一碗地道的农家面

## 感受

骑了大概 40 公里，虽然有点累，但心情特别好。城市周边有这么多被忽略的好地方，以后要多出来走走。`,
      excerpt: "上周末骑了 40 公里，发现了城市周边隐藏的美景。",
      category: "life",
      published: true,
      viewCount: 320,
      authorId: alice.id,
    },
  });

  console.log("✓ 已创建生活类文章");

  // 创建评论
  await prisma.comment.createMany({
    data: [
      {
        content: "写的太好了！特别是 Server Actions 那部分。",
        postId: post1.id,
        authorId: bob.id,
      },
      {
        content: "Prisma 确实比手写 SQL 方便太多了。",
        postId: post2.id,
        authorId: bob.id,
      },
      {
        content: "同意！SQLite 对于小项目来说完全够用。",
        postId: post3.id,
        authorId: alice.id,
      },
    ],
  });

  console.log("✓ 已创建评论");
  console.log("\n🎉 种子数据创建完成！");
  console.log(`  - ${await prisma.user.count()} 个用户`);
  console.log(`  - ${await prisma.post.count()} 篇文章`);
  console.log(`  - ${await prisma.tag.count()} 个标签`);
  console.log(`  - ${await prisma.comment.count()} 条评论`);
  console.log("\n🔑 登录凭据：");
  console.log("  alice@example.com / password123");
  console.log("  bob@example.com   / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
