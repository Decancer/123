import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const ONLINE_THRESHOLD_MS = 15_000; // 15 秒内有心跳视为在线

/** GET /api/chat-room/heartbeat — 获取在线人数和用户列表（公开） */
export async function GET() {
  try {
    const cutoff = new Date(Date.now() - ONLINE_THRESHOLD_MS);

    const [count, users] = await Promise.all([
      prisma.chatRoomPresence.count({
        where: { lastSeenAt: { gte: cutoff } },
      }),
      prisma.chatRoomPresence.findMany({
        where: { lastSeenAt: { gte: cutoff } },
        select: { userId: true, userName: true, userAvatar: true },
        orderBy: { lastSeenAt: "desc" },
      }),
    ]);

    return NextResponse.json({ count, users }, {
      headers: {
        "Cache-Control": "public, s-maxage=3, stale-while-revalidate=10",
      },
    });
  } catch (error) {
    console.error("获取在线人数失败:", error);
    return NextResponse.json({ error: "获取在线人数失败" }, { status: 500 });
  }
}

/** POST /api/chat-room/heartbeat — 发送心跳（需登录） */
export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

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

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("心跳更新失败:", error);
    return NextResponse.json({ error: "心跳更新失败" }, { status: 500 });
  }
}
