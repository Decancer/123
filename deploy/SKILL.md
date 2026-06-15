# Blog Deploy Skill

## Skill Name

`blog_deploy`

---

## Skill Description

在 Ubuntu 服务器（2核4G）上从零部署 Next.js 16 + Prisma 7 + SQLite 全栈博客项目，配置 Nginx 反向代理 + PM2 进程守护，实现生产环境运行。

**功能：**

1. 检查系统环境
2. 安装 Node.js 20 LTS
3. 安装 Nginx + PM2
4. 克隆项目代码
5. 配置环境变量
6. 安装依赖 & 生成 Prisma Client
7. 初始化数据库
8. 构建 & 启动
9. 配置 Nginx 反向代理
10. 配置防火墙
11. 验证部署

---

## Trigger Conditions

触发词包括：

- 部署博客
- 部署项目
- 上线博客
- 部署 Next.js 项目
- 把我的博客部署到服务器

---

## Step 0 — 系统信息收集

开始部署前，**必须先运行**以下命令了解服务器状态：

```bash
# 1. 系统版本
cat /etc/os-release

# 2. CPU & 内存
lscpu | grep -E "^CPU\(s\)|Model name" && free -h

# 3. 磁盘空间
df -h /

# 4. 当前用户 & 是否有 sudo
whoami && sudo -n true 2>&1 && echo "HAS_SUDO=true" || echo "HAS_SUDO=false"

# 5. 网络 — 是否有公网 IP
curl -s ifconfig.me && echo ""
```

如果 `HAS_SUDO=false`，后续所有 `sudo` 命令改为直接用 root 执行（去掉 `sudo`）。

**向用户确认：**
- 服务器 IP 地址是？（有公网 IP 则用公网，内网则用户自行端口映射）
- 是否已有域名指向该服务器？（如有，后续 Nginx 配置服务器名）
- 项目代码怎么上传？（GitHub 仓库 / 直接上传压缩包）

---

## Step 1 — 安装 Node.js 20 LTS

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证
node -v   # 应输出 v20.x.x
npm -v    # 应输出 10.x.x
```

如果 NodeSource 不可用，改用 nvm：

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
node -v
```

---

## Step 2 — 安装系统依赖

```bash
# 基础工具
sudo apt-get update
sudo apt-get install -y git nginx ufw curl unzip

# PM2 进程管理器（全局安装）
sudo npm install -g pm2

# 验证
pm2 -v
nginx -v
git --version
```

---

## Step 3 — 创建项目目录

```bash
# 创建项目目录
sudo mkdir -p /var/www/blog
sudo chown -R $USER:$USER /var/www/blog

# 创建工作目录
mkdir -p /var/www/blog/logs
```

---

## Step 4 — 获取项目代码

### 方式 A：GitHub 克隆（推荐）

如果项目已推送到 GitHub：

```bash
# 询问用户仓库地址
git clone <用户的仓库地址> /var/www/blog/app
```

### 方式 B：用户上传压缩包

如果用户通过 SFTP/SCP 上传了项目压缩包：

```bash
# 假设用户上传到了 /tmp/blog.tar.gz
tar -xzf /tmp/blog.tar.gz -C /var/www/blog/app
```

### 方式 C：用户通过豆包文件上传

告知用户：将整个项目文件夹压缩为 zip 上传，然后：

```bash
cd /var/www/blog
# 解压用户上传的文件
unzip -o <上传的zip路径> -d /var/www/blog/app
```

**验证项目结构：**

```bash
ls /var/www/blog/app/
# 应该看到: package.json  prisma/  src/  next.config.ts  ...
```

---

## Step 5 — 配置环境变量

### 5.1 生成 JWT_SECRET

```bash
# 生成一个安全的随机密钥
openssl rand -base64 64
```

### 5.2 创建 .env 文件

在 `/var/www/blog/app/.env` 创建：

```bash
cat > /var/www/blog/app/.env << 'ENVEOF'
# 数据库（SQLite 文件路径，确保目录可写）
DATABASE_URL="file:./dev.db"

# JWT 密钥（用上面 openssl 生成的替换）
JWT_SECRET="<用上面 openssl rand -base64 64 的输出替换>"

# Resend API Key（发邮件验证用）
RESEND_API_KEY="RESEND_KEY_REDACTED"

# 网站域名（重要！邮箱验证链接会用这个）
BASE_URL="http://<你的服务器IP>:3000"

# 环境
NODE_ENV="production"
ENVEOF
```

