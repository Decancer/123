# Cloudflare Tunnel 配置 Skill

## Skill Name

`cloudflare_tunnel_setup`

---

## Skill Description

在已部署博客的 Ubuntu 服务器上配置 Cloudflare Tunnel，将内网 Next.js 服务暴露到公网，支持 HTTPS 和自定义域名。

**前提：** 博客已通过 PM2 在 `localhost:3000` 运行。

**功能：**

1. 提供两种方案供用户选择
2. 下载 cloudflared 二进制（无需 apt，适配受限环境）
3. 创建隧道并测试连通性
4. 配置 systemd 持久化运行
5. 更新项目 BASE_URL 环境变量
6. 验证外网访问

---

## Trigger Conditions

触发词包括：

- 配置 Cloudflare Tunnel
- 外网访问
- 公网访问
- 暴露端口
- 内网穿透
- cloudflared
- 域名访问
- HTTPS 配置

---

## Step 0 — 确认博客正在运行

```bash
# 确认 PM2 进程状态
pm2 status

# 确认本地 3000 端口可访问
curl -sI http://localhost:3000 | head -5
```

必须看到 `HTTP/1.1 200 OK`。如果失败，先排查博客部署问题。

---

## Step 1 — 选择方案（询问用户）

向用户说明两种方案，由用户选择：

### 方案 A：快速隧道（Quick Tunnel）⭐ 推荐先试

- **不需要** Cloudflare 账号
- **不需要** 域名
- 得到一个临时域名：`https://xxx.trycloudflare.com`
- 适合：快速测试、临时演示
- 缺点：域名是随机的，重启后会变

### 方案 B：命名隧道（Named Tunnel）

- **需要** Cloudflare 账号（免费注册）
- **需要** 一个域名，且 DNS 托管在 Cloudflare
- 得到：`https://你的域名`
- 适合：长期使用、生产环境
- 自动 HTTPS、自动续期证书

```
请用户选择方案 A 或方案 B。

如果用户不确定，建议先选 A 快速验证，之后再升级到 B。
```

---

## Step 2 — 下载 cloudflared（⭐ 关键步骤，多个备用方案）

两种方案都需要 cloudflared。

### ⚠️ 国内下载 GitHub 文件极易超时，请严格按以下优先级尝试：

---

### 🥇 方式一：用户自行下载后上传（成功率最高）

**告知用户：**

> 由于国内访问 GitHub 通常很慢，建议你在自己电脑上下载 cloudflared 后上传给我。
>
> 📥 下载地址（在你自己电脑浏览器中打开）：
> https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
>
> 下载完成后把文件上传给我，我会继续配置。

用户上传后：

```bash
# 假设文件上传到了工作目录
mkdir -p ~/cloudflared
mv cloudflared-linux-amd64 ~/cloudflared/cloudflared
chmod +x ~/cloudflared/cloudflared
~/cloudflared/cloudflared --version
```

---

### 🥈 方式二：多重镜像依次尝试（自动化）

```bash
mkdir -p ~/cloudflared && cd ~/cloudflared

# 按顺序尝试，哪个成功用哪个。每个超时 30 秒，避免卡死。

# 源 1：ghproxy 镜像（国内常用）
curl -L --connect-timeout 30 --max-time 120 \
  -o cloudflared \
  "https://ghproxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
  && echo "✅ ghproxy 成功" && chmod +x cloudflared && ./cloudflared --version && exit 0

# 源 2：gh-proxy 另一个镜像
curl -L --connect-timeout 30 --max-time 120 \
  -o cloudflared \
  "https://gh-proxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
  && echo "✅ gh-proxy 成功" && chmod +x cloudflared && ./cloudflared --version && exit 0

# 源 3：mirror.ghproxy.com
curl -L --connect-timeout 30 --max-time 120 \
  -o cloudflared \
  "https://mirror.ghproxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
  && echo "✅ mirror.ghproxy 成功" && chmod +x cloudflared && ./cloudflared --version && exit 0

# 源 4：直接 GitHub（可能很慢，但值得一试）
curl -L --connect-timeout 30 --max-time 120 \
  -o cloudflared \
  "https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
  && echo "✅ GitHub 直连成功" && chmod +x cloudflared && ./cloudflared --version && exit 0

# 如果全部失败，告诉用户手工下载上传
echo "❌ 所有镜像均失败，请用户自行下载后上传"
```

**⚠️ 关键：** 这里用了固定版本 `2025.2.1` 的**直接下载链接**，而不是 `/latest/` 重定向链接。因为 `/latest/` 需要先访问 GitHub API 获取重定向，多一步就多一个失败点。

---

