import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MESSAGE_LIMIT = 100;

/** GET /api/chat-room/messages — 获取消息（公开）
 *  ?since=<id> — 增量拉取，只返回 id > since 的新消息（省带宽）
 *  ?cursor=<id> — 向前翻页，返回 id < cursor 的历史消息
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sinceStr = searchParams.get("since");
    const cursorStr = searchParams.get("cursor");

    if (sinceStr) {
      // 增量模式：只返回比 since 更新的消息
      const sinceId = parseInt(sinceStr, 10);
      if (isNaN(sinceId)) {
        return NextResponse.json({ error: "Invalid since param" }, { status: 400 });
      }

      const messages = await prisma.chatRoomMessage.findMany({
        where: { id: { gt: sinceId } },
        orderBy: { id: "asc" },
        take: MESSAGE_LIMIT,
      });

      const latest = messages.length > 0 ? messages[messages.length - 1].id : sinceId;
      return NextResponse.json({ messages, latest, hasMore: false });
    }

    // 全量模式 — 初始加载 / 翻页
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

    messages.reverse(); // 旧→新

    const oldest = messages.length > 0 ? messages[0].id : null;
    const latest = messages.length > 0 ? messages[messages.length - 1].id : null;

    return NextResponse.json({
      messages,
      cursor: oldest,
      latest,
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
