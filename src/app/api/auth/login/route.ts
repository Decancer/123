import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

const COOKIE_NAME = "auth-token";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 参数校验
    if (!email || !password) {
      return NextResponse.json(
        { error: "请输入邮箱和密码" },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, avatar: true, password: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 验证密码
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 签发 JWT
    const token = await signToken({ userId: user.id, email: user.email });

    // ✅ 直接在 NextResponse 上设置 Cookie
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: "/",
    });
    return response;
  } catch (error) {
    console.error("登录失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
