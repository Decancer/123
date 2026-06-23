import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { ProfileEditor } from "@/components/ProfileEditor";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 dark:bg-[#0f0f1e] relative">
      {/* 背景装饰生物 */}
      <BackgroundMonsters />
      {/* 导航 */}
      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md dark:border-[#2a2a45] dark:bg-[#0f0f1e]/80">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink dark:text-[#e0e0f0]">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted dark:text-[#9090a8]">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-border dark:bg-[#2a2a45]" />
            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <Link href="/login" className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97] dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300">
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* 内容 */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <BackToHomeLink />

        {currentUser ? (
          <ProfileEditor
            user={{
              name: currentUser.name,
              email: currentUser.email,
              avatar: currentUser.avatar,
              background: currentUser.background ?? null,
              bio: currentUser.bio,
            }}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-primary-200 p-12 text-center dark:border-[#2a2a45]">
            <p className="text-muted dark:text-[#9090a8]">请先登录</p>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted/70 dark:border-[#2a2a45] dark:text-[#9090a8]/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
