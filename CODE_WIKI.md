# Mashiro Chat 项目文档

## 项目概述

**Mashiro Chat** 是一个集博客系统、聊天室、私信功能于一体的 Web 应用，集成了 Live2D 虚拟角色（Mashiro）作为交互式界面元素。

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite (支持 Turso 部署) |
| ORM | Prisma 7 |
| 样式 | Tailwind CSS v4 |
| 认证 | JWT + Cookie (jose) |
| 密码加密 | bcryptjs |
| 邮件服务 | Resend API |
| 对象存储 | 腾讯云 COS |
| AI 对话 | DeepSeek API |
| Live2D | pixi-live2d-display + pixi.js |
| 富文本编辑 | Tiptap |

---

## 项目架构

```
e:\13\
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/                # API 路由
│   │   │   ├── auth/           # 认证相关 API
│   │   │   ├── chat-room/      # 聊天室 API
│   │   │   ├── messages/       # 私信 API
│   │   │   ├── posts/          # 文章 API
│   │   │   ├── cos/            # 对象存储 API
│   │   │   └── ...
│   │   ├── chat-room/          # 聊天室页面
│   │   ├── dressing-room/       # 换装页面
│   │   ├── login/               # 登录页
│   │   ├── register/            # 注册页
│   │   ├── posts/               # 文章详情页
│   │   ├── profile/             # 个人资料页
│   │   ├── messages/            # 私信页面
│   │   └── page.tsx             # 首页
│   ├── components/              # React 组件
│   │   ├── ChatRoomClient.tsx   # 聊天室客户端 (核心)
│   │   ├── Live2DMashiro.tsx    # Live2D 角色渲染
│   │   ├── UserMenu.tsx         # 用户菜单
│   │   ├── PostList.tsx         # 文章列表
│   │   └── ...
│   └── lib/                     # 核心工具库
│       ├── auth.ts               # 认证工具
│       ├── prisma.ts            # 数据库客户端
│       ├── email.ts             # 邮件服务
│       ├── cos.ts               # COS 对象存储
│       ├── sanitize.ts           # HTML 清理
│       ├── Live2DContext.tsx     # Live2D 上下文
│       └── useLive2DReaction.ts  # Live2D 交互 Hook
├── prisma/
│   ├── schema.prisma            # 数据库模型
│   ├── seed.ts                  # 种子数据
│   └── migrations/               # 数据库迁移
├── public/
│   ├── live2d*/                  # Live2D 模型资源
│   ├── mashiro live2d/          # 默认 Live2D 模型
│   └── live2d.min.js            # Live2D 运行时
└── deploy/                       # 部署配置
```

---

## 核心模块详解

### 1. 认证模块 (`src/lib/auth.ts`)

认证采用 **JWT + HttpOnly Cookie** 方案。

#### 关键函数

| 函数 | 说明 |
|------|------|
| `hashPassword(password)` | 使用 bcryptjs 对密码进行哈希 |
| `verifyPassword(password, hash)` | 验证密码是否匹配 |
| `signToken(payload)` | 生成 JWT Token (HS256, 7天有效期) |
| `verifyToken(token)` | 验证并解析 JWT Token |
| `setAuthCookie(token)` | 设置 HttpOnly Cookie |
| `removeAuthCookie()` | 清除认证 Cookie |
| `getAuthCookie()` | 获取认证 Cookie |
| `getCurrentUser()` | 获取当前登录用户信息 |

#### Token 结构
```typescript
// Payload
{ userId: number, email: string }
// 过期时间: 7天
```

---

### 2. 数据库模块 (`src/lib/prisma.ts`)

使用 Prisma ORM 连接 SQLite/Turso 数据库。

#### 初始化逻辑
```typescript
// 开发环境使用全局单例避免热重载创建多个实例
const prisma = globalForPrisma.prisma ?? createPrismaClient()

// 支持 Turso 云数据库 (需要 AUTH_TOKEN)
const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) })
```

---

### 3. 邮件服务 (`src/lib/email.ts`)

使用 Resend API 发送验证邮件。

#### 关键函数

| 函数 | 说明 |
|------|------|
| `sendVerificationEmail(userId, userEmail, userName)` | 发送验证邮件 (60秒冷却) |
| `verifyEmailToken(token)` | 验证邮箱 Token |

#### 邮件配置
- **发件人**: `Mashiro Chat <noreply@mashiro.chat>`
- **Token 有效期**: 24 小时
- **发送冷却**: 60 秒

---

### 4. 对象存储 (`src/lib/cos.ts`)

集成腾讯云 COS 进行图片上传和存储。

#### 上传分类

| 分类 | 大小限制 | 存储路径 |
|------|----------|----------|
| `avatar` | 500KB | `avatars/u_{userId}_{timestamp}.{ext}` |
| `background` | 2MB | `backgrounds/u_{userId}_{timestamp}.{ext}` |
| `post-image` | 5MB | `posts/p_{userId}_{timestamp}_{suffix}.{ext}` |

#### 关键函数

