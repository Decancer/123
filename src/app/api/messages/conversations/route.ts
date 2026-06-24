import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

/** GET /api/messages/conversations — 获取当前用户的私信会话列表（需登录）
 *  返回按最新消息排序的对话对象列表，每人带未读数
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 获取所有与我有关的消息，按 id 倒序
    const allMessages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      orderBy: { id: "desc" },
      take: 1000, // 足够覆盖所有会话的最近消息
    });

    // 按对话对象分组
    const partnerMap = new Map<number, {
      partnerId: number;
      partnerName: string;
      partnerAvatar: string | null;
      lastMessage: { id: number; content: string; createdAt: Date; senderId: number };
      unreadCount: number;
    }>();

    for (const msg of allMessages) {
      const partnerId = msg.senderId === user.id ? msg.receiverId : msg.senderId;
      const partnerName = msg.senderId === user.id ? msg.receiverName : msg.senderName;
      const partnerAvatar = msg.senderId === user.id ? msg.receiverAvatar : msg.senderAvatar;

      if (!partnerMap.has(partnerId)) {
        partnerMap.set(partnerId, {
          partnerId,
          partnerName,
          partnerAvatar,
          lastMessage: {
            id: msg.id,
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          },
          unreadCount: 0,
        });
      }

      // 统计未读数（对方发给我的 + 未读）
      if (msg.receiverId === user.id && msg.senderId === partnerId && !msg.isRead) {
        partnerMap.get(partnerId)!.unreadCount++;
      }
    }

    // 转为数组并按最新消息时间排序
    const conversations = Array.from(partnerMap.values()).sort(
      (a, b) => b.lastMessage.id - a.lastMessage.id
    );

    return NextResponse.json({ conversations }, {
      headers: {
        "Cache-Control": "private, s-maxage=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("获取私信会话列表失败:", error);
    return NextResponse.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}
