#!/bin/bash
# ============================================================
# VPS 首次初始化脚本
# 在服务器上以 root 执行: bash setup-vps.sh
# ============================================================
set -e

echo "🚀 Mashiro Blog VPS Setup"
echo "========================="

# ---- 更新系统 ----
echo "📦 更新系统..."
apt update -y && apt upgrade -y

# ---- 安装基础工具 ----
echo "📦 安装 Node.js / Nginx / git..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs nginx git sqlite3

# ---- 安装 PM2 ----
echo "📦 安装 PM2..."
npm install -g pm2

# ---- 创建目录 ----
echo "📁 创建应用目录..."
mkdir -p /var/www/blog/logs /var/www/blog/prisma /var/www/blog/data

# ---- Nginx 配置 ----
echo "🔧 配置 Nginx..."
cp /var/www/blog/deploy/nginx.conf /etc/nginx/sites-available/mashiro
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/mashiro /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# ---- 环境变量 ----
echo "🔧 设置环境变量..."
cp /var/www/blog/deploy/.env.production /var/www/blog/.env

# ---- 首次构建 ----
echo "🔨 安装依赖 + 构建..."
cd /var/www/blog
npm install
npx prisma generate
npx next build

# ---- PM2 启动 ----
echo "🚀 启动应用..."
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

echo ""
echo "========================="
echo "✅ 部署完成！"
echo "访问: http://$(curl -s ifconfig.me)"
echo ""
echo "🔐 接下来："
echo "  1. 安装 SSL 证书: certbot --nginx -d mashiro.chat"
echo "  2. DNS A 记录: mashiro.chat → $(curl -s ifconfig.me)"
echo "========================="
