import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { PostList } from "@/components/PostList";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";

export const dynamic = "force-dynamic";

interface HomeProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { category } = await searchParams;
  const initialCategory =
    category === "tech" || category === "life" ? category : null;

  const [posts, currentUser] = await Promise.all([
    prisma.post.findMany({
      where: { published: true },
      select: {
        id: true, title: true, slug: true, content: true, excerpt: true,
        category: true, viewCount: true, createdAt: true,
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 dark:bg-[#0f0f1e] relative">
      {/* 背景装饰生物 */}
      <BackgroundMonsters />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md dark:border-[#2a2a45] dark:bg-[#0f0f1e]/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink dark:text-[#e0e0f0]">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted dark:text-[#9090a8]">
            <NavHomeLink />
            <NavFeatureLink />

            {/* 分隔线 */}
            <span className="mx-1 h-4 w-px bg-border dark:bg-[#2a2a45]" />

            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97] dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:bg-primary-50 hover:text-ink active:scale-[0.97] dark:border-[#2a2a45] dark:text-[#9090a8] dark:hover:border-primary-500 dark:hover:bg-[#1a1a35] dark:hover:text-[#e0e0f0]"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* 邮箱未验证提醒（仅登录后显示） */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 分类 Tab + 文章列表（客户端筛选，瞬间切换） */}
        <PostList posts={JSON.parse(JSON.stringify(posts))} initialCategory={initialCategory} />

        {/* 技术栈说明 */}
        <div className="mt-16 rounded-2xl border border-border bg-surface p-6 shadow-card dark:border-[#2a2a45] dark:bg-[#1a1a30]">
          <h3 className="mb-3 font-semibold text-ink dark:text-[#e0e0f0]">🛠️ 技术栈</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted dark:text-[#9090a8]">
            <div>• Next.js 16（App Router）</div>
            <div>• Auth（JWT + Cookie）</div>
            <div>• Prisma 7（ORM）</div>
            <div>• SQLite（数据库）</div>
            <div>• TypeScript</div>
            <div>• Tailwind CSS v4</div>
            <div>• bcryptjs（密码加密）</div>
            <div>• jose（JWT）</div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted/70 dark:border-[#2a2a45] dark:text-[#9090a8]/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
