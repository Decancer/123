# 博客部署包

两种部署方式任选其一：

---

## 方式一：Vercel + Turso（⭐ 推荐 — 永久免费，零运维）

代码 push 到 GitHub，自动部署。服务器不用管，不消失。

**跟着 `VERCEL-TURSO.md` 一步步操作即可，不需要豆包 VM。**

---

## 方式二：豆包 VM 手动部署

把 SKILL 文件发给豆包 AI，在 2核4G Ubuntu 虚拟机上部署。

> 发给豆包：请按照附件的 SKILL.md 部署我的博客项目到这台服务器上。项目代码在 https://github.com/Decancer/123

---

## 文件说明

| 文件 | 用途 |
|------|------|
| `VERCEL-TURSO.md` | **⭐ 推荐** — Vercel + Turso 部署指南（永久免费，零运维） |
| `SKILL.md` | 豆包 VM 手动部署（Node.js + Nginx + PM2） |
| `SKILL-CLOUDFLARE-TUNNEL.md` | Cloudflare Tunnel 外网穿透 |
| `env.template` | 环境变量模板 |
| `nginx.conf` | Nginx 配置模板 |
| `ecosystem.config.js` | PM2 进程管理配置模板 |

## 测试账号

`alice@example.com` / `password123`

## 注意事项

- Resend 邮件服务未验证域名，只能发到 `1541148313@qq.com`
- 如需正式使用，去 [resend.com](https://resend.com) 添加域名验证 DNS
