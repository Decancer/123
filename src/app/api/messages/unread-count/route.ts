import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/messages/unread-count — 获取当前用户的总未读私信数（需登录） */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const count = await prisma.privateMessage.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("获取未读私信数失败:", error);
    return NextResponse.json({ count: 0, error: "获取失败" }, { status: 500 });
  }
}
