# Mashiro Chat 🐱

全栈博客 + 聊天室 + AI 猫娘，部署在 `mashiro.chat`。

## 技术栈

Next.js 16 + TypeScript + Prisma + SQLite + Tailwind CSS v4 + Live2D + DeepSeek AI

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:3000

## 部署

生产环境：腾讯云 2C2G VPS + Cloudflare Tunnel + PM2

```bash
git push  # → GitHub Actions 自动部署到 VPS，30s 上线
```

详细部署文档见 `deploy/README.md`。

## 项目文档

完整架构文档见 `CODE_WIKI.md`。