**⚠️ 必须告知用户：**
- `BASE_URL` 如果有域名就填 `https://your-domain.com`，否则填 `http://<服务器IP>:3000`
- `RESEND_API_KEY` 当前只能发到 `1541148313@qq.com`，正式使用需在 [resend.com](https://resend.com) 验证域名
- 如果用域名 + HTTPS，`BASE_URL` 一定要用 `https://`

### 5.3 创建 .env.production（构建时用）

```bash
cp /var/www/blog/app/.env /var/www/blog/app/.env.production
```

---

## Step 6 — 安装项目依赖 & 生成 Prisma Client

```bash
cd /var/www/blog/app

# 安装依赖（生产模式，跳过 devDependencies）
npm ci --omit=dev

# 如果 npm ci 失败（没有 lock 文件或版本不匹配），改用：
# npm install --omit=dev

# 安装开发依赖（Prisma 需要）
npm install --save-dev prisma @types/node typescript tsx

# 生成 Prisma Client（输出到 src/generated/prisma/）
npx prisma generate
```

**验证 Prisma Client 已生成：**

```bash
ls src/generated/prisma/
# 应该看到: client.ts  index.ts  ...
```

---

## Step 7 — 初始化数据库

```bash
cd /var/www/blog/app

# 运行数据库迁移
npx prisma migrate deploy

# 验证数据库文件已创建
ls -la /var/www/blog/app/dev.db
```

### 可选：运行种子数据

```bash
# 创建测试用户和示例文章
npm run db:seed
```

种子数据包含：
- 2 个用户：`alice@example.com` / `bob@example.com`（密码：`password123`）
- 4 篇示例文章（3 技术 + 1 生活）

---

## Step 8 — 构建项目

```bash
cd /var/www/blog/app

# Next.js 生产构建
npm run build
```

**⚠️ 常见构建错误：**

| 错误 | 解决 |
|------|------|
| `Module not found: @/generated/prisma/client` | 运行 `npx prisma generate` |
| `DATABASE_URL is not set` | 检查 `.env` 文件是否存在 |
| TypeScript 类型错误 | `npm install --save-dev @types/node @types/react @types/react-dom` |
| 内存不足 | 限制 Node 内存：`NODE_OPTIONS="--max-old-space-size=2048" npm run build` |

构建成功后 `.next/` 目录会出现。

---

## Step 9 — 创建 PM2 启动配置

在 `/var/www/blog/ecosystem.config.js` 创建：

```bash
cat > /var/www/blog/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: "blog",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "/var/www/blog/app",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        // Next.js 在生产模式下需要这些
        JWT_SECRET: process.env.JWT_SECRET,
        DATABASE_URL: process.env.DATABASE_URL,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        BASE_URL: process.env.BASE_URL,
      },
      instances: 1,
      exec_mode: "fork",
      max_memory_restart: "800M",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/var/www/blog/logs/error.log",
      out_file: "/var/www/blog/logs/output.log",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};
EOF
```

**⚠️ PM2 无法直接读取 .env 文件**，所以用以下方式启动：

```bash
# 方式一：用 --env-file 加载 .env（推荐，Node 20.6+）
cd /var/www/blog/app
pm2 start "node --env-file=.env node_modules/.bin/next start" --name blog

# 方式二：如果 Node 版本 < 20.6，手动 export 环境变量
# cd /var/www/blog/app
# export $(grep -v '^#' .env | xargs)
# pm2 start node_modules/.bin/next --name blog -- start
```

验证 PM2 进程状态：

```bash
pm2 status
pm2 logs blog --lines 20
```

设置 PM2 开机自启：

```bash
pm2 startup systemd
# 运行 pm2 startup 输出的命令（需要 sudo）
pm2 save
```

---

## Step 10 — 配置 Nginx 反向代理

### 10.1 创建 Nginx 配置

```bash
sudo tee /etc/nginx/sites-available/blog << 'NGXEOF'
server {
    listen 80;
    server_name _;  # 如果没有域名就用 _（匹配所有 IP 访问）

    # 如果有域名，把 _ 换成你的域名，例如：
    # server_name blog.example.com;

    client_max_body_size 10M;  # 允许上传最大 10MB

    # 日志
    access_log /var/www/blog/logs/nginx-access.log;
    error_log  /var/www/blog/logs/nginx-error.log;

    # 反向代理到 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # 静态资源直接由 Nginx 提供（可选，减轻 Next.js 负担）
    location /_next/static {
        alias /var/www/blog/app/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
NGXEOF
```

### 10.2 启用站点

```bash
# 创建软链接
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/

# 删除默认站点（避免冲突）
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

---

## Step 11 — 配置防火墙 (UFW)

```bash
# 允许 SSH（重要！别把自己锁在外面）
sudo ufw allow 22/tcp

# 允许 HTTP / HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 可选：只允许本地访问 3000 端口（更安全）
# sudo ufw deny 3000/tcp

# 启用防火墙
sudo ufw --force enable

# 查看状态
sudo ufw status verbose
```

---

## Step 12 — 最终验证

### 12.1 检查所有服务

```bash
# PM2
pm2 status

# Nginx
sudo systemctl status nginx

# 端口监听
sudo ss -tlnp | grep -E "80|3000"

# 测试 HTTP 响应
curl -sI http://localhost:3000 | head -5
curl -sI http://localhost | head -5
```

### 12.2 浏览器验证

向用户输出最终访问地址：
- 如果配置了域名：`http://<域名>`
- 如果只有 IP：`http://<服务器公网IP>`

**用户应能在浏览器中看到：**
- 博客首页，显示文章列表
- 分类 Tab（全部 / 技术 / 生活）
- 可以注册新用户（但邮箱验证暂时只能发到 1541148313@qq.com）

### 12.3 验证清单

完成后确认：
- [ ] `pm2 status` 显示 blog 进程 `online`
- [ ] `curl http://localhost:3000` 返回 HTML
- [ ] `curl http://localhost` 返回 HTML（Nginx 代理正常）
- [ ] 浏览器访问公网 IP 能看到博客首页
- [ ] 可以注册/登录
- [ ] 登录后可以写文章

---

## Troubleshooting / 常见问题

### PM2 进程反复重启

```bash
pm2 logs blog --lines 50 --nostream
```

常见原因：
- `.env` 文件未正确加载 → 检查 `DATABASE_URL` 是否生效
- Prisma Client 未生成 → `npm run db:generate`
- 数据库文件权限问题 → `chmod 666 /var/www/blog/app/dev.db`
- 端口被占用 → `lsof -i :3000`

### Nginx 502 Bad Gateway

说明 Next.js 没有在 3000 端口运行：
```bash
pm2 restart blog
curl http://localhost:3000  # 确认 Next.js 响应正常
```

### 构建时内存不足 (OOM)

```bash
# 构建时限制内存
NODE_OPTIONS="--max-old-space-size=2048" npm run build

# 或者添加 swap（临时）
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 数据库被锁定 (SQLITE_BUSY)

SQLite 不支持高并发写入。如果遇到锁定：
```bash
pm2 restart blog
```

### 邮件发送失败

Resend 未验证域名时只能发到已验证邮箱。告诉用户：
- 去 [resend.com](https://resend.com) 添加域名
- 配置 DNS 记录（MX, DKIM, SPF）
- 验证通过后所有邮箱都能收到

---

## 更新部署流程

当用户修改代码后需要更新：

```bash
cd /var/www/blog/app

# 1. 拉取最新代码
git pull  # 或重新上传

# 2. 安装新依赖（如有）
npm ci --omit=dev

# 3. 数据库迁移（如有新迁移）
npx prisma migrate deploy

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart blog

# 6. 查看日志确认正常
pm2 logs blog --lines 20
```

---

## 常用维护命令

```bash
# 查看服务状态
pm2 status

# 查看实时日志
pm2 logs blog

# 重启服务
pm2 restart blog

# 停止服务
pm2 stop blog

# 查看资源占用
pm2 monit

# Nginx 重载
sudo systemctl reload nginx

# 查看 Nginx 日志
sudo tail -f /var/www/blog/logs/nginx-access.log
sudo tail -f /var/www/blog/logs/nginx-error.log
```

---

## 可选：配置 HTTPS (Let's Encrypt)

如果有域名，建议开启 HTTPS：

```bash
# 安装 certbot
sudo apt-get install -y certbot python3-certbot-nginx

# 获取证书（替换为你的域名）
sudo certbot --nginx -d blog.example.com

# 证书会自动续期（certbot 已配置 systemd timer）
sudo systemctl status certbot.timer
```

开启 HTTPS 后，记得更新 `.env` 中的 `BASE_URL` 为 `https://your-domain.com`。
