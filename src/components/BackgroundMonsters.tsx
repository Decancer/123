"use client";

import { SlenderMonster } from "@/components/SlenderMonster";

export function BackgroundMonsters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden hidden md:block"
      style={{ zIndex: 0 }}
    >
      {/* 蓝色瘦高 — 外（左） */}
      <SlenderMonster
        color="#3b82f6"
        name="蓝色瘦高"
        left="4%"
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

      {/* 橙色矮胖 — 紧挨着蓝色 */}
      <SlenderMonster
        color="#f97316"
        name="橙色矮胖"
        left="calc(4% + 44px)"
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
        mouthType="cat"
        mouthWidth={28}
        mouthSensitivity={1.2}
      />

      {/* 黄色矮胖 — 紧挨着橙色，同形状 */}
      <SlenderMonster
        color="#eab308"
        name="黄色矮胖"
        left="calc(4% + 136px)"
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

      {/* 紫色宽矮 — 最后面，超宽超矮，叠在其他三个上面 */}
      <SlenderMonster
        color="#a855f7"
        name="紫色宽矮"
        left="4%"
        bottom="3%"
        width={240}
        height={70}
        eyeSize={28}
        pupilSize={10}
        zIndex={2}
        maxSkew={4}
        borderRadius="12px 12px 0 0"
        showFeet={false}
      />
    </div>
  );
}
