import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { stripHtml } from "@/lib/sanitize";
import { isValidImageValue } from "@/lib/cos";

// PATCH /api/posts/[slug] — 编辑文章（仅作者本人）
export async function PATCH(
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
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.authorId !== user.id) {
      return NextResponse.json({ error: "只能编辑自己的文章" }, { status: 403 });
    }

    const body = await request.json();
    const { title, content, excerpt, category, tags, images } = body;

    // 验证图片（过渡期：COS URL 或 base64 data URI 均接受）
    let imagesJson: string | null | undefined;
    if (Array.isArray(images)) {
      if (images.length === 0) {
        imagesJson = null; // 清空图片
      } else {
        const validImages = images.slice(0, 6).filter(isValidImageValue);
        imagesJson = JSON.stringify(validImages);
      }
    }

    // 处理标签
    let tagConnect: { tagId: number }[] | undefined;
    if (Array.isArray(tags)) {
      const tagNames: string[] = tags
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter(Boolean);
      const tagRecords = await Promise.all(
        tagNames.map(async (name) => {
          const existing = await prisma.tag.findUnique({ where: { name } });
          return existing ?? prisma.tag.create({ data: { name } });
        })
      );
      tagConnect = tagRecords.map((t) => ({ tagId: t.id }));
    }

    const updated = await prisma.post.update({
      where: { id: post.id },
      data: {
        ...(title?.trim() ? { title: title.trim() } : {}),
        ...(content?.trim() ? { content: content.trim() } : {}),
        ...(excerpt !== undefined ? { excerpt: excerpt?.trim() || null } : {}),
        ...(imagesJson !== undefined ? { images: imagesJson } : {}),
        ...(category === "tech" || category === "life" ? { category } : {}),
        ...(tagConnect
          ? { tags: { deleteMany: {}, create: tagConnect } }
          : {}),
      },
      select: {
        id: true, title: true, slug: true, content: true, excerpt: true,
        category: true, viewCount: true, createdAt: true,
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("编辑文章失败:", error);
    return NextResponse.json({ error: "编辑文章失败" }, { status: 500 });
  }
}

// DELETE /api/posts/[slug] — 删除文章（作者或管理员）
export async function DELETE(
  _request: NextRequest,
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
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    if (post.authorId !== user.id && user.role !== "admin") {
      return NextResponse.json({ error: "无权删除此文章" }, { status: 403 });
    }

    await prisma.post.delete({ where: { id: post.id } });

    return NextResponse.json({ message: "文章已删除" });
  } catch (error) {
    console.error("删除文章失败:", error);
    return NextResponse.json({ error: "删除文章失败" }, { status: 500 });
  }
}