| 函数 | 说明 |
|------|------|
| `generateObjectKey(category, ext, opts)` | 生成 COS 对象键 |
| `getPresignedUploadUrl(objectKey, contentType, expires)` | 生成预签名上传 URL |
| `getPublicUrl(objectKey)` | 获取公开访问 URL |
| `isCosUrl(url)` | 判断是否为 COS URL |
| `isValidImageValue(img)` | 校验图片值 (COS URL 或 base64) |

---

## 数据模型 (Prisma Schema)

### User (用户)
```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password      String
  name          String?
  avatar        String?
  background    String?
  bio           String?
  role          String    @default("user")  // user | admin
  emailVerified DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  posts              Post[]
  comments           Comment[]
  verificationTokens EmailVerificationToken[]
}
```

### Post (文章)
```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  slug      String   @unique
  images    String?  // JSON array of image URLs
  content   String
  excerpt   String?
  category  String   @default("tech")  // tech | life
  published Boolean  @default(false)
  viewCount Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId  Int
  author    User     @relation(...)
  comments  Comment[]
  tags      TagOnPost[]
}
```

### ChatRoomMessage (聊天室消息)
```prisma
model ChatRoomMessage {
  id         Int      @id @default(autoincrement())
  content    String
  userId     Int
  userName   String
  userAvatar String?
  createdAt  DateTime @default(now())
}
```

### PrivateMessage (私信)
```prisma
model PrivateMessage {
  id             Int      @id @default(autoincrement())
  content        String
  senderId       Int
  senderName     String
  senderAvatar   String?
  receiverId     Int
  receiverName   String
  receiverAvatar String?
  isRead         Boolean  @default(false)
  createdAt      DateTime @default(now())

  @@index([senderId, receiverId])
  @@index([receiverId, isRead])
}
```

### 其他模型
- **EmailVerificationToken**: 邮箱验证 Token
- **Comment**: 文章评论
- **Tag**: 文章标签
- **TagOnPost**: 文章-标签多对多关系
- **ChatRoomPresence**: 聊天室在线用户状态

---

## API 路由

### 认证 API (`/api/auth/`)

| 路由 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | 否 |
| `/api/auth/login` | POST | 用户登录 | 否 |
| `/api/auth/logout` | POST | 用户登出 | 是 |
| `/api/auth/me` | GET | 获取当前用户 | 是 |
| `/api/auth/delete` | DELETE | 删除账号 | 是 |
| `/api/auth/send-verification` | POST | 发送验证邮件 | 是 |
| `/api/auth/resend-verification` | POST | 重新发送验证邮件 | 是 |
| `/api/auth/check-verified` | GET | 检查邮箱验证状态 | 是 |
| `/api/auth/verify-email` | POST | 验证邮箱 Token | 否 |

### 文章 API (`/api/posts/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/posts` | GET | 获取文章列表 (支持 category/search/pagination) |
| `/api/posts` | POST | 创建文章 |
| `/api/posts/[slug]` | GET | 获取文章详情 |
| `/api/posts/[slug]` | PUT | 更新文章 |
| `/api/posts/[slug]/comments` | GET/POST | 文章评论 |

### 聊天室 API (`/api/chat-room/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/chat-room/messages` | GET | 获取消息 (支持 since/cursor/wait 长轮询) |
| `/api/chat-room/messages` | POST | 发送消息 |
| `/api/chat-room/messages` | DELETE | 清空聊天室 (仅管理员) |
| `/api/chat-room/ai-reply` | POST | 召唤 AI 回复 |
| `/api/chat-room/heartbeat` | GET/POST | 在线人数心跳 |

### 私信 API (`/api/messages/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/messages` | GET | 获取私信对话 (支持长轮询) |
| `/api/messages` | POST | 发送私信 |
| `/api/messages/conversations` | GET | 获取会话列表 |
| `/api/messages/unread-count` | GET | 获取未读数 |

### 其他 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/api/cos/presign` | POST | 生成 COS 预签名 URL |
| `/api/profile` | GET/PUT | 用户资料 |
| `/api/users` | GET | 用户列表 |

---

## 核心组件

### ChatRoomClient (`src/components/ChatRoomClient.tsx`)

聊天室核心客户端组件。

#### 特性
- **长轮询**: 实时获取新消息 (8秒超时)
- **心跳机制**: 10秒间隔维护在线人数
- **页面可见性**: 隐藏时暂停轮询，恢复时立即拉取
- **消息去重**: 防止长轮询和增量拉取竞态
- **AI 召唤**: 调用 DeepSeek API 生成 AI 回复
- **管理员功能**: 清空聊天室

#### 关键状态
```typescript
const [messages, setMessages] = useState<ChatMessage[]>([])
const [input, setInput] = useState("")
const [onlineCount, setOnlineCount] = useState(0)
const [aiLoading, setAiLoading] = useState(false)
```

### Live2DMashiro (`src/components/Live2DMashiro.tsx`)

Live2D 虚拟角色 Mashiro 渲染组件。

