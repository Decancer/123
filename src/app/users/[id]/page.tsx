import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { UserPostList } from "@/components/UserPostList";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: PageProps) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) notFound();

  const [profileUser, currentUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        background: true,
        bio: true,
        createdAt: true,
        _count: { select: { posts: true, comments: true } },
        posts: {
          where: { published: true },
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: true,
            viewCount: true,
            createdAt: true,
            _count: { select: { comments: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    getCurrentUser(),
  ]);

  if (!profileUser) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 relative">
      <BackgroundMonsters />

      {/* 导航 */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <Link href="/login" className="rounded-lg bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <BackToHomeLink />

        {/* 背景图 */}
        {profileUser.background ? (
          <div className="mb-6 overflow-hidden rounded-xl relative">
            <img
              src={profileUser.background}
              alt=""
              className="h-36 w-full object-cover"
            />
            {/* 底部渐变遮罩，防止白字看不清 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
        ) : null}

        {/* 用户信息卡片 */}
        <div className={`flex items-end gap-4 ${profileUser.background ? "-mt-14 relative z-10 px-2" : "mb-6"}`}>
          {profileUser.avatar ? (
            <img
              src={profileUser.avatar}
              alt=""
              className={`rounded-full border-4 object-cover ${
                profileUser.background
                  ? "h-24 w-24 border-white dark:border-zinc-800"
                  : "h-20 w-20 border-white dark:border-zinc-900"
              }`}
            />
          ) : (
            <span
              className={`inline-flex items-center justify-center rounded-full bg-blue-500 font-bold text-white border-4 ${
                profileUser.background
                  ? "h-24 w-24 text-3xl border-white dark:border-zinc-800"
                  : "h-20 w-20 text-2xl border-white dark:border-zinc-900"
              }`}
            >
              {profileUser.name?.charAt(0) || "?"}
            </span>
          )}
          <div className="pb-1">
            <h1 className={`text-2xl font-bold ${
              profileUser.background
                ? "text-white drop-shadow-sm"
                : "text-zinc-900 dark:text-zinc-100"
            }`}>
              {profileUser.name || "未命名用户"}
            </h1>
            <p className={`text-sm ${
              profileUser.background
                ? "text-white/80 drop-shadow-sm"
                : "text-zinc-400"
            }`}>
              加入于 {new Date(profileUser.createdAt).toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
              })}
              {" · "}
              {profileUser._count.posts} 篇文章 · {profileUser._count.comments} 条评论
            </p>
          </div>
        </div>

        {/* Bio */}
        {profileUser.bio && (
          <p className="mb-8 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {profileUser.bio}
          </p>
        )}

        {/* 分隔线 */}
        <div className="mb-8 border-t border-zinc-200 dark:border-zinc-800" />

        {/* 文章列表 */}
        <h2 className="mb-6 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {profileUser.name || "TA"} 的文章 ({profileUser._count.posts})
        </h2>

        {profileUser.posts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
            <p className="text-zinc-400">暂无已发布文章</p>
          </div>
        ) : (
          <UserPostList
            posts={JSON.parse(JSON.stringify(profileUser.posts))}
          />
        )}
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
