import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { FeatureCardLink } from "@/components/FeatureCardLink";
import { UserMenu } from "@/components/UserMenu";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";

export const dynamic = "force-dynamic";

/** 每张功能卡片的定义 */
interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
  href?: string;
}

const features: FeatureCard[] = [
  {
    icon: "💬",
    title: "聊天室",
    desc: "实时公共聊天室！在这里和大家聊天交流，看看谁在线～需要登录才能发送消息喵！",
    href: "/chat-room",
  },
  {
    icon: "👗",
    title: "更衣室",
    desc: "想给 Mashiro 换衣服吗？冬季校服、夏季校服、SSR、UR… 来帮她挑选今天的造型吧～",
    href: "/dressing-room",
  },
  {
    icon: "✉️",
    title: "私信",
    desc: "想和某位用户单独聊聊？在 TA 的个人主页点击私信按钮，或者在这里查看你的所有私信对话～",
    href: "/messages",
  },
];

export default async function FeaturesPage() {
  const currentUser = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      <BackgroundMonsters />

      {/* 导航 */}
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

      {/* 主体 */}
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* Hero 区 */}
        <div className="mb-12 text-center">
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-20 w-20 rounded-full shadow-glow"
          />
          <h1 className="text-3xl font-bold text-ink">
            ✨ 我能做什么？
          </h1>
          <p className="mt-2 text-muted">
            来看看 Mashiro Chat 为你准备了哪些好玩的功能吧～
          </p>
        </div>

        {/* 功能卡片网格：1 列 mobile / 2 列 sm / 3 列 lg */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const cardContent = (
              <>
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1.5 text-base font-semibold text-ink">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">
                  {f.desc}
                </p>
                {f.href && (
                  <span className="mt-2 inline-block text-xs font-medium text-primary-500 group-hover:underline">
                    点击进入 →
                  </span>
                )}
              </>
            );

            const className =
              "group rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary-300";

            return f.href ? (
              <FeatureCardLink key={f.title} href={f.href} className={className}>
                {cardContent}
              </FeatureCardLink>
            ) : (
              <div key={f.title} className={className}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