#### 特性
- **响应式**: 仅桌面宽屏 (≥768px) 显示
- **多装扮**: 支持 7 种不同服装模型
- **交互**: 点击触发随机动作
- **事件驱动**: 通过 `mashiro:reaction` 事件响应其他组件

#### 可用动作
`smile`, `surprised`, `angry`, `cry`, `sad`, `serious`, `thinking`, `bye`, `kandou`, `kime`, `uziuzi`, `nf`, `nnf`, `gacha`, `idle`

### Live2DContext (`src/lib/Live2DContext.tsx`)

Live2D 状态管理 Context。

```typescript
interface Live2DContextValue {
  modelPath: string
  outfitId: OutfitId
  setOutfit: (id: OutfitId) => void
}
```

#### 可用装扮 (OUTFITS)

| ID | 名称 | 路径 |
|----|------|------|
| `ur` | UR 事件313 | `/live2d4/mashiro.model.json` |
| `event242` | UR 事件242 | `/live2d6/mashiro.model.json` |
| `event234` | UR 事件234 | `/live2d5/mashiro.model.json` |
| `ssr` | SSR 限定 | `/live2d3/mashiro.model.json` |
| `winter` | 冬季校服 | `/mashiro live2d/mashiro.model.json` |
| `summer` | 夏季校服 | `/live2d2/mashiro.model.json` |

---

## 关键工具函数

### sanitize.ts

```typescript
stripHtml(html: string): string
// 移除所有 HTML 标签，转换实体字符为纯文本
// 用于从富文本内容生成摘要
```

### useLive2DReaction.ts

```typescript
useLoadingReaction(loading: boolean): void
// loading=true 时触发 Mashiro 思考动画
// loading=false 时恢复 idle 状态
```

---

## 项目运行

### 开发环境

```bash
# 安装依赖
npm install

# 生成 Prisma Client
npm run postinstall

# 初始化数据库
npm run db:push

# 填充种子数据 (可选)
npm run db:seed

# 启动开发服务器
npm run dev
```

### 数据库命令

| 命令 | 说明 |
|------|------|
| `npm run db:push` | 推送 schema 到数据库 |
| `npm run db:migrate` | 运行迁移 |
| `npm run db:seed` | 填充种子数据 |
| `npm run db:studio` | 打开 Prisma Studio |
| `npm run db:reset` | 重置数据库 |

### 生产构建

```bash
npm run build
npm start
```

---

## 环境变量

参考 `deploy/env.template`:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# JWT 密钥
JWT_SECRET="your-64-char-secret"

# Resend 邮件 API
RESEND_API_KEY="your-resend-api-key"

# 网站地址 (邮箱验证链接用)
BASE_URL="https://your-domain.com"

# 腾讯云 COS
COS_BUCKET="your-bucket"
COS_REGION="ap-guangzhou"
COS_SECRET_ID="your-secret-id"
COS_SECRET_KEY="your-secret-key"

# DeepSeek AI
DEEPSEEK_API_KEY="your-deepseek-api-key"
```

---

## 目录结构详解

### 公共资源 (`public/`)

| 目录 | 说明 |
|------|------|
| `live2d*/` | 各装扮的 Live2D 模型文件 (.moc, .physics.json, .bundle) |
| `mashiro live2d/` | 默认冬季校服模型 |
| `mashiro head/` | 头像用 Live2D 模型 |
| `live2d.min.js` | Live2D Cubism 2 运行时 |

### 部署配置 (`deploy/`)

| 文件 | 说明 |
|------|------|
| `ecosystem.config.js` | PM2 进程管理配置 |
| `nginx.conf` | Nginx 反向代理配置 |
| `SKILL.md` | 部署技能文档 |
| `VERCEL-TURSO.md` | Vercel + Turso 部署指南 |

---

## 依赖关系图

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  ChatRoom    │    │   Posts      │    │  Profile   │ │
│  │  Page        │    │   Page       │    │  Page      │ │
│  └──────┬───────┘    └──────┬───────┘    └─────┬──────┘ │
│         │                   │                  │        │
│  ┌──────▼───────────────────▼──────────────────▼─────┐ │
│  │                    API Routes                       │ │
│  │  /api/auth/*  /api/posts/*  /api/chat-room/*      │ │
│  │  /api/messages/*  /api/cos/presign                │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │                   lib/                               │ │
│  │  auth.ts  prisma.ts  email.ts  cos.ts  sanitize.ts │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │                 Prisma ORM                           │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │         SQLite / Turso Database                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              External Services                       │ │
│  │  Resend (Email)  |  COS (Storage)  |  DeepSeek (AI) │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 安全考量

1. **密码安全**: 使用 bcryptjs (cost factor 10) 哈希存储
2. **认证 Token**: JWT HS256 + HttpOnly Cookie + SameSite Lax
3. **CSRF 防护**: SameSite Cookie + POST 请求体验证
4. **输入验证**: Zod/手动校验所有用户输入
5. **SQL 注入**: Prisma ORM 参数化查询防护
6. **XSS 防护**: HTML 内容 stripHtml 清理
7. **邮件验证**: 24 小时过期 Token + 60 秒发送冷却
