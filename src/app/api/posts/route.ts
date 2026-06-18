import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripHtml } from "@/lib/sanitize";

const PAGE_SIZE = 10;

// GET /api/posts — 获取文章列表（支持 published / category / search / page 筛选）
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const published = searchParams.get("published");
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || String(PAGE_SIZE)) || PAGE_SIZE));

    const where: Record<string, unknown> = {};
    if (published === "true") where.published = true;
    else if (published === "false") where.published = false;
    if (category === "tech" || category === "life") where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
      ];
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        select: {
          id: true, title: true, slug: true, content: true, excerpt: true,
          category: true, viewCount: true, createdAt: true,
          author: { select: { id: true, name: true, avatar: true } },
          tags: { include: { tag: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
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
    const { title, content, excerpt, tags, category, images } = body;

    // 参数校验
    if (!title || !title.trim()) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
    }

    // 生成 slug：统一用 post-时间戳
    const baseSlug = `post-${Date.now()}`;
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

    // 验证图片
    let imagesJson: string | null = null;
    if (Array.isArray(images) && images.length > 0) {
      const validImages = images.slice(0, 6).filter(
        (img: unknown) => typeof img === "string" && img.startsWith("data:image/")
      );
      if (validImages.length > 0) {
        imagesJson = JSON.stringify(validImages);
      }
    }

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        slug,
        content: content.trim(),
        images: imagesJson,
        excerpt: excerpt?.trim() || stripHtml(content).slice(0, 150),
        category: category === "life" ? "life" : "tech",
        published: true,
        authorId: user.id,
        tags: {
          create: tagConnections.map((t) => ({ tagId: t.id })),
        },
      },
      select: {
        id: true, title: true, slug: true, content: true, excerpt: true,
        images: true, category: true, viewCount: true, createdAt: true,
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
