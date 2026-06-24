"use client";

import { SlenderMonster } from "@/components/SlenderMonster";
import { useMonsterPals } from "@/lib/MonsterPalsContext";

const PAL_PROPS = {
  rui: {
    left: "4%" as const,
    bottom: "3%" as const,
    width: 42,
    height: 320,
    eyeSize: 28,
    pupilSize: 10,
    zIndex: 1 as const,
    maxSkew: 5,
    borderRadius: "5px 5px 0 0" as const,
    showFeet: false,
  },
  nanami: {
    left: "calc(4% + 44px)" as const,
    bottom: "5%" as const,
    width: 90,
    height: 160,
    eyeSize: 40,
    pupilSize: 14,
    eyeColor: "transparent" as const,
    zIndex: 1 as const,
    maxSkew: 6,
    borderRadius: "80px 80px 0 0" as const,
    showFeet: false,
    showMouth: true,
    mouthWidth: 28,
    mouthSensitivity: 1.2,
  },
  toko: {
    left: "calc(4% + 136px)" as const,
    bottom: "5%" as const,
    width: 90,
    height: 200,
    eyeSize: 40,
    pupilSize: 14,
    eyeColor: "transparent" as const,
    eyeMaxDistance: 16,
    zIndex: 1 as const,
    maxSkew: 3,
    borderRadius: "80px 80px 0 0" as const,
    showFeet: false,
    showMouth: true,
    mouthWidth: 28,
    mouthSensitivity: 1.2,
  },
  tsukushi: {
    left: "4%" as const,
    bottom: "3%" as const,
    width: 240,
    height: 70,
    eyeSize: 28,
    pupilSize: 10,
    zIndex: 2 as const,
    maxSkew: 4,
    borderRadius: "12px 12px 0 0" as const,
    showFeet: false,
  },
};

const PAL_ORDER = ["rui", "nanami", "toko", "tsukushi"] as const;

export function BackgroundMonsters() {
  const { pals } = useMonsterPals();
  const visibleIds = new Set(pals.filter((p) => p.visible).map((p) => p.id));

  if (visibleIds.size === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {PAL_ORDER.filter((id) => visibleIds.has(id)).map((id) => {
        const pal = pals.find((p) => p.id === id)!;
        const props = PAL_PROPS[id];
        return (
          <SlenderMonster
            key={id}
            color={pal.color}
            name={pal.name}
            {...props}
          />
        );
      })}
    </div>
  );
}
