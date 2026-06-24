import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { CommentForm } from "@/components/CommentForm";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { PostActions } from "@/components/PostActions";
import { CommentSection } from "@/components/CommentSection";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { AuthorNameLink } from "@/components/AuthorNameLink";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  let post;
  try {
    post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true, title: true, slug: true, content: true, excerpt: true,
        images: true, category: true, viewCount: true, createdAt: true, updatedAt: true,
        author: { select: { id: true, name: true, avatar: true, bio: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
        comments: {
          include: {
            author: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 21, // 多取 1 条判断 hasMore
        },
      },
    });
  } catch (err) {
    console.error("文章详情查询失败:", err);
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-50">
        <div className="text-center">
          <div className="mb-4 text-5xl">😿</div>
          <h1 className="text-xl font-bold text-ink">页面加载失败</h1>
          <p className="mt-2 text-sm text-muted">{(err as Error).message || "请稍后重试"}</p>
          <BackToHomeLink />
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  // 评论分页：首屏取 21 条，若满 21 则有更多
  const COMMENT_PAGE_SIZE = 20;
  const hasMoreComments = post.comments.length > COMMENT_PAGE_SIZE;
  const firstComments = hasMoreComments ? post.comments.slice(0, COMMENT_PAGE_SIZE) : post.comments;
  const totalComments = post._count.comments;

  let images: string[] = [];
  try {
    images = post.images ? JSON.parse(post.images) : [];
  } catch {
    images = [];
  }

  if (!post) {
    notFound();
  }

  // 增加阅读量
  await prisma.post.update({
    where: { id: post.id },
    data: { viewCount: { increment: 1 } },
  });

  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      {/* 背景装饰生物 */}
      <BackgroundMonsters />
      {/* 导航 */}
      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <NavHomeLink />
            <NavFeatureLink />

            <span className="mx-1 h-4 w-px bg-border" />

            {currentUser ? (
              <UserMenu userId={currentUser.id} userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97]"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:bg-primary-50 hover:text-ink active:scale-[0.97]"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 文章内容 */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* 返回链接 */}
        <BackToHomeLink />

        {/* 邮箱未验证提醒 */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 头部 */}
        <header className="mb-8">
          {/* 分区徽章 + 标签 */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${
                post.category === "life"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-primary-50 text-primary-700"
              }`}
            >
              {post.category === "life" ? "🌿 生活" : "💻 技术"}
            </span>
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <div className="mb-4 flex items-start gap-2">
            <h1 className="text-3xl font-bold leading-tight tracking-tight text-ink">
              {post.title}
            </h1>
            {currentUser && (
              <PostActions
                post={{
                  id: post.id,
                  title: post.title,
                  slug: post.slug,
                  content: post.content,
                  excerpt: post.excerpt,
                  images: post.images,
                  category: post.category,
                  tags: post.tags,
                  authorId: post.author.id,
                }}
                currentUserId={currentUser.id}
                currentUserRole={currentUser.role}
              />
            )}
          </div>

          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            {post.author.avatar ? (
              <img
                src={post.author.avatar}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-100"
              />
            ) : (
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                {post.author.name?.charAt(0) || "?"}
              </span>
            )}
            <div>
              <AuthorNameLink
                userId={post.author.id}
                name={post.author.name || "User"}
                className="text-sm font-medium text-ink/80"
              />
              <div className="flex items-center gap-2 text-xs text-muted/70">
                <time dateTime={post.createdAt.toISOString()}>
                  {new Date(post.createdAt).toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>·</span>
                <span>{post.viewCount + 1} 次阅读</span>
              </div>
            </div>
          </div>
        </header>

        {/* 图片展示 */}
        {images.length > 0 && (
          <div className={`mb-8 grid gap-2 ${
            images.length === 1 ? "grid-cols-1" :
            images.length === 2 ? "grid-cols-2" :
            "grid-cols-3"
          }`}>
            {images.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-border">
                <img
                  src={img}
                  alt={`图片 ${i + 1}`}
                  className="w-full object-cover max-h-96"
                />
              </div>
            ))}
          </div>
        )}

        {/* 正文 */}
        <article
          className="prose prose-zinc max-w-none leading-relaxed text-ink/85"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* 评论区域 */}
        {/* 评论表单（须登录） */}
        {currentUser ? (
          <CommentForm slug={slug} userName={currentUser.name || "User"} />
        ) : (
          <div className="mb-8 rounded-xl border border-dashed border-primary-200 p-4 text-center">
            <p className="text-sm text-muted">
              <Link href="/login" className="font-medium text-primary-500 hover:text-primary-600">
                登录
              </Link>
              {" "}后即可发表评论
            </p>
          </div>
        )}

        <CommentSection
          slug={slug}
          initialComments={firstComments}
          initialHasMore={hasMoreComments}
          totalCount={totalComments}
          currentUserId={currentUser?.id}
          currentUserRole={currentUser?.role}
        />
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
