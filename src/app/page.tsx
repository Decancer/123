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
        id: true, title: true, slug: true, excerpt: true,
        category: true, viewCount: true, createdAt: true,
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      {/* 背景装饰生物 */}
      <BackgroundMonsters />

      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <NavHomeLink />
            <NavFeatureLink />

            {/* 分隔线 */}
            <span className="mx-1 h-4 w-px bg-border" />

            {currentUser ? (
              <UserMenu userId={currentUser.id} userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition cursor-pointer hover:bg-primary-600 hover:shadow-glow hover:scale-105 active:scale-[0.97]"
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

      {/* 主体内容 */}
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* 邮箱未验证提醒（仅登录后显示） */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 分类 Tab + 文章列表（客户端筛选，瞬间切换） */}
        <PostList posts={JSON.parse(JSON.stringify(posts))} initialCategory={initialCategory} />

        {/* 技术栈说明 */}
        <div className="mt-16 rounded-2xl border border-border bg-surface p-6 shadow-card">
          <h3 className="mb-3 font-semibold text-ink">🛠️ 技术栈</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted">
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
      <footer className="border-t border-border py-8 text-center text-sm text-muted/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
