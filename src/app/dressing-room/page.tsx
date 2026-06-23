"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLive2DContext, OUTFITS, type OutfitId } from "@/lib/Live2DContext";
import { useLoadingReaction } from "@/lib/useLive2DReaction";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";

export default function DressingRoomPage() {
  const { outfitId, setOutfit } = useLive2DContext();
  const [switching, setSwitching] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; avatar?: string | null } | null>(null);

  useLoadingReaction(switching);

  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});
  }, []);

  function handleSelect(id: OutfitId) {
    if (id === outfitId) return;
    setSwitching(true);
    setOutfit(id);
    setTimeout(() => setSwitching(false), 1200);
  }

  const outfits = Object.values(OUTFITS);

  return (
    <>
      {/* 加载遮罩 */}
      {switching &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-50/80 backdrop-blur-sm dark:bg-[#0f0f1e]/80">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mashiro.svg"
              alt="加载中"
              className="h-20 w-20 animate-spin"
            />
          </div>,
          document.body
        )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary-50/80 backdrop-blur-md dark:border-[#2a2a45] dark:bg-[#0f0f1e]/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="select-none text-lg font-bold tracking-tight text-ink dark:text-[#e0e0f0]">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-muted dark:text-[#9090a8]">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-border dark:bg-[#2a2a45]" />
            {currentUser ? (
              <UserMenu userName={currentUser.name} avatar={currentUser.avatar ?? null} />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-primary-600 hover:shadow-glow active:scale-[0.97] dark:bg-primary-400 dark:text-[#0f0f1e] dark:hover:bg-primary-300"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition hover:border-primary-300 hover:bg-primary-50 hover:text-ink active:scale-[0.97] dark:border-[#2a2a45] dark:text-[#9090a8] dark:hover:border-primary-500 dark:hover:bg-[#1a1a35] dark:hover:text-[#e0e0f0]"
                >
                  注册
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 bg-primary-50 dark:bg-[#0f0f1e]">
        {/* 返回 */}
        <div className="mb-6">
          <BackToHomeLink />
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mashiro.svg"
            alt="Mashiro"
            className="mx-auto mb-4 h-20 w-20 drop-shadow-[0_0_12px_rgba(102,119,204,0.3)]"
          />
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink dark:text-[#e0e0f0]">
            👗 Mashiro 的更衣室
          </h1>
          <p className="text-muted dark:text-[#9090a8]">
            帮她挑选一套喜欢的衣服吧～右下角的 Mashiro 会立刻换上新造型哦
          </p>
        </div>

        {/* 衣服卡片网格 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {outfits.map((outfit) => {
            const isActive = outfitId === outfit.id;
            return (
              <div
                key={outfit.id}
                className={`relative flex flex-col items-center rounded-2xl border-2 p-6 transition-all duration-300 ${
                  isActive
                    ? "border-primary-500 bg-primary-50 shadow-glow dark:border-primary-400 dark:bg-primary-500/10"
                    : "border-border bg-surface shadow-card hover:border-primary-300 hover:shadow-card-hover dark:border-[#2a2a45] dark:bg-[#1a1a30] dark:hover:border-primary-500"
                } ${switching ? "pointer-events-none opacity-70" : ""}`}
              >
                {/* 图标 */}
                <span className="mb-3 text-5xl">{outfit.icon}</span>

                {/* 名称 */}
                <h3 className="mb-1 text-base font-semibold text-ink dark:text-[#e0e0f0]">
                  {outfit.name}
                </h3>

                {/* 描述 */}
                <p className="mb-4 text-center text-sm leading-relaxed text-muted dark:text-[#9090a8]">
                  {outfit.desc}
                </p>

                {/* 按钮 */}
                {isActive ? (
                  <span className="inline-block rounded-full bg-primary-500 px-5 py-1.5 text-sm font-medium text-white shadow-sm">
                    当前
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelect(outfit.id)}
                    className="inline-block cursor-pointer rounded-full border border-border px-5 py-1.5 text-sm font-medium text-muted transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 active:scale-95 dark:border-[#2a2a45] dark:text-[#9090a8] dark:hover:border-primary-400 dark:hover:bg-primary-500/10 dark:hover:text-primary-300"
                    disabled={switching}
                  >
                    选择
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* 提示 */}
        <p className="mt-6 text-center text-sm text-muted/80 dark:text-[#9090a8]/80">
          💡 切换服装后，右下角的 Mashiro 会立即穿上新衣服哦～
        </p>
        <p className="mt-1 text-center text-xs text-muted/50 dark:text-[#9090a8]/50 md:hidden">
          请在电脑端查看 Mashiro 模型效果
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted/70 dark:border-[#2a2a45] dark:text-[#9090a8]/70 bg-primary-50 dark:bg-[#0f0f1e]">
        Built with Next.js + Prisma + SQLite
      </footer>

      <BackgroundMonsters />
    </>
  );
}
