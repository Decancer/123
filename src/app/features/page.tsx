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

            {currentUser ? (
              <UserMenu userName={currentUser.name || "User"} avatar={currentUser.avatar} />
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
      <main className="relative z-[1] mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        {/* Hero 区 */}
        <div className="mb-12 text-center">
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-20 w-20 rounded-full shadow-glow"
          />
          <h1 className="text-3xl font-bold text-ink dark:text-[#e8e8f8]">
            ✨ 我能做什么？
          </h1>
          <p className="mt-2 text-muted dark:text-[#a0a0c0]">
            来看看 Mashiro Chat 为你准备了哪些好玩的功能吧～
          </p>
        </div>

        {/* 功能卡片网格：1 列 mobile / 2 列 sm / 3 列 lg */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const cardContent = (
              <>
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-1.5 text-base font-semibold text-ink dark:text-[#e8e8f8]">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted dark:text-[#a0a0c0]">
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
              "group rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary-300 dark:border-[#3a3a58] dark:bg-[#222240] dark:hover:border-primary-500";

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

          {/* 占位卡片 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-5 text-center transition hover:border-primary-300 dark:border-[#3a3a58] dark:bg-[#222240]/50 dark:hover:border-primary-500">
            <div className="mb-2 text-3xl opacity-40">🐾</div>
            <p className="text-sm font-medium text-muted dark:text-[#a0a0c0]">
              还有更多……
            </p>
            <p className="mt-1 text-xs text-muted/60 dark:text-[#a0a0c0]/60">
              新功能陆续添加中
            </p>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted/70 dark:border-[#3a3a58] dark:text-[#a0a0c0]/70">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
