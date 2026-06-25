#!/bin/bash
# ============================================================
# 本地一键部署到 VPS（rsync 方式，无需 Git）
# 用法: bash scripts/deploy.sh
# ============================================================
set -e

VPS_HOST="${VPS_HOST:-159.75.96.65}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="/var/www/blog"

echo "📦 构建中..."
npm run build

echo "🚀 同步文件到 ${VPS_USER}@${VPS_HOST}..."
rsync -avz --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude '.env' \
  --exclude 'public/live2d*/' \
  --exclude 'public/live2d.min.js' \
  ./ "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

echo "🔧 安装依赖 + 重启..."
ssh "${VPS_USER}@${VPS_HOST}" << 'EOF'
  cd /var/www/blog
  npm install --omit=dev
  npx prisma generate
  pm2 reload deploy/ecosystem.config.js
  echo "✅ 部署完成"
EOF
