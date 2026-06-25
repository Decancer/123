#!/bin/bash
# ============================================================
# 本地一键部署到 VPS（rsync 源码到服务器，服务器上构建）
# 用法: bash scripts/deploy.sh
# ============================================================
set -e

VPS_HOST="${VPS_HOST:-159.75.96.65}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/var/www/blog"

echo "📦 同步源码到 ${VPS_USER}@${VPS_HOST}..."
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude '.next' \
  --exclude 'public/live2d*/' \
  --exclude 'public/live2d.min.js' \
  ./ "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

echo "🔨 服务器上安装 + 构建 + 重启..."
ssh "${VPS_USER}@${VPS_HOST}" << 'ENDSSH'
  set -e
  cd /var/www/blog
  npm install --omit=dev
  npx prisma generate
  npx next build
  npx prisma db push
  cp -r public .next/standalone/
  cp -r .next/static .next/standalone/.next/
  pm2 reload deploy/ecosystem.config.js
  echo "✅ 部署完成"
ENDSSH
