"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export interface PalInfo {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

const DEFAULT_PALS: PalInfo[] = [
  { id: "rui",      name: "rui",      color: "#669988", visible: true },
  { id: "nanami",   name: "nanami",   color: "#EE7744", visible: true },
  { id: "toko",     name: "toko",     color: "#fef9c3", visible: false },
  { id: "tsukushi", name: "tsukushi", color: "#7c3aed", visible: false },
];

const STORAGE_KEY = "monster-pals";

function readPals(): PalInfo[] {
  if (typeof window === "undefined") return DEFAULT_PALS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 合并：如果存储里少了一些 pal（新增的），补上默认
        return DEFAULT_PALS.map((d) => {
          const saved = parsed.find((p: PalInfo) => p.id === d.id);
          return saved ? { ...d, visible: saved.visible } : d;
        });
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_PALS;
}

function writePals(pals: PalInfo[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pals)); } catch { /* ignore */ }
}

interface MonsterPalsContextValue {
  pals: PalInfo[];
  togglePal: (id: string) => void;
}

const MonsterPalsContext = createContext<MonsterPalsContextValue>({
  pals: DEFAULT_PALS,
  togglePal: () => {},
});

export function MonsterPalsProvider({ children }: { children: ReactNode }) {
  const [pals, setPals] = useState<PalInfo[]>(readPals);

  const togglePal = useCallback((id: string) => {
    setPals((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p));
      writePals(next);
      return next;
    });
  }, []);

  return (
    <MonsterPalsContext.Provider value={{ pals, togglePal }}>
      {children}
    </MonsterPalsContext.Provider>
  );
}

export function useMonsterPals() {
  return useContext(MonsterPalsContext);
}
