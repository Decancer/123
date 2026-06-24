import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const MESSAGE_LIMIT = 100;
const LONG_POLL_TIMEOUT = 8000;
const DB_POLL_INTERVAL = 200; // 每 200ms 查一次 DB，保证消息及时送达

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET /api/messages?with=<userId>[&since=<id>][&wait=1]
 *  获取当前用户与指定用户的私信对话（需登录）
 *  - 无 since 参数 — 初始加载最近 100 条，并标记对方发来的未读消息为已读
 *  - since + wait=1 — 长轮询等待新消息
 *  - since 无 wait — 增量获取
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const withStr = searchParams.get("with");
    const sinceStr = searchParams.get("since");
    const shouldWait = searchParams.get("wait") === "1";

    if (!withStr) {
      return NextResponse.json({ error: "缺少 with 参数" }, { status: 400 });
    }

    const withUserId = parseInt(withStr, 10);
    if (isNaN(withUserId)) {
      return NextResponse.json({ error: "无效的 with 参数" }, { status: 400 });
    }

    // 对话过滤条件
    const conversationWhere = (extra?: Record<string, unknown>) => ({
      AND: [
        extra || {},
        {
          OR: [
            { senderId: user.id, receiverId: withUserId },
            { senderId: withUserId, receiverId: user.id },
          ],
        },
      ],
    });

    // 初始加载
    if (!sinceStr) {
      const messages = await prisma.privateMessage.findMany({
        where: conversationWhere(),
        orderBy: { id: "desc" },
        take: MESSAGE_LIMIT,
      });

      messages.reverse();

      // 标记对方发来的未读消息为已读
      const lastId = messages.length > 0 ? messages[messages.length - 1].id : 0;
      await prisma.privateMessage.updateMany({
        where: {
          senderId: withUserId,
          receiverId: user.id,
          isRead: false,
          id: { lte: lastId },
        },
        data: { isRead: true },
      });

      const oldest = messages.length > 0 ? messages[0].id : null;
      const latest = messages.length > 0 ? messages[messages.length - 1].id : null;

      return NextResponse.json({ messages, cursor: oldest, latest, hasMore: messages.length === MESSAGE_LIMIT });
    }

    // 增量模式
    const sinceId = parseInt(sinceStr, 10);
    if (isNaN(sinceId)) {
      return NextResponse.json({ error: "Invalid since param" }, { status: 400 });
    }

    // 长轮询
    if (shouldWait) {
      const deadline = Date.now() + LONG_POLL_TIMEOUT;

      while (Date.now() < deadline) {
        const messages = await prisma.privateMessage.findMany({
          where: conversationWhere({ id: { gt: sinceId } }),
          orderBy: { id: "asc" },
          take: MESSAGE_LIMIT,
        });

        if (messages.length > 0) {
          // 标记新消息中对方发来的为已读
          const lastNewId = messages[messages.length - 1].id;
          await prisma.privateMessage.updateMany({
            where: {
              senderId: withUserId,
              receiverId: user.id,
              isRead: false,
              id: { lte: lastNewId },
            },
            data: { isRead: true },
          });

          const latest = messages[messages.length - 1].id;
          return NextResponse.json({ messages, latest, hasMore: false });
        }

        await sleep(DB_POLL_INTERVAL);
      }

      return NextResponse.json({ messages: [], latest: sinceId, hasMore: false });
    }

    // 普通增量（不等待）
    const messages = await prisma.privateMessage.findMany({
      where: conversationWhere({ id: { gt: sinceId } }),
      orderBy: { id: "asc" },
      take: MESSAGE_LIMIT,
    });

    const latest = messages.length > 0 ? messages[messages.length - 1].id : sinceId;
    return NextResponse.json({ messages, latest, hasMore: false });
  } catch (error) {
    console.error("获取私信失败:", error);
    return NextResponse.json({ error: "获取消息失败" }, { status: 500 });
  }
}

/** POST /api/messages — 发送私信（需登录）
 *  body: { receiverId: number, content: string }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || typeof receiverId !== "number") {
      return NextResponse.json({ error: "缺少接收者 ID" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const trimmed = content.trim();
    if (trimmed.length > 500) {
      return NextResponse.json({ error: "消息不能超过500字" }, { status: 400 });
    }

    // 不能给自己发消息
    if (receiverId === user.id) {
      return NextResponse.json({ error: "不能给自己发私信" }, { status: 400 });
    }

    // 确认接收者存在
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, avatar: true },
    });

    if (!receiver) {
      return NextResponse.json({ error: "接收者不存在" }, { status: 404 });
    }

    const message = await prisma.privateMessage.create({
      data: {
        content: trimmed,
        senderId: user.id,
        senderName: user.name || "匿名用户",
        senderAvatar: user.avatar,
        receiverId: receiver.id,
        receiverName: receiver.name || "匿名用户",
        receiverAvatar: receiver.avatar,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("发送私信失败:", error);
    return NextResponse.json({ error: "发送消息失败" }, { status: 500 });
  }
}
