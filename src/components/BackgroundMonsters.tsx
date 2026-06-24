"use client";

import { SlenderMonster } from "@/components/SlenderMonster";
import { useMonsters, type MonsterConfig } from "@/lib/MonsterContext";

function getEyeConfig(m: MonsterConfig) {
  const ratio = m.width / 60;
  const base = m.shape === "wide" ? 40 : m.shape === "slender" ? 28 : m.shape === "round" ? 34 : 36;
  const sz = Math.round(base * ratio);
  return { eyeSize: sz, pupilSize: Math.round(sz * 0.35) };
}

export function BackgroundMonsters() {
  const { monsters } = useMonsters();

  if (monsters.length === 0) return null;

  const startLeft = 4;
  const gapPx = 50;

  function borderRadius(m: MonsterConfig): string {
    if (m.headShape === "square") return "0 0 0 0";
    const r = Math.round(m.width * 0.35);
    return `${r}px ${r}px 0 0`;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {monsters.map((m, i) => {
        const eye = getEyeConfig(m);
        const left = i === 0 ? `${startLeft}%` : `calc(${startLeft}% + ${i * gapPx}px)`;
        const isWide = m.width >= 80;

        return (
          <SlenderMonster
            key={m.id}
            color={m.color}
            name={`怪兽 ${i + 1}`}
            left={left}
            bottom={isWide ? "5%" : "3%"}
            width={m.width}
            height={m.height}
            eyeSize={eye.eyeSize}
            pupilSize={eye.pupilSize}
            eyeType={m.eyeType}
            mouthType={m.mouthType}
            mouthWidth={isWide ? 28 : 22}
            mouthSensitivity={isWide ? 1.2 : 1}
            zIndex={1}
            maxSkew={isWide ? 3 : 5}
            borderRadius={borderRadius(m)}
            showFeet={m.width >= 60}
            showMouth={m.mouthType !== "none"}
          />
        );
      })}
    </div>
  );
}