### 🥉 方式三：如果上述全部失败

用 `wget` 重试（`wget` 的重试机制比 `curl` 更鲁棒）：

```bash
cd ~/cloudflared
wget --tries=5 --timeout=30 \
  "https://ghproxy.com/https://github.com/cloudflare/cloudflared/releases/download/2025.2.1/cloudflared-linux-amd64" \
  -O cloudflared
chmod +x cloudflared
./cloudflared --version
```

---

### 快速验证

一旦拿到文件，验证是否可用：

```bash
file ~/cloudflared/cloudflared
# 应输出: ELF 64-bit LSB executable, x86-64 ...

~/cloudflared/cloudflared --version
# 应输出: cloudflared version 2025.2.1 ...
```

如果 `file` 命令输出包含 `HTML` 或 `text`，说明下载的是错误页面而不是二进制文件，文件无效，需重试。

---

## ---- 方案 A：快速隧道 ----

## Step A1 — 直接启动

```bash
cd ~/cloudflared

# 启动快速隧道，将 localhost:3000 暴露出去
./cloudflared tunnel --url http://localhost:3000
```

启动后会看到类似输出：

```
2024-01-01T00:00:00Z INF Requesting new quick Tunnel on trycloudflare.com...
2024-01-01T00:00:00Z INF +--------------------------------------------------------------------------------------------+
2024-01-01T00:00:00Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2024-01-01T00:00:00Z INF |  https://random-words.trycloudflare.com                                                    |
2024-01-01T00:00:00Z INF +--------------------------------------------------------------------------------------------+
```

**记下这个 URL**（例如 `https://random-words.trycloudflare.com`），这就是公网访问地址。

按 `Ctrl+C` 停止当前隧道，继续下一步配置后台运行。

## Step A2 — 配置为系统服务（后台运行 + 开机自启）

```bash
# 安装 cloudflared 到系统路径
sudo cp ~/cloudflared/cloudflared /usr/local/bin/cloudflared

# 创建 systemd 服务文件
sudo tee /etc/systemd/system/cloudflared-tunnel.service << 'EOF'
[Unit]
Description=Cloudflare Tunnel (Quick Tunnel)
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:3000
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# 重载 systemd 并启动
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
```

## Step A3 — 等待并从日志中获取 URL

```bash
# 等待几秒让隧道建立
sleep 10

# 查看日志，找到 trycloudflare.com URL
sudo journalctl -u cloudflared-tunnel --no-pager | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1
```

如果没有输出，直接查看完整日志：

```bash
sudo journalctl -u cloudflared-tunnel --no-pager -n 30
```

找到 URL 后，它就是博客的公网访问地址。

## Step A4 — 更新 BASE_URL

```bash
# 把获取到的 URL 填入（替换下面示例）
TUNNEL_URL="https://random-words.trycloudflare.com"

# 更新 .env
cd /var/www/blog/app
sed -i "s|^BASE_URL=.*|BASE_URL=\"$TUNNEL_URL\"|" .env

# 重启博客使 BASE_URL 生效
pm2 restart blog
```

⚠️ 注意：每次 Cloudflare Tunnel 重启，trycloudflare.com 子域名会变化。届时需要重新执行 Step A3-A4。

---

## ---- 方案 B：命名隧道（需域名）----

## 前置条件确认

开始前向用户确认：

1. ✅ 你有一个域名（例如 `blog.example.com`）
2. ✅ 该域名的 DNS 已托管在 Cloudflare（nameserver 指向 Cloudflare）
3. ✅ 你有一个 Cloudflare 账号

