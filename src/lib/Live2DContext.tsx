"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const COS_URL = process.env.NEXT_PUBLIC_COS_URL || "https://mashiro-chat-1443843125.cos.ap-guangzhou.myqcloud.com";

export const OUTFITS = {
  ur:       { id: "ur" as const,       name: "UR 事件313",   path: `${COS_URL}/live2d/ur/mashiro.model.json`,        icon: "✨", desc: "优雅独特的设计，活动限定 UR 造型，细节满满的华丽装扮～" },
  event242: { id: "event242" as const, name: "UR 事件242",   path: `${COS_URL}/live2d/event242/mashiro.model.json`,   icon: "🌟", desc: "璀璨星芒洒落裙摆，242 期限定 UR，Mashiro 的星光礼服～" },
  event234: { id: "event234" as const, name: "UR 事件234",   path: `${COS_URL}/live2d/event234/mashiro.model.json`,   icon: "💎", desc: "冰晶凝结的梦幻舞裙，234 期限定 UR，如钻石般闪耀～" },
  ssr:      { id: "ssr" as const,      name: "SSR 限定",     path: `${COS_URL}/live2d/ssr/mashiro.model.json`,        icon: "🎤", desc: "闪亮的舞台服装，SSR 稀有度，偶像气场全开～" },
  winter:   { id: "winter" as const,   name: "冬季校服",     path: `${COS_URL}/live2d/winter/mashiro.model.json`,     icon: "❄️", desc: "温暖的深色外套配围巾，经典冬季校服，Mashiro 的日常穿搭～" },
  summer:   { id: "summer" as const,   name: "夏季校服",     path: `${COS_URL}/live2d/summer/mashiro.model.json`,     icon: "☀️", desc: "清凉的白色短袖衬衫，夏日限定的轻便造型～" },
} as const;

export type OutfitId = keyof typeof OUTFITS;

const STORAGE_KEY = "mashiro-outfit";

function readOutfit(): OutfitId {
  if (typeof window === "undefined") return "winter";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && raw in OUTFITS) return raw as OutfitId;
  } catch { /* localStorage blocked */ }
  return "winter";
}

interface Live2DContextValue {
  modelPath: string;
  outfitId: OutfitId;
  setOutfit: (id: OutfitId) => void;
}

const Live2DContext = createContext<Live2DContextValue>({
  modelPath: OUTFITS.winter.path,
  outfitId: "winter",
  setOutfit: () => {},
});

export function Live2DProvider({ children }: { children: ReactNode }) {
  const [outfitId, setOutfitId] = useState<OutfitId>(readOutfit);
  const modelPath = OUTFITS[outfitId].path;

  const setOutfit = useCallback((id: OutfitId) => {
    setOutfitId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  return (
    <Live2DContext.Provider value={{ modelPath, outfitId, setOutfit }}>
      {children}
    </Live2DContext.Provider>
  );
}

export function useLive2DContext() {
  return useContext(Live2DContext);
}
