import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { PostList } from "@/components/PostList";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

interface HomeProps {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;

  const category =
    params.category === "tech" || params.category === "life"
      ? params.category
      : null;
  const q = params.q?.trim() || null;
  const page = Math.max(1, parseInt(params.page || "1") || 1);

  // 构建查询条件
  const where: Record<string, unknown> = { published: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { content: { contains: q } },
    ];
  }

  const [total, posts, currentUser] = await Promise.all([
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    getCurrentUser(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 relative">
      {/* 背景装饰生物 */}
      <BackgroundMonsters />
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

            {/* 分隔线 */}
            <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />

            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
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
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* 邮箱未验证提醒（仅登录后显示） */}
        {currentUser && !currentUser.emailVerified && (
          <EmailVerificationBanner />
        )}

        {/* 搜索 + 分类 + 文章列表 + 分页 */}
        <PostList
          posts={JSON.parse(JSON.stringify(posts))}
          total={total}
          page={page}
          totalPages={totalPages}
          currentCategory={category}
          currentSearch={q}
        />

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

      </main>

      {/* 页脚 */}
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
