"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  useMonsters,
  getShapeProps,
  COLOR_PRESETS,
  MONSTER_LIMITS,
  type MonsterShape,
  type EyeType,
  type MouthType,
  type HeadShape,
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
const SHAPE_KEYS: MonsterShape[] = ["slender", "wide", "round", "classic"];

const EYE_OPTIONS: { value: EyeType; label: string; icon: string }[] = [
  { value: "normal", label: "正常", icon: "👀" },
  { value: "noSclera", label: "黑豆", icon: "⚫" },
  { value: "verticalLine", label: "竖线", icon: "〰️" },
];

const MOUTH_OPTIONS: { value: MouthType; label: string; icon: string }[] = [
  { value: "none", label: "无", icon: "✕" },
  { value: "line", label: "横线", icon: "—" },
  { value: "arcUp", label: "上弧", icon: "⌣" },
  { value: "arcDown", label: "下弧", icon: "⌢" },
];

const HEAD_OPTIONS: { value: HeadShape; label: string }[] = [
  { value: "round", label: "圆头" },
  { value: "square", label: "方头" },
];

// ==================== 页面 ====================

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
        <div className="mb-8 text-center">
          <span className="text-5xl">👾</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
            怪兽实验室
          </h1>
          <p className="mt-2 text-muted">
            打造你的专属小怪兽小队 —— 眼睛、嘴巴、大小、脑袋形状都能调～
          </p>
        </div>

        {/* === 预览区 === */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border shadow-card"
          style={{ background: "linear-gradient(180deg, #e8edf5 0%, #d5dded 60%, #c8d2a6 100%)" }}
        >
          <div className="px-4 py-2 text-xs font-medium text-muted/80 border-b border-border/60 bg-white/40 backdrop-blur-sm">
            📺 实时预览 — 下方怪兽外观与你左下角的一致
          </div>
          <div className="relative" style={{ height: 260 }}>
            {/* 地面线 */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/8" />
            {mounted && monsters.length > 0 ? (
              monsters.map((m, i) => (
                <PreviewMonster key={m.id} config={m} index={i} />
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-muted/60 text-sm">
                还没有怪兽，点击下方按钮添加吧～
              </div>
            )}
          </div>
        </div>

        {/* === 控制面板 === */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            ⚙️ 怪兽配置
            <span className="text-sm font-normal text-muted">({monsters.length}/{MONSTER_LIMITS.count})</span>
          </h2>
          <button
            onClick={addMonster}
            disabled={!canAdd}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-primary-300 bg-primary-50/50 px-4 py-2 text-sm font-medium text-primary-600 transition hover:border-primary-400 hover:bg-primary-100 active:scale-95 disabled:border-border disabled:text-muted/40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            <span className="text-base leading-none">+</span> 添加
          </button>
        </div>
        {!canAdd && <p className="-mt-2 mb-4 text-xs text-muted">已达上限 5 只</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {monsters.map((m, i) => (
            <MonsterCard
              key={m.id}
              config={m}
              index={i}
              onUpdate={(p) => updateMonster(m.id, p)}
              onRemove={() => removeMonster(m.id)}
            />
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-muted/80">
          💡 所有修改实时生效并自动保存。去看页面左下角的实际效果吧～
        </p>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted/70 bg-primary-50">
        Built with Next.js + Prisma + SQLite
      </footer>
    </div>
  );
}

// ==================== 预览区小怪兽 ====================

function PreviewMonster({ config: m, index }: { config: MonsterConfig; index: number }) {
  const baseLeft = 6;
  const gap = 50;
  const previewHeight = Math.min(m.height * 0.65, 220);
  const previewWidth = m.width;
  const eyeRatio = m.width / 60;
  const eyeS = Math.round((m.shape === "wide" ? 40 : 28) * eyeRatio);
  const pupilS = Math.round(eyeS * 0.35);
  const br = m.headShape === "square" ? "0 0 0 0" : `${Math.round(m.width * 0.35)}px ${Math.round(m.width * 0.35)}px 0 0`;

  // 嘴巴预览
  function mouthEl() {
    const mw = m.width >= 80 ? 28 : 20;
    const base: React.CSSProperties = { marginTop: 6, marginLeft: "auto", marginRight: "auto" };
    switch (m.mouthType) {
      case "none": return null;
      case "line":
        return <div style={{ ...base, width: mw, height: 4, backgroundColor: "#1a1a1a", borderRadius: 2 }} />;
      case "arcUp":
        return (
          <div style={{
            ...base, width: mw, height: 10,
            borderBottom: "2.5px solid #1a1a1a",
            borderBottomLeftRadius: "50%",
            borderBottomRightRadius: "50%",
          }} />
        );
      case "arcDown":
        return (
          <div style={{
            ...base, width: mw, height: 10,
            borderTop: "2.5px solid #1a1a1a",
            borderTopLeftRadius: "50%",
            borderTopRightRadius: "50%",
          }} />
        );
    }
  }

  return (
    <div
      className="absolute bottom-0 transition-all duration-300"
      style={{
        left: `calc(${baseLeft}% + ${index * gap}px)`,
        width: previewWidth,
        height: previewHeight,
        backgroundColor: m.color,
        borderRadius: br,
        boxShadow: "inset -6px 0 10px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: Math.max(12, previewHeight * 0.06),
      }}
    >
      {/* 眼睛 */}
      <div style={{ display: "flex", gap: m.width < 50 ? 6 : 10 }}>
        {m.eyeType === "verticalLine" ? (
          <>
            <div style={{ width: 3, height: eyeS * 0.7, backgroundColor: "#1a1a1a", borderRadius: 2 }} />
            <div style={{ width: 3, height: eyeS * 0.7, backgroundColor: "#1a1a1a", borderRadius: 2 }} />
          </>
        ) : (
          <>
            <div
              style={{
                width: eyeS, height: eyeS,
                backgroundColor: m.eyeType === "noSclera" ? "transparent" : "white",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: pupilS, height: pupilS, backgroundColor: "#1a1a1a", borderRadius: "50%" }} />
            </div>
            <div
              style={{
                width: eyeS, height: eyeS,
                backgroundColor: m.eyeType === "noSclera" ? "transparent" : "white",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: pupilS, height: pupilS, backgroundColor: "#1a1a1a", borderRadius: "50%" }} />
            </div>
          </>
        )}
      </div>
      {mouthEl()}
    </div>
  );
}

// ==================== 怪兽配置卡片 ====================

function MonsterCard({
  config: m,
  index,
  onUpdate,
  onRemove,
}: {
  config: MonsterConfig;
  index: number;
  onUpdate: (p: Partial<MonsterConfig>) => void;
  onRemove: () => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card transition hover:border-primary-200 overflow-hidden">
      {/* 卡片头部 */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/60 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-block h-4 w-4 rounded-full shadow-sm ring-1 ring-black/10"
            style={{ backgroundColor: m.color }}
          />
          <span className="text-sm font-semibold text-ink">怪兽 #{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="rounded-lg px-2 py-1 text-xs text-muted hover:text-ink hover:bg-primary-50 transition"
            title={drawerOpen ? "折叠" : "展开更多"}
          >
            {drawerOpen ? "收起 ▲" : "更多 ▼"}
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg px-2 py-1 text-xs text-red-400 transition hover:bg-red-50 hover:text-red-500"
            title="删除"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* === 形状快速预设 === */}
        <ControlGroup label="形状">
          <div className="flex gap-1.5">
            {SHAPE_KEYS.map((s) => (
              <button
                key={s}
                onClick={() => {
                  const d = getShapeProps(s);
                  onUpdate({ shape: s, width: d.width, height: d.height, headShape: d.headShape });
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition border flex-1 ${
                  m.shape === s
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-muted border-border hover:border-primary-300 hover:text-ink"
                }`}
              >
                {SHAPE_LABELS[s]}
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* === 颜色 === */}
        <ControlGroup label="颜色">
          <div className="flex gap-1.5 flex-wrap">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ color: c })}
                title={c}
                className={`h-7 w-7 rounded-full border-2 transition active:scale-90 ${
                  m.color === c ? "border-ink scale-110 shadow-md" : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </ControlGroup>

        {/* === 眼睛类型 === */}
        <ControlGroup label="眼睛">
          <div className="flex gap-1.5">
            {EYE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ eyeType: opt.value })}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition border flex-1 ${
                  m.eyeType === opt.value
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-muted border-border hover:border-primary-300 hover:text-ink"
                }`}
              >
                <span className="text-sm">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* === 嘴巴类型 === */}
        <ControlGroup label="嘴巴">
          <div className="grid grid-cols-4 gap-1.5">
            {MOUTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onUpdate({ mouthType: opt.value })}
                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition border ${
                  m.mouthType === opt.value
                    ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                    : "bg-white text-muted border-border hover:border-primary-300 hover:text-ink"
                }`}
              >
                <span className="block text-sm">{opt.icon}</span>
                <span className="text-[10px]">{opt.label}</span>
              </button>
            ))}
          </div>
        </ControlGroup>

        {/* === 展开区域：宽高滑块 + 头型 === */}
        {drawerOpen && (
          <div className="space-y-4 pt-1 border-t border-border/50">
            {/* 宽度 */}
            <ControlGroup label={`宽度 — ${m.width}px`}>
              <input
                type="range"
                min={MONSTER_LIMITS.width.min}
                max={MONSTER_LIMITS.width.max}
                step={MONSTER_LIMITS.width.step}
                value={m.width}
                onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#6677cc" }}
              />
              <div className="flex justify-between text-[10px] text-muted/60 -mt-1">
                <span>{MONSTER_LIMITS.width.min}</span>
                <span>{MONSTER_LIMITS.width.max}</span>
              </div>
            </ControlGroup>

            {/* 高度 */}
            <ControlGroup label={`高度 — ${m.height}px`}>
              <input
                type="range"
                min={MONSTER_LIMITS.height.min}
                max={MONSTER_LIMITS.height.max}
                step={MONSTER_LIMITS.height.step}
                value={m.height}
                onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "#6677cc" }}
              />
              <div className="flex justify-between text-[10px] text-muted/60 -mt-1">
                <span>{MONSTER_LIMITS.height.min}</span>
                <span>{MONSTER_LIMITS.height.max}</span>
              </div>
            </ControlGroup>

            {/* 头型 */}
            <ControlGroup label="头型">
              <div className="flex gap-1.5">
                {HEAD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onUpdate({ headShape: opt.value })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition border flex-1 ${
                      m.headShape === opt.value
                        ? "bg-primary-500 text-white border-primary-500 shadow-sm"
                        : "bg-white text-muted border-border hover:border-primary-300 hover:text-ink"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </ControlGroup>
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== 小工具 ====================

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted tracking-wide">{label}</label>
      {children}
    </div>
  );
}
