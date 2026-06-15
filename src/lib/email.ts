import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// 延迟初始化：只在真正发送邮件时才创建 Resend 实例，避免构建时因环境变量缺失崩溃
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM = "My Blog <onboarding@resend.dev>";

// 24 小时过期
const TOKEN_EXPIRES_MS = 24 * 60 * 60 * 1000;

// 60 秒冷却，防止滥用
const RESEND_COOLDOWN_MS = 60 * 1000;

/**
 * 生成一个 32 位随机 token（URL 安全）
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * 获取本站完整 URL（开发环境用 localhost，生产环境需要设置 BASE_URL 环境变量）
 */
function getBaseUrl(): string {
  return (
    process.env.BASE_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://your-domain.com"
      : "http://localhost:3000")
  );
}

/**
 * 发送验证邮件，并在数据库中记录 token。
 * 返回 null 表示成功，返回 string 表示错误信息。
 */
export async function sendVerificationEmail(
  userId: number,
  userEmail: string,
  userName: string
): Promise<string | null> {
  // ---- 1. 检查 60 秒冷却 ----
  const existing = await prisma.emailVerificationToken.findUnique({
    where: { userId },
  });

  if (existing) {
    const msSinceLast = Date.now() - existing.createdAt.getTime();
    if (msSinceLast < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - msSinceLast) / 1000);
      return `请等待 ${waitSeconds} 秒后再重新发送`;
    }
    // 冷却已过，删掉旧 token
    await prisma.emailVerificationToken.delete({ where: { userId } });
  }

  // ---- 2. 生成 token 并存库 ----
  const token = generateToken();

  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRES_MS),
    },
  });

  // ---- 3. 发送邮件 ----
  const verifyUrl = `${getBaseUrl()}/verify-email?token=${token}`;

  try {
    const { error } = await getResend().emails.send({
      from: FROM,
      to: userEmail,
      subject: "[My Blog] 请验证你的邮箱",
      html: getEmailHtml(userName, verifyUrl),
    });

    if (error) {
      console.error("Resend 发送失败:", error);
      // 发送失败，删除 token 记录
      await prisma.emailVerificationToken
        .delete({ where: { userId } })
        .catch(() => {});
      return error.message || "邮件发送失败，请稍后重试";
    }

    return null; // 成功
  } catch (err) {
    console.error("Resend 发送异常:", err);
    await prisma.emailVerificationToken
      .delete({ where: { userId } })
      .catch(() => {});
    return "邮件发送失败，请稍后重试";
  }
}

/**
 * 验证 token：
 * - 有效 → 标记用户 emailVerified，删除 token，返回 userId
 * - 无效/过期 → 返回 null + error 信息
 */
export async function verifyEmailToken(
  token: string
): Promise<{ userId: number } | { error: string }> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return { error: "验证链接无效或已被使用" };
  }

  if (record.expiresAt < new Date()) {
    // 过期了，清理掉
    await prisma.emailVerificationToken.delete({ where: { id: record.id } });
    return { error: "验证链接已过期，请重新发送验证邮件" };
  }

  // ---- 标记用户已验证 ----
  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  // ---- 删除 token ----
  await prisma.emailVerificationToken.delete({ where: { id: record.id } });

  return { userId: record.userId };
}

/**
 * 纯文本和简单 HTML 邮件内容
 */
function getEmailHtml(userName: string, verifyUrl: string): string {
  const displayName = userName || "用户";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; font-size: 32px; margin-bottom: 16px;">📝</div>
  <h2 style="text-align: center; color: #27272a;">验证你的邮箱</h2>
  <p style="color: #52525b; text-align: center;">
    你好，<strong>${displayName}</strong>！感谢注册 My Blog。
  </p>
  <p style="color: #52525b; text-align: center; margin-bottom: 28px;">
    请点击下方按钮验证你的邮箱地址，该链接 24 小时内有效：
  </p>
  <div style="text-align: center; margin-bottom: 28px;">
    <a href="${verifyUrl}"
       style="display: inline-block; background: #18181b; color: #fff; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
      验证邮箱
    </a>
  </div>
  <p style="color: #a1a1aa; font-size: 13px; text-align: center;">
    如果按钮无法点击，请复制以下链接到浏览器：
  </p>
  <p style="color: #3b82f6; font-size: 12px; text-align: center; word-break: break-all;">
    ${verifyUrl}
  </p>
  <hr style="margin: 24px 0; border: none; border-top: 1px solid #e4e4e7;">
  <p style="color: #a1a1aa; font-size: 11px; text-align: center;">
    如果你没有注册 My Blog，请忽略此邮件。
  </p>
</body>
</html>`.trim();
}
