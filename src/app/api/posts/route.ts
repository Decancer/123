import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/posts — 获取文章列表（支持 ?published=true 筛选）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get("published");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (published === "true") where.published = true;
    else if (published === "false") where.published = false;
    if (category === "tech" || category === "life") where.category = category;

    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("获取文章失败:", error);
    return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
  }
}

// POST /api/posts — 创建文章（需登录）
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, excerpt, tags, category } = body;

    // 参数校验
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    // 生成 slug
    const rawSlug = title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9一-鿿-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    // 纯中文标题兜底
    const baseSlug = rawSlug || `post-${Date.now()}`;
    let slug = baseSlug;
    let count = 1;
    while (await prisma.post.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${count++}`;
    }

    // 处理标签：查找已有或创建新标签
    const rawTags: unknown[] = Array.isArray(tags) ? tags : [];
    const tagNames: string[] = rawTags
      .map((t) => (typeof t === "string" ? t.trim() : ""))
      .filter(Boolean);

    const tagConnections = await Promise.all(
      tagNames.map(async (name) => {
        const existing = await prisma.tag.findUnique({ where: { name } });
        return existing ?? prisma.tag.create({ data: { name } });
      })
    );

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        slug,
        content: content.trim(),
        excerpt: excerpt?.trim() || content.trim().slice(0, 150),
        category: category === "life" ? "life" : "tech",
        published: true,
        authorId: user.id,
        tags: {
          create: tagConnections.map((t) => ({ tagId: t.id })),
        },
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("创建文章失败:", error);
    return NextResponse.json({ error: "创建文章失败" }, { status: 500 });
  }
}
