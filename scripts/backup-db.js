// 每天备份 dev.db 到腾讯云 COS
// Cron: 0 3 * * * cd /var/www/blog && node scripts/backup-db.js

const COS = require("cos-nodejs-sdk-v5");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const BUCKET = process.env.COS_BUCKET || "mashiro-chat-1443843125";
const REGION = process.env.COS_REGION || "ap-guangzhou";
const DB_PATH = path.join(__dirname, "..", "dev.db");

async function main() {
  if (!process.env.COS_SECRET_ID || !process.env.COS_SECRET_KEY) {
    console.error("❌ COS 密钥未配置");
    process.exit(1);
  }

  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ 数据库文件不存在: ${DB_PATH}`);
    process.exit(1);
  }

  const cos = new COS({
    SecretId: process.env.COS_SECRET_ID,
    SecretKey: process.env.COS_SECRET_KEY,
  });

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const key = `backups/dev-${date}.db`;
  const content = fs.readFileSync(DB_PATH);
  const sizeKB = (content.length / 1024).toFixed(1);

  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: content,
      },
      (err) => {
        if (err) return reject(err);
        console.log(`✅ 备份成功: ${key} (${sizeKB} KB)`);
        resolve();
      }
    );
  });
}

main().catch((e) => {
  console.error("❌ 备份失败:", e.message || e);
  process.exit(1);
});
