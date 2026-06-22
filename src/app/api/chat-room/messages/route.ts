import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MESSAGE_LIMIT = 100;

/** GET /api/chat-room/messages — 获取最近消息（公开） */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cursorStr = searchParams.get("cursor");

    const where: Record<string, unknown> = {};
    if (cursorStr) {
      const cursorId = parseInt(cursorStr, 10);
      if (!isNaN(cursorId)) {
        where.id = { lt: cursorId };
      }
    }

    const messages = await prisma.chatRoomMessage.findMany({
      where,
      orderBy: { id: "desc" },
      take: MESSAGE_LIMIT,
    });

    // 返回时间升序（旧→新）
    messages.reverse();

    const oldest = messages.length > 0 ? messages[0].id : null;

    return NextResponse.json({
      messages,
      cursor: oldest,
      hasMore: messages.length === MESSAGE_LIMIT,
    });
  } catch (error) {
    console.error("获取聊天消息失败:", error);
    return NextResponse.json({ error: "获取消息失败" }, { status: 500 });
  }
}

/** POST /api/chat-room/messages — 发送消息（需登录） */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return NextResponse.json({ error: "消息不能超过500字" }, { status: 400 });
    }

    const message = await prisma.chatRoomMessage.create({
      data: {
        content: trimmed,
        userId: user.id,
        userName: user.name || "匿名用户",
        userAvatar: user.avatar,
      },
    });

    // 发消息时顺便更新在线状态（省一次请求）
    await prisma.chatRoomPresence.upsert({
      where: { userId: user.id },
      update: {
        lastSeenAt: new Date(),
        userName: user.name || "匿名用户",
        userAvatar: user.avatar,
      },
      create: {
        userId: user.id,
        userName: user.name || "匿名用户",
        userAvatar: user.avatar,
        lastSeenAt: new Date(),
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("发送聊天消息失败:", error);
    return NextResponse.json({ error: "发送消息失败" }, { status: 500 });
  }
}
