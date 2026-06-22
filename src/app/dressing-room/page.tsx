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
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-zinc-950/80">
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
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="select-none text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            🐾 Mashiro Chat
          </span>
          <nav className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <NavHomeLink />
            <NavFeatureLink />
            <span className="mx-1 h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
            {currentUser ? (
              <UserMenu userName={currentUser.name} avatar={currentUser.avatar} />
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

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
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
            className="mx-auto mb-4 h-20 w-20"
          />
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            👗 Mashiro 的更衣室
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
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
                className={`relative flex flex-col items-center rounded-xl border-2 p-6 transition-all ${
                  isActive
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200 dark:border-blue-400 dark:bg-blue-950/30 dark:ring-blue-500/30"
                    : "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-600"
                } ${switching ? "pointer-events-none opacity-70" : ""}`}
              >
                {/* 图标 */}
                <span className="mb-3 text-5xl">{outfit.icon}</span>

                {/* 名称 */}
                <h3 className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {outfit.name}
                </h3>

                {/* 描述 */}
                <p className="mb-4 text-center text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {outfit.desc}
                </p>

                {/* 按钮 */}
                {isActive ? (
                  <span className="inline-block rounded-full bg-blue-500 px-5 py-1.5 text-sm font-medium text-white">
                    当前
                  </span>
                ) : (
                  <button
                    onClick={() => handleSelect(outfit.id)}
                    className="inline-block cursor-pointer rounded-full border border-zinc-300 px-5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 active:scale-95 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
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
        <p className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
          💡 切换服装后，右下角的 Mashiro 会立即穿上新衣服哦～
        </p>
        <p className="mt-1 text-center text-xs text-zinc-300 dark:text-zinc-600 md:hidden">
          请在电脑端查看 Mashiro 模型效果
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Built with Next.js + Prisma + SQLite
      </footer>

      <BackgroundMonsters />
    </>
  );
}
