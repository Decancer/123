"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useMonsterPals } from "@/lib/MonsterPalsContext";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";

const PAL_CARDS = [
  {
    id: "rui",
    name: "rui",
    color: "#669988",
    emoji: "💚",
    desc: "性格冷漠，目标是永远站在顶端，主张比起感情应更优先现实。",
    shape: "42 × 320 · 小圆眼",
  },
  {
    id: "nanami",
    name: "nanami",
    color: "#EE7744",
    emoji: "🧡",
    desc: "在各领域都才能出众的女孩，尤其是在艺术方面有着天才一般的才能。",
    shape: "90 × 160 · 大黑豆眼 · 追踪嘴",
  },
  {
    id: "toko",
    name: "toko",
    color: "#fef9c3",
    emoji: "💛",
    desc: "总是非常积极开朗的女高中生。因为其爽朗的性格，交友圈子很广，无论在学校里还是社交网络上都是有着许多追随者的风云人物。",
    shape: "90 × 200 · 大黑豆眼 · 追踪嘴 · 灵动眼",
  },
  {
    id: "tsukushi",
    name: "tsukushi",
    color: "#7c3aed",
    emoji: "💜",
    desc: "总是自信满满的Morfonica的队长。面对做不到的事也会努力进行挑战，而且经常失败，现在开始转为专注于能够做到的事。",
    shape: "240 × 70 · 小圆眼 · 图层 2",
  },
];

export default function MonsterPalsPage() {
  const { pals, togglePal } = useMonsterPals();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  const visibleCount = pals.filter((p) => p.visible).length;

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      {mounted && <BackgroundMonsters />}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="select-none text-lg font-bold tracking-tight text-ink">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-border" />
            {currentUser ? (
              <UserMenu userId={Number(currentUser.id)} userName={currentUser.name} avatar={currentUser.avatar ?? null} />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97]">
                  登录
                </Link>
                <Link href="/register" className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:bg-primary-50 hover:text-ink active:scale-[0.97]">
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6">
          <BackToHomeLink />
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="text-5xl">👾</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            Mashiro 的小伙伴
          </h1>
          <p className="mt-2 text-muted">
            左下角的小家伙们都在这儿了～点击卡片控制它们的出现与隐藏
          </p>
          <p className="mt-1 text-xs text-muted/60">
            当前 {visibleCount} 只可见
          </p>
        </div>

        {/* 小伙伴卡片网格 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PAL_CARDS.map((card) => {
            const pal = pals.find((p) => p.id === card.id)!;
            const isVisible = pal.visible;

            return (
              <div
                key={card.id}
                className={`relative flex flex-col items-center rounded-2xl border-2 p-6 transition-all duration-300 ${
                  isVisible
                    ? "border-primary-500 bg-primary-50 shadow-glow"
                    : "border-border bg-surface shadow-card hover:border-primary-300 hover:shadow-card-hover"
                }`}
              >
                {/* 颜色圆 + emoji */}
                <div className="relative mb-3">
                  <span className="text-4xl">{card.emoji}</span>
                </div>

                {/* 名字 */}
                <h3 className="mb-1 text-base font-semibold text-ink">
                  {card.name}
                </h3>

                {/* 色块预览 */}
                <div
                  className="mb-3 h-3 w-16 rounded-full shadow-sm ring-1 ring-black/10"
                  style={{ backgroundColor: card.color }}
                />

                {/* 形状信息 */}
                <p className="mb-3 text-center text-xs text-muted/70 font-mono">
                  {card.shape}
                </p>

                {/* 描述 */}
                <p className="mb-4 text-center text-sm leading-relaxed text-muted">
                  {card.desc}
                </p>

                {/* 开关按钮 */}
                <button
                  onClick={() => togglePal(card.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium transition active:scale-95 ${
                    isVisible
                      ? "bg-primary-500 text-white shadow-sm hover:bg-primary-600"
                      : "border border-border text-muted hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600"
                  }`}
                >
                  {isVisible ? (
                    <>
                      <span>👁️</span> 显示中
                    </>
                  ) : (
                    <>
                      <span>✨</span> 召唤出来
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {/* 占位卡片 */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-6 text-center transition hover:border-primary-300">
            <div className="mb-2 text-3xl opacity-40">🐾</div>
            <p className="text-sm font-medium text-muted">
              更多小伙伴
            </p>
            <p className="mt-1 text-xs text-muted/60">
              等待加入中...
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted/80">
          💡 去页面左下角看看效果～刷新后设置也会保留哦
        </p>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted/70 bg-primary-50">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}
