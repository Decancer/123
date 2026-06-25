# 博客部署包

## 当前部署方式：VPS + Cloudflare Tunnel（✅ 生产运行中）

```
用户 → https://mashiro.chat → Cloudflare CDN → cloudflared 隧道 → localhost:3000 (PM2)
```

- **服务器**：腾讯云轻量 2C2G 广州
- **数据库**：本地 SQLite（不再用 Turso）
- **静态资源**：腾讯云 COS
- **自动部署**：git push → GitHub Actions → SSH 构建重启（30s 上线）
- **备份**：每天凌晨 3:00 自动备份 dev.db 到 COS

## 文件说明

| 文件 | 用途 |
|------|------|
| `env.template` | 环境变量模板 |
| `ecosystem.config.js` | PM2 进程管理配置 |
| `SKILL.md` | 服务器部署指南（Node.js + Nginx + PM2） |
| `SKILL-CLOUDFLARE-TUNNEL.md` | Cloudflare Tunnel 外网穿透 |

## 测试账号

`alice@example.com` / `password123`

## 注意事项

- Resend 邮件已验证 mashiro.chat 域名，可发往任意邮箱
- 图片走 COS 直传，不经过 VPS 带宽
