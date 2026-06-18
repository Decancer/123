import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const currentUser = await getCurrentUser();

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

      {/* 内容区 */}
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">🛠️ 功能</h1>
        <p className="text-zinc-500 dark:text-zinc-400">即将上线，敬请期待……</p>
      </main>

      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-400 dark:border-zinc-800">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
