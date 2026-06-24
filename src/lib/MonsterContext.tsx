"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

// ==================== 类型 ====================

export type MonsterShape = "slender" | "wide" | "round" | "classic";

export interface MonsterConfig {
  id: string;
  shape: MonsterShape;
  color: string;
}

const SHAPE_DEFAULTS: Record<MonsterShape, { width: number; height: number; borderRadius: string }> = {
  slender:  { width: 42,  height: 320, borderRadius: "5px 5px 0 0" },
  wide:     { width: 90,  height: 160, borderRadius: "80px 80px 0 0" },
  round:    { width: 70,  height: 200, borderRadius: "60px 60px 0 0" },
  classic:  { width: 60,  height: 240, borderRadius: "20px 20px 0 0" },
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
  { id: "default-1", shape: "slender", color: "#3b82f6" },
  { id: "default-2", shape: "wide",    color: "#f97316" },
];

const MAX_MONSTERS = 5;
const STORAGE_KEY = "monster-lab";

// ==================== Context ====================

interface MonsterContextValue {
  monsters: MonsterConfig[];
  addMonster: () => void;
  removeMonster: (id: string) => void;
  updateMonster: (id: string, patch: Partial<Pick<MonsterConfig, "shape" | "color">>) => void;
  canAdd: boolean;
}

const MonsterContext = createContext<MonsterContextValue>({
  monsters: DEFAULT_MONSTERS,
  addMonster: () => {},
  removeMonster: () => {},
  updateMonster: () => {},
  canAdd: true,
});

function readMonsters(): MonsterConfig[] {
  if (typeof window === "undefined") return DEFAULT_MONSTERS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return DEFAULT_MONSTERS;
}

function writeMonsters(monsters: MonsterConfig[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(monsters)); } catch { /* ignore */ }
}

let _nextId = 100;
function nextId(): string {
  return `monster-${_nextId++}-${Date.now()}`;
}

export function MonsterProvider({ children }: { children: ReactNode }) {
  const [monsters, setMonsters] = useState<MonsterConfig[]>(readMonsters);

  const canAdd = monsters.length < MAX_MONSTERS;

  const addMonster = useCallback(() => {
    if (!canAdd) return;
    setMonsters((prev) => {
      // 新怪兽随机形状 + 随机颜色
      const shapes: MonsterShape[] = ["slender", "wide", "round", "classic"];
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      const color = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
      const next = [...prev, { id: nextId(), shape, color }];
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

  const updateMonster = useCallback((id: string, patch: Partial<Pick<MonsterConfig, "shape" | "color">>) => {
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
