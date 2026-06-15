import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      );
    }

    // 删除用户（级联删除其文章和评论）
    await prisma.user.delete({
      where: { id: user.id },
    });

    // 清除 Cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("注销账号失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