如果域名 DNS 还没托管到 Cloudflare：
- 去 [Cloudflare 官网](https://dash.cloudflare.com/sign-up) 注册
- 添加站点 → 按指引修改 nameserver → 等待生效

## Step B1 — 安装 cloudflared

```bash
# 安装到系统路径
sudo cp ~/cloudflared/cloudflared /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
cloudflared --version
```

## Step B2 — 登录 Cloudflare

```bash
# 运行登录命令
cloudflared tunnel login
```

**此时会输出一个 URL。**

**告知用户：**
> 请在你的浏览器中打开这个 URL，登录你的 Cloudflare 账号，选择你要使用的域名并授权。
> 完成后回来告诉我。

授权后，证书会保存在 `~/.cloudflared/cert.pem`。

验证：

```bash
ls -la ~/.cloudflared/cert.pem
```

## Step B3 — 创建隧道

```bash
# 创建隧道（blog-tunnel 可改成你喜欢的名字）
cloudflared tunnel create blog-tunnel
```

输出示例：
```
Created tunnel blog-tunnel with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**记下隧道 ID**，后面要用。

查看隧道凭据文件：

```bash
ls -la ~/.cloudflared/
# 应该看到 <隧道ID>.json
```

## Step B4 — 配置隧道

创建配置文件：

```bash
mkdir -p ~/.cloudflared

# 替换 YOUR_TUNNEL_ID 为上面获取的隧道 ID
# 替换 YOUR_DOMAIN 为你的域名（如 blog.example.com）
```

```bash
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: YOUR_DOMAIN
    service: http://localhost:3000
  - service: http_status:404
EOF
```

**⚠️ 务必替换 `YOUR_TUNNEL_ID` 和 `YOUR_DOMAIN` 为实际值。**

验证配置：

```bash
# 测试运行（前台，Ctrl+C 停止）
cloudflared tunnel run blog-tunnel
```

确认无报错后 `Ctrl+C` 停止。

## Step B5 — 配置 DNS

```bash
# 将域名指向隧道（Cloudflare 自动创建 CNAME 记录）
cloudflared tunnel route dns blog-tunnel YOUR_DOMAIN
```

**告知用户：**
> 已经为 `YOUR_DOMAIN` 创建了 DNS 记录。你可以在 Cloudflare 控制台 → DNS 设置中看到一条 CNAME 记录指向 `YOUR_TUNNEL_ID.cfargotunnel.com`。

验证 DNS：

```bash
dig +short YOUR_DOMAIN
# 或
nslookup YOUR_DOMAIN
```

需要看到 CNAME 记录。DNS 生效可能需要几分钟。

## Step B6 — 安装为系统服务

```bash
# 安装为 systemd 服务
cloudflared service install

# 这会自动创建 /etc/systemd/system/cloudflared.service
# 并读取 ~/.cloudflared/config.yml

# 启动服务
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# 检查状态
sudo systemctl status cloudflared
```

## Step B7 — 更新 BASE_URL

```bash
cd /var/www/blog/app

# 替换为你的实际域名
sed -i "s|^BASE_URL=.*|BASE_URL=\"https://YOUR_DOMAIN\"|" .env

# 重启博客
pm2 restart blog
```

## Step B8 — 验证

```bash
# 从服务器内部测试
curl -sI https://YOUR_DOMAIN | head -10
```

应该看到 `HTTP/2 200`。

**告知用户：**
> 现在可以在浏览器中访问 `https://YOUR_DOMAIN` 查看博客了！

---

## 最终验证清单

无论方案 A 还是方案 B，完成后确认：

- [ ] `pm2 status` — blog 进程 `online`
- [ ] `curl -sI http://localhost:3000` — 返回 200
- [ ] `sudo systemctl status cloudflared-tunnel`（方案 A）或 `cloudflared`（方案 B）— `active (running)`
- [ ] 浏览器访问公网 URL 能看到博客首页
- [ ] 注册/登录功能正常
- [ ] 邮箱验证链接中的 URL 正确（检查 BASE_URL）

---

## Troubleshooting

### cloudflared 启动失败

```bash
# 查看详细日志
sudo journalctl -u cloudflared-tunnel -n 50 --no-pager
# 或
sudo journalctl -u cloudflared -n 50 --no-pager
```

常见原因：
- 端口 3000 不可达 → 确认 `curl http://localhost:3000` 正常
- 方案 B：证书文件路径不对 → 检查 `config.yml` 中的 `credentials-file` 路径
- 方案 B：DNS 未生效 → 等 5 分钟再试

### 方案 A：URL 变了怎么办

Quick Tunnel 重启后域名会变。如果发现访问不了：

```bash
# 获取新的 URL
sudo journalctl -u cloudflared-tunnel --no-pager | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' | tail -1

# 更新 BASE_URL
cd /var/www/blog/app
sed -i "s|^BASE_URL=.*|BASE_URL=\"新的URL\"|" .env
pm2 restart blog
```

### 方案 B：DNS 不生效

```bash
# 检查 Cloudflare DNS 记录
cloudflared tunnel route ip show

# 手动在 Cloudflare 控制台确认 CNAME 记录存在
# CNAME: YOUR_DOMAIN → YOUR_TUNNEL_ID.cfargotunnel.com
# 确保橙色云朵是开启状态（Proxied）
```

### 连接不稳定

在 systemd service 文件中增加重试参数：

```ini
[Service]
Restart=always
RestartSec=5
```

---

## 长期使用建议

- **方案 A** 适合测试，域名每次重启会变。可以写一个脚本定期检查 URL 变化并通知你
- **方案 B** 是生产方案，域名固定，自动 HTTPS，Cloudflare CDN 全球加速
- 建议最终迁移到方案 B
