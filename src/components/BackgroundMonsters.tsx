"use client";

import { SlenderMonster } from "@/components/SlenderMonster";

export function BackgroundMonsters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* 橙色矮胖 */}
      <SlenderMonster
        color="#f97316"
        accentColor="#fed7aa"
        name="橙色矮胖"
        left="4%"
        bottom="5%"
        width={90}
        height={160}
        eyeSize={40}
        pupilSize={14}
        zIndex={1}
        maxSkew={3}
        borderRadius="30px 30px 0 0"
      />

      {/* 蓝色瘦高 */}
      <SlenderMonster
        color="#3b82f6"
        accentColor="#bfdbfe"
        name="蓝色瘦高"
        left="18%"
        bottom="3%"
        width={42}
        height={320}
        eyeSize={28}
        pupilSize={10}
        zIndex={1}
        maxSkew={5}
        borderRadius="10px 10px 0 0"
      />
    </div>
  );
}
