"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ====== 服装定义 ======

interface Outfit {
  id: string;
  name: string;
  path: string;
  icon: string;
  desc: string;
}

const OUTFITS: Record<string, Outfit> = {
  ur:       { id: "ur",       name: "UR 事件313",   path: "/live2d4/mashiro.model.json",        icon: "✨", desc: "优雅独特的设计，活动限定 UR 造型，细节满满的华丽装扮～" },
  event242: { id: "event242", name: "UR 事件242",   path: "/live2d6/mashiro.model.json",        icon: "🌟", desc: "璀璨星芒洒落裙摆，242 期限定 UR，Mashiro 的星光礼服～" },
  event234: { id: "event234", name: "UR 事件234",   path: "/live2d5/mashiro.model.json",        icon: "💎", desc: "冰晶凝结的梦幻舞裙，234 期限定 UR，如钻石般闪耀～" },
  ssr:      { id: "ssr",      name: "SSR 限定",     path: "/live2d3/mashiro.model.json",        icon: "🎤", desc: "闪亮的舞台服装，SSR 稀有度，偶像气场全开～" },
  winter:   { id: "winter",   name: "冬季校服",     path: "/mashiro live2d/mashiro.model.json", icon: "❄️", desc: "温暖的深色外套配围巾，经典冬季校服，Mashiro 的日常穿搭～" },
  summer:   { id: "summer",   name: "夏季校服",     path: "/live2d2/mashiro.model.json",        icon: "☀️", desc: "清凉的白色短袖衬衫，夏日限定的轻便造型～" },
};

const OUTFIT_LIST = Object.values(OUTFITS);

const DEFAULT_OUTFIT = "winter";

// ====== localStorage ======

// 沿用原 per-character key（mashiro-outfit-mashiro），保留用户已有的 Mashiro 服装选择
const STORAGE_OUTFIT = "mashiro-outfit-mashiro";

function readOutfit(): string {
  if (typeof window === "undefined") return DEFAULT_OUTFIT;
  try {
    const raw = localStorage.getItem(STORAGE_OUTFIT);
    if (raw && raw in OUTFITS) return raw;
  } catch { /* localStorage blocked */ }
  return DEFAULT_OUTFIT;
}

// ====== Context ======

interface Live2DContextValue {
  outfitId: string;
  modelPath: string;
  outfits: Outfit[];
  setOutfit: (id: string) => void;
}

const Live2DContext = createContext<Live2DContextValue>({
  outfitId: DEFAULT_OUTFIT,
  modelPath: OUTFITS[DEFAULT_OUTFIT].path,
  outfits: OUTFIT_LIST,
  setOutfit: () => {},
});

export function Live2DProvider({ children }: { children: ReactNode }) {
  const [outfitId, setOutfitId] = useState<string>(readOutfit);

  const modelPath = OUTFITS[outfitId]?.path ?? OUTFITS[DEFAULT_OUTFIT].path;

  const setOutfit = useCallback((id: string) => {
    if (!(id in OUTFITS)) return;
    setOutfitId(id);
    try { localStorage.setItem(STORAGE_OUTFIT, id); } catch { /* ignore */ }
  }, []);

  return (
    <Live2DContext.Provider value={{ outfitId, modelPath, outfits: OUTFIT_LIST, setOutfit }}>
      {children}
    </Live2DContext.Provider>
  );
}

export function useLive2DContext() {
  return useContext(Live2DContext);
}
