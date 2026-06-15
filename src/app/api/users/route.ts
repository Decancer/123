import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users — 获取所有用户
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, email: true, name: true, avatar: true, bio: true,
        createdAt: true, updatedAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("获取用户失败:", error);
    return NextResponse.json({ error: "获取用户失败" }, { status: 500 });
  }
}
