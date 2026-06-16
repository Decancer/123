import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { CommentForm } from "@/components/CommentForm";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      author: { select: { id: true, name: true, avatar: true, bio: true } },
      tags: { include: { tag: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* 导航 */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            🐾 Mashiro Chat
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              首页
            </Link>

            <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
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
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1 text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          ← 返回首页
        </Link>

        {/* 邮箱未验证提醒 */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 头部 */}
        <header className="mb-8">
          {/* 分区徽章 + 标签 */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span
              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                post.category === "life"
                  ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              }`}
            >
              {post.category === "life" ? "🌿 生活" : "💻 技术"}
            </span>
            {post.tags.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              >
                {tag.name}
              </span>
            ))}
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100">
            {post.title}
          </h1>

          {/* 作者信息 */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
              {post.author.name?.charAt(0) || "?"}
            </span>
            <div>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {post.author.name}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
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

        {/* 正文 */}
        <article className="prose prose-zinc max-w-none dark:prose-invert">
          {/* 简单渲染：将 Markdown 风格的换行转为段落 */}
          <div className="space-y-4 leading-relaxed text-zinc-700 dark:text-zinc-300">
            {post.content.split("\n\n").map((block, i) =>
              block.startsWith("## ") ? (
                <h2 key={i} className="mt-8 mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {block.replace("## ", "")}
                </h2>
              ) : block.startsWith("- ") ? (
                <ul key={i} className="list-disc space-y-1 pl-5">
                  {block.split("\n").map((item, j) => (
                    <li key={j}>{item.replace("- ", "")}</li>
                  ))}
                </ul>
              ) : block.startsWith("1. ") ? (
                <ol key={i} className="list-decimal space-y-1 pl-5">
                  {block.split("\n").map((item, j) => (
                    <li key={j}>
                      {item.replace(/^\d+\.\s/, "").replace(/\*\*(.+?)\*\*/g, "$1")}
                    </li>
                  ))}
                </ol>
              ) : (
                <p key={i}>{block}</p>
              )
            )}
          </div>
        </article>

        {/* 评论区域 */}
        <section className="mt-16 border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <h3 className="mb-6 text-lg font-semibold">
            评论 ({post.comments.length})
          </h3>

          {/* 评论表单（须登录） */}
          {currentUser ? (
            <CommentForm slug={slug} userName={currentUser.name || "User"} />
          ) : (
            <div className="mb-8 rounded-lg border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-700">
              <p className="text-sm text-zinc-400">
                <Link href="/login" className="text-blue-500 hover:text-blue-600">
                  登录
                </Link>
                {" "}后即可发表评论
              </p>
            </div>
          )}

          {/* 评论列表 */}
          {post.comments.length === 0 ? (
            <p className="text-sm text-zinc-400">暂无评论，来发表第一条吧</p>
          ) : (
            <div className="space-y-5">
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      {comment.author.name?.charAt(0) || "?"}
                    </span>
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {comment.author.name}
                    </span>
                    <time className="text-xs text-zinc-400" dateTime={comment.createdAt.toISOString()}>
                      {new Date(comment.createdAt).toLocaleDateString("zh-CN")}
                    </time>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
