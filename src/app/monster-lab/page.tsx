"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useMonsters,
  getShapeProps,
  COLOR_PRESETS,
  type MonsterShape,
  type MonsterConfig,
} from "@/lib/MonsterContext";
import { BackgroundMonsters } from "@/components/BackgroundMonsters";
import { NavHomeLink } from "@/components/NavHomeLink";
import { NavFeatureLink } from "@/components/NavFeatureLink";
import { UserMenu } from "@/components/UserMenu";
import { BackToHomeLink } from "@/components/BackToHomeLink";

const SHAPE_LABELS: Record<MonsterShape, string> = {
  slender: "瘦高",
  wide: "矮胖",
  round: "圆润",
  classic: "经典",
};

export default function MonsterLabPage() {
  const { monsters, addMonster, removeMonster, updateMonster, canAdd } = useMonsters();
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

  return (
    <div className="flex min-h-screen flex-col bg-primary-50 relative">
      {/* 页面上也显示实际怪兽（预览） */}
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
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6">
          <BackToHomeLink />
        </div>

        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="text-5xl">👾</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            怪兽实验室
          </h1>
          <p className="mt-2 text-muted">
            自由增减、改变形状和颜色，打造你的专属小怪兽小队～（最多 5 只）
          </p>
        </div>

        {/* 预览区 */}
        <div className="mb-10 overflow-hidden rounded-2xl border border-border bg-white/60 shadow-card">
          <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted">
            📺 实时预览 — 怪兽就在你页面的左下角哦，往下看 ↓
          </div>
          <div
            className="relative bg-gradient-to-t from-primary-100/50 to-transparent"
            style={{ height: 280 }}
          >
            {/* 地面线 */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-border/50" />
            {/* 模拟怪兽 */}
            {mounted &&
              monsters.map((m, i) => {
                const shape = getShapeProps(m.shape);
                const baseLeft = 6;
                const gap = 50;
                return (
                  <div
                    key={m.id}
                    className="absolute bottom-0 transition-all duration-300"
                    style={{
                      left: `calc(${baseLeft}% + ${i * gap}px)`,
                      width: shape.width,
                      height: shape.height * 0.7,
                      backgroundColor: m.color,
                      borderRadius: shape.borderRadius,
                      boxShadow: "inset -6px 0 10px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      paddingTop: 20,
                    }}
                  >
                    {/* 简化的眼睛 */}
                    <div style={{ display: "flex", gap: m.shape === "wide" ? 14 : 8, marginTop: 8 }}>
                      <div
                        style={{
                          width: m.shape === "wide" ? 16 : 11,
                          height: m.shape === "wide" ? 16 : 11,
                          backgroundColor: "white",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            backgroundColor: "#1a1a1a",
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          width: m.shape === "wide" ? 16 : 11,
                          height: m.shape === "wide" ? 16 : 11,
                          backgroundColor: "white",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            backgroundColor: "#1a1a1a",
                            borderRadius: "50%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            {monsters.length === 0 && (
              <div className="flex h-full items-center justify-center text-muted text-sm">
                还没有怪兽，点击下方按钮添加吧～
              </div>
            )}
          </div>
        </div>

        {/* 控制面板 */}
        <h2 className="mb-4 text-lg font-semibold text-ink flex items-center gap-2">
          ⚙️ 怪兽配置
          <span className="text-sm font-normal text-muted">
            ({monsters.length}/5)
          </span>
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {monsters.map((m, i) => (
            <MonsterCard
              key={m.id}
              config={m}
              index={i}
              onShape={(s) => updateMonster(m.id, { shape: s })}
              onColor={(c) => updateMonster(m.id, { color: c })}
              onRemove={() => removeMonster(m.id)}
            />
          ))}
        </div>

        {/* 添加按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={addMonster}
            disabled={!canAdd}
            title={canAdd ? "添加一只怪兽" : "已达上限 5 只"}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 px-5 py-3 text-sm font-medium text-primary-600 transition hover:border-primary-400 hover:bg-primary-100 active:scale-95 disabled:border-border disabled:text-muted/40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <span className="text-lg">+</span>
            添加怪兽
          </button>
          {!canAdd && (
            <p className="mt-2 text-xs text-muted">已达上限 5 只，请先删除再添加</p>
          )}
        </div>

        {/* 提示 */}
        <p className="mt-10 text-center text-sm text-muted/80">
          💡 修改实时生效并自动保存。去看看页面左下角的效果吧～
        </p>
        <p className="mt-1 text-center text-xs text-muted/50 md:hidden">
          请在电脑端查看怪兽效果
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted/70 bg-primary-50">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}

// ==================== 单个怪兽控制卡片 ====================

function MonsterCard({
  config,
  index,
  onShape,
  onColor,
  onRemove,
}: {
  config: MonsterConfig;
  index: number;
  onShape: (s: MonsterShape) => void;
  onColor: (c: string) => void;
  onRemove: () => void;
}) {
  const shapeKeys: MonsterShape[] = ["slender", "wide", "round", "classic"];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card transition hover:border-primary-200">
      {/* 头部：编号 + 删除 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-ink">
          怪兽 #{index + 1}
        </span>
        <button
          onClick={onRemove}
          className="rounded-lg px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-500"
          title="删除这只怪兽"
        >
          🗑
        </button>
      </div>

      {/* 形状选择 */}
      <div className="mb-3">
        <label className="mb-1.5 block text-xs font-medium text-muted">形状</label>
        <div className="flex gap-1.5 flex-wrap">
          {shapeKeys.map((s) => (
            <button
              key={s}
              onClick={() => onShape(s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition border ${
                config.shape === s
                  ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                  : "bg-white text-muted border-border hover:border-primary-300 hover:text-ink"
              }`}
            >
              {SHAPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* 颜色选择 */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">颜色</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c}
              onClick={() => onColor(c)}
              title={c}
              className={`h-6 w-6 rounded-full border-2 transition ${
                config.color === c
                  ? "border-ink scale-110 shadow-sm"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
