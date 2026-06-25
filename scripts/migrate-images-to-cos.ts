/**
 * 存量 base64 图片迁移到腾讯云 COS
 *
 * 用法：
 *   npx tsx scripts/migrate-images-to-cos.ts             # 正式迁移
 *   npx tsx scripts/migrate-images-to-cos.ts --dry-run   # 试运行，只打印不改
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import COS from "cos-nodejs-sdk-v5";
import * as dotenv from "dotenv";

dotenv.config();

// ====== 数据库连接（复用 lib/prisma.ts 的模式）=====

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const adapter = new PrismaLibSql({
  url,
  ...(authToken ? { authToken } : {}),
});

const prisma = new PrismaClient({ adapter } as any);

// ====== 配置 ======

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

const BUCKET = process.env.COS_BUCKET!;
const REGION = process.env.COS_REGION!;

// ====== 工具函数 ======

function parseBase64(str: string): { mime: string; buffer: Buffer; ext: string } | null {
  const match = str.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return null;
  const mime = match[1];
  const ext = mime === "image/jpeg" ? ".jpg" : `.${mime.split("/")[1].replace("svg+xml", "svg")}`;
  try {
    const buffer = Buffer.from(match[2], "base64");
    return { mime, buffer, ext };
  } catch {
    return null;
  }
}

function makePublicUrl(key: string): string {
  return `https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`;
}

async function uploadToCos(key: string, buffer: Buffer, mime: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cos.putObject({
      Bucket: BUCKET,
      Region: REGION,
      Key: key,
      Body: buffer,
      ContentType: mime,
    }, (err) => {
      if (err) reject(err);
      else resolve(makePublicUrl(key));
    });
  });
}

// ====== 主流程 ======

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  console.log(`\n🚀 ${isDryRun ? "【试运行】" : ""}Base64 → COS 迁移\n`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Region: ${REGION}\n`);

  // ---------- 1. 用户头像 ----------
  console.log("📷 处理用户头像...");
  const usersWithBase64 = await prisma.user.findMany({
    where: {
      OR: [
        { avatar: { startsWith: "data:image/" } },
        { background: { startsWith: "data:image/" } },
      ],
    },
    select: { id: true, avatar: true, background: true },
  });

  console.log(`   找到 ${usersWithBase64.length} 个用户有 base64 图片`);

  let avatarCount = 0, bgCount = 0, skipCount = 0;

  for (const user of usersWithBase64) {
    // 头像
    if (user.avatar && user.avatar.startsWith("data:image/")) {
      const parsed = parseBase64(user.avatar);
      if (!parsed) { skipCount++; continue; }
      const key = `avatars/u_${user.id}_migrated${parsed.ext}`;
      if (!isDryRun) {
        try {
          await uploadToCos(key, parsed.buffer, parsed.mime);
          await prisma.user.update({ where: { id: user.id }, data: { avatar: makePublicUrl(key) } });
        } catch (e) { console.error(`   ❌ 用户 ${user.id} 头像上传失败:`, e); continue; }
      }
      avatarCount++;
    }

    // 背景
    if (user.background && user.background.startsWith("data:image/")) {
      const parsed = parseBase64(user.background);
      if (!parsed) { skipCount++; continue; }
      const key = `backgrounds/u_${user.id}_migrated${parsed.ext}`;
      if (!isDryRun) {
        try {
          await uploadToCos(key, parsed.buffer, parsed.mime);
          await prisma.user.update({ where: { id: user.id }, data: { background: makePublicUrl(key) } });
        } catch (e) { console.error(`   ❌ 用户 ${user.id} 背景上传失败:`, e); continue; }
      }
      bgCount++;
    }
  }

  console.log(`   ✅ 头像: ${avatarCount}, 背景: ${bgCount}, 跳过: ${skipCount}\n`);

  // ---------- 2. 文章图片 ----------
  console.log("🖼️  处理文章图片...");
  const postsWithImages = await prisma.post.findMany({
    where: { images: { contains: "data:image/" } },
    select: { id: true, images: true },
  });

  console.log(`   找到 ${postsWithImages.length} 篇文章有 base64 图片`);

  let postImgCount = 0, postSkip = 0;

  for (const post of postsWithImages) {
    if (!post.images) continue;
    let imgArr: string[];
    try { imgArr = JSON.parse(post.images); } catch { postSkip++; continue; }

    const newUrls: string[] = [];

    for (let i = 0; i < imgArr.length; i++) {
      const img = imgArr[i];
      if (!img.startsWith("data:image/")) {
        // 可能已经是 URL（混合情况），保持不变
        newUrls.push(img);
        continue;
      }

      const parsed = parseBase64(img);
      if (!parsed) { postSkip++; continue; }
      const key = `posts/p_${post.id}_migrated_${i}${parsed.ext}`;

      if (!isDryRun) {
        try {
          await uploadToCos(key, parsed.buffer, parsed.mime);
          newUrls.push(makePublicUrl(key));
          postImgCount++;
        } catch (e) { console.error(`   ❌ 文章 ${post.id} 图片 ${i} 上传失败:`, e); newUrls.push(img); }
      } else {
        newUrls.push(makePublicUrl(key));
        postImgCount++;
      }
    }

    if (!isDryRun && newUrls.length > 0) {
      await prisma.post.update({
        where: { id: post.id },
        data: { images: JSON.stringify(newUrls) },
      });
    }
  }

  console.log(`   ✅ 图片: ${postImgCount}, 跳过: ${postSkip}\n`);

  // ---------- 3. 统计 ----------
  if (isDryRun) {
    console.log("🏁 试运行完成（未实际修改）。将迁移：");
    console.log(`   头像: ${avatarCount} | 背景: ${bgCount} | 文章图片: ${postImgCount}`);
    console.log(`   总计: ${avatarCount + bgCount + postImgCount} 个文件`);
  } else {
    console.log("✅ 迁移完成！");
    console.log(`   头像: ${avatarCount} | 背景: ${bgCount} | 文章图片: ${postImgCount}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("❌ 迁移失败:", e);
  prisma.$disconnect();
  process.exit(1);
});
