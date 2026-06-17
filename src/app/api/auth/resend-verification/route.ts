import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";

// 60 秒冷却，防止滥用
const RESEND_COOLDOWN_MS = 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "请提供有效的邮箱" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, name: true, emailVerified: true },
    });

    if (!user) {
      // 不暴露用户是否存在
      return NextResponse.json({ message: "如果该邮箱已注册，验证邮件已发送" });
    }

    if (user.emailVerified) {
      return NextResponse.json({ message: "该邮箱已验证，请直接登录" });
    }

    // 检查冷却
    const existing = await prisma.emailVerificationToken.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      const msSinceLast = Date.now() - existing.createdAt.getTime();
      if (msSinceLast < RESEND_COOLDOWN_MS) {
        return NextResponse.json({ message: "验证邮件已发送，请查收" });
      }
    }

    const error = await sendVerificationEmail(user.id, user.email, user.name || "用户");
    if (error) {
      return NextResponse.json({ error }, { status: 429 });
    }

    return NextResponse.json({ message: "验证邮件已发送，请查收" });
  } catch (error) {
    console.error("重发验证邮件失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
