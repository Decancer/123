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
    <div className="flex min-h-screen flex-col bg-primary-50 dark:bg-[#16162a] relative">
      <BackgroundMonsters />

      {/* 导航 */}
      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md dark:border-[#3a3a58] dark:bg-[#16162a]/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink dark:text-[#e8e8f8]">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted dark:text-[#a0a0c0]">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-border dark:bg-[#3a3a58]" />
            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <Link href="/login" className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97] dark:bg-primary-400 dark:text-[#16162a] dark:hover:bg-primary-300">
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
          <div className="mb-6 overflow-hidden rounded-2xl">
            <img
              src={profileUser.background}
              alt=""
              className="h-36 w-full object-cover"
            />
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
                  ? "h-24 w-24 border-surface dark:border-[#222240]"
                  : "h-20 w-20 border-surface dark:border-[#222240]"
              }`}
            />
          ) : (
            <span
              className={`inline-flex items-center justify-center rounded-full bg-primary-500 font-bold text-white border-4 ${
                profileUser.background
                  ? "h-24 w-24 text-3xl border-surface dark:border-[#222240]"
                  : "h-20 w-20 text-2xl border-surface dark:border-[#222240]"
              }`}
            >
              {profileUser.name?.charAt(0) || "?"}
            </span>
          )}
          <div className="pb-1">
            <h1 className="text-2xl font-bold text-ink dark:text-[#e8e8f8]">
              {profileUser.name || "未命名用户"}
            </h1>
            <p className="text-sm text-muted/70 dark:text-[#a0a0c0]/70">
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
          <p className="mb-8 text-sm leading-relaxed text-muted dark:text-[#a0a0c0]">
            {profileUser.bio}
          </p>
        )}

        {/* 分隔线 */}
        <div className="mb-8 border-t border-border dark:border-[#3a3a58]" />

        {/* 文章列表 */}
        <h2 className="mb-6 text-lg font-semibold text-ink dark:text-[#e8e8f8]">
          {profileUser.name || "TA"} 的文章 ({profileUser._count.posts})
        </h2>

        {profileUser.posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary-200 p-12 text-center dark:border-[#3a3a58]">
            <p className="text-muted dark:text-[#a0a0c0]">暂无已发布文章</p>
          </div>
        ) : (
          <UserPostList
            posts={JSON.parse(JSON.stringify(profileUser.posts))}
          />
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted/70 dark:border-[#3a3a58] dark:text-[#a0a0c0]/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
