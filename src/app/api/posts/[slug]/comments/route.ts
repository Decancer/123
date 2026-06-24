import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/posts/[slug]/comments?cursor=<id>&take=20 — 获取评论列表（公开，支持分页）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const cursorStr = searchParams.get("cursor");
    const take = Math.min(parseInt(searchParams.get("take") || "20", 10) || 20, 50);

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const where: Record<string, unknown> = { postId: post.id };
    if (cursorStr) {
      const cursorId = parseInt(cursorStr, 10);
      if (!isNaN(cursorId)) {
        where.id = { gt: cursorId };
      }
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "asc" },
      take: take + 1, // 多取一条判断 hasMore
    });

    const hasMore = comments.length > take;
    if (hasMore) comments.pop();

    return NextResponse.json({ comments, hasMore });
  } catch (error) {
    console.error("获取评论失败:", error);
    return NextResponse.json({ error: "获取评论失败" }, { status: 500 });
  }
}

// POST /api/posts/[slug]/comments — 发表评论（须登录）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const { slug } = await params;

    const post = await prisma.post.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "评论不能为空" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        postId: post.id,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("发表评论失败:", error);
    return NextResponse.json({ error: "发表评论失败" }, { status: 500 });
  }
}
