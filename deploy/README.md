# 博客部署包

把这个文件夹里的内容发给豆包的 AI 助手，它会按步骤在 2核4G Ubuntu 虚拟机上把博客部署起来。

## 你需要发给豆包的内容

**直接复制下面这句话 + 附上 SKILL.md 文件：**

> 请按照附件的 SKILL.md 部署我的博客项目到这台服务器上。项目代码在 [GitHub仓库地址 或 我稍后上传]，请先帮我检查系统环境。

## 你需要准备的信息

| 需要确认 | 说明 |
|---------|------|
| 项目代码位置 | GitHub 仓库地址，或把项目文件夹打包成 zip 上传 |
| 域名（可选） | 如果有域名指向服务器，部署时配置 Nginx 会用到 |
| 服务器 IP | 豆包 VM 的公网 IP，部署完用这个访问 |

## 文件说明

| 文件 | 用途 |
|------|------|
| `SKILL.md` | **主文件** — 完整部署步骤（Node.js + Nginx + PM2） |
| `SKILL-CLOUDFLARE-TUNNEL.md` | **外网访问** — Cloudflare Tunnel 配置指南（解决 NAT 隔离无法外网访问的问题） |
| `env.template` | 环境变量模板，部署时参考 |
| `nginx.conf` | Nginx 配置模板 |
| `ecosystem.config.js` | PM2 进程管理配置模板 |

## 部署后访问

部署完成后，豆包 VM 有 NAT 网络隔离，**外网无法直接访问**。还需要配 Cloudflare Tunnel：

> 把 `SKILL-CLOUDFLARE-TUNNEL.md` 发给豆包，按指引配置。

- 方案 A（无需域名）：得到 `https://xxx.trycloudflare.com` 临时地址
- 方案 B（需域名）：得到 `https://你的域名` 固定地址，自动 HTTPS
- 测试账号：`alice@example.com` / `password123`

## 注意事项

- Resend 邮件服务未验证域名，只能发到 `1541148313@qq.com`
- 注册新用户后邮箱验证功能暂时受限
- 如需正式使用，去 [resend.com](https://resend.com) 添加域名验证 DNS
