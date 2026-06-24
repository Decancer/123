import { getCurrentUser } from "@/lib/auth";
import { MessagesClient } from "@/components/MessagesClient";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      <BackgroundMonsters />

      <header className="sticky top-0 z-10 border-b border-border bg-primary-50/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="text-lg font-bold tracking-tight text-ink">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-border" />
            {currentUser ? (
              <UserMenu userId={currentUser.id} userName={currentUser.name || "User"} avatar={currentUser.avatar} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97]"
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

      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <BackToHomeLink />
        <MessagesClient currentUser={currentUser} />
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
