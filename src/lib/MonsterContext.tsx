"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ==================== 类型 ====================

export type MonsterShape = "slender" | "wide" | "round" | "classic";
export type EyeType = "normal" | "noSclera" | "verticalLine";
export type MouthType = "none" | "line" | "arcUp" | "arcDown";
export type HeadShape = "round" | "square";

export interface MonsterConfig {
  id: string;
  shape: MonsterShape;
  color: string;
  eyeType: EyeType;
  mouthType: MouthType;
  width: number;
  height: number;
  headShape: HeadShape;
}

// 形状快速预设（仅设置宽高+头型，不影响眼睛嘴巴）
const SHAPE_DEFAULTS: Record<MonsterShape, { width: number; height: number; headShape: HeadShape }> = {
  slender:  { width: 42,  height: 320, headShape: "round" },
  wide:     { width: 90,  height: 160, headShape: "round" },
  round:    { width: 70,  height: 200, headShape: "round" },
  classic:  { width: 60,  height: 240, headShape: "round" },
};

export function getShapeProps(shape: MonsterShape) {
  return SHAPE_DEFAULTS[shape];
}

export const COLOR_PRESETS = [
  "#3b82f6", // 蓝
  "#f97316", // 橙
  "#ef4444", // 红
  "#eab308", // 黄
  "#22c55e", // 绿
  "#a855f7", // 紫
  "#ec4899", // 粉
];

const DEFAULT_MONSTERS: MonsterConfig[] = [
  { id: "default-1", shape: "slender", color: "#3b82f6", eyeType: "normal", mouthType: "none",    width: 42,  height: 320, headShape: "round" },
  { id: "default-2", shape: "wide",    color: "#f97316", eyeType: "normal", mouthType: "line",    width: 90,  height: 160, headShape: "round" },
];

export const MONSTER_LIMITS = {
  width:  { min: 30, max: 150, step: 2 },
  height: { min: 80, max: 400, step: 5 },
  count:  5,
} as const;

const STORAGE_KEY = "monster-lab";

// ==================== 数据迁移 ====================

function migrateMonster(raw: Record<string, unknown>): MonsterConfig {
  const shape = (raw.shape as MonsterShape) || "classic";
  const defaults = SHAPE_DEFAULTS[shape];
  return {
    id: (raw.id as string) || "",
    shape,
    color: (raw.color as string) || "#3b82f6",
    eyeType: (raw.eyeType as EyeType) || "normal",
    mouthType: (raw.mouthType as MouthType) || "none",
    width: typeof raw.width === "number" ? raw.width : defaults.width,
    height: typeof raw.height === "number" ? raw.height : defaults.height,
    headShape: (raw.headShape as HeadShape) || "round",
  };
}

function readMonsters(): MonsterConfig[] {
  if (typeof window === "undefined") return DEFAULT_MONSTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: Record<string, unknown>) => migrateMonster(m));
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_MONSTERS;
}

function writeMonsters(monsters: MonsterConfig[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(monsters)); } catch { /* ignore */ }
}

// ==================== Context ====================

interface MonsterContextValue {
  monsters: MonsterConfig[];
  addMonster: () => void;
  removeMonster: (id: string) => void;
  updateMonster: (id: string, patch: Partial<MonsterConfig>) => void;
  canAdd: boolean;
}

const MonsterContext = createContext<MonsterContextValue>({
  monsters: DEFAULT_MONSTERS,
  addMonster: () => {},
  removeMonster: () => {},
  updateMonster: () => {},
  canAdd: true,
});

let _nextId = 100;
function nextId(): string {
  return `monster-${_nextId++}-${Date.now()}`;
}

export function MonsterProvider({ children }: { children: ReactNode }) {
  const [monsters, setMonsters] = useState<MonsterConfig[]>(readMonsters);

  const canAdd = monsters.length < MONSTER_LIMITS.count;

  const addMonster = useCallback(() => {
    if (!canAdd) return;
    setMonsters((prev) => {
      const shapes: MonsterShape[] = ["slender", "wide", "round", "classic"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
      const d = SHAPE_DEFAULTS[shape];
      const next = [...prev, {
        id: nextId(),
        shape,
        color,
        eyeType: "normal" as EyeType,
        mouthType: "none" as MouthType,
        width: d.width,
        height: d.height,
        headShape: "round" as HeadShape,
      }];
      writeMonsters(next);
      return next;
    });
  }, [canAdd]);

  const removeMonster = useCallback((id: string) => {
    setMonsters((prev) => {
      const next = prev.filter((m) => m.id !== id);
      writeMonsters(next.length > 0 ? next : DEFAULT_MONSTERS);
      return next.length > 0 ? next : DEFAULT_MONSTERS;
    });
  }, []);

  const updateMonster = useCallback((id: string, patch: Partial<MonsterConfig>) => {
    setMonsters((prev) => {
      const next = prev.map((m) => (m.id === id ? { ...m, ...patch } : m));
      writeMonsters(next);
      return next;
    });
  }, []);

  return (
    <MonsterContext.Provider value={{ monsters, addMonster, removeMonster, updateMonster, canAdd }}>
      {children}
    </MonsterContext.Provider>
  );
}

export function useMonsters() {
  return useContext(MonsterContext);
}
