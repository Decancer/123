"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useLive2DContext } from "@/lib/Live2DContext";
import { useLoadingReaction } from "@/lib/useLive2DReaction";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";

export default function DressingRoomPage() {
  const { characterId, outfitId, characters, currentCharacter, setCharacter, setOutfit } = useLive2DContext();
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

  function handleSelect(id: string) {
    if (id === outfitId) return;
    setSwitching(true);
    setOutfit(id);
    setTimeout(() => setSwitching(false), 1200);
  }

  const outfits = Object.values(currentCharacter.outfits);

  return (
    <>
      {/* 加载遮罩 */}
      {switching &&
        mounted &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-50/80 backdrop-blur-sm">
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

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 bg-primary-50">
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
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-ink">
            👗 {currentCharacter.name} 的更衣室
          </h1>
          <p className="text-muted">
            帮她挑选一套喜欢的衣服吧～右下角的 {currentCharacter.name} 会立刻换上新造型哦
          </p>
        </div>

        {/* 角色切换 */}
        <div className="mb-6 flex justify-center gap-2">
          {characters.map((char) => {
            const isActive = characterId === char.id;
            return (
              <button
                key={char.id}
                onClick={() => { if (!isActive) setCharacter(char.id); }}
                className={`cursor-pointer rounded-full border-2 px-6 py-2 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "border-primary-500 bg-primary-500 text-white shadow-sm"
                    : "border-border bg-surface text-muted hover:border-primary-300 hover:text-primary-600"
                }`}
              >
                {char.name}
              </button>
            );
          })}
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
                    ? "border-primary-500 bg-primary-50 shadow-glow"
                    : "border-border bg-surface shadow-card hover:border-primary-300 hover:shadow-card-hover"
                } ${switching ? "pointer-events-none opacity-70" : ""}`}
              >
                {/* 图标 */}
                <span className="mb-3 text-5xl">{outfit.icon}</span>

                {/* 名称 */}
                <h3 className="mb-1 text-base font-semibold text-ink">
                  {outfit.name}
                </h3>

                {/* 描述 */}
                <p className="mb-4 text-center text-sm leading-relaxed text-muted">
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
                    className="inline-block cursor-pointer rounded-full border border-border px-5 py-1.5 text-sm font-medium text-muted transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-600 active:scale-95"
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
        <p className="mt-6 text-center text-sm text-muted/80">
          💡 切换服装后，右下角的 {currentCharacter.name} 会立即穿上新衣服哦～
        </p>
        <p className="mt-1 text-center text-xs text-muted/50 md:hidden">
          请在电脑端查看 Mashiro 模型效果
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted/70 bg-primary-50">
        Built with Next.js + Prisma + SQLite
      </footer>

      <BackgroundMonsters />
    </>
  );
}
