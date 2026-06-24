"use client";

import { SlenderMonster } from "@/components/SlenderMonster";
import { useMonsters, getShapeProps, type MonsterShape } from "@/lib/MonsterContext";

function getEyeConfig(shape: MonsterShape) {
  switch (shape) {
    case "slender": return { eyeSize: 28, pupilSize: 10 };
    case "wide":    return { eyeSize: 40, pupilSize: 14 };
    case "round":   return { eyeSize: 34, pupilSize: 12 };
    case "classic": return { eyeSize: 36, pupilSize: 12 };
  }
}

function getExtra(shape: MonsterShape) {
  switch (shape) {
    case "slender": return { showMouth: false, showFeet: false };
    case "wide":    return { showMouth: true, mouthWidth: 28, mouthSensitivity: 1.2, showFeet: false };
    case "round":   return { showMouth: true, mouthWidth: 24, mouthSensitivity: 1, showFeet: true };
    case "classic": return { showMouth: false, showFeet: true };
  }
}

export function BackgroundMonsters() {
  const { monsters } = useMonsters();

  if (monsters.length === 0) return null;

  // 从左往右排列，间距约 46-50px
  const startLeft = 4; // %
  const gapPx = 50;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {monsters.map((m, i) => {
        const shape = getShapeProps(m.shape);
        const eye = getEyeConfig(m.shape);
        const extra = getExtra(m.shape);
        const left = i === 0 ? `${startLeft}%` : `calc(${startLeft}% + ${i * gapPx}px)`;

        return (
          <SlenderMonster
            key={m.id}
            color={m.color}
            name={`怪兽 ${i + 1}`}
            left={left}
            bottom={m.shape === "wide" ? "5%" : "3%"}
            width={shape.width}
            height={shape.height}
            eyeSize={eye.eyeSize}
            pupilSize={eye.pupilSize}
            zIndex={1}
            maxSkew={m.shape === "wide" ? 3 : 5}
            borderRadius={shape.borderRadius}
            {...extra}
          />
        );
      })}
    </div>
  );
}
