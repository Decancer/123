/**
 * 上传 Live2D 模型 + live2d.min.js 到 COS
 *
 * 用法：npx tsx scripts/upload-live2d-to-cos.ts
 */

import * as fs from "fs";
import * as path from "path";
import COS from "cos-nodejs-sdk-v5";
import * as dotenv from "dotenv";

dotenv.config();

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

const BUCKET = process.env.COS_BUCKET!;
const REGION = process.env.COS_REGION!;

// 本地目录 → COS 路径（保持内部结构不变，确保 .model.json 相对引用正常）
const DIR_MAP: Record<string, string> = {
  "public/mashiro live2d": "live2d/winter",
  "public/live2d2": "live2d/summer",
  "public/live2d3": "live2d/ssr",
  "public/live2d4": "live2d/ur",
  "public/live2d5": "live2d/event234",
  "public/live2d6": "live2d/event242",
};

const SINGLE_FILES: Record<string, string> = {
  "public/live2d.min.js": "live2d/live2d.min.js",
};

function walkDir(dir: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".json": "application/json",
    ".moc": "application/octet-stream",
    ".mtn": "application/octet-stream",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".js": "application/javascript",
    ".txt": "text/plain",
  };
  return map[ext] || "application/octet-stream";
}

async function uploadFile(
  localPath: string,
  cosKey: string
): Promise<void> {
  const body = fs.readFileSync(localPath);
  const mime = getMimeType(localPath);

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: cosKey,
        Body: body,
        ContentType: mime,
      },
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

async function main() {
  let total = 0;

  // 上传目录
  for (const [localDir, cosPrefix] of Object.entries(DIR_MAP)) {
    const files = walkDir(localDir);
    console.log(`📁 ${localDir} → ${cosPrefix}/ (${files.length} 文件)`);

    for (const filePath of files) {
      const relativePath = path.relative(localDir, filePath).replace(/\\/g, "/");
      const cosKey = `${cosPrefix}/${relativePath}`;
      try {
        await uploadFile(filePath, cosKey);
        total++;
      } catch (e) {
        console.error(`  ❌ ${cosKey}:`, (e as Error).message);
      }
    }
  }

  // 上传单文件
  for (const [localPath, cosKey] of Object.entries(SINGLE_FILES)) {
    try {
      await uploadFile(localPath, cosKey);
      total++;
      console.log(`📄 ${localPath} → ${cosKey}`);
    } catch (e) {
      console.error(`  ❌ ${cosKey}:`, (e as Error).message);
    }
  }

  console.log(`\n✅ 共上传 ${total} 个文件`);
}

main().catch((e) => {
  console.error("❌ 上传失败:", e);
  process.exit(1);
});
