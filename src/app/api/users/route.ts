import { NextRequest, NextResponse } from "next/server";
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

// POST /api/users — 创建新用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        bio: body.bio,
      },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json({ error: "创建用户失败" }, { status: 500 });
  }
}
