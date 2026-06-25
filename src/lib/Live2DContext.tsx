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

const MASHIRO_OUTFITS: Record<string, Outfit> = {
  ur:       { id: "ur",       name: "UR 事件313",   path: "/live2d4/mashiro.model.json",        icon: "✨", desc: "优雅独特的设计，活动限定 UR 造型，细节满满的华丽装扮～" },
  event242: { id: "event242", name: "UR 事件242",   path: "/live2d6/mashiro.model.json",        icon: "🌟", desc: "璀璨星芒洒落裙摆，242 期限定 UR，Mashiro 的星光礼服～" },
  event234: { id: "event234", name: "UR 事件234",   path: "/live2d5/mashiro.model.json",        icon: "💎", desc: "冰晶凝结的梦幻舞裙，234 期限定 UR，如钻石般闪耀～" },
  ssr:      { id: "ssr",      name: "SSR 限定",     path: "/live2d3/mashiro.model.json",        icon: "🎤", desc: "闪亮的舞台服装，SSR 稀有度，偶像气场全开～" },
  winter:   { id: "winter",   name: "冬季校服",     path: "/mashiro live2d/mashiro.model.json", icon: "❄️", desc: "温暖的深色外套配围巾，经典冬季校服，Mashiro 的日常穿搭～" },
  summer:   { id: "summer",   name: "夏季校服",     path: "/live2d2/mashiro.model.json",        icon: "☀️", desc: "清凉的白色短袖衬衫，夏日限定的轻便造型～" },
};

const RAN_OUTFITS: Record<string, Outfit> = {
  winter: { id: "winter", name: "冬季校服", path: "/ran/ran.model.json", icon: "❄️", desc: "深色校服外套搭配格纹裙，Ran 的日常穿搭～更多服装即将到来" },
};

// ====== 角色定义 ======

type CharacterId = "mashiro" | "ran";

interface Character {
  name: string;
  defaultOutfit: string;
  outfits: Record<string, Outfit>;
}

const CHARACTERS: Record<CharacterId, Character> = {
  mashiro: { name: "Mashiro", defaultOutfit: "winter", outfits: MASHIRO_OUTFITS },
  ran:     { name: "Ran",     defaultOutfit: "winter", outfits: RAN_OUTFITS },
};

const CHARACTER_LIST = Object.entries(CHARACTERS).map(([id, c]) => ({
  id: id as CharacterId,
  name: c.name,
}));

// ====== localStorage ======

const STORAGE_CHARACTER = "mashiro-character";
const OUTFIT_KEY_PREFIX = "mashiro-outfit-";

function readCharacter(): CharacterId {
  if (typeof window === "undefined") return "mashiro";
  try {
    const raw = localStorage.getItem(STORAGE_CHARACTER);
    if (raw && raw in CHARACTERS) return raw as CharacterId;
  } catch { /* localStorage blocked */ }
  return "mashiro";
}

function readOutfit(characterId: CharacterId): string {
  if (typeof window === "undefined") return CHARACTERS[characterId].defaultOutfit;
  try {
    const raw = localStorage.getItem(OUTFIT_KEY_PREFIX + characterId);
    if (raw && raw in CHARACTERS[characterId].outfits) return raw;
  } catch { /* localStorage blocked */ }
  return CHARACTERS[characterId].defaultOutfit;
}

// ====== Context ======

interface Live2DContextValue {
  characterId: CharacterId;
  outfitId: string;
  modelPath: string;
  characters: typeof CHARACTER_LIST;
  currentCharacter: Character;
  setCharacter: (id: CharacterId) => void;
  setOutfit: (id: string) => void;
}

const Live2DContext = createContext<Live2DContextValue>({
  characterId: "mashiro",
  outfitId: "winter",
  modelPath: MASHIRO_OUTFITS.winter.path,
  characters: CHARACTER_LIST,
  currentCharacter: CHARACTERS.mashiro,
  setCharacter: () => {},
  setOutfit: () => {},
});

export function Live2DProvider({ children }: { children: ReactNode }) {
  const [characterId, setCharacterId] = useState<CharacterId>(readCharacter);
  const [outfitId, setOutfitId] = useState<string>(() => readOutfit(readCharacter()));

  const currentCharacter = CHARACTERS[characterId];
  const modelPath = currentCharacter.outfits[outfitId]?.path ?? currentCharacter.outfits[currentCharacter.defaultOutfit].path;

  const setCharacter = useCallback((id: CharacterId) => {
    setCharacterId(id);
    const saved = (() => {
      try { const r = localStorage.getItem(OUTFIT_KEY_PREFIX + id); return r; } catch { return null; }
    })();
    const valid = saved && saved in CHARACTERS[id].outfits;
    setOutfitId(valid ? saved : CHARACTERS[id].defaultOutfit);
    try { localStorage.setItem(STORAGE_CHARACTER, id); } catch { /* ignore */ }
  }, []);

  const setOutfit = useCallback((id: string) => {
    if (!(id in currentCharacter.outfits)) return;
    setOutfitId(id);
    try { localStorage.setItem(OUTFIT_KEY_PREFIX + characterId, id); } catch { /* ignore */ }
  }, [characterId, currentCharacter]);

  return (
    <Live2DContext.Provider value={{
      characterId,
      outfitId,
      modelPath,
      characters: CHARACTER_LIST,
      currentCharacter,
      setCharacter,
      setOutfit,
    }}>
      {children}
    </Live2DContext.Provider>
  );
}

export function useLive2DContext() {
  return useContext(Live2DContext);
}
