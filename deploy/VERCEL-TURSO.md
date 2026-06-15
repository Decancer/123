# Vercel + Turso 部署指南

把你的博客部署到 Vercel（免费），数据库用 Turso（免费云端 SQLite），一次配置永久运行。

---

## 整体架构

```
你写代码 → git push GitHub → Vercel 自动部署 → 全球 CDN 加速
                ↓
          Turso 云端 SQLite（数据持久化，不会丢）
```

---

## Step 1：注册 Turso + 创建数据库

### 1.1 注册

打开 [turso.tech](https://turso.tech)，点击 **Sign Up**，用 GitHub 账号登录（推荐）。

### 1.2 安装 Turso CLI

在你自己的电脑上（不是豆包 VM）：

**Windows（PowerShell）：**
```powershell
# 下载 turso.exe
Invoke-WebRequest -Uri "https://github.com/tursodatabase/turso-cli/releases/latest/download/turso-windows-amd64.exe" -OutFile "turso.exe"
```

**Mac：**
```bash
brew install tursodatabase/tap/turso
```

### 1.3 登录

```bash
turso auth login
```

浏览器会弹出，用 GitHub 授权。

### 1.4 创建数据库

```bash
# 创建一个数据库（名字随意）
turso db create my-blog

# 查看数据库信息
turso db show my-blog

# 拿到连接 URL，类似：
# libsql://my-blog-xxxx.turso.io
```

### 1.5 创建 Auth Token

```bash
# 创建访问令牌
turso db tokens create my-blog
```

会输出一个 token，类似 `eyJhbGciOiJFZERTQSIsInR...`。

**⚠️ 把这个 token 和 URL 记下来，后面要用。**

---

## Step 2：本地推 schema 到 Turso

在项目目录 `E:\13` 下：

### 2.1 先设置本地环境变量连 Turso

在 PowerShell 中临时设置（不影响 `.env` 文件）：

```powershell
$env:DATABASE_URL = "libsql://my-blog-xxxx.turso.io"
$env:TURSO_AUTH_TOKEN = "eyJhbGciOiJFZERTQSIsInR..."
```

### 2.2 推送数据库结构

```bash
npm run db:push
```

这会直接把 `prisma/schema.prisma` 中的表结构推到 Turso 云端。

输出应该类似：
```
✔ Generated Prisma Client ...
✔ The database schema was successfully pushed to the database.
```

### 2.3 验证数据库已创建

```bash
turso db shell my-blog
```

进入后输入：
```sql
.tables
```

应该看到 `users`、`posts`、`comments`、`tags`、`tags_on_posts`、`email_verification_tokens`。

输入 `.quit` 退出。

---

## Step 3：部署到 Vercel

### 3.1 注册 Vercel

打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录（推荐）。

### 3.2 导入项目

1. Vercel 控制台 → **Add New...** → **Project**
2. 选择你的 GitHub 仓库 `Decancer/123`（可能需要先授权 Vercel 访问）
3. 导入

### 3.3 配置构建设置

Vercel 会自动识别 Next.js 项目，一般无需改动。确认：

| 设置 | 值 |
|------|-----|
| Framework | Next.js |
| Build Command | `npm run build`（默认） |
| Output Directory | `.next`（默认） |
| Install Command | `npm install`（默认） |

### 3.4 配置环境变量（关键！）

在 Vercel 项目设置 → **Environment Variables**，添加：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `libsql://my-blog-xxxx.turso.io` | Production |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOiJFZERTQSIsInR...`（你创建的 token） | Production |
| `JWT_SECRET` | 运行 `openssl rand -base64 64` 生成的随机串 | Production |
| `RESEND_API_KEY` | `你的 Resend API Key — 去 resend.com 创建` | Production |
| `BASE_URL` | `https://你的项目名.vercel.app` | Production |

> `BASE_URL` 先用 Vercel 给的默认域名。以后绑了自定义域名再改。

### 3.5 部署

点击 **Deploy**。Vercel 会自动：
1. Clone 你的仓库
2. `npm install`（会触发 `postinstall` → `prisma generate`）
3. `npm run build`（Next.js 生产构建）
4. 部署到全球 CDN

完成后会给你一个地址，比如 `https://my-blog-xxxx.vercel.app`。

---

## Step 4：验证

1. 浏览器打开 `https://你的项目名.vercel.app`
2. 应该看到博客首页
3. 注册一个新用户试试
4. 登录后写一篇文章试试

---

## Step 5：可选 — 导入种子数据

如果需要把本地的测试数据导入 Turso：

```bash
# 导出本地 SQLite 为 SQL
sqlite3 dev.db .dump > backup.sql

# 导入到 Turso
turso db shell my-blog < backup.sql
```

注意：如果本地和 Turso 的 ID 自增值冲突，导入可能失败。建议生产环境直接用 `npm run db:seed`（需要先配置 `DATABASE_URL` 指向 Turso）。

---

## 后续开发流程

本地开发和部署两不误：

```
本地开发：
  1. 改代码
  2. 连本地 SQLite（DATABASE_URL=file:./dev.db）
  3. npm run dev 测试
  4. 数据库结构有变化 → npm run db:migrate（生成本地迁移文件）

部署到生产：
  1. git push 到 GitHub
  2. Vercel 自动部署
  3. 如果有数据库结构变化 → 本地 npm run db:push 到 Turso
```

---

## 免费额度

| 服务 | 免费额度 | 够用吗 |
|------|----------|--------|
| **Vercel** | 100GB 带宽/月、6000 分钟构建/月 | ✅ 个人博客完全够 |
| **Turso** | 500 个数据库、10GB 存储/月、50 亿行读取/月 | ✅ 个人博客完全够 |
| **Resend** | 100 封/天 | ⚠️ 够用但域名未验证 |

---

## 常见问题

### Vercel 构建失败：Prisma Client not found

检查 Vercel 构建日志中 `postinstall` 是否执行了 `prisma generate`。确认 `package.json` 中有：
```json
"postinstall": "prisma generate"
```

### Turso 连接失败

在 Vercel 环境变量中确认：
- `DATABASE_URL` 以 `libsql://` 开头
- `TURSO_AUTH_TOKEN` 正确填写（没有多余空格或引号）

### 想换自定义域名

1. 在 Vercel 项目 → Settings → Domains → 添加你的域名
2. 去域名 DNS 托管处添加 Vercel 要求的 CNAME 记录
3. 更新 Vercel 环境变量 `BASE_URL` 为 `https://你的域名`

---

## 豆包 VM 怎么办

Vercel + Turso 部署完成后，豆包 VM 就不需要了。你的博客永久运行在 Vercel 上，数据在 Turso 云端，不会丢失。
