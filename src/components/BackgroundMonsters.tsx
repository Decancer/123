"use client";

import { SlenderMonster } from "@/components/SlenderMonster";

export function BackgroundMonsters() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* 左侧一群 */}
      <SlenderMonster
        color="#8b5cf6"
        accentColor="#c4b5fd"
        name="紫色长条"
        left="2%"
        bottom="5%"
        width={55}
        height={260}
        eyeSize={32}
        pupilSize={11}
        zIndex={1}
        maxSkew={5}
      />
      <SlenderMonster
        color="#ec4899"
        accentColor="#fbcfe8"
        name="粉色长条"
        left="8%"
        bottom="8%"
        width={48}
        height={220}
        eyeSize={28}
        pupilSize={10}
        zIndex={1}
        maxSkew={4}
        borderRadius="20px 20px 0 0"
      />
      <SlenderMonster
        color="#f97316"
        accentColor="#fed7aa"
        name="橙色长条"
        left="14%"
        bottom="2%"
        width={62}
        height={300}
        eyeSize={38}
        pupilSize={13}
        zIndex={1}
        maxSkew={6}
      />

      {/* 右侧一群 */}
      <SlenderMonster
        color="#06b6d4"
        accentColor="#a5f3fc"
        name="青色长条"
        right="2%"
        bottom="6%"
        width={50}
        height={240}
        eyeSize={30}
        pupilSize={10}
        zIndex={1}
        maxSkew={5}
        borderRadius="18px 18px 0 0"
      />
      <SlenderMonster
        color="#84cc16"
        accentColor="#d9f99d"
        name="绿色长条"
        right="9%"
        bottom="3%"
        width={56}
        height={270}
        eyeSize={34}
        pupilSize={12}
        zIndex={1}
        maxSkew={5}
      />
      <SlenderMonster
        color="#f43f5e"
        accentColor="#fecdd3"
        name="红色长条"
        right="15%"
        bottom="10%"
        width={44}
        height={200}
        eyeSize={26}
        pupilSize={9}
        zIndex={1}
        maxSkew={4}
        borderRadius="16px 16px 0 0"
      />
    </div>
  );
}
