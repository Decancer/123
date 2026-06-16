"use client";

import { SlenderMonster } from "@/components/SlenderMonster";

export function BackgroundMonsters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {/* 橙色矮胖 — 靠中间，纯圆头 */}
      <SlenderMonster
        color="#f97316"
        name="橙色矮胖"
        left="14%"
        bottom="5%"
        width={90}
        height={160}
        eyeSize={40}
        pupilSize={14}
        zIndex={1}
        maxSkew={3}
        borderRadius="50% 50% 0 0"
        showFeet={false}
      />

      {/* 蓝色瘦高 — 靠外边，方头微圆 */}
      <SlenderMonster
        color="#3b82f6"
        name="蓝色瘦高"
        left="3%"
        bottom="3%"
        width={42}
        height={320}
        eyeSize={28}
        pupilSize={10}
        zIndex={1}
        maxSkew={5}
        borderRadius="5px 5px 0 0"
        showFeet={false}
      />
    </div>
  );
}
