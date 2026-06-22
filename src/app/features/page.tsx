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
    icon: "✍️",
    title: "富文本写作",
    desc: "所见即所得的 TipTap 编辑器，支持代码高亮和图片嵌入，写技术博客从未如此顺手～",
  },
  {
    icon: "🎭",
    title: "Live2D 看板娘",
    desc: "全站右下角驻扎！点击她会切换表情动作，害羞、惊讶、生气… 还会对页面操作做出反应呢～",
  },
  {
    icon: "👁️",
    title: "眼动小怪物",
    desc: "首页背景里藏着两只小生物，它们的眼睛会跟着你的鼠标转来转去，试着晃晃光标跟它们玩吧！",
  },
  {
    icon: "🖼️",
    title: "图片上传压缩",
    desc: "最多 6 张配图，上传自动压缩到合适大小。详情页自适应网格排列，1 张铺满、2 张并排、3+ 张瀑布～",
  },
  {
    icon: "🔐",
    title: "安全认证",
    desc: "JWT + httpOnly Cookie + bcryptjs 密码加密。注册需要邮箱验证，Resend 发送验证邮件，安全感拉满！",
  },
  {
    icon: "💭",
    title: "评论互动",
    desc: "登录后就能评论啦～作者和管理员可以编辑或删除，大家都是文明人，好好交流喵～",
  },
  {
    icon: "👤",
    title: "个人主页",
    desc: "上传头像和背景图，写一段个人简介，你的所有文章都会展示在这里，让别人认识你吧！",
  },
  {
    icon: "📱",
    title: "响应式适配",
    desc: "从手机到宽屏，Tailwind CSS v4 让每一处都恰到好处。移动端也能愉快浏览和聊天～",
  },
];

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

      {/* 主体 */}
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* Hero 区 */}
        <div className="mb-12 text-center">
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-20 w-20 rounded-full shadow-lg"
          />
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            ✨ 我能做什么？
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            来看看 Mashiro Chat 为你准备了哪些好玩的功能吧～
          </p>
        </div>

        {/* 功能卡片网格：1 列 mobile / 2 列 sm / 3 列 lg */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const cardContent = (
              <>
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1.5 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {f.desc}
                </p>
                {f.href && (
                  <span className="mt-2 inline-block text-xs text-blue-500 group-hover:underline">
                    点击进入 →
                  </span>
                )}
              </>
            );

            const className =
              "group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-700";

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

          {/* 占位卡片 — 更多功能等你来想 */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-5 text-center transition hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-blue-700">
            <div className="mb-2 text-3xl opacity-40">🐾</div>
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              还有更多……
            </p>
            <p className="mt-1 text-xs text-zinc-300 dark:text-zinc-600">
              新功能陆续添加中
            </p>
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
