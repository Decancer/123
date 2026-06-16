"use client";

import { SlenderMonster } from "@/components/SlenderMonster";

export function BackgroundMonsters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {/* 橙色矮胖 — 靠中间，钝半圆头，只留黑眼珠，黑色横条嘴 */}
      <SlenderMonster
        color="#f97316"
        name="橙色矮胖"
        left="14%"
        bottom="5%"
        width={90}
        height={160}
        eyeSize={40}
        pupilSize={14}
        eyeColor="transparent"
        zIndex={1}
        maxSkew={3}
        borderRadius="80px 80px 0 0"
        showFeet={false}
        showMouth
        mouthWidth={28}
        mouthSensitivity={1.2}
      />

      {/* 蓝色瘦高 — 靠中间，靠近橙色 */}
      <SlenderMonster
        color="#3b82f6"
        name="蓝色瘦高"
        left="6%"
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
