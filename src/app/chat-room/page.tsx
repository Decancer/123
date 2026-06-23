import { getCurrentUser } from "@/lib/auth";
import { ChatRoomClient } from "@/components/ChatRoomClient";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import Link from "next/link";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";

export const dynamic = "force-dynamic";

export default async function ChatRoomPage() {
  const user = await getCurrentUser();

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
            {user ? (
              <UserMenu userName={user.name || "User"} avatar={user.avatar} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97] dark:bg-primary-400 dark:text-[#16162a] dark:hover:bg-primary-300"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:bg-primary-50 hover:text-ink active:scale-[0.97] dark:border-[#3a3a58] dark:text-[#a0a0c0] dark:hover:border-primary-500 dark:hover:bg-[#2a2a48] dark:hover:text-[#e8e8f8]"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* 主体 */}
      <main className="relative z-[1] mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <BackToHomeLink />
        <ChatRoomClient
          currentUser={
            user
              ? { id: user.id, name: user.name || "User", avatar: user.avatar }
              : null
          }
        />
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted/70 dark:border-[#3a3a58] dark:text-[#a0a0c0]/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
