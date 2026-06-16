import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { WriteArticle } from "@/components/WriteArticle";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { PostList } from "@/components/PostList";

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
      include: {
        author: { select: { id: true, name: true, avatar: true } },
        tags: { include: { tag: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getCurrentUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            🐾 Mashiro Chat
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              首页
            </Link>
            <Link href="/api/users" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              API: 用户
            </Link>
            <Link href="/api/posts?published=true" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              API: 文章
            </Link>

            {/* 分隔线 */}
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

      {/* 主体内容 */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* 欢迎区 */}
        {currentUser && (
          <div className="mb-10 rounded-xl border border-blue-100 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-base font-semibold text-white">
                {currentUser.name?.charAt(0) || "U"}
              </span>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  你好，{currentUser.name}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {currentUser.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 邮箱未验证提醒（仅登录后显示） */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 分类 Tab + 文章列表（客户端筛选，瞬间切换） */}
        <PostList posts={JSON.parse(JSON.stringify(posts))} initialCategory={initialCategory} currentUserId={currentUser?.id} />

        {/* 技术栈说明 */}
        <div className="mt-16 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 font-semibold">🛠️ 技术栈</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
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

        {/* 写文章（仅登录后可见） */}
        {currentUser && <WriteArticle userName={currentUser.name || "User"} />}
      </main>

      {/* 页脚 */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
