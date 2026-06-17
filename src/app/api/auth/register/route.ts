import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 参数校验
    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 }
      );
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "请输入有效的邮箱地址" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "密码至少需要 6 个字符" },
        { status: 400 }
      );
    }

    // 检查邮箱是否已注册
    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    // 创建用户
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        password: passwordHash,
        name: (name || email.split("@")[0]).trim(),
        avatar: `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      },
      select: { id: true, email: true, name: true },
    });

    // 发送验证邮件
    const sendError = await sendVerificationEmail(user.id, user.email, user.name || "用户");

    return NextResponse.json(
      {
        email: user.email,
        message: sendError
          ? "账号已创建，但验证邮件发送失败，登录后可重新发送"
          : "验证邮件已发送，请查收",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("注册失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
